import React from 'react';
import { notFound, redirect } from 'next/navigation';
import { Edit3 } from 'lucide-react';
import { prisma } from '@/lib/prisma';
import { getCurrentUser, hasPermission } from '@/lib/rbac';
import { CandidateForm } from '@/components/candidates/CandidateForm';
import { updateCandidateAction } from '@/app/actions/candidates';

export const revalidate = 0;

interface CandidateEditPageProps {
  params: {
    id: string;
  };
}

export default async function CandidateEditPage({ params }: CandidateEditPageProps) {
  const dbUser = await getCurrentUser();
  if (!dbUser || !hasPermission(dbUser, 'candidate.edit')) {
    redirect('/403');
  }

  const agencyId = dbUser.agencyId;

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
      <div className="border-b border-slate-200 pb-5">
        <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
          <Edit3 className="h-6 w-6 text-amber-500" />
          Edit Candidate Profile
        </h1>
        <p className="text-xs font-semibold text-slate-500 mt-1">
          Update information for <span className="text-slate-900 font-bold">{candidate.firstName} {candidate.lastName}</span>
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
