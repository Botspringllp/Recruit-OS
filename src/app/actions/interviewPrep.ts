'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { createNotification, NotificationType, NotificationCategory } from '@/lib/notifications';
import { logInterviewPrepKitEmail, EmailEventType, processPendingEmails } from '@/lib/email';
import crypto from 'crypto';

export interface ChecklistItem {
  id: string;
  label: string;
  completed: boolean;
}

/**
 * PART B: Auto Preparation Kit Generator
 * Generates an InterviewPreparationKit dynamically from Job Mandate, Client, Candidate, and Interview Round.
 */
export async function generateAndSendPrepKitAction(interviewScheduleId: string): Promise<{
  success: boolean;
  secureToken?: string;
  error?: string;
}> {
  try {
    const interview = await prisma.interviewSchedule.findUnique({
      where: { id: interviewScheduleId },
      include: {
        submission: {
          include: {
            job: {
              include: {
                client: true
              }
            },
            candidate: true,
            recruiter: true
          }
        },
        preparationKit: true
      } as any
    });

    if (!interview) {
      return { success: false, error: 'Interview schedule not found.' };
    }

    const submission = (interview as any).submission;
    const { job, candidate, recruiter } = submission || {};
    const agencyId = interview.agencyId || job.agencyId;
    const candidateName = `${candidate.firstName} ${candidate.lastName}`.trim();
    const companyName = job.client?.companyName || 'Client Company';
    const positionTitle = job.title;
    const roundTypeStr = interview.roundType ? String(interview.roundType) : 'Technical Discussion';

    // Extract dynamic skills from job title or requirements
    const defaultSkills = [
      'Core Domain Concepts & Technical Fundamentals',
      'System Architecture & Design Patterns',
      'Problem-Solving & Data Structures',
      'Past Project Accomplishments & Architecture',
      'Communication & Stakeholder Collaboration'
    ];

    const bestPracticesList = [
      'Join the meeting 5 minutes early to test audio, microphone, and video settings.',
      'Ensure a clean, well-lit, and quiet environment with stable internet connection.',
      'Use the STAR method (Situation, Task, Action, Result) when answering scenario questions.',
      'Be prepared to explain technical design decisions and trade-offs from your recent experience.',
      'Have 2-3 insightful questions ready regarding company tech stack and team structure.'
    ];

    const checklistItemsDefault: ChecklistItem[] = [
      { id: 'c1', label: 'Review Resume & Past Project Experiences', completed: false },
      { id: 'c2', label: 'Research Company Overview & Industry Context', completed: false },
      { id: 'c3', label: 'Test Video, Audio & Meeting Software (Jitsi/Meet)', completed: false },
      { id: 'c4', label: 'Prepare Technical & Scenario-Based Questions', completed: false }
    ];

    const meetingUrl = (interview as any).meetingUrl || interview.meetingLink || 'https://meet.jit.si';
    const meetingInstructions = `Please join using your unique meeting link: ${meetingUrl}. Make sure your webcam and microphone are operational prior to the interview start.`;
    const recruiterName = (recruiter as any)?.name || (recruiter as any)?.firstName || 'Recruitment Team';
    const contactInfo = `Recruiter: ${recruiterName} (${recruiter?.email || 'support@recruitos.com'})`;

    const secureToken = (interview as any).preparationKit?.secureToken || crypto.randomUUID();

    const prepKitData = {
      agencyId,
      interviewScheduleId: interview.id,
      candidateId: candidate.id,
      candidateSubmissionId: submission.id,
      secureToken,
      title: `Interview Preparation Kit - ${positionTitle}`,
      description: `Tailored interview preparation guide for ${candidateName} interviewing for ${positionTitle} at ${companyName}.`,
      companyOverview: job.client?.overview || `${companyName} is a leading enterprise organization hiring top talent for key engineering and business mandates.`,
      jobSummary: `Position: ${positionTitle}. Headcount: ${job.headcount}. Focus areas: Technical leadership, execution excellence, and collaborative problem solving.`,
      skillsToRevise: defaultSkills,
      bestPractices: bestPracticesList,
      meetingInstructions,
      contactInfo,
      checklistItems: checklistItemsDefault as any,
      status: 'SENT' as any,
      sentAt: new Date()
    };

    // Upsert prep kit record in DB
    const kit = await (prisma as any).interviewPreparationKit.upsert({
      where: { interviewScheduleId: interview.id },
      create: prepKitData,
      update: {
        ...prepKitData,
        updatedAt: new Date()
      }
    });

    // Format start time string for candidate email
    const startTimeFormatted = interview.confirmedStartTime
      ? new Date(interview.confirmedStartTime).toLocaleString('en-US', {
          weekday: 'short',
          month: 'short',
          day: 'numeric',
          year: 'numeric',
          hour: 'numeric',
          minute: '2-digit',
          hour12: true
        })
      : 'Scheduled Date & Time';

    // Send Candidate Preparation Email (PART C)
    if (candidate.email) {
      await logInterviewPrepKitEmail(
        agencyId,
        candidate.email,
        candidateName,
        positionTitle,
        companyName,
        roundTypeStr,
        startTimeFormatted,
        kit.secureToken,
        EmailEventType.INTERVIEW_PREP_SENT
      );
      await processPendingEmails(agencyId);
    }

    // Trigger Recruiter Notification: IW-03-A
    if (recruiter?.id) {
      await createNotification({
        agencyId,
        recipientUserId: recruiter.id,
        title: `IW-03-A: Preparation Kit Sent`,
        message: `Interview Preparation Kit generated & sent to candidate ${candidateName} for ${positionTitle} at ${companyName}.`,
        type: NotificationType.INFO,
        category: NotificationCategory.CANDIDATE,
        entityType: 'PREP_KIT',
        entityId: kit.id
      });
    }

    revalidatePath('/interviews');
    revalidatePath('/submissions');

    return { success: true, secureToken: kit.secureToken };
  } catch (err: any) {
    console.error('Error in generateAndSendPrepKitAction:', err);
    return { success: false, error: err.message || 'Failed to generate preparation kit.' };
  }
}

