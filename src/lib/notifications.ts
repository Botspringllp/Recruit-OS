import { prisma } from '@/lib/prisma';

export enum NotificationType {
  INFO = 'INFO',
  SUCCESS = 'SUCCESS',
  WARNING = 'WARNING',
  ERROR = 'ERROR'
}

export enum NotificationCategory {
  REQUIREMENT = 'REQUIREMENT',
  JOB_MANDATE = 'JOB_MANDATE',
  CANDIDATE = 'CANDIDATE',
  SUBMISSION = 'SUBMISSION',
  SYSTEM = 'SYSTEM',
  SUBSCRIPTION = 'SUBSCRIPTION'
}

export interface CreateNotificationInput {
  agencyId?: string | null;
  recipientUserId: string;
  title: string;
  message: string;
  type?: NotificationType;
  category?: NotificationCategory;
  entityType?: string | null;
  entityId?: string | null;
}

/**
 * Creates a single database-persisted notification for a recipient user.
 */
export async function createNotification(input: CreateNotificationInput) {
  try {
    if (!input.recipientUserId || !input.title || !input.message) {
      console.warn('[NotificationEngine] Missing required notification fields');
      return null;
    }

    const notification = await (prisma as any).notification.create({
      data: {
        agencyId: input.agencyId || null,
        recipientUserId: input.recipientUserId,
        title: input.title.trim(),
        message: input.message.trim(),
        type: input.type || NotificationType.INFO,
        category: input.category || NotificationCategory.SYSTEM,
        entityType: input.entityType || null,
        entityId: input.entityId || null,
        isRead: false
      }
    });

    return notification;
  } catch (error) {
    console.error('[NotificationEngine] Failed to create notification:', error);
    return null;
  }
}

/**
 * Sends a notification to all active owners (MASTER_OWNER, AGENCY_OWNER, AGENCY_FOUNDER) of an agency.
 */
export async function notifyAgencyOwners(
  agencyId: string,
  input: Omit<CreateNotificationInput, 'recipientUserId' | 'agencyId'>
) {
  try {
    if (!agencyId) return [];

    const owners = await prisma.user.findMany({
      where: {
        agencyId,
        role: { in: ['MASTER_OWNER', 'AGENCY_OWNER', 'AGENCY_FOUNDER'] },
        isActive: true,
        deletedAt: null
      },
      select: { id: true }
    });

    if (!owners.length) return [];

    const notificationsData = owners.map((owner) => ({
      agencyId,
      recipientUserId: owner.id,
      title: input.title.trim(),
      message: input.message.trim(),
      type: input.type || NotificationType.INFO,
      category: input.category || NotificationCategory.SYSTEM,
      entityType: input.entityType || null,
      entityId: input.entityId || null,
      isRead: false
    }));

    await (prisma as any).notification.createMany({
      data: notificationsData
    });
  } catch (error) {
    console.error('[NotificationEngine] Failed to notify agency owners:', error);
  }
}

/**
 * Sends a notification to all active Super Admins across the platform.
 */
export async function notifySuperAdmins(
  input: Omit<CreateNotificationInput, 'recipientUserId'>
) {
  try {
    const superAdmins = await prisma.user.findMany({
      where: {
        role: 'SUPER_ADMIN',
        isActive: true,
        deletedAt: null
      },
      select: { id: true }
    });

    if (!superAdmins.length) return [];

    const notificationsData = superAdmins.map((admin) => ({
      agencyId: input.agencyId || null,
      recipientUserId: admin.id,
      title: input.title.trim(),
      message: input.message.trim(),
      type: input.type || NotificationType.INFO,
      category: input.category || NotificationCategory.SYSTEM,
      entityType: input.entityType || null,
      entityId: input.entityId || null,
      isRead: false
    }));

    await (prisma as any).notification.createMany({
      data: notificationsData
    });
  } catch (error) {
    console.error('[NotificationEngine] Failed to notify super admins:', error);
  }
}

/**
 * Event E: Subscription Expiring check (<= 7 days remaining).
 * Emits WARNING notification to Agency Owners & Super Admins if not already notified today.
 */
export async function checkSubscriptionExpiryNotifications(agencyId: string) {
  try {
    if (!agencyId) return;

    const agency = await prisma.agency.findUnique({
      where: { id: agencyId },
      select: { id: true, name: true, subscriptionExpiryDate: true }
    });

    if (!agency || !agency.subscriptionExpiryDate) return;

    const now = new Date();
    const expiry = new Date(agency.subscriptionExpiryDate);
    const diffTime = expiry.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays > 0 && diffDays <= 7) {
      // Check if a subscription warning was already generated today for this agency
      const startOfToday = new Date();
      startOfToday.setHours(0, 0, 0, 0);

      const existingNotif = await (prisma as any).notification.findFirst({
        where: {
          agencyId: agency.id,
          category: NotificationCategory.SUBSCRIPTION,
          createdAt: { gte: startOfToday }
        }
      });

      if (!existingNotif) {
        const title = 'Subscription Expiring Soon';
        const message = `Subscription for agency "${agency.name}" is expiring in ${diffDays} day(s) on ${expiry.toLocaleDateString('en-US')}. Please renew to maintain uninterrupted access.`;

        await notifyAgencyOwners(agency.id, {
          title,
          message,
          type: NotificationType.WARNING,
          category: NotificationCategory.SUBSCRIPTION,
          entityType: 'SYSTEM',
          entityId: agency.id
        });

        await notifySuperAdmins({
          agencyId: agency.id,
          title: `Agency Subscription Alert: ${agency.name}`,
          message: `Agency "${agency.name}" subscription expires in ${diffDays} day(s).`,
          type: NotificationType.WARNING,
          category: NotificationCategory.SUBSCRIPTION,
          entityType: 'SYSTEM',
          entityId: agency.id
        });

        // Trigger Email Event: SUBSCRIPTION_EXPIRY
        try {
          const { logSubscriptionExpiryEmail } = await import('@/lib/email');
          const owners = await prisma.user.findMany({
            where: {
              agencyId: agency.id,
              role: { in: ['MASTER_OWNER', 'AGENCY_OWNER', 'AGENCY_FOUNDER'] },
              isActive: true,
              deletedAt: null
            },
            select: { email: true }
          });

          for (const owner of owners) {
            if (owner.email) {
              await logSubscriptionExpiryEmail(agency.id, owner.email, agency.name, diffDays);
            }
          }
        } catch (emailErr) {
          console.error('[NotificationEngine] Failed creating subscription expiry email log:', emailErr);
        }
      }
    }
  } catch (error) {
    console.error('[NotificationEngine] Failed checking subscription expiry:', error);
  }
}
