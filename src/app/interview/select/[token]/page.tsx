import React from 'react';
import { getInterviewSlotSelectionDataAction } from '@/app/actions/interviews';
import { CandidateSlotSelectionView } from '@/components/interview/CandidateSlotSelectionView';
import { AlertCircle, ShieldAlert } from 'lucide-react';

interface PageProps {
  params: {
    token: string;
  };
}

export default async function CandidateInterviewSelectPage({ params }: PageProps) {
  const { token } = params;

  const res = await getInterviewSlotSelectionDataAction(token);

  if (!res.success || !res.interview) {
    return (
      <div className="min-h-screen bg-slate-900 text-slate-100 flex items-center justify-center p-4 font-sans">
        <div className="bg-slate-800/80 border border-slate-700 rounded-3xl p-8 max-w-md w-full text-center space-y-4 shadow-2xl">
          <div className="h-16 w-16 rounded-2xl bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center justify-center mx-auto">
            <ShieldAlert className="h-8 w-8" />
          </div>
          <h1 className="text-xl font-black text-white">Interview Link Expired or Invalid</h1>
          <p className="text-xs text-slate-300 leading-relaxed">
            {res.error || 'This interview scheduling link could not be found or has expired. Please contact your recruitment manager for assistance.'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <CandidateSlotSelectionView
      token={token}
      isConsumed={!!res.isConsumed}
      interview={res.interview}
    />
  );
}