/**
 * PART D & E: Get Prep Kit By Secure Token & Record Opened Status
 */
export async function getPrepKitByTokenAction(token: string): Promise<{
  success: boolean;
  kit?: any;
  error?: string;
}> {
  try {
    if (!token) {
      return { success: false, error: 'Preparation token required.' };
    }

    const kit = await (prisma as any).interviewPreparationKit.findUnique({
      where: { secureToken: token },
      include: {
        interview: {
          include: {
            submission: {
              include: {
                job: { include: { client: true } },
                candidate: true,
                recruiter: true
              }
            }
          }
        }
      }
    });

    if (!kit) {
      return { success: false, error: 'Invalid or expired preparation kit token.' };
    }

    // Record openedAt & update status to OPENED if previously SENT or PENDING
    if (!kit.openedAt && (kit.status === 'SENT' || kit.status === 'PENDING')) {
      const updatedKit = await (prisma as any).interviewPreparationKit.update({
        where: { id: kit.id },
        data: {
          openedAt: new Date(),
          status: 'OPENED',
          updatedAt: new Date()
        }
      });

      kit.status = 'OPENED';
      kit.openedAt = updatedKit.openedAt;

      // Trigger Recruiter Notification: IW-03-B (Preparation Kit Opened)
      const recruiterId = kit.interview?.submission?.recruiter?.id;
      const candidateName = `${kit.interview?.submission?.candidate?.firstName || ''} ${kit.interview?.submission?.candidate?.lastName || ''}`.trim();
      const positionTitle = kit.interview?.submission?.job?.title || 'Job Mandate';

      if (recruiterId) {
        await createNotification({
          agencyId: kit.agencyId,
          recipientUserId: recruiterId,
          title: `IW-03-B: Preparation Kit Opened`,
          message: `Candidate ${candidateName} has opened their Interview Preparation Kit for ${positionTitle}.`,
          type: NotificationType.SUCCESS,
          category: NotificationCategory.CANDIDATE,
          entityType: 'PREP_KIT',
          entityId: kit.id
        });
      }
    }

    return { success: true, kit };
  } catch (err: any) {
    console.error('Error in getPrepKitByTokenAction:', err);
    return { success: false, error: err.message || 'Failed to load preparation kit.' };
  }
}

/**
 * PART F: Completion Tracking Action
 */
