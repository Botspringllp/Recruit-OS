import React from 'react';
import { DashboardShell } from '@/components/dashboard/DashboardShell';
import { TenantContextType, UserContextType } from '@/types/dashboard';

export const metadata = {
  title: 'Recruiter Cockpit - RecruitOS',
  description: 'Enterprise Recruiter Workspace and Execution Engine',
};

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Resolved Server Context (Mock fallback for Phase RC-01.A layout verification)
  const tenantContext: TenantContextType = {
    agencyId: 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d',
    agencyName: 'Apex Executive Search',
    subdomain: 'apex',
    subscriptionTier: 'ENTERPRISE',
    logoUrl: null,
    primaryColor: '#4F46E5',
  };

  const userContext: UserContextType = {
    userId: 'u1v2w3x4-y5z6-7a8b-9c0d-1e2f3a4b5c6d',
    email: 'sarah.sharma@apexrecruitment.com',
    firstName: 'Sarah',
    lastName: 'Sharma',
    role: 'AGENCY_FOUNDER',
  };

  return (
    <DashboardShell tenant={tenantContext} user={userContext}>
      {children}
    </DashboardShell>
  );
}
