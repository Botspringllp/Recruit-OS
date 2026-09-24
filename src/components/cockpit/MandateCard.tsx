'use client';

import React from 'react';
import { Building2, MapPin, IndianRupee, Users, ArrowRight, Plus, AlertCircle } from 'lucide-react';
import { MandateSummaryCard } from '@/types/cockpit';

interface MandateCardProps {
  mandate: MandateSummaryCard;
  onViewMandate?: (id: string) => void;
  onAddCandidate?: (id: string) => void;
}

export const MandateCard: React.FC<MandateCardProps> = ({
  mandate,
  onViewMandate,
  onAddCandidate
}) => {
  const getStageCount = (stageName: string) => {
    const found = mandate.stageBreakdown.find(s => s.stage === stageName);
    return found ? found.count : 0;
  };

  const screenedCount = getStageCount('SCREENED');
  const submittedCount = getStageCount('SUBMITTED_TO_CLIENT');
  const interviewCount = getStageCount('INTERVIEW_SCHEDULED');
  const offerCount = getStageCount('OFFER_EXTENDED');

  const recruiterInitials = mandate.leadRecruiter.name
    .split(' ')
    .map(n => n.charAt(0))
    .join('')
    .toUpperCase();

  return (
    <div className="rounded-2xl bg-white border border-slate-200 p-5 space-y-4 shadow-sm shadow-slate-200/50 hover:shadow-md hover:border-indigo-400 transition-all duration-200 group flex flex-col justify-between">
      <div>
        {/* Header: Company & Title */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-900 font-extrabold text-sm shadow-2xs group-hover:border-indigo-400 transition-colors">
              {mandate.companyLogoUrl ? (
                <img src={mandate.companyLogoUrl} alt={mandate.companyName} className="h-6 w-6 object-contain" />
              ) : (
                <Building2 className="h-5 w-5 text-indigo-600 transition-colors" />
              )}
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-1">
                {mandate.title}
              </h3>
              <p className="text-xs text-slate-600 flex items-center gap-1 font-semibold">
                <span>{mandate.companyName}</span>
                <span>•</span>
                <span className="flex items-center text-[11px] text-slate-600">
                  <MapPin className="h-3 w-3 mr-0.5 text-indigo-600" />
                  {mandate.location}
                </span>
              </p>
            </div>
          </div>

          <span className="px-2.5 py-0.5 text-[10px] font-extrabold rounded-md bg-emerald-100 text-emerald-950 border border-emerald-300 shrink-0">
            {mandate.feePercentage}% Fee
          </span>
        </div>

        {/* Details Tag Bar */}
        <div className="flex items-center flex-wrap gap-2 text-xs text-slate-800 mb-4">
          <div className="px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200 text-[11px] font-bold flex items-center gap-1 text-slate-800">
            <IndianRupee className="h-3.5 w-3.5 text-emerald-600" />
            <span>
              {mandate.minCtcLpa} - {mandate.maxCtcLpa} LPA
            </span>
          </div>

          <div className="px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200 text-[11px] font-bold flex items-center gap-1 text-slate-800">
            <Users className="h-3.5 w-3.5 text-indigo-600" />
            <span>{mandate.headcount} Openings</span>
          </div>

          {mandate.slaWarningCount > 0 && (
            <div className="px-2.5 py-1 rounded-lg bg-amber-100 border border-amber-300 text-amber-950 text-[10px] font-extrabold flex items-center gap-1">
              <AlertCircle className="h-3.5 w-3.5 text-amber-600 animate-pulse" />
              <span>{mandate.slaWarningCount} SLA Alert</span>
            </div>
          )}
        </div>

        {/* Pipeline Progress Breakdown */}
        <div className="space-y-1.5 mb-4">
          <div className="flex items-center justify-between text-[11px] font-bold">
            <span className="text-slate-600">Pipeline Stages ({mandate.totalSubmissions} Candidates)</span>
            <span className="text-indigo-700 font-extrabold">{offerCount} Extended</span>
          </div>

          {/* Micro Stage Progress Bar */}
          <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden flex gap-0.5 p-0.5 border border-slate-200">
            <div
              style={{ width: `${mandate.totalSubmissions > 0 ? (screenedCount / mandate.totalSubmissions) * 100 : 0}%` }}
              className="h-full bg-slate-400 rounded-sm transition-all duration-300"
              title={`Screened: ${screenedCount}`}
            />
            <div
              style={{ width: `${mandate.totalSubmissions > 0 ? (submittedCount / mandate.totalSubmissions) * 100 : 0}%` }}
              className="h-full bg-indigo-600 rounded-sm transition-all duration-300"
              title={`Submitted: ${submittedCount}`}
            />
            <div
              style={{ width: `${mandate.totalSubmissions > 0 ? (interviewCount / mandate.totalSubmissions) * 100 : 0}%` }}
              className="h-full bg-blue-500 rounded-sm transition-all duration-300"
              title={`Interviews: ${interviewCount}`}
            />
            <div
              style={{ width: `${mandate.totalSubmissions > 0 ? (offerCount / mandate.totalSubmissions) * 100 : 0}%` }}
              className="h-full bg-emerald-500 rounded-sm transition-all duration-300"
              title={`Offered: ${offerCount}`}
            />
          </div>

          {/* Stage Count Breakdown Pills */}
          <div className="grid grid-cols-4 gap-1 text-center pt-1 text-[10px]">
            <div className="bg-slate-50 p-1 rounded border border-slate-200 text-slate-700 font-bold">
              Screened: <span className="text-slate-950 font-black">{screenedCount}</span>
            </div>
            <div className="bg-indigo-50 p-1 rounded border border-indigo-200 text-indigo-900 font-bold">
              Submitted: <span className="text-indigo-950 font-black">{submittedCount}</span>
            </div>
            <div className="bg-blue-50 p-1 rounded border border-blue-200 text-blue-900 font-bold">
              Interview: <span className="text-blue-950 font-black">{interviewCount}</span>
            </div>
            <div className="bg-emerald-50 p-1 rounded border border-emerald-200 text-emerald-900 font-bold">
              Offer: <span className="text-emerald-950 font-black">{offerCount}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Footer: Recruiter Avatar & Quick Action Buttons */}
      <div className="flex items-center justify-between pt-3 border-t border-slate-100">
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-lg bg-indigo-600 text-white font-black text-[10px] flex items-center justify-center shadow-2xs">
            {recruiterInitials}
          </div>
          <div className="flex flex-col">
            <span className="text-[11px] font-extrabold text-slate-900 line-clamp-1">
              {mandate.leadRecruiter.name}
            </span>
            <span className="text-[9px] text-slate-500 font-bold">Lead Recruiter</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onAddCandidate && onAddCandidate(mandate.id)}
            className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 transition-colors"
            title="Intake Candidate to Mandate"
          >
            <Plus className="h-4 w-4" />
          </button>

          <button
            onClick={() => onViewMandate && onViewMandate(mandate.id)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-sm shadow-indigo-600/20 transition-all duration-200"
          >
            <span>View Board</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
