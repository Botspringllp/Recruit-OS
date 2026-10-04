import { CreateNotificationInput } from '@/lib/notifications';
import { dispatchNotification } from './notificationDispatcher';
import { prisma } from '@/lib/prisma';

export async function publishNotification(input: CreateNotificationInput) {
  return dispatchNotification(input);
}

export async function publishAgencyNotification(
  agencyId: string,
  roles: string[],
  input: Omit<CreateNotificationInput, 'recipientUserId' | 'agencyId'>
) {
  try {
    const users = await prisma.user.findMany({
      where: {
        agencyId,
        role: { in: roles as any },
        isActive: true,
        deletedAt: null
      },
      select: { id: true }
    });

    for (const user of users) {
      await dispatchNotification({
        ...input,
        agencyId,
        recipientUserId: user.id
      });
    }
  } catch (err) {
    console.error('[publishAgencyNotification Error]:', err);
  }
}
