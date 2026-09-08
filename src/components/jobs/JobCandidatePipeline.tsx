'use client';

import React, { useState } from 'react';
import { Users, Sparkles, CheckCircle2, Plus, Loader2, Award, Briefcase, MapPin } from 'lucide-react';
import { submitCandidateToMandateAction } from '@/app/actions/jobs';

export interface SubmissionItem {
  id: string;
  stage: string;
  slaStatus: string;
  createdAt: any;
  candidate: {
    id?: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    currentCompany?: string | null;
    currentDesignation?: string | null;
    totalExperienceYears?: any;
    currentLocation?: string | null;
    primarySkills?: string[];
  };
}

export interface CandidateDirectoryItem {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  currentCompany?: string | null;
  currentDesignation?: string | null;
  totalExperienceYears?: any;
  currentLocation?: string | null;
  primarySkills: string[];
}

interface JobCandidatePipelineProps {
  jobId: string;
  jobSkills: string[];
  jobExperience: string;
  jobLocation: string;
  submissions: SubmissionItem[];
  allCandidates: CandidateDirectoryItem[];
}

/**
 * AI Match Calculation Algorithm
 */
export function calculateCandidateMatchScore(
  cand: { primarySkills?: string[]; totalExperienceYears?: any; currentLocation?: string | null },
  jobSkills: string[],
  jobExpStr: string,
  jobLocStr: string
): number {
  let score = 0;
  const candSkills = (cand.primarySkills || []).map(s => s.toLowerCase());

  // 1. Skill Match Score (Max 70 Points)
  if (jobSkills.length > 0) {
    let matchedCount = 0;
    for (const jSkill of jobSkills) {
      const cleanJSkill = jSkill.toLowerCase().trim();
      const isMatched = candSkills.some(cSkill => 
        cSkill.includes(cleanJSkill) || cleanJSkill.includes(cSkill)
      );
      if (isMatched) matchedCount++;
    }
    const skillRatio = matchedCount / jobSkills.length;
    score += Math.round(skillRatio * 70);
  } else {
    score += 45;
  }

  // 2. Experience Match Score (Max 20 Points)
  const expMatch = jobExpStr.match(/(\d+)/);
  const requiredYears = expMatch ? parseInt(expMatch[1], 10) : 3;
  const candYears = cand.totalExperienceYears ? parseFloat(String(cand.totalExperienceYears)) : 2;

  if (candYears >= requiredYears - 1 && candYears <= requiredYears + 3) {
    score += 20;
  } else if (candYears >= 1) {
    score += 12;
  } else {
    score += 5;
  }

  // 3. Location Match Score (Max 10 Points)
  if (jobLocStr && cand.currentLocation) {
    if (
      cand.currentLocation.toLowerCase().includes(jobLocStr.toLowerCase()) ||
      jobLocStr.toLowerCase().includes('remote')
    ) {
      score += 10;
    } else {
      score += 5;
    }
  } else {
    score += 8;
  }

  // Cap between 45% and 98%
  return Math.min(Math.max(score, 45), 98);
}

