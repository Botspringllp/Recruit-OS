import React from 'react';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/rbac';
import { getNotificationCenterAction } from '@/app/actions/notificationActions';
import { NotificationsClient } from '@/components/notifications/NotificationsClient';

export const revalidate = 0;

export default async function NotificationCenterPage() {
  const dbUser = await getCurrentUser();
  if (!dbUser) {
    redirect('/auth/login');
  }

  const res = await getNotificationCenterAction();

  return (
    <NotificationsClient
      initialNotifications={res.notifications || []}
      initialTotalCount={res.totalCount || 0}
      initialUnreadCount={res.unreadCount || 0}
    />
  );
}
