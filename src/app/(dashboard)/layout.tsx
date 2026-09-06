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
    agencyId: dbUser?.agencyId || '',
    agencyName: dbUser?.agency?.name || 'RecruitOS Workspace',
    subdomain: 'demo',
    subscriptionTier: 'ENTERPRISE',
    logoUrl: null,
    primaryColor: '#4F46E5',
  };

  const userContext: UserContextType = {
    userId: dbUser?.id || '',
    email: dbUser?.email || '',
    firstName: dbUser?.firstName || dbUser?.email?.split('@')[0] || 'User',
    lastName: dbUser?.lastName || '',
    role: (dbUser?.role as any) || 'RECRUITER',
  };

  const userPermissions = getCurrentUserPermissions(dbUser);

  return (
    <DashboardShell tenant={tenantContext} user={userContext} userPermissions={userPermissions}>
      {children}
    </DashboardShell>
  );
}