export async function markPrepKitCompletedAction(
  token: string,
  candidateNotes?: string,
  checklistItems?: ChecklistItem[]
): Promise<{ success: boolean; error?: string }> {
  try {
    if (!token) {
      return { success: false, error: 'Token required.' };
    }

    const kit = await (prisma as any).interviewPreparationKit.findUnique({
      where: { secureToken: token },
      include: {
        interview: {
          include: {
            submission: {
              include: {
                candidate: true,
                job: true,
                recruiter: true
              }
            }
          }
        }
      }
    });

    if (!kit) {
      return { success: false, error: 'Preparation kit not found.' };
    }

    await (prisma as any).interviewPreparationKit.update({
      where: { id: kit.id },
      data: {
        status: 'COMPLETED',
        completedAt: new Date(),
        candidateNotes: candidateNotes !== undefined ? candidateNotes : kit.candidateNotes,
        checklistItems: checklistItems !== undefined ? (checklistItems as any) : kit.checklistItems,
        updatedAt: new Date()
      }
    });

    // Trigger Recruiter Notification: IW-03-C (Preparation Kit Completed)
    const recruiterId = kit.interview?.submission?.recruiter?.id;
    const candidateName = `${kit.interview?.submission?.candidate?.firstName || ''} ${kit.interview?.submission?.candidate?.lastName || ''}`.trim();
    const positionTitle = kit.interview?.submission?.job?.title || 'Job Mandate';

    if (recruiterId) {
      await createNotification({
        agencyId: kit.agencyId,
        recipientUserId: recruiterId,
        title: `IW-03-C: Preparation Kit Completed`,
        message: `Candidate ${candidateName} marked their Interview Preparation Kit for ${positionTitle} as REVIEWED & COMPLETED.`,
        type: NotificationType.SUCCESS,
        category: NotificationCategory.CANDIDATE,
        entityType: 'PREP_KIT',
        entityId: kit.id
      });
    }

    return { success: true };
  } catch (err: any) {
    console.error('Error in markPrepKitCompletedAction:', err);
    return { success: false, error: err.message || 'Failed to submit preparation kit completion.' };
  }
}

/**
 * PART H: Reminder Automation Background Action (7h and 1h reminders)
 */
export async function checkAndSendPrepKitRemindersAction(): Promise<{
  success: boolean;
  sent7hCount: number;
  sent1hCount: number;
  error?: string;
}> {
  try {
    const now = new Date();

    // Find preparation kits where status is NOT COMPLETED
    const pendingKits = await (prisma as any).interviewPreparationKit.findMany({
      where: {
        status: { in: ['PENDING', 'SENT', 'OPENED'] }
      },
      include: {
        interview: {
          include: {
            submission: {
              include: {
                candidate: true,
                job: { include: { client: true } },
                recruiter: true
              }
            }
          }
        }
      }
    });

    let sent7hCount = 0;
    let sent1hCount = 0;

    for (const kit of pendingKits) {
      const startTime = kit.interview?.confirmedStartTime;
      if (!startTime) continue;

      const diffMs = new Date(startTime).getTime() - now.getTime();
      const hoursUntil = diffMs / (1000 * 60 * 60);

      const candidateEmail = kit.interview?.submission?.candidate?.email;
      const candidateName = `${kit.interview?.submission?.candidate?.firstName || ''} ${kit.interview?.submission?.candidate?.lastName || ''}`.trim();
      const positionTitle = kit.interview?.submission?.job?.title || 'Job Mandate';
      const companyName = kit.interview?.submission?.job?.client?.companyName || 'Client Company';
      const roundTypeStr = String(kit.interview?.roundType || 'Technical Round');
      const recruiterId = kit.interview?.submission?.recruiter?.id;

      const startTimeFormatted = new Date(startTime).toLocaleString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });

      // 7 Hour Reminder Check: hoursUntil <= 7 && hoursUntil > 1 && !firstReminderSentAt
      if (hoursUntil <= 7 && hoursUntil > 1 && !kit.firstReminderSentAt) {
        if (candidateEmail) {
          await logInterviewPrepKitEmail(
            kit.agencyId,
            candidateEmail,
            candidateName,
            positionTitle,
            companyName,
            roundTypeStr,
            startTimeFormatted,
            kit.secureToken,
            EmailEventType.INTERVIEW_PREP_REMINDER
          );
        }

        await (prisma as any).interviewPreparationKit.update({
          where: { id: kit.id },
          data: {
            firstReminderSentAt: new Date(),
            updatedAt: new Date()
          }
        });

        sent7hCount++;

        // Recruiter Notification: IW-03-D
        if (recruiterId) {
          await createNotification({
            agencyId: kit.agencyId,
            recipientUserId: recruiterId,
            title: `IW-03-D: 7 Hour Reminder Sent`,
            message: `7-hour interview readiness reminder sent to ${candidateName} for ${positionTitle}.`,
            type: NotificationType.WARNING,
            category: NotificationCategory.CANDIDATE,
            entityType: 'PREP_KIT',
            entityId: kit.id
          });
        }
      }

      // 1 Hour Final Reminder Check: hoursUntil <= 1 && hoursUntil > 0 && !secondReminderSentAt
      if (hoursUntil <= 1 && hoursUntil > 0 && !kit.secondReminderSentAt) {
        if (candidateEmail) {
          await logInterviewPrepKitEmail(
            kit.agencyId,
            candidateEmail,
            candidateName,
            positionTitle,
            companyName,
            roundTypeStr,
            startTimeFormatted,
            kit.secureToken,
            EmailEventType.INTERVIEW_PREP_FINAL_REMINDER
          );
        }

        await (prisma as any).interviewPreparationKit.update({
          where: { id: kit.id },
          data: {
            secondReminderSentAt: new Date(),
            updatedAt: new Date()
          }
        });

        sent1hCount++;

        // Recruiter Notification: IW-03-E
        if (recruiterId) {
          await createNotification({
            agencyId: kit.agencyId,
            recipientUserId: recruiterId,
            title: `IW-03-E: 1 Hour Reminder Sent`,
            message: `⚡ FINAL 1-hour interview readiness reminder sent to ${candidateName} for ${positionTitle}.`,
            type: NotificationType.WARNING,
            category: NotificationCategory.CANDIDATE,
            entityType: 'PREP_KIT',
            entityId: kit.id
          });
        }
      }

      if (kit.agencyId) {
        await processPendingEmails(kit.agencyId);
      }
    }

    return { success: true, sent7hCount, sent1hCount };
  } catch (err: any) {
    console.error('Error in checkAndSendPrepKitRemindersAction:', err);
    return { success: false, sent7hCount: 0, sent1hCount: 0, error: err.message };
  }
}

