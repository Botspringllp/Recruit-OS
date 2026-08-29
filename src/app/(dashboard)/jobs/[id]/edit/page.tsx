import React from 'react';
import { notFound } from 'next/navigation';
import { Edit3 } from 'lucide-react';
import { prisma } from '@/lib/prisma';
import { JobForm } from '@/components/jobs/JobForm';
import { updateJobMandateAction } from '@/app/actions/jobs';

export const revalidate = 0;

interface JobEditPageProps {
  params: {
    id: string;
  };
}

export default async function JobEditPage({ params }: JobEditPageProps) {
  const demoAgency = await prisma.agency.findFirst({
    where: { subdomain: 'demo' },
    select: { id: true }
  }).catch(() => null);
  const agencyId = demoAgency?.id;

  const [job, clients] = await Promise.all([
    prisma.jobMandate.findFirst({
      where: { id: params.id, agencyId }
    }).catch(() => null),
    prisma.client.findMany({
      where: { agencyId },
      select: { id: true, companyName: true },
      orderBy: { companyName: 'asc' }
    }).catch(() => [])
  ]);

  if (!job) {
    notFound();
  }

  const boundUpdateAction = updateJobMandateAction.bind(null, job.id);

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="border-b border-slate-800/80 pb-5">
        <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
          <Edit3 className="h-6 w-6 text-brand-400" />
          Edit Job Mandate
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Update hiring mandate specification for <span className="text-white font-semibold">{job.title}</span>
        </p>
      </div>

      <JobForm
        clients={clients}
        initialData={{
          id: job.id,
          clientId: job.clientId,
          title: job.title,
          headcount: job.headcount,
          minCtcLpa: job.minCtcLpa,
          maxCtcLpa: job.maxCtcLpa,
          feePercentage: job.feePercentage,
          status: job.status
        }}
        action={boundUpdateAction}
        isEdit={true}
      />
    </div>
  );
}
