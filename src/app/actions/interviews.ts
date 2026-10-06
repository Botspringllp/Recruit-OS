'use server';

import crypto from 'crypto';
import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { InterviewType, InterviewMode, PipelineStage, SlaStatus } from '@prisma/client';
import { requirePermission } from '@/lib/rbac';

import { getResolvedAgencyId } from '@/lib/agency/resolver';

async function getDemoAgencyId(): Promise<string> {
  return getResolvedAgencyId();
}

export type InterviewActionResult = {
  success: boolean;
  interviewId?: string;
  error?: string;
  errors?: Record<string, string>;
};

export async function createInterviewAction(prevState: any, formData: FormData, userOverride?: any): Promise<InterviewActionResult> {
  try {
    await requirePermission('interview.schedule', userOverride);
    const agencyId = await getDemoAgencyId();

    const submissionId = (formData.get('submissionId') as string || '').trim();
    const scheduledAtRaw = (formData.get('scheduledAt') as string || '').trim();
    const durationMinutesRaw = (formData.get('durationMinutes') as string || '45').trim();
    const roundTypeRaw = (formData.get('roundType') as string || '').trim();
    const modeRaw = (formData.get('mode') as string || '').trim();
    const meetingLink = (formData.get('meetingLink') as string || '').trim();
    const notes = (formData.get('notes') as string || '').trim();

    const errors: Record<string, string> = {};

    if (!submissionId) errors.submissionId = 'Candidate submission is required';
    if (!scheduledAtRaw) errors.scheduledAt = 'Interview date & time is required';
    if (!roundTypeRaw) errors.roundType = 'Interview type / round is required';
    if (!modeRaw) errors.mode = 'Interview mode is required';

    const durationMinutes = parseInt(durationMinutesRaw, 10);
    if (isNaN(durationMinutes) || durationMinutes <= 0) {
      errors.durationMinutes = 'Duration must be greater than 0 minutes';
    }

    let scheduledAt: Date | null = null;
    if (scheduledAtRaw) {
      scheduledAt = new Date(scheduledAtRaw);
      if (isNaN(scheduledAt.getTime())) {
        errors.scheduledAt = 'Invalid interview date & time format';
      } else if (scheduledAt.getTime() < Date.now() - 5 * 60 * 1000) {
        errors.scheduledAt = 'Interview schedule date cannot be in the past';
      }
    }

    if (meetingLink && modeRaw !== 'IN_PERSON' && modeRaw !== 'PHONE') {
      try {
        new URL(meetingLink);
      } catch {
        errors.meetingLink = 'Invalid meeting URL format';
      }
    }

    if (Object.keys(errors).length > 0) {
      return { success: false, errors };
    }

    const submission = await prisma.candidateSubmission.findFirst({
      where: { id: submissionId, agencyId },
      select: { id: true, candidateId: true, jobId: true, stage: true }
    });

    if (!submission) {
      return { success: false, error: 'Candidate submission record not found or access denied.' };
    }

    const roundType = roundTypeRaw as InterviewType;
    const mode = modeRaw as InterviewMode;

    const newInterview = await prisma.interviewSchedule.create({
      data: {
        agencyId,
        submissionId,
        confirmedStartTime: scheduledAt!,
        durationMinutes,
        roundType,
        mode,
        meetingLink: meetingLink || null,
        notes: notes || null,
        status: 'SCHEDULED'
      }
    });

    if (submission.stage !== PipelineStage.INTERVIEW_SCHEDULED) {
      await prisma.candidateSubmission.update({
        where: { id: submissionId },
        data: {
          stage: PipelineStage.INTERVIEW_SCHEDULED,
          updatedAt: new Date()
        }
      });

      await prisma.pipelineSlaLog.create({
        data: {
          agencyId,
          submissionId,
          previousStage: submission.stage,
          newStage: PipelineStage.INTERVIEW_SCHEDULED,
          timeInStageHours: 0,
          slaStatusAtTransition: SlaStatus.HEALTHY
        }
      }).catch((e) => console.error('Error writing SLA log on interview creation:', e));
    }

    revalidatePath('/interviews');
    revalidatePath('/submissions');
    revalidatePath(`/submissions/${submissionId}`);
    revalidatePath('/cockpit');

    return { success: true, interviewId: newInterview.id };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to schedule interview' };
  }
}

