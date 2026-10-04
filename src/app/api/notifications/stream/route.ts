import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/rbac';
import { notificationStreamManager } from '@/lib/notifications/notificationStream';
import { notificationEventBus } from '@/lib/notifications/eventBus';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const dbUser = await getCurrentUser();
  if (!dbUser) {
    return new NextResponse('Unauthorized SSE connection request', { status: 401 });
  }

  const userId = dbUser.id;
  const agencyId = dbUser.agencyId || null;

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      // 1. Register with Notification Stream Manager
      const conn = notificationStreamManager.addConnection(userId, agencyId, controller);

      // 2. Send initial connected event
      const connectedPayload = `event: connected\ndata: ${JSON.stringify({ status: 'connected', userId, agencyId })}\n\n`;
      controller.enqueue(encoder.encode(connectedPayload));

      // 3. Setup Heartbeat interval (every 15 seconds) to prevent proxy timeout
      const heartbeatInterval = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(`: heartbeat\n\n`));
        } catch (err) {
          clearInterval(heartbeatInterval);
        }
      }, 15000);

      // 4. Listen to event bus for real-time broadcasts
      const onNewNotification = (notif: any) => {
        if (notif.recipientUserId === userId) {
          try {
            const payload = `event: notification\ndata: ${JSON.stringify(notif)}\n\n`;
            controller.enqueue(encoder.encode(payload));
          } catch (err) {
            // Stream closed
          }
        }
      };

      notificationEventBus.on('NEW_NOTIFICATION', onNewNotification);

      // 5. Cleanup when connection closes or aborts
      req.signal.onabort = () => {
        clearInterval(heartbeatInterval);
        notificationEventBus.off('NEW_NOTIFICATION', onNewNotification);
        notificationStreamManager.removeConnection(userId, conn);
        try {
          controller.close();
        } catch (err) {
          // Stream already closed
        }
      };
    }
  });

  return new NextResponse(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no'
    }
  });
}
