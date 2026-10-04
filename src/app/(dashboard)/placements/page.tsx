import React from 'react';
import { getPlacementAndRevenueDashboardDataAction } from '@/app/actions/offerActions';
import { RevenueDashboardClientView } from '@/components/offer/RevenueDashboardClientView';
import { getCurrentUser } from '@/lib/rbac';

export default async function PlacementsPage() {
  const dbUser = await getCurrentUser();
  if (!dbUser || !dbUser.agencyId) {
    return (
      <div className="p-8 text-center text-slate-500 font-bold">
        Unauthorized access: Recruiter session required.
      </div>
    );
  }

  const data = await getPlacementAndRevenueDashboardDataAction();
  return <RevenueDashboardClientView initialData={data} />;
}
