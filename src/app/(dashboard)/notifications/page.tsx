import React from 'react';
import { NotificationsClient } from './NotificationsClient';

export const metadata = {
  title: 'Notification Center - RecruitOS',
  description: 'Real-time platform notifications and audit event history'
};

export default function NotificationsPage() {
  return <NotificationsClient />;
}