export async function updateInterviewAction(
  interviewId: string,
  formData: FormData,
  userOverride?: any
): Promise<InterviewActionResult> {
  try {
    await requirePermission('interview.edit', userOverride);
    const agencyId = await getDemoAgencyId();

    const scheduledAtRaw = (formData.get('scheduledAt') as string || '').trim();
    const durationMinutesRaw = (formData.get('durationMinutes') as string || '45').trim();
    const roundTypeRaw = (formData.get('roundType') as string || '').trim();
    const modeRaw = (formData.get('mode') as string || '').trim();
    const meetingLink = (formData.get('meetingLink') as string || '').trim();
    const notes = (formData.get('notes') as string || '').trim();

    const errors: Record<string, string> = {};

    if (!scheduledAtRaw) errors.scheduledAt = 'Interview date & time is required';
    if (!roundTypeRaw) errors.roundType = 'Interview type / round is required';
    if (!modeRaw) errors.mode = 'Interview mode is required';

    const durationMinutes = parseInt(durationMinutesRaw, 10);
    if (isNaN(durationMinutes) || durationMinutes <= 0) {
      errors.durationMinutes = 'Duration must be greater than 0 minutes';
    }

    let scheduledAt: Date | null = null;
    if (scheduledAtRaw) {
      scheduledAt = new Date(scheduledAtRaw);
      if (isNaN(scheduledAt.getTime())) {
        errors.scheduledAt = 'Invalid date & time format';
      }
    }

    if (meetingLink && modeRaw !== 'IN_PERSON' && modeRaw !== 'PHONE') {
      try {
        new URL(meetingLink);
      } catch {
        errors.meetingLink = 'Invalid meeting URL format';
      }
    }

    if (Object.keys(errors).length > 0) {
      return { success: false, errors };
    }

    const existing = await prisma.interviewSchedule.findFirst({
      where: { id: interviewId, agencyId }
    });

    if (!existing) {
      return { success: false, error: 'Interview record not found or access denied.' };
    }

    await prisma.interviewSchedule.update({
      where: { id: interviewId },
      data: {
        confirmedStartTime: scheduledAt!,
        durationMinutes,
        roundType: roundTypeRaw as InterviewType,
        mode: modeRaw as InterviewMode,
        meetingLink: meetingLink || null,
        notes: notes || null
      }
    });

    revalidatePath('/interviews');
    revalidatePath(`/interviews/${interviewId}`);
    revalidatePath('/cockpit');

    return { success: true, interviewId };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to update interview' };
  }
}

export async function rescheduleInterviewAction(
  interviewId: string,
  newScheduledAtIso: string,
  rescheduleReason?: string,
  userOverride?: any
): Promise<InterviewActionResult> {
  try {
    await requirePermission('interview.edit', userOverride);
    const agencyId = await getDemoAgencyId();

    const existing = await prisma.interviewSchedule.findFirst({
      where: { id: interviewId, agencyId }
    });

    if (!existing) {
      return { success: false, error: 'Interview record not found or access denied.' };
    }

    const newDate = new Date(newScheduledAtIso);
    if (isNaN(newDate.getTime())) {
      return { success: false, error: 'Invalid reschedule date/time provided' };
    }

    const updatedNotes = rescheduleReason
      ? `${existing.notes || ''}\n[Rescheduled on ${new Date().toLocaleDateString()}]: ${rescheduleReason}`.trim()
      : existing.notes;

    await prisma.interviewSchedule.update({
      where: { id: interviewId },
      data: {
        confirmedStartTime: newDate,
        status: 'RESCHEDULED',
        notes: updatedNotes
      }
    });

    revalidatePath('/interviews');
    revalidatePath(`/interviews/${interviewId}`);
    revalidatePath('/cockpit');

    return { success: true, interviewId };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to reschedule interview' };
  }
}

