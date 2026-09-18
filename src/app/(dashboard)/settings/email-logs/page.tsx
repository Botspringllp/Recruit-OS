import React from 'react';
import { redirect } from 'next/navigation';
import { getCurrentUser, hasPermission } from '@/lib/rbac';
import { prisma } from '@/lib/prisma';
import { SettingsHeaderTabs } from '@/components/settings/SettingsHeaderTabs';
import { EmailLogsClient } from './EmailLogsClient';

export const revalidate = 0;

export default async function EmailLogsPage() {
  const dbUser = await getCurrentUser();
  if (!dbUser || !hasPermission(dbUser, 'user.manage')) {
    redirect('/403');
  }

  const roleStr = String(dbUser.role || '').toUpperCase();
  const agencyId = dbUser.agencyId || dbUser.agency?.id;

  // Filter email logs by agency tenant isolation
  let whereClause: any = {};
  if (roleStr !== 'SUPER_ADMIN') {
    if (agencyId) {
      whereClause.agencyId = agencyId;
    } else {
      whereClause.agencyId = '00000000-0000-0000-0000-000000000000'; // empty placeholder
    }
  }

  const logs = await (prisma as any).emailLog.findMany({
    where: whereClause,
    orderBy: { createdAt: 'desc' },
    take: 100
  }).catch(() => []);

  // Fetch Agency email identity settings (senderName, replyToEmail)
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

  return (
    <div className="space-y-6 pb-12 text-slate-900 font-sans">
      <SettingsHeaderTabs />
      <EmailLogsClient
        initialLogs={formattedLogs}
        agencyIdentity={agencyData}
        userRole={roleStr}
      />
    </div>
  );
}
