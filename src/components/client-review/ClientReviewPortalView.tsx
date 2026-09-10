'use client';

import React, { useState } from 'react';
import {
  Briefcase,
  Building2,
  FileText,
  UserCheck,
  Clock,
  CheckCircle,
  XCircle,
  PauseCircle,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Loader2,
  Sparkles,
  MapPin,
  GraduationCap,
  DollarSign
} from 'lucide-react';
import { updateClientDecisionAction } from '@/app/actions/clientSubmissions';

export interface SubmittedCandidateViewItem {
  submissionId: string;
  status: 'PENDING' | 'INTERVIEW' | 'HOLD' | 'REJECT' | string;
  candidateId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  totalExperience: string;
  relevantExperience: string;
  currentDesignation: string;
  qualification: string;
  currentCompany: string;
  currentSalary: string;
  expectedSalary: string;
  noticePeriod: string;
  reasonOfLeaving: string;
  offerInHand: string;
  resumeUrl: string | null;
  resumeFileName: string | null;
}

interface ClientReviewPortalViewProps {
  token: string;
  positionTitle: string;
  clientName: string;
  recruiterMessage?: string | null;
  candidates: SubmittedCandidateViewItem[];
}

export function ClientReviewPortalView({
  token,
  positionTitle,
  clientName,
  recruiterMessage,
  candidates: initialCandidates
}: ClientReviewPortalViewProps) {
  const [candidates, setCandidates] = useState<SubmittedCandidateViewItem[]>(initialCandidates);
  const [loadingMap, setLoadingMap] = useState<Record<string, boolean>>({});
  const [expandedMap, setExpandedMap] = useState<Record<string, boolean>>(() => {
    // Expand all by default for client convenience
    const map: Record<string, boolean> = {};
    initialCandidates.forEach(c => {
      map[c.submissionId] = true;
    });
    return map;
  });

  function toggleExpand(submissionId: string) {
    setExpandedMap(prev => ({ ...prev, [submissionId]: !prev[submissionId] }));
  }

  async function handleDecision(submissionId: string, decision: 'INTERVIEW' | 'HOLD' | 'REJECT') {
    setLoadingMap(prev => ({ ...prev, [submissionId]: true }));

    const res = await updateClientDecisionAction(submissionId, token, decision);
    setLoadingMap(prev => ({ ...prev, [submissionId]: false }));

    if (res.success && res.status) {
      setCandidates(prev =>
        prev.map(c => (c.submissionId === submissionId ? { ...c, status: res.status! } : c))
      );
    } else {
      alert(res.error || 'Failed to update candidate decision.');
    }
  }

  const pendingCount = candidates.filter(c => c.status === 'PENDING').length;
  const interviewCount = candidates.filter(c => c.status === 'INTERVIEW').length;
  const holdCount = candidates.filter(c => c.status === 'HOLD').length;
  const rejectCount = candidates.filter(c => c.status === 'REJECT').length;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans antialiased py-8 px-4 sm:px-6 lg:px-8 selection:bg-amber-500 selection:text-slate-950">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Portal Header */}
        <header className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 backdrop-blur-xl shadow-2xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
            <div className="space-y-1.5">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-full text-xs font-black uppercase tracking-wider">
                <Briefcase className="h-3.5 w-3.5" />
                Client Candidate Review Portal
              </div>
              <h1 className="text-3xl font-black tracking-tight text-white">
                {positionTitle}
              </h1>
              <p className="text-sm font-semibold text-slate-400 flex items-center gap-2">
                <Building2 className="h-4 w-4 text-slate-500" />
                Submitted for <strong>{clientName}</strong>
              </p>
            </div>

            {/* Decision Summary Chips */}
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="px-3 py-1.5 bg-slate-800 border border-slate-700 text-slate-300 rounded-xl text-xs font-bold">
                Total: <strong className="text-white">{candidates.length}</strong>
              </span>
              {interviewCount > 0 && (
                <span className="px-3 py-1.5 bg-emerald-950/60 border border-emerald-800 text-emerald-300 rounded-xl text-xs font-extrabold flex items-center gap-1.5">
                  <CheckCircle className="h-3.5 w-3.5 text-emerald-400" />
                  Interview: {interviewCount}
                </span>
              )}
              {holdCount > 0 && (
                <span className="px-3 py-1.5 bg-amber-950/60 border border-amber-800 text-amber-300 rounded-xl text-xs font-extrabold flex items-center gap-1.5">
                  <PauseCircle className="h-3.5 w-3.5 text-amber-400" />
                  Hold: {holdCount}
                </span>
              )}
              {rejectCount > 0 && (
                <span className="px-3 py-1.5 bg-rose-950/60 border border-rose-800 text-rose-300 rounded-xl text-xs font-extrabold flex items-center gap-1.5">
                  <XCircle className="h-3.5 w-3.5 text-rose-400" />
                  Reject: {rejectCount}
                </span>
              )}
            </div>
          </div>

          {/* Recruiter Message Box */}
          {recruiterMessage && (
            <div className="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-4 space-y-1 text-xs text-slate-300">
              <span className="font-extrabold text-amber-400 uppercase tracking-wider block text-[10px]">
                Note from Recruiter
              </span>
              <p className="italic font-medium leading-relaxed">"{recruiterMessage}"</p>
            </div>
          )}
        </header>

        {/* Submitted Candidates List Header */}
        <div className="flex items-center justify-between px-2">
          <h2 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
            <UserCheck className="h-5 w-5 text-amber-500" />
            Submitted Candidates List ({candidates.length})
          </h2>
          <span className="text-xs font-semibold text-slate-400">
            Review candidate details and click your decision below
          </span>
        </div>

        {/* Candidate List Cards */}
        <div className="space-y-5">
          {candidates.map((c, index) => {
            const isExpanded = Boolean(expandedMap[c.submissionId]);
            const isUpdating = Boolean(loadingMap[c.submissionId]);

            return (
              <div
                key={c.submissionId}
                className={`bg-slate-900/90 border rounded-3xl overflow-hidden transition-all duration-200 shadow-xl ${
                  c.status === 'INTERVIEW'
                    ? 'border-emerald-500/40 ring-1 ring-emerald-500/20'
                    : c.status === 'HOLD'
                    ? 'border-amber-500/40 ring-1 ring-amber-500/20'
                    : c.status === 'REJECT'
                    ? 'border-rose-500/40 ring-1 ring-rose-500/20'
                    : 'border-slate-800 hover:border-slate-700'
                }`}
              >
                {/* Candidate Header Banner */}
                <div
                  onClick={() => toggleExpand(c.submissionId)}
                  className="p-5 sm:p-6 bg-slate-900/80 hover:bg-slate-800/80 transition flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer select-none border-b border-slate-800/80"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="h-11 w-11 rounded-2xl bg-amber-500/10 text-amber-400 font-black text-base flex items-center justify-center border border-amber-500/20 shrink-0">
                      #{index + 1}
                    </div>
                    <div>
                      <div className="flex items-center gap-3">
                        <h3 className="text-lg font-black text-white tracking-tight">
                          {c.firstName} {c.lastName}
                        </h3>
                        {/* Status Badge */}
                        {c.status === 'INTERVIEW' && (
                          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                            <CheckCircle className="h-3 w-3" /> INTERVIEW
                          </span>
                        )}
                        {c.status === 'HOLD' && (
                          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center gap-1">
                            <PauseCircle className="h-3 w-3" /> HOLD
                          </span>
                        )}
                        {c.status === 'REJECT' && (
                          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center gap-1">
                            <XCircle className="h-3 w-3" /> REJECT
                          </span>
                        )}
                        {c.status === 'PENDING' && (
                          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black bg-slate-800 text-slate-400 border border-slate-700 flex items-center gap-1">
                            <Clock className="h-3 w-3 text-amber-500" /> PENDING DECISION
                          </span>
                        )}
                      </div>
                      <p className="text-xs font-semibold text-slate-400 mt-0.5">
                        {c.currentDesignation} at <strong className="text-slate-200">{c.currentCompany}</strong> ({c.totalExperience} Exp)
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 self-end sm:self-auto shrink-0">
                    {/* View Resume Header CTA */}
                    {c.resumeUrl && (
                      <a
                        href={c.resumeUrl}
                        target="_blank"
                        rel="noreferrer"
                        onClick={e => e.stopPropagation()}
                        className="px-3.5 py-2 bg-amber-500/10 hover:bg-amber-500 text-amber-400 hover:text-slate-950 rounded-xl text-xs font-extrabold border border-amber-500/30 transition flex items-center gap-1.5"
                      >
                        <FileText className="h-3.5 w-3.5" />
                        <span>View Resume</span>
                      </a>
                    )}

                    <div className="p-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-400">
                      {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </div>
                  </div>
                </div>

                {/* Candidate Details Body */}
                {isExpanded && (
                  <div className="p-6 sm:p-8 space-y-6 animate-in slide-in-from-top-2 duration-200">
                    {/* Key Metrics Grid per PART 6 */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 text-xs">
                      <div className="p-4 bg-slate-950/60 rounded-2xl border border-slate-800 space-y-1">
                        <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block">Experience</span>
                        <span className="font-black text-slate-100 text-sm">{c.totalExperience}</span>
                      </div>

                      <div className="p-4 bg-slate-950/60 rounded-2xl border border-slate-800 space-y-1">
                        <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block">Relevant Experience</span>
                        <span className="font-black text-amber-400 text-sm">{c.relevantExperience}</span>
                      </div>

                      <div className="p-4 bg-slate-950/60 rounded-2xl border border-slate-800 space-y-1">
                        <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block">Current Designation</span>
                        <span className="font-bold text-slate-200 text-xs truncate block">{c.currentDesignation}</span>
                      </div>

                      <div className="p-4 bg-slate-950/60 rounded-2xl border border-slate-800 space-y-1">
                        <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block">Qualification</span>
                        <span className="font-bold text-slate-200 text-xs truncate block">{c.qualification}</span>
                      </div>

                      <div className="p-4 bg-slate-950/60 rounded-2xl border border-slate-800 space-y-1">
                        <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block">Current / Last Company</span>
                        <span className="font-bold text-slate-200 text-xs truncate block">{c.currentCompany}</span>
                      </div>

                      <div className="p-4 bg-slate-950/60 rounded-2xl border border-slate-800 space-y-1">
                        <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block">Current Salary</span>
                        <span className="font-black text-emerald-400 text-sm">{c.currentSalary}</span>
                      </div>

                      <div className="p-4 bg-slate-950/60 rounded-2xl border border-slate-800 space-y-1">
                        <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block">Expected Salary</span>
                        <span className="font-black text-amber-400 text-sm">{c.expectedSalary}</span>
                      </div>

                      <div className="p-4 bg-slate-950/60 rounded-2xl border border-slate-800 space-y-1">
                        <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block">Notice Period</span>
                        <span className="font-bold text-slate-200 text-xs">{c.noticePeriod}</span>
                      </div>
                    </div>

                    {/* Secondary Metrics */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                      <div className="p-4 bg-slate-950/60 rounded-2xl border border-slate-800 space-y-1">
                        <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block">Reason Of Leaving</span>
                        <span className="font-medium text-slate-300 text-xs">{c.reasonOfLeaving}</span>
                      </div>

                      <div className="p-4 bg-slate-950/60 rounded-2xl border border-slate-800 space-y-1">
                        <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block">Offer In Hand</span>
                        <span className="font-medium text-slate-300 text-xs">{c.offerInHand}</span>
                      </div>
                    </div>

                    {/* Decision Action Buttons Bar per PART 7 */}
                    <div className="pt-4 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
                      <div className="text-xs font-extrabold text-slate-400">
                        Mark your review decision:
                      </div>

                      {/* PART 7: Exactly 3 Action Buttons [ Interview ] [ Hold ] [ Reject ] */}
                      <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
                        {/* Interview Button */}
                        <button
                          type="button"
                          disabled={isUpdating}
                          onClick={() => handleDecision(c.submissionId, 'INTERVIEW')}
                          className={`flex-1 sm:flex-none px-5 py-2.5 rounded-xl text-xs font-black transition flex items-center justify-center gap-2 cursor-pointer shadow-md ${
                            c.status === 'INTERVIEW'
                              ? 'bg-emerald-500 text-slate-950 ring-2 ring-emerald-400'
                              : 'bg-emerald-950/70 hover:bg-emerald-900 text-emerald-300 border border-emerald-800/80'
                          }`}
                        >
                          {isUpdating ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <CheckCircle className="h-4 w-4 stroke-[2.5]" />
                          )}
                          <span>Interview</span>
                        </button>

                        {/* Hold Button */}
                        <button
                          type="button"
                          disabled={isUpdating}
                          onClick={() => handleDecision(c.submissionId, 'HOLD')}
                          className={`flex-1 sm:flex-none px-5 py-2.5 rounded-xl text-xs font-black transition flex items-center justify-center gap-2 cursor-pointer shadow-md ${
                            c.status === 'HOLD'
                              ? 'bg-amber-500 text-slate-950 ring-2 ring-amber-400'
                              : 'bg-amber-950/70 hover:bg-amber-900 text-amber-300 border border-amber-800/80'
                          }`}
                        >
                          {isUpdating ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <PauseCircle className="h-4 w-4 stroke-[2.5]" />
                          )}
                          <span>Hold</span>
                        </button>

                        {/* Reject Button */}
                        <button
                          type="button"
                          disabled={isUpdating}
                          onClick={() => handleDecision(c.submissionId, 'REJECT')}
                          className={`flex-1 sm:flex-none px-5 py-2.5 rounded-xl text-xs font-black transition flex items-center justify-center gap-2 cursor-pointer shadow-md ${
                            c.status === 'REJECT'
                              ? 'bg-rose-600 text-white ring-2 ring-rose-400'
                              : 'bg-rose-950/70 hover:bg-rose-900 text-rose-300 border border-rose-800/80'
                          }`}
                        >
                          {isUpdating ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <XCircle className="h-4 w-4 stroke-[2.5]" />
                          )}
                          <span>Reject</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