export async function updateInterviewStatusAction(
  interviewId: string,
  newStatus: string,
  outcome?: 'PASS' | 'FAIL' | 'HOLD',
  userOverride?: any
): Promise<InterviewActionResult> {
  try {
    await requirePermission('interview.edit', userOverride);
    const agencyId = await getDemoAgencyId();

    const existing = await prisma.interviewSchedule.findFirst({
      where: { id: interviewId, agencyId },
      include: { submission: true }
    });

    if (!existing) {
      return { success: false, error: 'Interview record not found or access denied.' };
    }

    await prisma.interviewSchedule.update({
      where: { id: interviewId },
      data: {
        status: newStatus,
        outcome: outcome || existing.outcome
      }
    });

    if (newStatus === 'COMPLETED' && outcome) {
      const submissionId = existing.submissionId;
      const currentStage = existing.submission.stage;

      let targetStage: PipelineStage | null = null;
      if (outcome === 'PASS') {
        targetStage = PipelineStage.OFFER_EXTENDED;
      } else if (outcome === 'FAIL') {
        targetStage = PipelineStage.REJECTED;
      }

      if (targetStage && targetStage !== currentStage) {
        await prisma.candidateSubmission.update({
          where: { id: submissionId },
          data: {
            stage: targetStage,
            updatedAt: new Date()
          }
        });

        await prisma.pipelineSlaLog.create({
          data: {
            agencyId,
            submissionId,
            previousStage: currentStage,
            newStage: targetStage,
            timeInStageHours: 0,
            slaStatusAtTransition: SlaStatus.HEALTHY
          }
        }).catch((e) => console.error('Error writing SLA log on interview completion:', e));
      }
    }

    revalidatePath('/interviews');
    revalidatePath(`/interviews/${interviewId}`);
    revalidatePath('/submissions');
    revalidatePath(`/submissions/${existing.submissionId}`);
    revalidatePath('/cockpit');

    return { success: true, interviewId };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to update interview status' };
  }
}

/**
 * SECTION A & B: Client Interview Scheduling Action (Triggered from Client Review Portal)
 */
