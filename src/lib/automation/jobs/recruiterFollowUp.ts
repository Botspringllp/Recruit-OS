import { prisma } from '@/lib/prisma';
import { createNotification, NotificationType, NotificationCategory } from '@/lib/notifications';
import { createEmailLog } from '@/lib/email';

export interface RecruiterFollowUpResult {
  success: boolean;
  processedCount: number;
  failedCount: number;
  details?: Record<string, any>;
  error?: string;
}

export async function processRecruiterFollowUpJob(): Promise<RecruiterFollowUpResult> {
  let processedCount = 0;
  let failedCount = 0;

  try {
    const now = new Date();
    const threshold48HoursAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000);

    // Find candidate submissions submitted to clients more than 48 hours ago
    const pendingSubmissions = await (prisma as any).candidateSubmission.findMany({
      where: {
        stage: 'CLIENT_REVIEW',
        submittedAt: { lte: threshold48HoursAgo }
      },
      include: {
        candidate: true,
        job: {
          include: { client: true }
        },
        recruiter: true
      },
      take: 100
    });

    for (const submission of pendingSubmissions) {
      const candidateName = `${submission.candidate?.firstName} ${submission.candidate?.lastName}`.trim();
      const positionTitle = submission.job?.title || 'Role';
      const clientName = submission.job?.client?.companyName || 'Client';
      const hoursAwaiting = Math.floor((now.getTime() - new Date(submission.submittedAt).getTime()) / (1000 * 60 * 60));

      const recruiterEmail = submission.recruiter?.email;
      const recruiterUserId = submission.recruiter?.id;

      // Idempotency: Check if alert was sent in the last 24 hours for this submission
      const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const existingLog = await (prisma as any).emailLog.findFirst({
        where: {
          recipientEmail: recruiterEmail || '',
          eventType: 'INTERVIEW_FEEDBACK_PENDING',
          createdAt: { gte: last24Hours },
          metadata: { path: ['submissionId'], equals: submission.id }
        }
      });

      if (existingLog) {
        continue;
      }

      try {
        const title = `Client Review Follow-Up: ${candidateName}`;
        const message = `Candidate ${candidateName} has been awaiting client review at ${clientName} for ${positionTitle} for ${hoursAwaiting} hours. Consider following up with the client.`;

        // Send Email to Recruiter
        if (recruiterEmail) {
          await createEmailLog({
            agencyId: submission.agencyId,
            eventType: 'INTERVIEW_FEEDBACK_PENDING',
            recipientEmail: recruiterEmail,
            subject: `[Follow-Up Required] ${candidateName} awaiting review for ${hoursAwaiting}h at ${clientName}`,
            htmlBody: `
              <p style="margin-top:0;">Hi <strong>${submission.recruiter?.firstName || 'Recruiter'}</strong>,</p>
              <p>Candidate <strong>${candidateName}</strong> was submitted for <strong>${positionTitle}</strong> at <strong>${clientName}</strong> on <strong>${new Date(submission.submittedAt).toLocaleDateString()}</strong>.</p>
              <div style="background-color:#fff7ed; border-left:4px solid #f97316; padding:12px; border-radius:6px; margin:16px 0; font-size:13px; color:#9a3412;">
                <strong>Warning:</strong> Candidate has been awaiting client review for <strong>${hoursAwaiting} hours</strong> without activity.
              </div>
              <p>Please reach out to the client hiring team to request feedback or schedule interviews.</p>
            `,
            textBody: message,
            metadata: { submissionId: submission.id, hoursAwaiting }
          });
        }

        // Trigger Notification
        if (recruiterUserId) {
          await createNotification({
            agencyId: submission.agencyId,
            recipientUserId: recruiterUserId,
            title,
            message,
            type: NotificationType.WARNING,
            category: NotificationCategory.SUBMISSION,
            entityType: 'SUBMISSION',
            entityId: submission.id
          });
        }

        processedCount++;
      } catch (err: any) {
        console.error(`[RECRUITER_FOLLOW_UP Error for Submission ${submission.id}]:`, err);
        failedCount++;
      }
    }

    return {
      success: true,
      processedCount,
      failedCount,
      details: { totalSubmissionsEvaluated: pendingSubmissions.length }
    };
  } catch (error: any) {
    console.error('[RECRUITER_FOLLOW_UP Job Exception]:', error);
    return {
      success: false,
      processedCount,
      failedCount,
      error: error?.message || 'Recruiter follow-up job failed'
    };
  }
}
