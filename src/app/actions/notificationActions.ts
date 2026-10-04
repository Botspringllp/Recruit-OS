'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/rbac';

export interface NotificationFilterOptions {
  category?: 'ALL' | 'UNREAD' | 'REQUIREMENTS' | 'CANDIDATES' | 'INTERVIEWS' | 'SYSTEM';
  searchQuery?: string;
  page?: number;
  pageSize?: number;
}

export async function getNotificationCenterAction(options: NotificationFilterOptions = {}) {
  try {
    const dbUser = await getCurrentUser();
    if (!dbUser) {
      return { success: false, error: 'Unauthorized', notifications: [], totalCount: 0, unreadCount: 0 };
    }

    const { category = 'ALL', searchQuery = '', page = 1, pageSize = 20 } = options;

    const where: any = {
      recipientUserId: dbUser.id
    };

    if (category === 'UNREAD') {
      where.isRead = false;
    } else if (category === 'REQUIREMENTS') {
      where.category = 'REQUIREMENT';
    } else if (category === 'CANDIDATES') {
      where.category = { in: ['CANDIDATE', 'SUBMISSION'] };
    } else if (category === 'INTERVIEWS') {
      where.category = { in: ['JOB_MANDATE', 'INTERVIEW'] };
    } else if (category === 'SYSTEM') {
      where.category = { in: ['SYSTEM', 'SUBSCRIPTION'] };
    }

    if (searchQuery.trim()) {
      const q = searchQuery.trim();
      where.OR = [
        { title: { contains: q, mode: 'insensitive' } },
        { message: { contains: q, mode: 'insensitive' } }
      ];
    }

    const [notifications, totalCount, unreadCount] = await Promise.all([
      (prisma as any).notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize
      }),
      (prisma as any).notification.count({ where }),
      (prisma as any).notification.count({ where: { recipientUserId: dbUser.id, isRead: false } })
    ]);

    // Mark retrieved notifications as delivered
    const unDeliveredIds = notifications.filter((n: any) => !n.deliveredAt).map((n: any) => n.id);
    if (unDeliveredIds.length > 0) {
      await (prisma as any).notification.updateMany({
        where: { id: { in: unDeliveredIds } },
        data: { deliveredAt: new Date() }
      });
    }

    return {
      success: true,
      notifications,
      totalCount,
      unreadCount,
      page,
      pageSize
    };
  } catch (err: any) {
    console.error('[getNotificationCenterAction Error]:', err);
    return { success: false, error: err?.message || 'Failed to fetch notifications', notifications: [], totalCount: 0, unreadCount: 0 };
  }
}

export async function bulkMarkNotificationsReadAction(notificationIds: string[]) {
  try {
    const dbUser = await getCurrentUser();
    if (!dbUser) return { success: false, error: 'Unauthorized' };

    await (prisma as any).notification.updateMany({
      where: {
        id: { in: notificationIds },
        recipientUserId: dbUser.id
      },
      data: {
        isRead: true,
        readAt: new Date()
      }
    });

    revalidatePath('/notifications');
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Failed to mark notifications read' };
  }
}

export async function markAllNotificationsReadAction() {
  try {
    const dbUser = await getCurrentUser();
    if (!dbUser) return { success: false, error: 'Unauthorized' };

    await (prisma as any).notification.updateMany({
      where: { recipientUserId: dbUser.id, isRead: false },
      data: { isRead: true, readAt: new Date() }
    });

    revalidatePath('/notifications');
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Failed to mark all as read' };
  }
}

export async function deleteNotificationsAction(notificationIds: string[]) {
  try {
    const dbUser = await getCurrentUser();
    if (!dbUser) return { success: false, error: 'Unauthorized' };

    await (prisma as any).notification.deleteMany({
      where: {
        id: { in: notificationIds },
        recipientUserId: dbUser.id
      }
    });

    revalidatePath('/notifications');
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Failed to delete notifications' };
  }
}

export async function getUserNotificationPreferencesAction() {
  try {
    const dbUser = await getCurrentUser();
    if (!dbUser) return { success: false, error: 'Unauthorized' };

    let prefs = await (prisma as any).userNotificationPreference.findUnique({
      where: { userId: dbUser.id }
    });

    if (!prefs) {
      prefs = await (prisma as any).userNotificationPreference.create({
        data: {
          userId: dbUser.id,
          emailNotifications: true,
          inAppNotifications: true,
          interviewNotifications: true,
          candidateNotifications: true,
          requirementNotifications: true,
          systemNotifications: true
        }
      });
    }

    return { success: true, preferences: prefs };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Failed to fetch preferences' };
  }
}

export async function updateUserNotificationPreferencesAction(data: {
  emailNotifications?: boolean;
  inAppNotifications?: boolean;
  interviewNotifications?: boolean;
  candidateNotifications?: boolean;
  requirementNotifications?: boolean;
  systemNotifications?: boolean;
}) {
  try {
    const dbUser = await getCurrentUser();
    if (!dbUser) return { success: false, error: 'Unauthorized' };

    const prefs = await (prisma as any).userNotificationPreference.upsert({
      where: { userId: dbUser.id },
      create: {
        userId: dbUser.id,
        ...data
      },
      update: {
        ...data
      }
    });

    revalidatePath('/settings/notifications');
    return { success: true, preferences: prefs };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Failed to update preferences' };
  }
}

export async function getNotificationAnalyticsAction() {
  try {
    const dbUser = await getCurrentUser();
    if (!dbUser) return { success: false, error: 'Unauthorized' };

    const agencyId = dbUser.agencyId;

    const [totalNotifs, deliveredCount, viewedCount, clickedCount] = await Promise.all([
      (prisma as any).notification.count({ where: agencyId ? { agencyId } : undefined }),
      (prisma as any).notification.count({ where: agencyId ? { agencyId, deliveredAt: { not: null } } : { deliveredAt: { not: null } } }),
      (prisma as any).notification.count({ where: agencyId ? { agencyId, isRead: true } : { isRead: true } }),
      (prisma as any).notification.count({ where: agencyId ? { agencyId, clickedAt: { not: null } } : { clickedAt: { not: null } } })
    ]);

    const deliveryRate = totalNotifs > 0 ? Math.round((deliveredCount / totalNotifs) * 100) : 100;
    const readRate = totalNotifs > 0 ? Math.round((viewedCount / totalNotifs) * 100) : 100;

    return {
      success: true,
      totalNotifs,
      deliveredCount,
      viewedCount,
      clickedCount,
      deliveryRate,
      readRate
    };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Failed to fetch delivery analytics' };
  }
}
