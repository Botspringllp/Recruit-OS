import React from 'react';
import { redirect } from 'next/navigation';
import { getCurrentUser, hasPermission } from '@/lib/rbac';
import { getUserNotificationPreferencesAction, getNotificationAnalyticsAction } from '@/app/actions/notificationActions';
import { NotificationPreferencesView } from '@/components/settings/NotificationPreferencesView';

export const revalidate = 0;

export default async function NotificationPreferencesPage() {
  const dbUser = await getCurrentUser();
  if (!dbUser) {
    redirect('/auth/login');
  }

  const [prefsRes, analyticsRes] = await Promise.all([
    getUserNotificationPreferencesAction(),
    getNotificationAnalyticsAction()
  ]);

  return (
    <NotificationPreferencesView
      initialPreferences={prefsRes.preferences || {}}
      analytics={{
        totalNotifs: analyticsRes.totalNotifs || 0,
        deliveredCount: analyticsRes.deliveredCount || 0,
        viewedCount: analyticsRes.viewedCount || 0,
        clickedCount: analyticsRes.clickedCount || 0,
        deliveryRate: analyticsRes.deliveryRate || 100,
        readRate: analyticsRes.readRate || 100
      }}
    />
  );
}
