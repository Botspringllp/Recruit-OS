import React from 'react';
import { redirect } from 'next/navigation';
import { getCurrentUser, hasPermission } from '@/lib/rbac';
import { SettingsHeaderTabs } from '@/components/settings/SettingsHeaderTabs';
import { OrganizationProfileClient } from '@/components/settings/OrganizationProfileClient';
import { prisma } from '@/lib/prisma';

export const revalidate = 0;

export default async function SettingsPage() {
  const dbUser = await getCurrentUser();
  if (!dbUser || !hasPermission(dbUser, 'user.manage')) {
    redirect('/403');
  }

  const roleStr = String(dbUser.role || '').toUpperCase();
  let agencyId = dbUser.agencyId || dbUser.agency?.id;

  const agencySelect = {
    id: true,
    name: true,
    subdomain: true,
    status: true,
    subscriptionTier: true,
    websiteUrl: true,
    businessEmail: true,
    supportEmail: true,
    phone: true,
    alternatePhone: true,
    address: true,
    city: true,
    state: true,
    country: true,
    companyDescription: true,
    gstNumber: true,
    cinNumber: true,
    panNumber: true,
    createdAt: true,
    users: {
      where: {
        OR: [
          { role: 'AGENCY_OWNER' },
          { role: 'AGENCY_FOUNDER' },
          { role: 'MASTER_OWNER' }
        ],
        deletedAt: null
      },
      select: { firstName: true, lastName: true, email: true },
      take: 1
    }
  };

  let agencyRecord: any = null;
  if (agencyId) {
    agencyRecord = await (prisma.agency as any).findFirst({
      where: { id: agencyId, deletedAt: null },
      select: agencySelect
    }).catch(() => null);
  }

  if (!agencyRecord && (roleStr === 'SUPER_ADMIN' || roleStr === 'MASTER_OWNER')) {
    agencyRecord = await (prisma.agency as any).findFirst({
      where: { deletedAt: null },
      select: agencySelect
    }).catch(() => null);
  }

  if (!agencyRecord) {
    redirect('/cockpit');
  }

  const owner = agencyRecord.users?.[0] || null;

  const formattedAgency = {
    id: agencyRecord.id,
    name: agencyRecord.name,
    subdomain: agencyRecord.subdomain,
    status: agencyRecord.status,
    subscriptionTier: agencyRecord.subscriptionTier,
    websiteUrl: agencyRecord.websiteUrl,
    businessEmail: agencyRecord.businessEmail,
    supportEmail: agencyRecord.supportEmail,
    phone: agencyRecord.phone,
    alternatePhone: agencyRecord.alternatePhone,
    address: agencyRecord.address,
    city: agencyRecord.city,
    state: agencyRecord.state,
    country: agencyRecord.country,
    companyDescription: agencyRecord.companyDescription,
    gstNumber: agencyRecord.gstNumber,
    cinNumber: agencyRecord.cinNumber,
    panNumber: agencyRecord.panNumber,
    createdAt: agencyRecord.createdAt,
    ownerName: owner ? `${owner.firstName} ${owner.lastName}`.trim() : 'Unassigned Owner',
    ownerEmail: owner ? owner.email : 'N/A'
  };

  return (
    <div className="space-y-6 pb-12 text-slate-900 font-sans">
      {/* Navigation Tabs inside Agency Settings */}
      <SettingsHeaderTabs />

      {/* Organization Profile View & Edit Component */}
      <OrganizationProfileClient agency={formattedAgency} />
    </div>
  );
}
