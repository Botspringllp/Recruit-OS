import React from 'react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { getCurrentUser, hasPermission } from '@/lib/rbac';
import { OfferForm } from '@/components/offers/OfferForm';
import { Award, ArrowLeft } from 'lucide-react';

export const revalidate = 0;

export default async function NewOfferPage() {
  const dbUser = await getCurrentUser();
  if (!dbUser || !hasPermission(dbUser, 'offer.create')) {
    redirect('/403');
  }

  const agencyId = dbUser.agencyId;

  // Fetch active candidate submissions for dropdown selection
  const activeSubmissions = await prisma.candidateSubmission.findMany({
    where: { agencyId },
    include: {
      candidate: { select: { id: true, firstName: true, lastName: true } },
      job: {
        select: {
          id: true,
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
          href="/offers"
          className="p-2 bg-slate-900 border border-slate-800 rounded-xl text-slate-400 hover:text-white transition"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <Award className="h-6 w-6 text-brand-400" />
            Issue New Candidate Job Offer
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Configure offered CTC components, joining dates, offer expiry terms, and notice period buyout.
          </p>
        </div>
      </div>

      <div className="glass-panel p-6 sm:p-8 rounded-2xl border border-slate-800/80">
        <OfferForm submissions={formattedSubmissions} />
      </div>
    </div>
  );
}
