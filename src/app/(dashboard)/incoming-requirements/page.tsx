import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/rbac';
import { getIncomingRequirementsAction, getAgencyRecruitersAction } from '@/app/actions/incomingRequirements';
import { IncomingRequirementsClient } from './IncomingRequirementsClient';

export const dynamic = 'force-dynamic';

export default async function IncomingRequirementsPage() {
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
    getIncomingRequirementsAction(),
    getAgencyRecruitersAction()
  ]);

  const initialRequirements = reqRes.success && reqRes.data ? reqRes.data.requirements : [];
  const initialKpis = reqRes.success && reqRes.data ? reqRes.data.kpis : { totalPending: 0, newToday: 0, accepted: 0, rejected: 0 };
  const recruiters = recruitersRes.success && recruitersRes.data ? recruitersRes.data.recruiters : [];

  return (
    <IncomingRequirementsClient
      initialRequirements={initialRequirements}
      initialKpis={initialKpis}
      recruiters={recruiters}
      userRole={roleStr}
    />
  );
}
