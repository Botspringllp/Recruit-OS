import React from 'react';
import { redirect, notFound } from 'next/navigation';
import { getCurrentUser } from '@/lib/rbac';
import { getAgencyProfileByIdAction } from '@/app/actions/agencies';
import { AgencyProfileClient } from './AgencyProfileClient';

export const revalidate = 0;

export default async function AgencyProfilePage({
  params
}: {
  params: Promise<{ id: string }>
}) {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    redirect('/login');
  }

  const resolvedParams = await params;
  const res = await getAgencyProfileByIdAction(resolvedParams.id, currentUser);

  if (!res.success || !res.data) {
    notFound();
  }

  const { agency, stats } = res.data;

  return (
    <AgencyProfileClient
      agency={agency}
      stats={stats}
    />
  );
}
