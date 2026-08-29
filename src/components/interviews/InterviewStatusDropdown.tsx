'use client';

import React, { useState, useTransition } from 'react';
import { updateInterviewStatusAction } from '@/app/actions/interviews';
import { CheckCircle2, XCircle, Clock, Calendar, AlertCircle } from 'lucide-react';

interface InterviewStatusDropdownProps {
  interviewId: string;
  currentStatus: string;
  currentOutcome?: string | null;
}

export function InterviewStatusDropdown({ interviewId, currentStatus, currentOutcome }: InterviewStatusDropdownProps) {
  const [isPending, startTransition] = useTransition();
  const [status, setStatus] = useState(currentStatus);
  const [outcome, setOutcome] = useState<string | null>(currentOutcome || null);
  const [showOutcomeModal, setShowOutcomeModal] = useState(false);

  const handleStatusChange = (newStatus: string) => {
    if (newStatus === 'COMPLETED') {
      setShowOutcomeModal(true);
      return;
    }

    startTransition(async () => {
      const res = await updateInterviewStatusAction(interviewId, newStatus);
      if (res.success) {
        setStatus(newStatus);
      } else {
        alert(res.error || 'Failed to update status');
      }
    });
  };

  const handleOutcomeSubmit = (selectedOutcome: 'PASS' | 'FAIL' | 'HOLD') => {
    startTransition(async () => {
      const res = await updateInterviewStatusAction(interviewId, 'COMPLETED', selectedOutcome);
      if (res.success) {
        setStatus('COMPLETED');
        setOutcome(selectedOutcome);
        setShowOutcomeModal(false);
      } else {
        alert(res.error || 'Failed to update outcome');
      }
    });
  };

  return (
    <div className="relative inline-block text-left">
      <div className="flex items-center gap-2">
        <select
          disabled={isPending}
          value={status}
          onChange={(e) => handleStatusChange(e.target.value)}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold border outline-none cursor-pointer transition ${
            status === 'COMPLETED'
              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
              : status === 'CANCELLED' || status === 'NO_SHOW'
              ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
              : status === 'CONFIRMED'
              ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30'
              : status === 'RESCHEDULED'
              ? 'bg-amber-500/10 text-amber-300 border-amber-500/30'
              : 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30'
          }`}
        >
          <option value="SCHEDULED" className="bg-slate-900 text-slate-200">SCHEDULED</option>
          <option value="CONFIRMED" className="bg-slate-900 text-cyan-300">CONFIRMED</option>
          <option value="RESCHEDULED" className="bg-slate-900 text-amber-300">RESCHEDULED</option>
          <option value="COMPLETED" className="bg-slate-900 text-emerald-300">COMPLETED</option>
          <option value="CANCELLED" className="bg-slate-900 text-rose-300">CANCELLED</option>
          <option value="NO_SHOW" className="bg-slate-900 text-rose-400">NO_SHOW</option>
        </select>

        {outcome && (
          <span className={`px-2.5 py-1 rounded-lg text-[11px] font-extrabold uppercase border ${
            outcome === 'PASS'
              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
              : outcome === 'FAIL'
              ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
              : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
          }`}>
            {outcome}
          </span>
        )}
      </div>

      {/* Outcome Selection Modal */}
      {showOutcomeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full space-y-5 shadow-2xl animate-in fade-in zoom-in-95">
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                Record Interview Outcome
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Marking this interview as COMPLETED will update candidate pipeline stage automatically.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => handleOutcomeSubmit('PASS')}
                disabled={isPending}
                className="p-4 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 rounded-xl text-center transition group"
              >
                <div className="text-emerald-400 font-bold text-sm group-hover:scale-105 transition">PASS</div>
                <div className="text-[10px] text-slate-400 mt-1">Move to Offer Extended</div>
              </button>

              <button
                type="button"
                onClick={() => handleOutcomeSubmit('FAIL')}
                disabled={isPending}
                className="p-4 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 rounded-xl text-center transition group"
              >
                <div className="text-rose-400 font-bold text-sm group-hover:scale-105 transition">FAIL</div>
                <div className="text-[10px] text-slate-400 mt-1">Move to Rejected</div>
              </button>

              <button
                type="button"
                onClick={() => handleOutcomeSubmit('HOLD')}
                disabled={isPending}
                className="p-4 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 rounded-xl text-center transition group"
              >
                <div className="text-amber-300 font-bold text-sm group-hover:scale-105 transition">HOLD</div>
                <div className="text-[10px] text-slate-400 mt-1">Keep in Pipeline</div>
              </button>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setShowOutcomeModal(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
