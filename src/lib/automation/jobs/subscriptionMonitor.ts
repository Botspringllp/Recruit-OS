import { prisma } from '@/lib/prisma';
import { createNotification, NotificationType, NotificationCategory } from '@/lib/notifications';
import { createEmailLog } from '@/lib/email';
import { generateSubscriptionExpiryTemplate } from '@/lib/emailTemplates';

export interface SubscriptionMonitorResult {
  success: boolean;
  processedCount: number;
  failedCount: number;
  details?: Record<string, any>;
  error?: string;
}

const ALERT_THRESHOLDS = [30, 15, 7, 3, 1];

export async function processSubscriptionMonitorJob(): Promise<SubscriptionMonitorResult> {
  let processedCount = 0;
  let failedCount = 0;

  try {
    const now = new Date();

    const agencies = await (prisma as any).agency.findMany({
      where: {
        subscriptionExpiryDate: { not: null },
        deletedAt: null
      },
      include: {
        users: {
          where: { role: 'AGENCY_ADMIN' },
          take: 1
        }
      }
    });

    for (const agency of agencies) {
      if (!agency.subscriptionExpiryDate) continue;

      const expiryDate = new Date(agency.subscriptionExpiryDate);
      const diffMs = expiryDate.getTime() - now.getTime();
      const daysRemaining = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

      if (daysRemaining <= 0 || !ALERT_THRESHOLDS.includes(daysRemaining)) {
        continue;
      }

      const adminUser = agency.users?.[0];
      const recipientEmail = agency.businessEmail || agency.replyToEmail || adminUser?.email;

      if (!recipientEmail) continue;

      // Idempotency check: Check if alert was already sent for this agency & threshold
      const subjectTag = `Subscription Expiry Alert (${daysRemaining} Days Remaining)`;
      const existingLog = await (prisma as any).emailLog.findFirst({
        where: {
          agencyId: agency.id,
          eventType: 'SUBSCRIPTION_EXPIRY',
          subject: { contains: `${daysRemaining} Days` }
        }
      });

      if (existingLog) {
        // Alert already sent for this threshold
        continue;
      }

      try {
        // Generate Email Template
        const emailTemplate = generateSubscriptionExpiryTemplate({
          agency: { agencyName: agency.name || 'RecruitOS Agency' },
          agencyName: agency.name || 'RecruitOS Agency',
          daysRemaining,
          expiryDate: expiryDate.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
        });

        // Dispatches Email Log
        await createEmailLog({
          agencyId: agency.id,
          eventType: 'SUBSCRIPTION_EXPIRY',
          recipientEmail,
          subject: subjectTag,
          htmlBody: emailTemplate.html,
          textBody: emailTemplate.text
        });

        // Trigger Platform Notification for Admin
        if (adminUser?.id) {
          await createNotification({
            agencyId: agency.id,
            recipientUserId: adminUser.id,
            title: `Subscription Expiring in ${daysRemaining} Days`,
            message: `Your RecruitOS agency subscription for ${agency.name} will expire on ${expiryDate.toLocaleDateString()}. Please renew to avoid service interruption.`,
            type: NotificationType.WARNING,
            category: NotificationCategory.SUBSCRIPTION,
            entityType: 'SUBSCRIPTION',
            entityId: agency.id
          });
        }

        processedCount++;
      } catch (err: any) {
        console.error(`[SUBSCRIPTION_MONITOR Error for Agency ${agency.id}]:`, err);
        failedCount++;
      }
    }

    return {
      success: true,
      processedCount,
      failedCount,
      details: { totalAgenciesChecked: agencies.length }
    };
  } catch (error: any) {
    console.error('[SUBSCRIPTION_MONITOR Job Exception]:', error);
    return {
      success: false,
      processedCount,
      failedCount,
      error: error?.message || 'Subscription monitor job failed'
    };
  }
}
