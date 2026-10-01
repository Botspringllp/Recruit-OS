'use client';

import React, { useState } from 'react';
import {
  Calendar,
  Clock,
  CheckCircle,
  Building2,
  Briefcase,
  User,
  FileText,
  Loader2,
  Sparkles,
  AlertCircle,
  ShieldCheck
} from 'lucide-react';
import { confirmCandidateSlotSelectionAction } from '@/app/actions/interviews';

export interface ProposedSlotItem {
  slotId: string;
  index: number;
  startTime: string;
  endTime: string;
  isSelected: boolean;
  formattedStr: string;
}

export interface InterviewSelectionData {
  id: string;
  candidateName: string;
  positionTitle: string;
  companyName: string;
  roundType: string;
  notes?: string | null;
  status: string;
  confirmedStartTime?: string | null;
  tokenConsumedAt?: string | null;
  slots: ProposedSlotItem[];
}

interface CandidateSlotSelectionViewProps {
  token: string;
  isConsumed: boolean;
  interview: InterviewSelectionData;
}

export function CandidateSlotSelectionView({
  token,
  isConsumed: initialConsumed,
  interview: initialInterview
}: CandidateSlotSelectionViewProps) {
  const [interview, setInterview] = useState<InterviewSelectionData>(initialInterview);
  const [isConsumed, setIsConsumed] = useState<boolean>(initialConsumed);
  const [selectedSlotId, setSelectedSlotId] = useState<string>(
    initialInterview.slots.length > 0 ? initialInterview.slots[0].slotId : ''
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmedTimeStr, setConfirmedTimeStr] = useState<string | null>(
    initialInterview.confirmedStartTime
      ? new Date(initialInterview.confirmedStartTime).toLocaleString('en-US', {
          weekday: 'short',
          month: 'short',
          day: 'numeric',
          year: 'numeric',
          hour: 'numeric',
          minute: '2-digit',
          hour12: true
        })
      : null
  );

  async function handleConfirmSlot() {
    if (!selectedSlotId) {
      setError('Please select an interview time slot.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const res = await confirmCandidateSlotSelectionAction(token, selectedSlotId);

    setIsSubmitting(false);

    if (res.success && res.confirmedStartTime) {
      setIsConsumed(true);
      const chosenSlot = interview.slots.find(s => s.slotId === selectedSlotId);
      setConfirmedTimeStr(
        new Date(res.confirmedStartTime).toLocaleString('en-US', {
          weekday: 'short',
          month: 'short',
          day: 'numeric',
          year: 'numeric',
          hour: 'numeric',
          minute: '2-digit',
          hour12: true
        })
      );
      setInterview(prev => ({
        ...prev,
        status: 'SCHEDULED',
        confirmedStartTime: res.confirmedStartTime
      }));
    } else {
      setError(res.error || 'Failed to confirm interview slot selection.');
    }
  }

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col justify-between font-sans antialiased selection:bg-amber-500 selection:text-slate-950">
      
      {/* Header */}
      <header className="bg-slate-900/80 border-b border-slate-800 sticky top-0 z-30 backdrop-blur-md">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-400 text-slate-950 font-black text-base flex items-center justify-center shadow-lg shadow-amber-500/20">
              R
            </div>
            <div>
              <span className="text-base font-black text-white tracking-wider uppercase">RecruitOS</span>
              <span className="text-[10px] font-bold text-slate-400 block -mt-1">Candidate Portal</span>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 bg-slate-800/80 px-3 py-1.5 rounded-full border border-slate-700">
            <ShieldCheck className="h-4 w-4 text-emerald-400" />
            <span>Secure Token Verified</span>
          </div>
        </div>
      </header>

      {/* Main Body */}
      <main className="max-w-4xl mx-auto w-full px-4 sm:px-6 py-8 sm:py-12 flex-1">
        
        {/* If already scheduled / consumed */}
        {isConsumed ? (
          <div className="bg-slate-800/60 border border-emerald-500/30 rounded-3xl p-8 sm:p-12 text-center space-y-6 shadow-2xl backdrop-blur-md animate-in fade-in zoom-in-95">
            <div className="h-20 w-20 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle className="h-10 w-10 stroke-[2.5]" />
            </div>

            <div className="space-y-2">
              <span className="px-3.5 py-1 rounded-full text-xs font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 uppercase tracking-widest inline-block">
                Interview Confirmed & Scheduled
              </span>
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                You're All Set, {interview.candidateName}!
              </h1>
              <p className="text-sm text-slate-300 max-w-lg mx-auto leading-relaxed">
                Your interview for <strong>{interview.positionTitle}</strong> with <strong>{interview.companyName}</strong> has been locked into the calendar.
              </p>
            </div>

            {/* Schedule Details Card */}
            <div className="bg-slate-900/80 border border-slate-700/80 rounded-2xl p-6 max-w-md mx-auto space-y-4 text-left shadow-lg">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <span className="text-xs font-bold text-slate-400">Position</span>
                <span className="text-xs font-extrabold text-white">{interview.positionTitle}</span>
              </div>
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <span className="text-xs font-bold text-slate-400">Company</span>
                <span className="text-xs font-extrabold text-white">{interview.companyName}</span>
              </div>
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <span className="text-xs font-bold text-slate-400">Round Type</span>
                <span className="text-xs font-extrabold text-amber-400">{interview.roundType}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400">Confirmed Date & Time</span>
                <span className="text-xs font-black text-emerald-400">{confirmedTimeStr}</span>
              </div>
            </div>

            <p className="text-xs text-slate-400">
              An calendar invite and email confirmation have been dispatched. Thank you!
            </p>
          </div>
        ) : (
          /* Active Selection Portal */
          <div className="space-y-8 animate-in fade-in duration-300">
            
            {/* Greeting & Header */}
            <div className="bg-slate-800/40 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-4">
              <div className="flex items-center gap-2 text-xs font-extrabold text-amber-400 uppercase tracking-widest">
                <Sparkles className="h-4 w-4" />
                Interview Invitation
              </div>
              
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                Select Your Interview Slot
              </h1>

              <p className="text-sm text-slate-300 leading-relaxed max-w-2xl">
                Hi <strong>{interview.candidateName}</strong>, the hiring team at <strong>{interview.companyName}</strong> would like to invite you for an interview. Please select 1 of the 3 available slots below that fits your schedule best.
              </p>

              {/* Position Info Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4 border-t border-slate-800">
                <div className="p-3.5 bg-slate-900/60 rounded-2xl border border-slate-800 flex items-center gap-3">
                  <Briefcase className="h-5 w-5 text-amber-400 shrink-0" />
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Position</span>
                    <span className="text-xs font-extrabold text-white truncate block">{interview.positionTitle}</span>
                  </div>
                </div>

                <div className="p-3.5 bg-slate-900/60 rounded-2xl border border-slate-800 flex items-center gap-3">
                  <Building2 className="h-5 w-5 text-amber-400 shrink-0" />
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Company</span>
                    <span className="text-xs font-extrabold text-white truncate block">{interview.companyName}</span>
                  </div>
                </div>

                <div className="p-3.5 bg-slate-900/60 rounded-2xl border border-slate-800 flex items-center gap-3">
                  <FileText className="h-5 w-5 text-amber-400 shrink-0" />
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Interview Round</span>
                    <span className="text-xs font-extrabold text-amber-400 truncate block">{interview.roundType}</span>
                  </div>
                </div>
              </div>

              {/* Optional Client Notes */}
              {interview.notes && (
                <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-2xl text-xs text-amber-200 space-y-1">
                  <strong className="text-amber-400 font-extrabold block">Client Note for Candidate:</strong>
                  <p className="leading-relaxed">{interview.notes}</p>
                </div>
              )}
            </div>

            {error && (
              <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-2xl text-xs font-bold text-rose-300 flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
                <span>{error}</span>
              </div>
            )}

            {/* 3 Available Slot Options */}
            <div className="space-y-4">
              <h2 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                <Calendar className="h-4 w-4 text-amber-400" />
                Choose 1 Available Option
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {interview.slots.map((s, idx) => {
                  const isSelected = selectedSlotId === s.slotId;

                  return (
                    <div
                      key={s.slotId}
                      onClick={() => setSelectedSlotId(s.slotId)}
                      className={`p-5 rounded-3xl border transition-all cursor-pointer flex flex-col justify-between gap-4 relative overflow-hidden ${
                        isSelected
                          ? 'bg-amber-500/10 border-amber-400 shadow-xl shadow-amber-500/10 ring-2 ring-amber-400/40'
                          : 'bg-slate-800/50 border-slate-800 hover:border-slate-700 hover:bg-slate-800'
                      }`}
                    >
                      {isSelected && (
                        <div className="absolute top-3 right-3 h-6 w-6 rounded-full bg-amber-400 text-slate-950 flex items-center justify-center font-black text-xs">
                          ✓
                        </div>
                      )}

                      <div className="space-y-2">
                        <span className="text-xs font-black text-slate-400 uppercase tracking-widest block">
                          Option {idx + 1}
                        </span>

                        <div className="flex items-start gap-2.5">
                          <Clock className={`h-5 w-5 mt-0.5 shrink-0 ${isSelected ? 'text-amber-400' : 'text-slate-400'}`} />
                          <div>
                            <span className="text-sm font-black text-white block">
                              {s.formattedStr}
                            </span>
                            <span className="text-[11px] font-semibold text-slate-400 block mt-0.5">
                              Duration: 45 Mins
                            </span>
                          </div>
                        </div>
                      </div>

                      <button
                        type="button"
                        className={`w-full py-2.5 rounded-xl text-xs font-black transition ${
                          isSelected
                            ? 'bg-amber-400 text-slate-950'
                            : 'bg-slate-700 text-slate-200 hover:bg-slate-600'
                        }`}
                      >
                        {isSelected ? 'Selected Option' : 'Select Slot'}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Confirm CTA Button */}
            <div className="pt-4 flex justify-end">
              <button
                type="button"
                disabled={isSubmitting || !selectedSlotId}
                onClick={handleConfirmSlot}
                className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-emerald-500 via-emerald-600 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-black text-sm shadow-xl shadow-emerald-600/20 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <CheckCircle className="h-5 w-5 stroke-[2.5]" />
                )}
                <span>Confirm Selected Interview Slot</span>
              </button>
            </div>

          </div>
        )}

      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800 py-6 text-center text-xs text-slate-500">
        <p>© 2026 RecruitOS Talent Platform. All rights reserved.</p>
      </footer>

    </div>
  );
}
