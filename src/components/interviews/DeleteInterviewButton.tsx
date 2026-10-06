'use client';

import React, { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Trash2, Loader2, AlertTriangle } from 'lucide-react';
import { deleteInterviewAction } from '@/app/actions/interviews';

interface DeleteInterviewButtonProps {
  interviewId: string;
  candidateName?: string;
}

export function DeleteInterviewButton({ interviewId, candidateName }: DeleteInterviewButtonProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [confirming, setConfirming] = useState(false);

  const handleDelete = () => {
    startTransition(async () => {
      const res = await deleteInterviewAction(interviewId);
      if (res.success) {
        router.refresh();
      } else {
        alert(res.error || 'Failed to delete interview schedule.');
        setConfirming(false);
      }
    });
  };

  if (confirming) {
    return (
      <div className="inline-flex items-center gap-1.5 p-1 bg-rose-50 border border-rose-200 rounded-xl shadow-xs">
        <span className="text-[10px] text-rose-800 font-extrabold flex items-center gap-1 px-1">
          <AlertTriangle className="h-3 w-3 text-rose-600" />
          Delete?
        </span>
        <button
          type="button"
          onClick={handleDelete}
          disabled={isPending}
          className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-[10px] font-black transition flex items-center gap-1 cursor-pointer disabled:opacity-50"
        >
          {isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Confirm'}
        </button>
        <button
          type="button"
          onClick={() => setConfirming(false)}
          disabled={isPending}
          className="px-2 py-1 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-[10px] font-bold transition cursor-pointer"
        >
          Cancel
        </button>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setConfirming(true)}
      title={`Delete interview for ${candidateName || 'candidate'}`}
      className="px-3.5 py-2 bg-rose-50 hover:bg-rose-600 text-rose-700 hover:text-white border border-rose-200 hover:border-rose-600 rounded-xl text-xs font-extrabold transition-all duration-200 flex items-center gap-1.5 shadow-2xs cursor-pointer"
    >
      <Trash2 className="h-3.5 w-3.5" />
      <span>Delete</span>
    </button>
  );
}