/**
 * PART K: Recruiter Interview Readiness Dashboard Metrics Action
 */
export async function getInterviewReadinessMetricsAction(agencyId?: string): Promise<{
  totalScheduled: number;
  prepSent: number;
  prepOpened: number;
  prepCompleted: number;
  needsFollowUp: number;
}> {
  try {
    const whereCondition = agencyId ? { agencyId } : {};

    const [schedules, kits] = await Promise.all([
      prisma.interviewSchedule.findMany({
        where: {
          ...whereCondition,
          confirmedStartTime: { not: null }
        },
        select: { id: true, confirmedStartTime: true }
      }),
      (prisma as any).interviewPreparationKit.findMany({
        where: whereCondition,
        select: {
          id: true,
          status: true,
          openedAt: true,
          completedAt: true,
          interview: { select: { confirmedStartTime: true } }
        }
      })
    ]);

    const totalScheduled = schedules.length;
    let prepSent = 0;
    let prepOpened = 0;
    let prepCompleted = 0;
    let needsFollowUp = 0;

    const now = new Date();

    for (const k of kits) {
      if (k.status === 'SENT' || k.status === 'OPENED' || k.status === 'COMPLETED') {
        prepSent++;
      }
      if (k.openedAt || k.status === 'OPENED' || k.status === 'COMPLETED') {
        prepOpened++;
      }
      if (k.completedAt || k.status === 'COMPLETED') {
        prepCompleted++;
      }

      // Needs Follow-Up: upcoming interview within 24h & prep not opened yet
      const startTime = k.interview?.confirmedStartTime;
      if (startTime && !k.openedAt && k.status !== 'COMPLETED') {
        const hoursLeft = (new Date(startTime).getTime() - now.getTime()) / (1000 * 60 * 60);
        if (hoursLeft > 0 && hoursLeft <= 24) {
          needsFollowUp++;
        }
      }
    }

    return {
      totalScheduled,
      prepSent,
      prepOpened,
      prepCompleted,
      needsFollowUp
    };
  } catch (err: any) {
    console.error('Error in getInterviewReadinessMetricsAction:', err);
    return {
      totalScheduled: 0,
      prepSent: 0,
      prepOpened: 0,
      prepCompleted: 0,
      needsFollowUp: 0
    };
  }
}
