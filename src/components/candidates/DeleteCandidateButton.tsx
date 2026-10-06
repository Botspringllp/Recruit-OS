'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Trash2, Loader2, AlertTriangle } from 'lucide-react';
import { deleteCandidateAction } from '@/app/actions/candidates';

interface DeleteCandidateButtonProps {
  candidateId: string;
  candidateName: string;
  redirectToList?: boolean;
  variant?: 'icon' | 'full';
}

export function DeleteCandidateButton({
  candidateId,
  candidateName,
  redirectToList = false,
  variant = 'icon'
}: DeleteCandidateButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [confirming, setConfirming] = useState(false);

  async function handleDelete() {
    setLoading(true);
    const res = await deleteCandidateAction(candidateId);
    setLoading(false);

    if (res.success) {
      if (redirectToList) {
        router.push('/candidates');
      }
      router.refresh();
    } else {
      alert(res.error || 'Failed to delete candidate record.');
      setConfirming(false);
    }
  }

  if (confirming) {
    return (
      <div className="inline-flex items-center gap-2 p-1.5 bg-rose-50 border border-rose-200 rounded-xl shadow-xs">
        <span className="text-[11px] text-rose-800 font-extrabold flex items-center gap-1">
          <AlertTriangle className="h-3.5 w-3.5 text-rose-600" />
          Delete candidate?
        </span>
        <button
          type="button"
          onClick={handleDelete}
          disabled={loading}
          className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-[10px] font-black transition flex items-center gap-1 cursor-pointer disabled:opacity-50"
        >
          {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Yes, Delete'}
        </button>
        <button
          type="button"
          onClick={() => setConfirming(false)}
          className="px-2 py-1 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-[10px] font-bold transition cursor-pointer"
        >
          Cancel
        </button>
      </div>
    );
  }

  if (variant === 'full') {
    return (
      <button
        type="button"
        onClick={() => setConfirming(true)}
        title={`Delete candidate ${candidateName}`}
        className="px-3.5 py-2 bg-rose-50 hover:bg-rose-600 text-rose-700 hover:text-white border border-rose-200 hover:border-rose-600 rounded-xl text-xs font-extrabold transition flex items-center gap-1.5 shadow-2xs cursor-pointer"
      >
        <Trash2 className="h-4 w-4 stroke-[2]" />
        <span>Delete Candidate</span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setConfirming(true)}
      title={`Delete candidate ${candidateName}`}
      className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-600 text-rose-600 hover:text-white border border-rose-200 hover:border-rose-600 transition-all duration-200 cursor-pointer"
    >
      <Trash2 className="h-4 w-4" />
    </button>
  );
}
