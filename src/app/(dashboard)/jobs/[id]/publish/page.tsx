import React from 'react';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/rbac';
import { JobPublishingClientView } from '@/components/sourcing/JobPublishingClientView';

export const revalidate = 0;

export default async function JobPublishPage({
  params
}: {
  params: { id: string };
}) {
  const dbUser = await getCurrentUser();
  if (!dbUser || !dbUser.agencyId) {
    return notFound();
  }

  const job = await (prisma as any).jobMandate.findUnique({
    where: { id: params.id },
    include: {
      client: true,
      distributionLogs: { orderBy: { createdAt: 'desc' } }
    }
  });

  if (!job) notFound();

  return <JobPublishingClientView job={job} />;
}