export function JobCandidatePipeline({
  jobId,
  jobSkills,
  jobExperience,
  jobLocation,
  submissions,
  allCandidates
}: JobCandidatePipelineProps) {
  const [activeTab, setActiveTab] = useState<'submissions' | 'directory'>('submissions');
  const [submittingCandidateId, setSubmittingCandidateId] = useState<string | null>(null);

  // Filter out candidates already submitted
  const submittedCandidateIds = new Set(
    submissions.map(s => s.candidate.id).filter(Boolean)
  );

  // Calculate & sort candidate directory by match score
  const matchedDirectoryCandidates = allCandidates
    .filter(c => !submittedCandidateIds.has(c.id))
    .map(c => ({
      ...c,
      matchScore: calculateCandidateMatchScore(c, jobSkills, jobExperience, jobLocation)
    }))
    .sort((a, b) => b.matchScore - a.matchScore);

  async function handleQuickSubmit(candidateId: string) {
    setSubmittingCandidateId(candidateId);
    const res = await submitCandidateToMandateAction(jobId, candidateId);
    setSubmittingCandidateId(null);

    if (!res.success) {
      alert(res.error || 'Failed to submit candidate');
    }
  }

  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden font-sans">
      {/* Header with Navigation Tabs */}
      <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="font-black text-base text-slate-900 flex items-center gap-2">
            <Users className="h-5 w-5 text-amber-600" />
            Candidate Pipeline & AI Matching
          </h3>
          <p className="text-xs font-semibold text-slate-500 mt-0.5">
            Screen active submissions or submit AI-matched candidates from directory
          </p>
        </div>

        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-2xl self-start sm:self-auto">
          <button
            onClick={() => setActiveTab('submissions')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition cursor-pointer ${
              activeTab === 'submissions'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Submissions ({submissions.length})
          </button>
          <button
            onClick={() => setActiveTab('directory')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'directory'
                ? 'bg-white text-amber-950 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Sparkles className="h-3.5 w-3.5 text-amber-600" />
            AI Matched ({matchedDirectoryCandidates.length})
          </button>
        </div>
      </div>

      {/* Content Body */}
      <div className="p-6">
        {activeTab === 'submissions' && (
          <div className="space-y-3">
            {submissions.length > 0 ? (
              submissions.map((sub) => {
                const matchScore = calculateCandidateMatchScore(
                  sub.candidate,
                  jobSkills,
                  jobExperience,
                  jobLocation
                );

                return (
                  <div
                    key={sub.id}
                    className="p-4 bg-slate-50 hover:bg-slate-100/80 rounded-2xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2.5">
                        <h4 className="font-black text-sm text-slate-900">
                          {sub.candidate.firstName} {sub.candidate.lastName}
                        </h4>
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-black border ${
                            matchScore >= 80
                              ? 'bg-emerald-100 text-emerald-950 border-emerald-300'
                              : matchScore >= 60
                              ? 'bg-amber-100 text-amber-950 border-amber-300'
                              : 'bg-slate-200 text-slate-800 border-slate-300'
                          }`}
                        >
                          🎯 {matchScore}% Match
                        </span>
                      </div>

                      <p className="text-xs font-semibold text-slate-600">
                        {sub.candidate.currentDesignation || 'Candidate'} {sub.candidate.currentCompany ? `at ${sub.candidate.currentCompany}` : ''}
                      </p>

                      <p className="text-[11px] font-medium text-slate-500">
                        {sub.candidate.email} | {sub.candidate.phone}
                      </p>
                    </div>

                    <div className="flex items-center gap-3 self-start sm:self-auto">
                      <span className="px-3 py-1 rounded-full text-[11px] font-extrabold bg-amber-100 text-amber-950 border border-amber-300">
                        {sub.stage}
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-950 border border-emerald-300">
                        {sub.slaStatus}
                      </span>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-10 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200 space-y-2">
                <Users className="h-8 w-8 text-slate-300 mx-auto" />
                <p className="text-xs font-extrabold text-slate-700">No candidates submitted to this mandate yet.</p>
                <p className="text-[11px] font-medium text-slate-500">
                  Switch to <span className="font-bold text-amber-600">AI Matched</span> tab to view matching directory candidates!
                </p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'directory' && (
          <div className="space-y-3">
            {matchedDirectoryCandidates.length > 0 ? (
              matchedDirectoryCandidates.map((cand) => (
                <div
                  key={cand.id}
                  className="p-4 bg-slate-50 hover:bg-slate-100/80 rounded-2xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition"
                >
                  <div className="space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <h4 className="font-black text-sm text-slate-900">
                        {cand.firstName} {cand.lastName}
                      </h4>
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-black border ${
                          cand.matchScore >= 80
                            ? 'bg-emerald-100 text-emerald-950 border-emerald-300 shadow-xs'
                            : cand.matchScore >= 60
                            ? 'bg-amber-100 text-amber-950 border-amber-300'
                            : 'bg-slate-200 text-slate-800 border-slate-300'
                        }`}
                      >
                        ⚡ {cand.matchScore}% Match
                      </span>
                    </div>

                    <p className="text-xs font-semibold text-slate-700 flex items-center gap-2">
                      <span>{cand.currentDesignation || 'Candidate'} {cand.currentCompany ? `(${cand.currentCompany})` : ''}</span>
                      <span>•</span>
                      <span>{cand.totalExperienceYears ? `${cand.totalExperienceYears} YOE` : 'Exp N/A'}</span>
                    </p>

                    {/* Skill Tags */}
                    {cand.primarySkills && cand.primarySkills.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {cand.primarySkills.slice(0, 5).map((sk, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-0.5 bg-white border border-slate-200 rounded-md text-[10px] font-bold text-slate-700"
                          >
                            {sk}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => handleQuickSubmit(cand.id)}
                    disabled={submittingCandidateId === cand.id}
                    className="px-4 py-2 bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700 text-slate-950 rounded-xl text-xs font-black transition flex items-center gap-1.5 shadow-sm shrink-0 disabled:opacity-50 cursor-pointer self-start sm:self-auto"
                  >
                    {submittingCandidateId === cand.id ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Plus className="h-3.5 w-3.5" />
                    )}
                    Submit to Mandate
                  </button>
                </div>
              ))
            ) : (
              <div className="text-center py-10 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200 space-y-2">
                <Sparkles className="h-8 w-8 text-slate-300 mx-auto" />
                <p className="text-xs font-extrabold text-slate-700">No additional directory candidates to match.</p>
                <p className="text-[11px] font-medium text-slate-500">All available candidate records have been submitted to this mandate.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
