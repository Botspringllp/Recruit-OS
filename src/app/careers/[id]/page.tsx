import React from 'react';
import { notFound } from 'next/navigation';
import { getPublicJobBySlugAction } from '@/app/actions/sourcingActions';
import { PublicJobDetailClientView } from '@/components/sourcing/PublicJobDetailClientView';

export const revalidate = 0;

export default async function CareerJobDetailPage({
  params
}: {
  params: { id: string };
}) {
  const jobId = params.id;
  const res = await getPublicJobBySlugAction(jobId);

  if (!res.success || !res.job) {
    notFound();
  }

  return <PublicJobDetailClientView job={res.job} />;
}