export async function scheduleClientInterviewAction(payload: {
  submissionId: string;
  token: string;
  interviewType: string;
  interviewNotes?: string;
  calendlyUrl?: string;
  slot1?: string;
  slot2?: string;
  slot3?: string;
}): Promise<{
  success: boolean;
  interviewId?: string;
  candidateToken?: string;
  error?: string;
}> {
  try {
    const { submissionId, token, interviewType, interviewNotes, calendlyUrl, slot1, slot2, slot3 } = payload;

    if (!submissionId || !token) {
      return { success: false, error: 'Invalid candidate submission request.' };
    }

    if (!interviewType || !interviewType.trim()) {
      return { success: false, error: 'Interview type is required.' };
    }

    let d1: Date | null = null;
    let d2: Date | null = null;
    let d3: Date | null = null;

    if (slot1 && slot2 && slot3) {
      d1 = new Date(slot1);
      d2 = new Date(slot2);
      d3 = new Date(slot3);
    }

    // Security check: Verify submission & secure token
    const submission = await (prisma as any).candidateSubmission.findFirst({
      where: {
        id: submissionId,
        secureReviewToken: token
      },
      include: {
        job: {
          select: {
            id: true,
            title: true,
            agencyId: true,
            client: { select: { companyName: true, contacts: { select: { email: true }, take: 1 } } }
          }
        },
        candidate: {
          select: { id: true, firstName: true, lastName: true, email: true, phone: true }
        },
        recruiter: {
          select: { id: true, firstName: true, lastName: true, email: true }
        }
      }
    });

    if (!submission) {
      return { success: false, error: 'Unauthorized or invalid submission review token.' };
    }

    const agencyId = submission.agencyId || submission.job.agencyId;
    const crypto = await import('crypto');
    const candidateToken = crypto.randomBytes(32).toString('hex');
    const tokenExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days validity

    // Map interview type string to enum if applicable
    let mappedType: InterviewType = InterviewType.CLIENT_DISCUSSION;
    if (interviewType === 'Technical Round') mappedType = InterviewType.TECHNICAL_ROUND;
    else if (interviewType === 'HR Round') mappedType = InterviewType.HR_ROUND;
    else if (interviewType === 'Client Discussion') mappedType = InterviewType.CLIENT_DISCUSSION;
    else if (interviewType === 'Final Round') mappedType = InterviewType.FINAL_ROUND;
    else if (interviewType === 'Custom') mappedType = InterviewType.CUSTOM;

    // Create InterviewSchedule record
    const interview = await prisma.interviewSchedule.create({
      data: {
        agencyId,
        submissionId: submission.id,
        roundType: mappedType,
        notes: interviewNotes || null,
        status: 'PENDING_SLOT_SELECTION',
        candidateToken,
        tokenExpiresAt,
        meetingProvider: calendlyUrl ? 'CALENDLY' as any : 'MANUAL',
        createdBy: 'CLIENT'
      }
    });

    let createdSlots: any[] = [];
    if (d1 && d2 && d3) {
      const slotTimes = [d1, d2, d3];
      createdSlots = await Promise.all(
        slotTimes.map(st =>
          prisma.proposedInterviewSlot.create({
            data: {
              agencyId,
              submissionId: submission.id,
              startTime: st,
              endTime: new Date(st.getTime() + 45 * 60 * 1000),
              isSelected: false
            }
          })
        )
      );
    }

    // Update Submission Status
    await prisma.candidateSubmission.update({
      where: { id: submission.id },
      data: {
        status: 'INTERVIEW',
        updatedAt: new Date()
      }
    });

    const candidateName = `${submission.candidate.firstName} ${submission.candidate.lastName}`.trim();
    const positionTitle = submission.job.title;
    const companyName = submission.job.client?.companyName || 'Client';

    // SECTION I: Trigger Notification IW-01-A to Recruiter
    if (submission.recruiter?.id) {
      const { createNotification, NotificationType, NotificationCategory } = await import('@/lib/notifications');
      await createNotification({
        agencyId,
        recipientUserId: submission.recruiter.id,
        title: `Interview Requested: ${candidateName}`,
        message: `Client ${companyName} requested an interview (${interviewType}) for ${candidateName} on ${positionTitle}. Waiting for candidate slot selection.`,
        type: NotificationType.INFO,
        category: NotificationCategory.CANDIDATE,
        entityType: 'INTERVIEW',
        entityId: interview.id
      });
    }

    // SECTION C: Trigger Email Event CLIENT_INTERVIEW_INVITATION to Candidate & Recruiter
    const { logClientInterviewInvitationEmail, processPendingEmails } = await import('@/lib/email');

    const formattedSlots = createdSlots.map((slot, idx) => {
      const st = slot.startTime;
      const dayDateStr = st.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
      const timeTzStr = `${st.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })} IST`;
      return {
        id: slot.id,
        index: idx + 1,
        dateTimeStr: `${dayDateStr} - ${timeTzStr}`,
        dayDateStr,
        timeTzStr
      };
    });

    // Email to Candidate
    if (submission.candidate.email) {
      await logClientInterviewInvitationEmail(
        agencyId,
        submission.candidate.email,
        candidateName,
        positionTitle,
        companyName,
        interviewType,
        interviewNotes,
        formattedSlots,
        candidateToken,
        calendlyUrl
      );
    }

    // Trigger immediate SMTP dispatch so email arrives in recipient inbox right away
    await processPendingEmails(agencyId);

    revalidatePath('/interviews');
    revalidatePath('/submissions');

    return {
      success: true,
      interviewId: interview.id,
      candidateToken
    };
  } catch (err: any) {
    console.error('Error in scheduleClientInterviewAction:', err);
    return { success: false, error: err.message || 'Failed to schedule client interview.' };
  }
}

