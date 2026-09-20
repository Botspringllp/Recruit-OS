import React from 'react';
import { redirect } from 'next/navigation';
import { getCurrentUser, hasPermission } from '@/lib/rbac';
import { prisma } from '@/lib/prisma';
import { getAgencySMTPSettingsAction } from '@/app/actions/emailSmtpActions';
import { getAgencyFeatureFlagsAction } from '@/app/actions/websiteBuilder';
import { SettingsHeaderTabs } from '@/components/settings/SettingsHeaderTabs';
import { EmailSettingsClient } from './EmailSettingsClient';

export const revalidate = 0;

interface PageProps {
  searchParams?: { tab?: string };
}

export default async function EmailSettingsPage({ searchParams }: PageProps) {
  const dbUser = await getCurrentUser();
  if (!dbUser || !hasPermission(dbUser, 'user.manage')) {
    redirect('/403');
  }

  const roleStr = String(dbUser.role || '').toUpperCase();
  const agencyId = dbUser.agencyId || dbUser.agency?.id;

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

  // Filter email logs by agency tenant isolation
  let whereClause: any = {};
  if (roleStr !== 'SUPER_ADMIN') {
    if (agencyId) {
      whereClause.agencyId = agencyId;
    } else {
      whereClause.agencyId = '00000000-0000-0000-0000-000000000000';
    }
  }

  const logs = await (prisma as any).emailLog.findMany({
    where: whereClause,
    orderBy: { createdAt: 'desc' },
    take: 100
  }).catch(() => []);

  let agencyData = null;
  if (agencyId) {
    agencyData = await (prisma as any).agency.findUnique({
      where: { id: agencyId },
      select: {
        id: true,
        name: true,
        senderName: true,
        replyToEmail: true
      }
    }).catch(() => null);
  }

  const formattedLogs = logs.map((log: any) => ({
    id: log.id,
    agencyId: log.agencyId,
    eventType: log.eventType,
    recipientEmail: log.recipientEmail,
    subject: log.subject,
    htmlBody: log.htmlBody || null,
    textBody: log.textBody || null,
    status: log.status,
    errorMessage: log.errorMessage,
    metadata: log.metadata ? JSON.stringify(log.metadata) : null,
    createdAt: log.createdAt ? new Date(log.createdAt).toISOString() : new Date().toISOString(),
    sentAt: log.sentAt ? new Date(log.sentAt).toISOString() : null
  }));

  const initialTab = searchParams?.tab === 'logs' ? 'logs' : 'smtp';

  return (
    <div className="space-y-6 pb-12 text-slate-900 font-sans">
      <SettingsHeaderTabs
        websiteBuilderEnabled={featureFlags.websiteBuilderEnabled}
        widgetEnabled={featureFlags.widgetEnabled}
      />
      <EmailSettingsClient
        initialData={smtpData}
        userEmail={dbUser.email || ''}
        initialLogs={formattedLogs}
        agencyIdentity={agencyData}
        userRole={roleStr}
        defaultTab={initialTab}
      />
    </div>
  );
}
