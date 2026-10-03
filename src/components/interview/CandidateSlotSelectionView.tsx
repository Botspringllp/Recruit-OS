'use client';

import React, { useState } from 'react';
import {
  Calendar,
  Clock,
  CheckCircle,
  Building2,
  Briefcase,
  FileText,
  Loader2,
  Sparkles,
  AlertCircle,
  ShieldCheck,
  Video,
  ExternalLink
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
  meetingUrl?: string | null;
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
      const formatted = new Date(res.confirmedStartTime).toLocaleString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
      setConfirmedTimeStr(formatted);
      setInterview(prev => ({
        ...prev,
        status: 'SCHEDULED',
        confirmedStartTime: res.confirmedStartTime,
        meetingUrl: prev.meetingUrl || `https://meet.jit.si/recruitos-interview-${prev.id.slice(0, 8)}`
      }));
    } else {
      setError(res.error || 'Failed to confirm interview slot selection.');
    }
  }

  const meetingUrl = interview.meetingUrl || `https://meet.jit.si/recruitos-interview-${interview.id.slice(0, 8)}`;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4 sm:p-6 font-sans antialiased selection:bg-amber-500 selection:text-slate-950">
      
      {/* Background Aesthetic Blur Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl" />
      </div>

      {/* Main Guest Card Container */}
      <div className="relative z-10 w-full max-w-2xl bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-10 shadow-2xl backdrop-blur-xl space-y-8">
        
        {/* Top Header Badge */}
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-5">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-amber-500 to-yellow-400 text-slate-950 font-black text-sm flex items-center justify-center shadow-lg shadow-amber-500/20">
              R
            </div>
            <div>
              <span className="text-xs font-black text-white uppercase tracking-wider block">Candidate Guest Portal</span>
              <span className="text-[10px] font-semibold text-slate-400">Secure Interview Scheduling</span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full">
            <ShieldCheck className="h-3.5 w-3.5" />
            <span>Verified Token</span>
          </div>
        </div>

        {/* If Already Confirmed / Scheduled */}
        {isConsumed ? (
          <div className="text-center space-y-6 animate-in fade-in zoom-in-95 duration-300">
            <div className="h-20 w-20 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle className="h-10 w-10 stroke-[2.5]" />
            </div>

            <div className="space-y-2">
              <span className="px-3 py-1 rounded-full text-[11px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 uppercase tracking-widest inline-block">
                Interview Confirmed & Locked
              </span>
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                You're All Set, {interview.candidateName}!
              </h1>
              <p className="text-xs sm:text-sm text-slate-300 max-w-md mx-auto leading-relaxed">
                Your interview for <strong className="text-white">{interview.positionTitle}</strong> at <strong className="text-white">{interview.companyName}</strong> has been locked into the calendar.
              </p>
            </div>

            {/* Confirmed Schedule Card */}
            <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-5 text-left space-y-3.5">
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5">
                <span className="text-xs font-semibold text-slate-400">Position Title</span>
                <span className="text-xs font-extrabold text-white">{interview.positionTitle}</span>
              </div>
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5">
                <span className="text-xs font-semibold text-slate-400">Company</span>
                <span className="text-xs font-extrabold text-white">{interview.companyName}</span>
              </div>
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5">
                <span className="text-xs font-semibold text-slate-400">Interview Round</span>
                <span className="text-xs font-extrabold text-amber-400">{interview.roundType}</span>
              </div>
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5">
                <span className="text-xs font-semibold text-slate-400">Confirmed Time</span>
                <span className="text-xs font-black text-emerald-400">{confirmedTimeStr}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-400">Timezone</span>
                <span className="text-xs font-bold text-slate-300">IST (UTC+5:30)</span>
              </div>
            </div>

            {/* Direct Join Interview CTA Button */}
            <div className="pt-2">
              <a
                href={meetingUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-500 via-emerald-600 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-black text-sm shadow-xl shadow-emerald-600/25 transition flex items-center justify-center gap-2 group"
              >
                <Video className="h-5 w-5" />
                <span>Join Interview</span>
                <ExternalLink className="h-4 w-4 opacity-70 group-hover:translate-x-0.5 transition" />
              </a>
              <p className="text-[11px] text-slate-400 mt-3">
                Calendar invite and email confirmation sent to your inbox.
              </p>
            </div>
          </div>
        ) : (
          /* Active Selection Card */
          <div className="space-y-6 animate-in fade-in duration-300">
            
            {/* Greeting & Header */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-xs font-extrabold text-amber-400 uppercase tracking-widest">
                <Sparkles className="h-4 w-4" />
                Interview Slot Selection
              </div>
              
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                Select Preferred Slot
              </h1>

              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                Hi <strong className="text-white">{interview.candidateName}</strong>, please select 1 of the proposed times for your upcoming interview round.
              </p>
            </div>

            {/* Summary Details Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3.5 bg-slate-950/70 rounded-2xl border border-slate-800/80 flex items-center gap-3">
                <Briefcase className="h-4 w-4 text-amber-400 shrink-0" />
                <div className="min-w-0">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Position</span>
                  <span className="text-xs font-extrabold text-white truncate block">{interview.positionTitle}</span>
                </div>
              </div>

              <div className="p-3.5 bg-slate-950/70 rounded-2xl border border-slate-800/80 flex items-center gap-3">
                <Building2 className="h-4 w-4 text-amber-400 shrink-0" />
                <div className="min-w-0">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Company</span>
                  <span className="text-xs font-extrabold text-white truncate block">{interview.companyName}</span>
                </div>
              </div>

              <div className="p-3.5 bg-slate-950/70 rounded-2xl border border-slate-800/80 flex items-center gap-3">
                <FileText className="h-4 w-4 text-amber-400 shrink-0" />
                <div className="min-w-0">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Round</span>
                  <span className="text-xs font-extrabold text-amber-400 truncate block">{interview.roundType}</span>
                </div>
              </div>
            </div>

            {/* Client Notes (If Any) */}
            {interview.notes && (
              <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl text-xs text-amber-200 space-y-1">
                <strong className="text-amber-400 font-extrabold block">Client Note:</strong>
                <p className="leading-relaxed">{interview.notes}</p>
              </div>
            )}

            {error && (
              <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-2xl text-xs font-bold text-rose-300 flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
                <span>{error}</span>
              </div>
            )}

            {/* 3 Available Slots */}
            <div className="space-y-3">
              <label className="text-xs font-black text-slate-300 uppercase tracking-wider flex items-center gap-2">
                <Calendar className="h-4 w-4 text-amber-400" />
                Proposed Slots (Select 1)
              </label>

              <div className="space-y-2.5">
                {interview.slots.map((s, idx) => {
                  const isSelected = selectedSlotId === s.slotId;

                  return (
                    <div
                      key={s.slotId}
                      onClick={() => setSelectedSlotId(s.slotId)}
                      className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-4 ${
                        isSelected
                          ? 'bg-amber-500/10 border-amber-400 ring-1 ring-amber-400/50 shadow-lg shadow-amber-500/10'
                          : 'bg-slate-950/60 border-slate-800/80 hover:border-slate-700 hover:bg-slate-900'
                      }`}
                    >
                      <div className="flex items-center gap-3.5">
                        <div className={`h-8 w-8 rounded-xl font-black text-xs flex items-center justify-center ${
                          isSelected ? 'bg-amber-400 text-slate-950' : 'bg-slate-800 text-slate-400'
                        }`}>
                          {idx + 1}
                        </div>

                        <div>
                          <span className="text-xs sm:text-sm font-black text-white block">
                            {s.formattedStr}
                          </span>
                          <span className="text-[11px] font-medium text-slate-400 block mt-0.5">
                            Duration: 45 Minutes • Timezone: IST
                          </span>
                        </div>
                      </div>

                      <div className={`h-5 w-5 rounded-full border flex items-center justify-center ${
                        isSelected ? 'border-amber-400 bg-amber-400 text-slate-950' : 'border-slate-700'
                      }`}>
                        {isSelected && <span className="font-black text-[10px]">✓</span>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Confirm CTA Button */}
            <div className="pt-2">
              <button
                type="button"
                disabled={isSubmitting || !selectedSlotId}
                onClick={handleConfirmSlot}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-500 via-emerald-600 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-black text-sm shadow-xl shadow-emerald-600/20 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <CheckCircle className="h-5 w-5 stroke-[2.5]" />
                )}
                <span>Confirm Interview Slot</span>
              </button>
            </div>

          </div>
        )}

        {/* Footer */}
        <div className="pt-4 border-t border-slate-800/80 text-center text-[11px] text-slate-500">
          <p>© 2026 RecruitOS Guest Scheduling Service</p>
        </div>

      </div>

    </div>
  );
}