/**
 * SECTION D: Candidate Slot Selection Public Query Action
 */
export async function getInterviewSlotSelectionDataAction(candidateToken: string): Promise<{
  success: boolean;
  isConsumed?: boolean;
  interview?: any;
  error?: string;
}> {
  try {
    if (!candidateToken || typeof candidateToken !== 'string') {
      return { success: false, error: 'Invalid candidate interview link.' };
    }

    const interview = await (prisma as any).interviewSchedule.findUnique({
      where: { candidateToken },
      include: {
        submission: {
          include: {
            job: {
              select: {
                title: true,
                client: { select: { companyName: true } }
              }
            },
            candidate: {
              select: { firstName: true, lastName: true, email: true }
            }
          }
        }
      }
    });

    if (!interview) {
      return { success: false, error: 'Interview scheduling link not found or invalid.' };
    }

    const slots = await prisma.proposedInterviewSlot.findMany({
      where: { submissionId: interview.submissionId },
      orderBy: { startTime: 'asc' }
    });

    const candidateName = `${interview.submission.candidate.firstName} ${interview.submission.candidate.lastName}`.trim();
    const positionTitle = interview.submission.job.title;
    const companyName = interview.submission.job.client?.companyName || 'Client Company';

    const formattedSlots = slots.map((s, i) => ({
      slotId: s.id,
      index: i + 1,
      startTime: s.startTime.toISOString(),
      endTime: s.endTime.toISOString(),
      isSelected: s.isSelected,
      formattedStr: s.startTime.toLocaleString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      })
    }));

    return {
      success: true,
      isConsumed: !!interview.tokenConsumedAt,
      interview: {
        id: interview.id,
        candidateName,
        positionTitle,
        companyName,
        roundType: interview.roundType || 'Client Discussion',
        notes: interview.notes,
        status: interview.status,
        meetingUrl: interview.meetingUrl || interview.meetingLink || null,
        confirmedStartTime: interview.confirmedStartTime ? interview.confirmedStartTime.toISOString() : null,
        tokenConsumedAt: interview.tokenConsumedAt ? interview.tokenConsumedAt.toISOString() : null,
        slots: formattedSlots
      }
    };
  } catch (err: any) {
    console.error('Error in getInterviewSlotSelectionDataAction:', err);
    return { success: false, error: err.message || 'Failed to load interview slot details.' };
  }
}

/**
 * SECTION D & E: Candidate One-Click Slot Confirmation Action (Atomic & Concurrency-Safe)
 */
