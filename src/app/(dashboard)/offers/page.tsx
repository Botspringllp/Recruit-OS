import React from 'react';
import { getOfferDashboardDataAction } from '@/app/actions/offerActions';
import { OfferDashboardClientView } from '@/components/offer/OfferDashboardClientView';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/rbac';

export default async function OffersPage() {
  const dbUser = await getCurrentUser();
  if (!dbUser || !dbUser.agencyId) {
    return (
      <div className="p-8 text-center text-slate-500 font-bold">
        Unauthorized access: Recruiter session required.
      </div>
    );
  }

  const [dashData, submissions] = await Promise.all([
    getOfferDashboardDataAction(),
    (prisma as any).candidateSubmission.findMany({
      where: { agencyId: dbUser.agencyId },
      include: {
        candidate: true,
        job: true,
        client: true
      },
      orderBy: { createdAt: 'desc' },
      take: 100
    })
  ]);

  return <OfferDashboardClientView initialData={dashData} submissions={submissions} />;
}
