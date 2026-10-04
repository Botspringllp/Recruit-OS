import React from 'react';
import { getPublicJobsAction } from '@/app/actions/sourcingActions';
import { PublicJobsClientView } from '@/components/sourcing/PublicJobsClientView';

export const revalidate = 0;

export default async function CareersPage({
  searchParams
}: {
  searchParams?: { q?: string; location?: string };
}) {
  const query = searchParams?.q || '';
  const location = searchParams?.location || '';

  const res = await getPublicJobsAction(query, location);
  const jobs = res.jobs || [];

  return <PublicJobsClientView initialJobs={jobs} />;
}