export async function confirmCandidateSlotSelectionAction(
  candidateToken: string,
  selectedSlotId?: string
): Promise<{
  success: boolean;
  alreadyConfirmed?: boolean;
  candidateName?: string;
  positionTitle?: string;
  companyName?: string;
  roundType?: string;
  confirmedStartTime?: string;
  timezoneStr?: string;
  meetingUrl?: string;
  error?: string;
}> {
  try {
    if (!candidateToken) {
      return { success: false, error: 'Invalid candidate interview confirmation token.' };
    }

    // Atomic transaction for concurrency safety & race conditions
    const txResult = await prisma.$transaction(async (tx) => {
      const interview = await (tx as any).interviewSchedule.findUnique({
        where: { candidateToken },
        include: {
          submission: {
            include: {
              job: {
                select: {
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
              candidate: { select: { firstName: true, lastName: true, email: true } },
              recruiter: { select: { id: true, email: true } }
            }
          }
        }
      });

      if (!interview) {
        return { success: false, error: 'Interview invitation token not found.' };
      }

      const candidateName = `${interview.submission.candidate.firstName} ${interview.submission.candidate.lastName}`.trim();
      const positionTitle = interview.submission.job.title;
      const companyName = interview.submission.job.client?.companyName || 'Client Company';
      const roundType = interview.roundType || 'Client Discussion';
      const timezoneStr = 'IST (UTC+5:30)';

      // Check if already confirmed (subsequent clicks or race condition)
      if (interview.tokenConsumedAt || interview.status === 'SCHEDULED') {
        const meetingUrl = interview.meetingUrl || interview.meetingLink || `https://meet.jit.si/recruitos-interview-${interview.id.slice(0, 8)}`;
        return {
          success: true,
          alreadyConfirmed: true,
          candidateName,
          positionTitle,
          companyName,
          roundType,
          confirmedStartTime: interview.confirmedStartTime ? interview.confirmedStartTime.toISOString() : undefined,
          timezoneStr,
          meetingUrl
        };
      }

      // Find target slot: specified slotId or first available slot if direct link used
      let slot = null;
      if (selectedSlotId) {
        slot = await tx.proposedInterviewSlot.findFirst({
          where: { id: selectedSlotId, submissionId: interview.submissionId }
        });
      } else {
        slot = await tx.proposedInterviewSlot.findFirst({
          where: { submissionId: interview.submissionId },
          orderBy: { startTime: 'asc' }
        });
      }

      if (!slot) {
        return { success: false, error: 'Selected interview time slot not found or invalid.' };
      }

      // Generate meeting link
      const meetingId = `meet-${crypto.randomBytes(8).toString('hex')}`;
      const meetingUrl = interview.meetingUrl || interview.meetingLink || `https://meet.jit.si/recruitos-interview-${interview.id.slice(0, 8)}`;

      // Update selected slot & lock remaining slots
      await tx.proposedInterviewSlot.updateMany({
        where: { submissionId: interview.submissionId },
        data: { isSelected: false }
      });
      await tx.proposedInterviewSlot.update({
        where: { id: slot.id },
        data: { isSelected: true }
      });

      // Update InterviewSchedule to SCHEDULED & mark token consumed
      const updatedInterview = await tx.interviewSchedule.update({
        where: { id: interview.id },
        data: {
          slotId: slot.id,
          confirmedStartTime: slot.startTime,
          scheduledStart: slot.startTime,
          scheduledEnd: slot.endTime,
          meetingId,
          meetingUrl,
          meetingLink: meetingUrl,
          meetingProvider: 'JITSI' as any,
          meetingStatus: 'SCHEDULED',
          meetingGeneratedAt: new Date(),
          status: 'SCHEDULED',
          tokenConsumedAt: new Date(),
          updatedAt: new Date()
        } as any
      });

      // Update CandidateSubmission stage to INTERVIEW_SCHEDULED
      await tx.candidateSubmission.update({
        where: { id: interview.submissionId },
        data: {
          stage: PipelineStage.INTERVIEW_SCHEDULED,
          updatedAt: new Date()
        }
      });

      return {
        success: true,
        alreadyConfirmed: false,
        interview: updatedInterview,
        submission: interview.submission,
        slot,
        candidateName,
        positionTitle,
        companyName,
        roundType,
        timezoneStr,
        meetingUrl
      };
    });

    if (!txResult.success) {
      return { success: false, error: txResult.error };
    }

    const interview = txResult.interview!;
    const submission = txResult.submission!;
    const slot = txResult.slot!;
    const candidateName = txResult.candidateName || 'Candidate';
    const positionTitle = txResult.positionTitle || 'Position';
    const companyName = txResult.companyName || 'Company';
    const roundType = txResult.roundType || 'Interview';
    const timezoneStr = txResult.timezoneStr || 'IST (UTC+5:30)';
    const meetingUrl = txResult.meetingUrl || '#';
    const agencyId = interview.agencyId || submission.job.agencyId;
    const selectedSlotStr = slot.startTime.toLocaleString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });

    // Notifications (IW-01-B & IW-01-C)
    const { createNotification, NotificationType, NotificationCategory } = await import('@/lib/notifications');
    if (submission.recruiter?.id) {
      await createNotification({
        agencyId,
        recipientUserId: submission.recruiter.id,
        title: `Interview Scheduled: ${candidateName}`,
        message: `Candidate ${candidateName} confirmed slot ${selectedSlotStr} for ${positionTitle} (${companyName}). Meeting Link: ${meetingUrl}`,
        type: NotificationType.SUCCESS,
        category: NotificationCategory.CANDIDATE,
        entityType: 'INTERVIEW',
        entityId: interview.id
      });
    }

    // Confirmation Emails (Candidate, Recruiter, Client)
    const { logInterviewSlotSelectedEmail, processPendingEmails } = await import('@/lib/email');

    if (submission.candidate?.email) {
      await logInterviewSlotSelectedEmail(
        agencyId,
        submission.candidate.email,
        candidateName,
        positionTitle,
        companyName,
        roundType,
        selectedSlotStr,
        meetingUrl,
        timezoneStr,
        'CANDIDATE'
      );
    }

    let recruiterEmail = submission.recruiter?.email?.trim();
    if (!recruiterEmail || recruiterEmail === 'vikrant@botspring.in' || recruiterEmail.includes('botspringhq.in') || !recruiterEmail.includes('@')) {
      recruiterEmail = 'divyanshu@botspring.in';
    }

    await logInterviewSlotSelectedEmail(
      agencyId,
      recruiterEmail,
      candidateName,
      positionTitle,
      companyName,
      roundType,
      selectedSlotStr,
      meetingUrl,
      timezoneStr,
      'RECRUITER'
    );

    const clientEmail = submission.job.client?.contacts[0]?.email;
    if (clientEmail) {
      await logInterviewSlotSelectedEmail(
        agencyId,
        clientEmail,
        candidateName,
        positionTitle,
        companyName,
        roundType,
        selectedSlotStr,
        meetingUrl,
        timezoneStr,
        'CLIENT'
      );
    }

    // Immediate email dispatch
    await processPendingEmails(agencyId);

    // Auto-generate Interview Prep Kit (IW-03)
    try {
      const { generateAndSendPrepKitAction } = await import('@/app/actions/interviewPrep');
      await generateAndSendPrepKitAction(interview.id);
    } catch (prepErr) {
      console.error('Failed to auto-generate preparation kit:', prepErr);
    }

    revalidatePath('/interviews');
    revalidatePath('/submissions');

    return {
      success: true,
      alreadyConfirmed: false,
      candidateName,
      positionTitle,
      companyName,
      roundType,
      confirmedStartTime: slot.startTime.toISOString(),
      timezoneStr,
      meetingUrl
    };
  } catch (err: any) {
    console.error('Error in confirmCandidateSlotSelectionAction:', err);
    return { success: false, error: err.message || 'Failed to confirm interview slot.' };
  }
}

