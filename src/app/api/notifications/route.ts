import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/rbac';
import { checkSubscriptionExpiryNotifications } from '@/lib/notifications';
import { NotificationCategory } from '@prisma/client';

export async function GET(req: Request) {
  try {
    const dbUser = await getCurrentUser();
    if (!dbUser) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.max(1, Math.min(50, parseInt(searchParams.get('limit') || '10', 10)));
    const category = searchParams.get('category') || 'ALL';
    const unreadOnly = searchParams.get('unreadOnly') === 'true';
    const query = (searchParams.get('q') || '').trim();

    const skip = (page - 1) * limit;

    // Build multi-tenant security condition (User sees ONLY their notifications)
    const whereClause: any = {
      recipientUserId: dbUser.id
    };

    if (category !== 'ALL' && Object.values(NotificationCategory).includes(category as NotificationCategory)) {
      whereClause.category = category as NotificationCategory;
    }

    if (unreadOnly) {
      whereClause.isRead = false;
    }

    if (query) {
      whereClause.OR = [
        { title: { contains: query, mode: 'insensitive' } },
        { message: { contains: query, mode: 'insensitive' } }
      ];
    }

    // Run query, unread counter, and total count concurrently
    const [notifications, unreadCount, total] = await Promise.all([
      (prisma as any).notification.findMany({
        where: whereClause,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      (prisma as any).notification.count({
        where: {
          recipientUserId: dbUser.id,
          isRead: false
        }
      }),
      (prisma as any).notification.count({
        where: whereClause
      })
    ]);

    // Check subscription expiry in background if agency context exists
    if (dbUser.agencyId) {
      checkSubscriptionExpiryNotifications(dbUser.agencyId).catch(() => {});
    }

    return NextResponse.json({
      success: true,
      notifications,
      unreadCount,
      total,
      totalPages: Math.ceil(total / limit) || 1,
      page,
      limit
    });
  } catch (error: any) {
    console.error('[Notifications API GET Error]:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch notifications' },
      { status: 500 }
    );
  }
}

export async function PATCH(req: Request) {
  try {
    const dbUser = await getCurrentUser();
    if (!dbUser) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();

    if (body.markAll) {
      // Mark all notifications for authenticated user as read
      await (prisma as any).notification.updateMany({
        where: {
          recipientUserId: dbUser.id,
          isRead: false
        },
        data: {
          isRead: true,
          readAt: new Date()
        }
      });
      return NextResponse.json({ success: true, message: 'All notifications marked as read' });
    }

    if (body.notificationId) {
      // Mark single notification as read
      await (prisma as any).notification.updateMany({
        where: {
          id: body.notificationId,
          recipientUserId: dbUser.id
        },
        data: {
          isRead: true,
          readAt: new Date()
        }
      });
      return NextResponse.json({ success: true, message: 'Notification marked as read' });
    }

    return NextResponse.json({ success: false, error: 'Missing notificationId or markAll param' }, { status: 400 });
  } catch (error: any) {
    console.error('[Notifications API PATCH Error]:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update notification' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
  try {
    const dbUser = await getCurrentUser();
    if (!dbUser) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const notificationId = searchParams.get('id');
    const clearRead = searchParams.get('clearRead') === 'true';

    if (clearRead) {
      await (prisma as any).notification.deleteMany({
        where: {
          recipientUserId: dbUser.id,
          isRead: true
        }
      });
      return NextResponse.json({ success: true, message: 'Read notifications cleared' });
    }

    if (notificationId) {
      await (prisma as any).notification.deleteMany({
        where: {
          id: notificationId,
          recipientUserId: dbUser.id
        }
      });
      return NextResponse.json({ success: true, message: 'Notification deleted' });
    }

    return NextResponse.json({ success: false, error: 'Missing notificationId or clearRead param' }, { status: 400 });
  } catch (error: any) {
    console.error('[Notifications API DELETE Error]:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to delete notification' },
      { status: 500 }
    );
  }
}
