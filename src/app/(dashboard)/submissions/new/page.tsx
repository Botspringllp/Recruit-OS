import React from 'react';
import { Send } from 'lucide-react';
import { prisma } from '@/lib/prisma';
import { SubmissionForm } from '@/components/submissions/SubmissionForm';
import { createSubmissionAction } from '@/app/actions/submissions';

export const revalidate = 0;

export default async function NewSubmissionPage() {
  const demoAgency = await prisma.agency.findFirst({
    where: { subdomain: 'demo' },
    select: { id: true }
  }).catch(() => null);
  const agencyId = demoAgency?.id;

  const [candidates, jobs] = await Promise.all([
    prisma.candidateRecord.findMany({
      where: { agencyId, deletedAt: null },
      select: { id: true, firstName: true, lastName: true, email: true, currentDesignation: true },
      orderBy: { createdAt: 'desc' }
    }).catch(() => []),
    prisma.jobMandate.findMany({
      where: { agencyId },
      select: { id: true, title: true, client: { select: { companyName: true } } },
      orderBy: { createdAt: 'desc' }
    }).catch(() => [])
  ]);

  const formattedJobs = jobs.map((j) => ({
    id: j.id,
    title: j.title,
    clientName: j.client?.companyName
  }));

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="border-b border-slate-800/80 pb-5">
        <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
          <Send className="h-6 w-6 text-brand-400" />
          Submit Candidate to Requisition
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Add candidate into client recruitment pipeline and calculate SLA watchdog tracking
        </p>
      </div>

      <SubmissionForm
        candidates={candidates}
        jobs={formattedJobs}
        action={createSubmissionAction}
      />
    </div>
  );
}
