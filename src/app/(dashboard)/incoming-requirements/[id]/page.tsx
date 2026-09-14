import { redirect, notFound } from 'next/navigation';
import { getCurrentUser } from '@/lib/rbac';
import { getIncomingRequirementByIdAction, getAgencyRecruitersAction } from '@/app/actions/incomingRequirements';
import { RequirementDetailClient } from './RequirementDetailClient';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function RequirementDetailPage({ params }: PageProps) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) {
    redirect('/login');
  }

  const roleStr = String(user.role || '').toUpperCase();
  const allowedRoles = ['MASTER_OWNER', 'AGENCY_OWNER', 'AGENCY_FOUNDER', 'SUPER_ADMIN'];

  if (!allowedRoles.includes(roleStr)) {
    redirect('/cockpit');
  }

  const [reqRes, recruitersRes] = await Promise.all([
    getIncomingRequirementByIdAction(id),
    getAgencyRecruitersAction()
  ]);

  if (!reqRes.success || !reqRes.data?.requirement) {
    notFound();
  }

  const requirement = reqRes.data.requirement;
  const recruiters = recruitersRes.success && recruitersRes.data ? recruitersRes.data.recruiters : [];

  return (
    <RequirementDetailClient
      initialRequirement={requirement}
      recruiters={recruiters}
      userRole={roleStr}
    />
  );
}
