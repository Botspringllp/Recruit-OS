import React from 'react';
import { getJoiningDashboardDataAction } from '@/app/actions/offerActions';
import { JoiningDashboardClientView } from '@/components/offer/JoiningDashboardClientView';
import { getCurrentUser } from '@/lib/rbac';

export default async function JoiningPage() {
  const dbUser = await getCurrentUser();
  if (!dbUser || !dbUser.agencyId) {
    return (
      <div className="p-8 text-center text-slate-500 font-bold">
        Unauthorized access: Recruiter session required.
      </div>
    );
  }

  const dashData = await getJoiningDashboardDataAction();
  return <JoiningDashboardClientView initialData={dashData} />;
}
