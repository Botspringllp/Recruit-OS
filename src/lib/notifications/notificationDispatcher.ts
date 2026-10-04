import { prisma } from '@/lib/prisma';
import { notificationEventBus } from './eventBus';
import { notificationStreamManager } from './notificationStream';
import { NotificationType, NotificationCategory, CreateNotificationInput } from '@/lib/notifications';

export interface DispatchNotificationResult {
  success: boolean;
  notificationId?: string;
  error?: string;
}

/**
 * Central Notification Dispatcher (PART B).
 * Every notification in RecruitOS passes through this dispatcher.
 * 1. Saves notification to PostgreSQL database (notifications table).
 * 2. Emits real-time SSE payload to recipient's active stream.
 * 3. Triggers eventBus broadcast for multi-instance servers.
 */
export async function dispatchNotification(input: CreateNotificationInput): Promise<DispatchNotificationResult> {
  try {
    if (!input.recipientUserId || !input.title || !input.message) {
      return { success: false, error: 'Missing required notification recipientUserId, title, or message' };
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

    const payload = {
      id: notification.id,
      agencyId: notification.agencyId,
      recipientUserId: notification.recipientUserId,
      title: notification.title,
      message: notification.message,
      type: notification.type,
      category: notification.category,
      entityType: notification.entityType,
      entityId: notification.entityId,
      isRead: notification.isRead,
      createdAt: notification.createdAt.toISOString()
    };

    // 1. Send to local SSE connection manager
    notificationStreamManager.sendToUser(notification.recipientUserId, 'notification', payload);

    // 2. Emit to Node.js event bus
    notificationEventBus.emit('NEW_NOTIFICATION', payload);

    return { success: true, notificationId: notification.id };
  } catch (error: any) {
    console.error('[NotificationDispatcher Error]:', error);
    return { success: false, error: error?.message || 'Failed to dispatch notification' };
  }
}
