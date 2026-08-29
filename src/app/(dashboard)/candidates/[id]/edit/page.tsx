import React from 'react';
import { notFound } from 'next/navigation';
import { Edit3 } from 'lucide-react';
import { prisma } from '@/lib/prisma';
import { CandidateForm } from '@/components/candidates/CandidateForm';
import { updateCandidateAction } from '@/app/actions/candidates';

export const revalidate = 0;

interface CandidateEditPageProps {
  params: {
    id: string;
  };
}

export default async function CandidateEditPage({ params }: CandidateEditPageProps) {
  const demoAgency = await prisma.agency.findFirst({
    where: { subdomain: 'demo' },
    select: { id: true }
  }).catch(() => null);
  const agencyId = demoAgency?.id;

  const candidate = await prisma.candidateRecord.findFirst({
    where: {
      id: params.id,
      agencyId,
      deletedAt: null
    }
  }).catch(() => null);

  if (!candidate) {
    notFound();
  }

  const boundUpdateAction = updateCandidateAction.bind(null, candidate.id);

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="border-b border-slate-800/80 pb-5">
        <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
          <Edit3 className="h-6 w-6 text-brand-400" />
          Edit Candidate Profile
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Update information for <span className="text-white font-semibold">{candidate.firstName} {candidate.lastName}</span>
        </p>
      </div>

      <CandidateForm
        initialData={{
          id: candidate.id,
          firstName: candidate.firstName,
          lastName: candidate.lastName,
          email: candidate.email,
          phone: candidate.phone,
          currentCompany: candidate.currentCompany,
          currentDesignation: candidate.currentDesignation,
          totalExperienceYears: candidate.totalExperienceYears,
          currentLocation: candidate.currentLocation,
          source: candidate.source
        }}
        action={boundUpdateAction}
        isEdit={true}
      />
    </div>
  );
}
