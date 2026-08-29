import React from 'react';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { InterviewForm } from '@/components/interviews/InterviewForm';
import { Calendar, ArrowLeft } from 'lucide-react';

export const revalidate = 0;

export default async function NewInterviewPage() {
  const demoAgency = await prisma.agency.findFirst({
    where: { subdomain: 'demo' },
    select: { id: true }
  }).catch(() => null);
  const agencyId = demoAgency?.id;

  // Fetch active candidate submissions for dropdown selection
  const activeSubmissions = await prisma.candidateSubmission.findMany({
    where: { agencyId },
    include: {
      candidate: { select: { firstName: true, lastName: true } },
      job: {
        select: {
          title: true,
          client: { select: { companyName: true } }
        }
      }
    },
    orderBy: { createdAt: 'desc' },
    take: 100
  });

  const formattedSubmissions = activeSubmissions.map((sub) => ({
    id: sub.id,
    candidateName: `${sub.candidate.firstName} ${sub.candidate.lastName}`,
    jobTitle: sub.job.title,
    clientName: sub.job.client?.companyName || 'N/A'
  }));

  return (
    <div className="space-y-6 pb-12">
      <div className="flex items-center gap-3 border-b border-slate-800/80 pb-5">
        <Link
          href="/interviews"
          className="p-2 bg-slate-900 border border-slate-800 rounded-xl text-slate-400 hover:text-white transition"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <Calendar className="h-6 w-6 text-brand-400" />
            Schedule New Interview Round
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Arrange technical, HR, or client interview rounds for candidate submissions.
          </p>
        </div>
      </div>

      <div className="glass-panel p-6 sm:p-8 rounded-2xl border border-slate-800/80">
        <InterviewForm submissions={formattedSubmissions} />
      </div>
    </div>
  );
}
