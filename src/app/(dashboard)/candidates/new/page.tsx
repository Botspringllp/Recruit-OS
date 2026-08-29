import React from 'react';
import { UserPlus } from 'lucide-react';
import { CandidateForm } from '@/components/candidates/CandidateForm';
import { createCandidateAction } from '@/app/actions/candidates';

export default function NewCandidatePage() {
  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="border-b border-slate-800/80 pb-5">
        <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
          <UserPlus className="h-6 w-6 text-brand-400" />
          Add New Candidate
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Create candidate profile record in the agency talent repository
        </p>
      </div>

      <CandidateForm action={createCandidateAction} />
    </div>
  );
}
