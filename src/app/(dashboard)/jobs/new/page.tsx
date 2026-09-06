import React from 'react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Briefcase, ArrowLeft } from 'lucide-react';
import { prisma } from '@/lib/prisma';
import { getCurrentUser, hasPermission } from '@/lib/rbac';
import { JobForm } from '@/components/jobs/JobForm';
import { createJobMandateAction } from '@/app/actions/jobs';

export const revalidate = 0;

export default async function NewJobPage() {
  const dbUser = await getCurrentUser();
  if (!dbUser || !hasPermission(dbUser, 'job.create')) {
    redirect('/403');
  }

  const agencyId = dbUser.agencyId;

  const clients = await prisma.client.findMany({
    where: { agencyId },
    select: { id: true, companyName: true },
    orderBy: { companyName: 'asc' }
  }).catch(() => []);

  return (
    <div className="space-y-6 pb-12 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <Briefcase className="h-6 w-6 text-amber-500" />
            Create New Job Mandate
          </h1>
          <p className="text-xs font-semibold text-slate-600 mt-1">
            Open a new hiring requisition for client recruitment pipeline
          </p>
        </div>

        <Link
          href="/jobs"
          className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-black transition flex items-center gap-2 shadow-sm shrink-0 self-start sm:self-auto"
        >
          <ArrowLeft className="h-4 w-4 text-amber-400" />
          <span>Back to Job Mandates</span>
        </Link>
      </div>

      <JobForm clients={clients} action={createJobMandateAction} />
    </div>
  );
}
