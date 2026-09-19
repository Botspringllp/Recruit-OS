import React from 'react';
import { redirect } from 'next/navigation';
import { getCurrentUser, hasPermission } from '@/lib/rbac';
import { getAgencySMTPSettingsAction } from '@/app/actions/emailSmtpActions';
import { getAgencyFeatureFlagsAction } from '@/app/actions/websiteBuilder';
import { SettingsHeaderTabs } from '@/components/settings/SettingsHeaderTabs';
import { EmailSettingsClient } from './EmailSettingsClient';

export const revalidate = 0;

export default async function EmailSettingsPage() {
  const dbUser = await getCurrentUser();
  if (!dbUser || !hasPermission(dbUser, 'user.manage')) {
    redirect('/403');
  }

  const [res, featureFlags] = await Promise.all([
    getAgencySMTPSettingsAction(),
    getAgencyFeatureFlagsAction()
  ]);

  const smtpData = res.success && res.data ? res.data : {
    smtpEnabled: false,
    smtpHost: '',
    smtpPort: 587,
    smtpSecure: false,
    smtpUsername: '',
    hasPassword: false,
    senderName: dbUser.agency?.name || '',
    senderEmail: '',
    replyToEmail: '',
    smtpLastTestedAt: null,
    smtpLastTestStatus: null
  };

  return (
    <div className="space-y-6 pb-12 text-slate-900 font-sans">
      <SettingsHeaderTabs
        websiteBuilderEnabled={featureFlags.websiteBuilderEnabled}
        widgetEnabled={featureFlags.widgetEnabled}
      />
      <EmailSettingsClient
        initialData={smtpData}
        userEmail={dbUser.email || ''}
      />
    </div>
  );
}
