import React from 'react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { getCurrentUser, hasPermission } from '@/lib/rbac';
import { InterviewForm } from '@/components/interviews/InterviewForm';
import { Calendar, ArrowLeft } from 'lucide-react';

export const revalidate = 0;

export default async function NewInterviewPage() {
  const dbUser = await getCurrentUser();
  if (!dbUser || !hasPermission(dbUser, 'interview.create')) {
    redirect('/403');
  }

  const agencyId = dbUser.agencyId;

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
      {/* Top Header Bar */}
      <div className="flex items-center gap-3 border-b border-slate-200 pb-5">
        <Link
          href="/interviews"
          className="p-2 bg-white border border-slate-300 rounded-xl text-slate-700 hover:text-indigo-600 hover:bg-slate-100 transition shadow-2xs"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Calendar className="h-6 w-6 text-indigo-600" />
            Schedule New Interview Round
          </h1>
          <p className="text-xs font-semibold text-slate-600 mt-1">
            Arrange technical, HR, or client interview rounds for candidate submissions.
          </p>
        </div>
      </div>

      {/* Main Form Container */}
      <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm shadow-slate-200/50">
        <InterviewForm submissions={formattedSubmissions} />
      </div>
    </div>
  );
}
