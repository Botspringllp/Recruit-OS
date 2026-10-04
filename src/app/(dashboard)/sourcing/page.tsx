import React from 'react';
import { getSourcingDashboardDataAction } from '@/app/actions/sourcingActions';
import { SourcingDashboardClientView } from '@/components/sourcing/SourcingDashboardClientView';

export const revalidate = 0;

export default async function SourcingDashboardPage() {
  const data = await getSourcingDashboardDataAction();

  return (
    <SourcingDashboardClientView
      metrics={data.metrics}
      sources={data.sources || []}
      recentApplications={data.recentApplications || []}
    />
  );
}
