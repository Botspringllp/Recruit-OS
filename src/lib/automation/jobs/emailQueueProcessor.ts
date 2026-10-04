import { prisma } from '@/lib/prisma';
import { sendAgencyEmail } from '@/lib/smtp';

export interface EmailQueueProcessorResult {
  success: boolean;
  processedCount: number;
  failedCount: number;
  details?: Record<string, any>;
  error?: string;
}

/**
 * Calculates next retry timestamp using exponential backoff:
 * Retry #1: +5 mins
 * Retry #2: +30 mins
 * Retry #3: +2 hours
 */
export function getNextRetryDate(retryCount: number): Date {
  const now = new Date();
  if (retryCount === 1) {
    return new Date(now.getTime() + 5 * 60 * 1000); // 5 mins
  }
  if (retryCount === 2) {
    return new Date(now.getTime() + 30 * 60 * 1000); // 30 mins
  }
  return new Date(now.getTime() + 120 * 60 * 1000); // 2 hours
}

export async function processEmailQueueJob(): Promise<EmailQueueProcessorResult> {
  let processedCount = 0;
  let failedCount = 0;

  try {
    const now = new Date();

    // Fetch pending or failed retryable email logs
    const emailsToProcess = await (prisma as any).emailLog.findMany({
      where: {
        OR: [
          { status: 'PENDING' },
          {
            status: 'FAILED',
            retryCount: { lt: 3 },
            OR: [
              { nextRetryAt: null },
              { nextRetryAt: { lte: now } }
            ]
          }
        ]
      },
      orderBy: { createdAt: 'asc' },
      take: 50
    });

    for (const email of emailsToProcess) {
      const currentRetry = (email.retryCount || 0) + 1;

      try {
        const sendResult = await sendAgencyEmail({
          agencyId: email.agencyId,
          to: email.recipientEmail,
          subject: email.subject,
          html: email.htmlBody || '',
          text: email.textBody || undefined
        });

        if (sendResult.success && sendResult.isSmtpSent) {
          await (prisma as any).emailLog.update({
            where: { id: email.id },
            data: {
              status: 'SENT',
              sentAt: new Date(),
              errorMessage: null
            }
          });
          processedCount++;
        } else {
          // If max retries reached, set PERMANENT_FAILURE
          const isPermanent = currentRetry >= 3;
          const nextRetry = isPermanent ? null : getNextRetryDate(currentRetry);

          await (prisma as any).emailLog.update({
            where: { id: email.id },
            data: {
              status: isPermanent ? 'PERMANENT_FAILURE' : 'FAILED',
              retryCount: currentRetry,
              nextRetryAt: nextRetry,
              errorMessage: (sendResult.error || 'SMTP delivery failed').slice(0, 1000)
            }
          });
          failedCount++;
        }
      } catch (err: any) {
        const isPermanent = currentRetry >= 3;
        const nextRetry = isPermanent ? null : getNextRetryDate(currentRetry);

        await (prisma as any).emailLog.update({
          where: { id: email.id },
          data: {
            status: isPermanent ? 'PERMANENT_FAILURE' : 'FAILED',
            retryCount: currentRetry,
            nextRetryAt: nextRetry,
            errorMessage: String(err?.message || err).slice(0, 1000)
          }
        });
        failedCount++;
      }
    }

    return {
      success: true,
      processedCount,
      failedCount,
      details: { totalFound: emailsToProcess.length }
    };
  } catch (error: any) {
    console.error('[EMAIL_QUEUE_PROCESSOR Job Error]:', error);
    return {
      success: false,
      processedCount,
      failedCount,
      error: error?.message || 'Email queue processing failed'
    };
  }
}
