'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { PipelineStage } from '@prisma/client';
import { updateSubmissionStageAction } from '@/app/actions/submissions';

interface SubmissionStageSelectorProps {
  submissionId: string;
  currentStage: PipelineStage;
}

export function SubmissionStageSelector({ submissionId, currentStage }: SubmissionStageSelectorProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleStageChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const newStage = e.target.value as PipelineStage;
    if (newStage === currentStage) return;

    setLoading(true);
    const res = await updateSubmissionStageAction(submissionId, newStage);
    setLoading(false);

    if (res.success) {
      router.refresh();
    } else {
      alert(res.error || 'Failed to update pipeline stage');
    }
  }

  const stages: { value: PipelineStage; label: string }[] = [
    { value: PipelineStage.SCREENED, label: 'Screened' },
    { value: PipelineStage.SUBMITTED_TO_CLIENT, label: 'Submitted to Client' },
    { value: PipelineStage.INTERVIEW_SCHEDULED, label: 'Interview Scheduled' },
    { value: PipelineStage.OFFER_EXTENDED, label: 'Offer Extended' },
    { value: PipelineStage.COMPLIANCE_AUDIT, label: 'Compliance Audit' },
    { value: PipelineStage.JOINED, label: 'Joined' },
    { value: PipelineStage.REJECTED, label: 'Rejected' }
  ];

  return (
    <div className="flex items-center gap-1.5">
      {loading ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin text-brand-400" />
      ) : (
        <select
          value={currentStage}
          onChange={handleStageChange}
          className="px-2 py-1 bg-slate-900 border border-slate-800 rounded-lg text-[11px] text-brand-300 font-semibold focus:outline-none focus:border-brand-500 transition cursor-pointer"
        >
          {stages.map((st) => (
            <option key={st.value} value={st.value}>
              {st.label}
            </option>
          ))}
        </select>
      )}
    </div>
  );
}
