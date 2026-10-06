import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logInterviewSlotSelectedEmail, processPendingEmails } from '@/lib/email';
import { createNotification, NotificationType, NotificationCategory } from '@/lib/notifications';

/**
 * Calendly Webhook Endpoint: /api/webhooks/calendly
 * Handles 'invitee.created' events when a candidate books a slot on Calendly.
 * Updates interview status & sends confirmation emails to Recruiter and Client.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Verify Calendly event payload
    const eventType = body.event || body.event_type;
    const payload = body.payload || body;

    // Handle invitee.created event
    if (eventType && eventType !== 'invitee.created') {
      return NextResponse.json({ success: true, message: `Ignored event type: ${eventType}` });
    }

    // Extract Candidate Email & Details from Calendly payload
    const candidateEmail =
      payload.email ||
      payload.invitee?.email ||
      payload.tracking?.utm_custom_1;

    const candidateNameFromCalendly =
      payload.name ||
      payload.invitee?.name ||
      'Candidate';

    const scheduledEvent = payload.scheduled_event || payload.event || {};
    const startTimeStr = scheduledEvent.start_time || payload.start_time;
    const location = scheduledEvent.location || payload.location || {};
    const meetingUrl =
      location.join_url ||
      location.location ||
      scheduledEvent.join_url ||
      'https://calendly.com/divyanshu-botspring/30min';

    if (!candidateEmail) {
      return NextResponse.json(
        { success: false, error: 'Candidate email missing in webhook payload.' },
        { status: 400 }
      );
    }

    // Search for matching Candidate Submission in RecruitOS DB
    const submission = await (prisma as any).candidateSubmission.findFirst({
      where: {
        candidate: {
          email: { equals: candidateEmail, mode: 'insensitive' }
        }
      },
      orderBy: { updatedAt: 'desc' },
      include: {
        job: {
          select: {
            id: true,
            title: true,
            agencyId: true,
            client: {
              select: {
                companyName: true,
                contacts: { select: { email: true }, take: 1 }
              }
            }
          }
        },
        candidate: {
          select: { id: true, firstName: true, lastName: true, email: true }
        },
        recruiter: {
          select: { id: true, firstName: true, lastName: true, email: true }
        }
      }
    });

    if (!submission) {
      console.warn(`[Calendly Webhook] No matching submission found for email: ${candidateEmail}`);
      return NextResponse.json({
        success: true,
        message: `Webhook received. No matching candidate found for email: ${candidateEmail}`
      });
    }

    const agencyId = submission.agencyId || submission.job.agencyId;
    const candidateName = `${submission.candidate.firstName} ${submission.candidate.lastName}`.trim() || candidateNameFromCalendly;
    const positionTitle = submission.job.title;
    const companyName = submission.job.client?.companyName || 'Client';

    // Format Scheduled Date & Time
    let selectedSlotStr = 'Scheduled via Calendly';
    let startTime: Date | null = null;

    if (startTimeStr) {
      startTime = new Date(startTimeStr);
      if (!isNaN(startTime.getTime())) {
        const dayDate = startTime.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
        const timeTz = startTime.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
        selectedSlotStr = `${dayDate} at ${timeTz} IST`;
      }
    }

    // 1. Update Candidate Submission Status
    await prisma.candidateSubmission.update({
      where: { id: submission.id },
      data: {
        status: 'INTERVIEW',
        updatedAt: new Date()
      }
    });

    // 2. Update or Create InterviewSchedule record
    let existingSchedule = await prisma.interviewSchedule.findFirst({
      where: { submissionId: submission.id },
      orderBy: { createdAt: 'desc' }
    });

    if (existingSchedule) {
      await prisma.interviewSchedule.update({
        where: { id: existingSchedule.id },
        data: {
          status: 'SCHEDULED' as any,
          confirmedStartTime: startTime || new Date(),
          meetingUrl,
          meetingProvider: 'CALENDLY' as any,
          updatedAt: new Date()
        }
      });
    } else {
      existingSchedule = await prisma.interviewSchedule.create({
        data: {
          agencyId,
          submissionId: submission.id,
          roundType: 'CLIENT_DISCUSSION' as any,
          status: 'SCHEDULED' as any,
          confirmedStartTime: startTime || new Date(),
          meetingUrl,
          meetingProvider: 'CALENDLY' as any,
          createdBy: 'CANDIDATE'
        }
      });
    }

    // 2.5 Auto-dispatch Interview Preparation Kit if scheduled within 24 hours
    try {
      const { generateAndSendPrepKitAction } = await import('@/app/actions/interviewPrep');
      const diffMs = (startTime || new Date()).getTime() - Date.now();
      const hoursUntil = diffMs / (1000 * 60 * 60);

      // If scheduled within 24 hours, generate & dispatch Interview Kit immediately
      if (hoursUntil <= 24 && hoursUntil > 0) {
        await generateAndSendPrepKitAction(existingSchedule.id);
      }
    } catch (kitErr) {
      console.error('[Calendly Webhook] Failed to auto-dispatch 24h Prep Kit:', kitErr);
    }

    // 3. Dispatch Confirmation Email to RECRUITER (divyanshu@botspring.in & Recruiter Email)
    const recruiterEmail = submission.recruiter?.email || 'divyanshu@botspring.in';
    await logInterviewSlotSelectedEmail(
      agencyId,
      recruiterEmail,
      candidateName,
      positionTitle,
      companyName,
      'Client Interview (Calendly)',
      selectedSlotStr,
      meetingUrl,
      'IST (UTC+5:30)',
      'RECRUITER'
    );

    if (recruiterEmail.toLowerCase() !== 'divyanshu@botspring.in') {
      await logInterviewSlotSelectedEmail(
        agencyId,
        'divyanshu@botspring.in',
        candidateName,
        positionTitle,
        companyName,
        'Client Interview (Calendly)',
        selectedSlotStr,
        meetingUrl,
        'IST (UTC+5:30)',
        'RECRUITER'
      );
    }

    // 4. Dispatch Confirmation Email to CLIENT
    const clientEmail = submission.job.client?.contacts?.[0]?.email;
    if (clientEmail) {
      await logInterviewSlotSelectedEmail(
        agencyId,
        clientEmail,
        candidateName,
        positionTitle,
        companyName,
        'Client Interview (Calendly)',
        selectedSlotStr,
        meetingUrl,
        'IST (UTC+5:30)',
        'CLIENT'
      );
    }

    // 5. Dispatch Confirmation Email to CANDIDATE
    if (submission.candidate.email) {
      await logInterviewSlotSelectedEmail(
        agencyId,
        submission.candidate.email,
        candidateName,
        positionTitle,
        companyName,
        'Client Interview (Calendly)',
        selectedSlotStr,
        meetingUrl,
        'IST (UTC+5:30)',
        'CANDIDATE'
      );
    }

    // Process all pending emails immediately
    await processPendingEmails(agencyId);

    // 6. Create Recruiter In-App Notification
    if (submission.recruiter?.id) {
      await createNotification({
        agencyId,
        recipientUserId: submission.recruiter.id,
        title: `Interview Slot Confirmed: ${candidateName}`,
        message: `${candidateName} booked their interview for ${positionTitle} on ${selectedSlotStr} via Calendly.`,
        type: NotificationType.SUCCESS,
        category: NotificationCategory.CANDIDATE,
        entityType: 'INTERVIEW',
        entityId: existingSchedule.id
      });
    }

    return NextResponse.json({
      success: true,
      message: `Successfully processed Calendly booking for ${candidateName}`
    });

  } catch (error: any) {
    console.error('[Calendly Webhook Error]:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error processing Calendly webhook' },
      { status: 500 }
    );
  }
}
