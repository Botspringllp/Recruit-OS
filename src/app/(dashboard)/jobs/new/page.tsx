import React from 'react';
import { Briefcase } from 'lucide-react';
import { prisma } from '@/lib/prisma';
import { JobForm } from '@/components/jobs/JobForm';
import { createJobMandateAction } from '@/app/actions/jobs';

export const revalidate = 0;

export default async function NewJobPage() {
  const demoAgency = await prisma.agency.findFirst({
    where: { subdomain: 'demo' },
    select: { id: true }
  }).catch(() => null);
  const agencyId = demoAgency?.id;

  const clients = await prisma.client.findMany({
    where: { agencyId },
    select: { id: true, companyName: true },
    orderBy: { companyName: 'asc' }
  }).catch(() => []);

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="border-b border-slate-800/80 pb-5">
        <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
          <Briefcase className="h-6 w-6 text-indigo-400" />
          Create New Job Mandate
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Open a new hiring requisition for client recruitment pipeline
        </p>
      </div>

      <JobForm clients={clients} action={createJobMandateAction} />
    </div>
  );
}
