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
  Users,
  CheckCircle2,
  Layers
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
  const [selectedJobTitle, setSelectedJobTitle] = useState<string>(positionTitle);
  const [loadingMap, setLoadingMap] = useState<Record<string, boolean>>({});
  const [expandedMap, setExpandedMap] = useState<Record<string, boolean>>(() => {
    const map: Record<string, boolean> = {};
    initialCandidates.forEach(c => {
      map[c.submissionId] = true;
    });
    return map;
  });

  // Group candidates by position title if multiple exist
  const jobRolesList = Array.from(new Set([positionTitle]));

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

  const filteredCandidates = candidates;
  const totalCount = candidates.length;
  const interviewCount = candidates.filter(c => c.status === 'INTERVIEW').length;
  const holdCount = candidates.filter(c => c.status === 'HOLD').length;
  const rejectCount = candidates.filter(c => c.status === 'REJECT').length;
  const pendingCount = candidates.filter(c => c.status === 'PENDING').length;

  return (
    <div className="min-h-screen bg-slate-50/70 text-slate-900 font-sans antialiased py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Top Header Card — Light Theme */}
        <header className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-6">
            <div className="space-y-1.5">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-50 text-amber-800 border border-amber-200 rounded-full text-xs font-black uppercase tracking-wider">
                <Building2 className="h-3.5 w-3.5 text-amber-600" />
                Client Candidate Review Portal
              </div>
              <h1 className="text-3xl font-black tracking-tight text-slate-900">
                {clientName}
              </h1>
              <p className="text-xs font-bold text-slate-500 flex items-center gap-2">
                <span>Evaluating shortlisted candidates for open job mandates</span>
              </p>
            </div>

            {/* Overall Decision Chips */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3.5 py-1.5 bg-slate-100 border border-slate-200 text-slate-700 rounded-xl text-xs font-bold">
                Total Submitted: <strong className="text-slate-900">{totalCount}</strong>
              </span>
              {interviewCount > 0 && (
                <span className="px-3 py-1.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-extrabold flex items-center gap-1.5">
                  <CheckCircle className="h-3.5 w-3.5 text-emerald-600" />
                  Interview: {interviewCount}
                </span>
              )}
              {holdCount > 0 && (
                <span className="px-3 py-1.5 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl text-xs font-extrabold flex items-center gap-1.5">
                  <PauseCircle className="h-3.5 w-3.5 text-amber-600" />
                  Hold: {holdCount}
                </span>
              )}
              {rejectCount > 0 && (
                <span className="px-3 py-1.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs font-extrabold flex items-center gap-1.5">
                  <XCircle className="h-3.5 w-3.5 text-rose-600" />
                  Reject: {rejectCount}
                </span>
              )}
            </div>
          </div>

          {/* Recruiter Cover Note Box */}
          {recruiterMessage && (
            <div className="p-4 bg-amber-50/60 border border-amber-200/80 rounded-2xl space-y-1 text-xs text-slate-800">
              <span className="font-extrabold text-amber-800 uppercase tracking-wider block text-[10px]">
                Note from Recruiter
              </span>
              <p className="italic font-semibold leading-relaxed text-slate-700">"{recruiterMessage}"</p>
            </div>
          )}
        </header>

        {/* SECTION: JOB ROLES MANDATES CARD TILES */}
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-base font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Briefcase className="h-4 w-4 text-amber-600" />
              Job Roles / Open Mandates ({jobRolesList.length})
            </h2>
            <span className="text-xs font-bold text-slate-500">Click a job role card to view candidates</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {jobRolesList.map(roleTitle => {
              const isSelected = selectedJobTitle === roleTitle;
              const roleCandidatesCount = candidates.length;

              return (
                <div
                  key={roleTitle}
                  onClick={() => setSelectedJobTitle(roleTitle)}
                  className={`p-5 rounded-3xl border transition-all duration-200 cursor-pointer select-none space-y-3 ${
                    isSelected
                      ? 'bg-white border-2 border-amber-500 shadow-md ring-4 ring-amber-500/10'
                      : 'bg-white border-slate-200 shadow-sm hover:border-slate-300 hover:shadow-md'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="h-10 w-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-200 font-bold">
                      <Briefcase className="h-5 w-5" />
                    </div>
                    <span className="px-2.5 py-1 rounded-full text-[11px] font-black bg-slate-100 text-slate-700 border border-slate-200">
                      {roleCandidatesCount} Candidate(s)
                    </span>
                  </div>

                  <div>
                    <h3 className="font-black text-slate-900 text-base tracking-tight">{roleTitle}</h3>
                    <p className="text-xs font-semibold text-slate-500">Client: {clientName}</p>
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] font-bold text-slate-600">
                    <span className="flex items-center gap-1 text-emerald-700">
                      <CheckCircle className="h-3 w-3 text-emerald-600" /> {interviewCount} Interview
                    </span>
                    <span className="flex items-center gap-1 text-amber-700">
                      <PauseCircle className="h-3 w-3 text-amber-600" /> {holdCount} Hold
                    </span>
                    <span className="flex items-center gap-1 text-rose-700">
                      <XCircle className="h-3 w-3 text-rose-600" /> {rejectCount} Reject
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* SECTION: SUBMITTED CANDIDATES EVALUATION */}
        <div className="space-y-5">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <UserCheck className="h-5 w-5 text-amber-600" />
              Submitted Candidates for {selectedJobTitle} ({filteredCandidates.length})
            </h2>
            <span className="text-xs font-bold text-slate-500">
              Review details and click your decision below
            </span>
          </div>

          {filteredCandidates.map((c, index) => {
            const isExpanded = Boolean(expandedMap[c.submissionId]);
            const isUpdating = Boolean(loadingMap[c.submissionId]);

            return (
              <div
                key={c.submissionId}
                className={`bg-white border rounded-3xl overflow-hidden transition-all duration-200 shadow-sm ${
                  c.status === 'INTERVIEW'
                    ? 'border-emerald-400 ring-2 ring-emerald-500/10'
                    : c.status === 'HOLD'
                    ? 'border-amber-400 ring-2 ring-amber-500/10'
                    : c.status === 'REJECT'
                    ? 'border-rose-400 ring-2 ring-rose-500/10'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                {/* Candidate Banner Header */}
                <div
                  onClick={() => toggleExpand(c.submissionId)}
                  className="p-5 sm:p-6 bg-slate-50/50 hover:bg-slate-100/50 transition flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer select-none border-b border-slate-100"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="h-11 w-11 rounded-2xl bg-amber-100 text-amber-800 font-black text-base flex items-center justify-center border border-amber-200 shrink-0">
                      #{index + 1}
                    </div>
                    <div>
                      <div className="flex items-center gap-3">
                        <h3 className="text-lg font-black text-slate-900 tracking-tight">
                          {c.firstName} {c.lastName}
                        </h3>
                        {/* Decision Status Badge */}
                        {c.status === 'INTERVIEW' && (
                          <span className="px-3 py-1 rounded-full text-[11px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
                            <CheckCircle className="h-3 w-3 text-emerald-600" /> INTERVIEW
                          </span>
                        )}
                        {c.status === 'HOLD' && (
                          <span className="px-3 py-1 rounded-full text-[11px] font-black bg-amber-100 text-amber-800 border border-amber-300 flex items-center gap-1">
                            <PauseCircle className="h-3 w-3 text-amber-600" /> HOLD
                          </span>
                        )}
                        {c.status === 'REJECT' && (
                          <span className="px-3 py-1 rounded-full text-[11px] font-black bg-rose-100 text-rose-800 border border-rose-300 flex items-center gap-1">
                            <XCircle className="h-3 w-3 text-rose-600" /> REJECT
                          </span>
                        )}
                        {c.status === 'PENDING' && (
                          <span className="px-3 py-1 rounded-full text-[11px] font-black bg-slate-100 text-slate-600 border border-slate-300 flex items-center gap-1">
                            <Clock className="h-3 w-3 text-amber-600" /> PENDING DECISION
                          </span>
                        )}
                      </div>
                      <p className="text-xs font-semibold text-slate-500 mt-0.5">
                        {c.currentDesignation} at <strong className="text-slate-800">{c.currentCompany}</strong> ({c.totalExperience} Exp)
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 self-end sm:self-auto shrink-0">
                    {/* View Resume CTA */}
                    {c.resumeUrl && (
                      <a
                        href={c.resumeUrl}
                        target="_blank"
                        rel="noreferrer"
                        onClick={e => e.stopPropagation()}
                        className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-black shadow transition flex items-center gap-1.5"
                      >
                        <FileText className="h-3.5 w-3.5 text-amber-400" />
                        <span>View Resume</span>
                      </a>
                    )}

                    <div className="p-2 rounded-xl bg-white border border-slate-200 text-slate-500 shadow-sm">
                      {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </div>
                  </div>
                </div>

                {/* Candidate Body Grid & Details */}
                {isExpanded && (
                  <div className="p-6 sm:p-8 space-y-6 animate-in slide-in-from-top-2 duration-200 bg-white">
                    {/* Candidate Metrics Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 text-xs">
                      <div className="p-4 bg-slate-50/80 rounded-2xl border border-slate-200 space-y-1">
                        <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block">Total Experience</span>
                        <span className="font-black text-slate-900 text-sm">{c.totalExperience}</span>
                      </div>

                      <div className="p-4 bg-slate-50/80 rounded-2xl border border-slate-200 space-y-1">
                        <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block">Relevant Exp</span>
                        <span className="font-black text-amber-700 text-sm">{c.relevantExperience}</span>
                      </div>

                      <div className="p-4 bg-slate-50/80 rounded-2xl border border-slate-200 space-y-1">
                        <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block">Current Designation</span>
                        <span className="font-bold text-slate-800 text-xs truncate block">{c.currentDesignation}</span>
                      </div>

                      <div className="p-4 bg-slate-50/80 rounded-2xl border border-slate-200 space-y-1">
                        <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block">Qualification</span>
                        <span className="font-bold text-slate-800 text-xs truncate block">{c.qualification}</span>
                      </div>

                      <div className="p-4 bg-slate-50/80 rounded-2xl border border-slate-200 space-y-1">
                        <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block">Current / Last Company</span>
                        <span className="font-bold text-slate-800 text-xs truncate block">{c.currentCompany}</span>
                      </div>

                      <div className="p-4 bg-slate-50/80 rounded-2xl border border-slate-200 space-y-1">
                        <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block">Current Salary</span>
                        <span className="font-black text-emerald-700 text-sm">{c.currentSalary}</span>
                      </div>

                      <div className="p-4 bg-slate-50/80 rounded-2xl border border-slate-200 space-y-1">
                        <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block">Expected Salary</span>
                        <span className="font-black text-amber-700 text-sm">{c.expectedSalary}</span>
                      </div>

                      <div className="p-4 bg-slate-50/80 rounded-2xl border border-slate-200 space-y-1">
                        <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block">Notice Period</span>
                        <span className="font-bold text-slate-800 text-xs">{c.noticePeriod}</span>
                      </div>
                    </div>

                    {/* Secondary Details */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                      <div className="p-4 bg-slate-50/80 rounded-2xl border border-slate-200 space-y-1">
                        <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block">Reason Of Leaving</span>
                        <span className="font-medium text-slate-700 text-xs">{c.reasonOfLeaving}</span>
                      </div>

                      <div className="p-4 bg-slate-50/80 rounded-2xl border border-slate-200 space-y-1">
                        <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block">Offer In Hand</span>
                        <span className="font-medium text-slate-700 text-xs">{c.offerInHand}</span>
                      </div>
                    </div>

                    {/* Decision Action Buttons Bar */}
                    <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
                      <div className="text-xs font-extrabold text-slate-600">
                        Mark your review decision for {c.firstName}:
                      </div>

                      {/* 3 Action Buttons: [ Interview ] [ Hold ] [ Reject ] */}
                      <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
                        {/* Interview Button */}
                        <button
                          type="button"
                          disabled={isUpdating}
                          onClick={() => handleDecision(c.submissionId, 'INTERVIEW')}
                          className={`flex-1 sm:flex-none px-6 py-2.5 rounded-xl text-xs font-black transition flex items-center justify-center gap-2 cursor-pointer shadow-sm ${
                            c.status === 'INTERVIEW'
                              ? 'bg-emerald-600 text-white ring-2 ring-emerald-400'
                              : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300'
                          }`}
                        >
                          {isUpdating ? (
                            <Loader2 className="h-4 w-4 animate-spin text-emerald-800" />
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
                          className={`flex-1 sm:flex-none px-6 py-2.5 rounded-xl text-xs font-black transition flex items-center justify-center gap-2 cursor-pointer shadow-sm ${
                            c.status === 'HOLD'
                              ? 'bg-amber-500 text-slate-950 ring-2 ring-amber-400'
                              : 'bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300'
                          }`}
                        >
                          {isUpdating ? (
                            <Loader2 className="h-4 w-4 animate-spin text-amber-900" />
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
                          className={`flex-1 sm:flex-none px-6 py-2.5 rounded-xl text-xs font-black transition flex items-center justify-center gap-2 cursor-pointer shadow-sm ${
                            c.status === 'REJECT'
                              ? 'bg-rose-600 text-white ring-2 ring-rose-400'
                              : 'bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-300'
                          }`}
                        >
                          {isUpdating ? (
                            <Loader2 className="h-4 w-4 animate-spin text-rose-800" />
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
