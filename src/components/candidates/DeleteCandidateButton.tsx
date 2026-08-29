'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Trash2, Loader2 } from 'lucide-react';
import { deleteCandidateAction } from '@/app/actions/candidates';

interface DeleteCandidateButtonProps {
  candidateId: string;
  candidateName: string;
  redirectToList?: boolean;
}

export function DeleteCandidateButton({ candidateId, candidateName, redirectToList = false }: DeleteCandidateButtonProps) {
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
      alert(res.error || 'Failed to soft delete candidate');
      setConfirming(false);
    }
  }

  if (confirming) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-[11px] text-rose-300 font-medium">Delete candidate?</span>
        <button
          onClick={handleDelete}
          disabled={loading}
          className="px-2.5 py-1 bg-rose-600 text-white rounded-lg text-[10px] font-semibold hover:bg-rose-500 transition flex items-center gap-1 disabled:opacity-50"
        >
          {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Confirm Soft Delete'}
        </button>
        <button
          onClick={() => setConfirming(false)}
          className="px-2 py-1 bg-slate-800 text-slate-400 hover:text-white rounded-lg text-[10px] font-medium transition"
        >
          Cancel
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => setConfirming(true)}
      title={`Soft delete ${candidateName}`}
      className="p-1.5 rounded-lg hover:bg-rose-500/10 text-slate-400 hover:text-rose-400 transition"
    >
      <Trash2 className="h-4 w-4" />
    </button>
  );
}