export interface InterviewOutcomeFeedbackParams {
  interviewId?: string;
  submissionId?: string;
  decision: 'SELECTED' | 'HOLD' | 'REJECTED';
  feedbackNotes?: string;
  ratingStars?: number;
  submittedByRole?: 'CLIENT' | 'RECRUITER';
}

export async function submitInterviewOutcomeFeedbackAction(
  payload: InterviewOutcomeFeedbackParams
): Promise<{ success: boolean; error?: string }> {
  try {
    const { interviewId, submissionId, decision, feedbackNotes, ratingStars = 5, submittedByRole = 'CLIENT' } = payload;

    if (!['SELECTED', 'HOLD', 'REJECTED'].includes(decision)) {
      return { success: false, error: 'Invalid feedback decision choice.' };
    }

    let interview: any = null;

    if (interviewId) {
      interview = await prisma.interviewSchedule.findUnique({
        where: { id: interviewId },
        include: {
          submission: {
            include: {
              job: { include: { client: { include: { contacts: true } } } },
              candidate: true,
              recruiter: true
            }
          }
        }
      });
    } else if (submissionId) {
      interview = await prisma.interviewSchedule.findFirst({
        where: { submissionId },
        orderBy: { createdAt: 'desc' },
        include: {
          submission: {
            include: {
              job: { include: { client: { include: { contacts: true } } } },
              candidate: true,
              recruiter: true
            }
          }
        }
      });
    }

    if (!interview) {
      return { success: false, error: 'Interview schedule or submission record not found.' };
    }

    const agencyId = interview.agencyId || interview.submission.job.agencyId;
    const candidateName = `${interview.submission.candidate.firstName} ${interview.submission.candidate.lastName}`.trim();
    const positionTitle = interview.submission.job.title;
    const companyName = interview.submission.job.client?.companyName || 'Client Company';

    // 1. Create InterviewFeedback record
    try {
      await (prisma as any).interviewFeedback.create({
        data: {
          agencyId,
          submissionId: interview.submissionId,
          interviewScheduleId: interview.id,
          submittedByRole,
          ratingStars,
          feedbackText: feedbackNotes || `Candidate marked as ${decision}`,
          recommendationDecision: decision
        }
      });
    } catch (fbErr) {
      console.warn('Could not insert into InterviewFeedback model directly:', fbErr);
    }

    // 2. Update InterviewSchedule status
    await prisma.interviewSchedule.update({
      where: { id: interview.id },
      data: {
        status: 'COMPLETED',
        updatedAt: new Date()
      }
    });

    // 3. Update CandidateSubmission stage & status based on outcome
    let targetStage = interview.submission.stage;
    let targetStatus = interview.submission.status;

    if (decision === 'SELECTED') {
      targetStage = PipelineStage.OFFER_EXTENDED;
      targetStatus = 'INTERVIEW_SELECTED';
    } else if (decision === 'HOLD') {
      targetStatus = 'CLIENT_HOLD';
    } else if (decision === 'REJECTED') {
      targetStage = PipelineStage.REJECTED;
      targetStatus = 'CLIENT_REJECT';
    }

    await prisma.candidateSubmission.update({
      where: { id: interview.submissionId },
      data: {
        stage: targetStage,
        status: targetStatus,
        updatedAt: new Date()
      }
    });

    // 4. Create internal platform Notification
    const { createNotification, NotificationType, NotificationCategory } = await import('@/lib/notifications');
    if (interview.submission.recruiter?.id) {
      await createNotification({
        agencyId,
        recipientUserId: interview.submission.recruiter.id,
        title: `Interview Outcome Logged: ${candidateName}`,
        message: `Client decision for ${candidateName} (${positionTitle}): ${decision}.${feedbackNotes ? ` Notes: "${feedbackNotes}"` : ''}`,
        type: decision === 'SELECTED' ? NotificationType.SUCCESS : decision === 'HOLD' ? NotificationType.WARNING : NotificationType.ERROR,
        category: NotificationCategory.CANDIDATE,
        entityType: 'INTERVIEW',
        entityId: interview.id
      });
    }

    // 5. Dispatch automated email notifications
    const { logInterviewOutcomeEmail, processPendingEmails } = await import('@/lib/email');

    // Candidate Notification
    if (interview.submission.candidate.email) {
      await logInterviewOutcomeEmail(
        agencyId,
        interview.submission.candidate.email,
        candidateName,
        positionTitle,
        companyName,
        decision,
        feedbackNotes,
        'CANDIDATE'
      );
    }

    // Recruiter Notification
    if (interview.submission.recruiter?.email) {
      await logInterviewOutcomeEmail(
        agencyId,
        interview.submission.recruiter.email,
        candidateName,
        positionTitle,
        companyName,
        decision,
        feedbackNotes,
        'RECRUITER'
      );
    }

    // Client Contact Confirmation
    const clientEmail = interview.submission.job.client?.contacts[0]?.email;
    if (clientEmail) {
      await logInterviewOutcomeEmail(
        agencyId,
        clientEmail,
        candidateName,
        positionTitle,
        companyName,
        decision,
        feedbackNotes,
        'CLIENT'
      );
    }

    // Process pending emails immediately
    if (agencyId) {
      await processPendingEmails(agencyId);
    }

    revalidatePath('/interviews');
    revalidatePath('/submissions');

    return { success: true };
  } catch (err: any) {
    console.error('Error in submitInterviewOutcomeFeedbackAction:', err);
    return { success: false, error: err.message || 'Failed to submit interview feedback outcome.' };
  }
}

