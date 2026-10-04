import React from 'react';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/rbac';
import { getTalentSearchAction } from '@/app/actions/sourcingActions';
import { TalentSearchClientView } from '@/components/sourcing/TalentSearchClientView';

export const revalidate = 0;

export default async function TalentSearchPage({
  searchParams
}: {
  searchParams?: { skills?: string; minExp?: string };
}) {
  const dbUser = await getCurrentUser();
  const agencyId = dbUser?.agencyId;

  const [searchRes, jobsList] = await Promise.all([
    getTalentSearchAction({
      skills: searchParams?.skills,
      minExp: searchParams?.minExp ? Number(searchParams.minExp) : undefined
    }),
    (prisma as any).jobMandate.findMany({
      where: { agencyId, status: 'OPEN' },
      select: { id: true, title: true }
    }).catch(() => [])
  ]);

  return (
    <TalentSearchClientView
      initialCandidates={searchRes.candidates || []}
      jobsList={jobsList || []}
    />
  );
}
