import React from 'react';
import { DashboardShell } from '@/components/dashboard/DashboardShell';
import { TenantContextType, UserContextType } from '@/types/dashboard';
import { getCurrentUser, getCurrentUserPermissions } from '@/lib/rbac';

export const metadata = {
  title: 'Recruiter Cockpit - RecruitOS',
  description: 'Enterprise Recruiter Workspace and Execution Engine',
};

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const dbUser = await getCurrentUser();

  const tenantContext: TenantContextType = {
    agencyId: dbUser?.agencyId || 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d',
    agencyName: 'Apex Executive Search',
    subdomain: 'apex',
    subscriptionTier: 'ENTERPRISE',
    logoUrl: null,
    primaryColor: '#4F46E5',
  };

  const userContext: UserContextType = {
    userId: dbUser?.id || 'u1v2w3x4-y5z6-7a8b-9c0d-1e2f3a4b5c6d',
    email: dbUser?.email || 'sarah.sharma@apexrecruitment.com',
    firstName: dbUser?.firstName || 'Sarah',
    lastName: dbUser?.lastName || 'Sharma',
    role: (dbUser?.role as any) || 'AGENCY_FOUNDER',
  };

  const userPermissions = getCurrentUserPermissions(dbUser);

  return (
    <DashboardShell tenant={tenantContext} user={userContext} userPermissions={userPermissions}>
      {children}
    </DashboardShell>
  );
}
