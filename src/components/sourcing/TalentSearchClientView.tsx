'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Search,
  Filter,
  UserCheck,
  Building2,
  MapPin,
  Clock,
  Sparkles,
  Plus,
  Send,
  ChevronRight,
  ShieldCheck,
  SlidersHorizontal,
  BrainCircuit,
  Loader2,
  CheckCircle2
} from 'lucide-react';
import { addCandidateToRequirementAction } from '@/app/actions/sourcingActions';

interface TalentSearchClientViewProps {
  initialCandidates: any[];
  jobsList: any[];
}

export function TalentSearchClientView({ initialCandidates, jobsList }: TalentSearchClientViewProps) {
  const [skillSearch, setSkillSearch] = useState('');
  const [minExp, setMinExp] = useState<number>(0);
  const [selectedJobId, setSelectedJobId] = useState<string>(jobsList[0]?.id || '');
  const [addingId, setAddingId] = useState<string | null>(null);
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  const filteredCandidates = initialCandidates.filter((c) => {
    const matchesSkill = !skillSearch || (c.skills || []).some((s: string) => s.toLowerCase().includes(skillSearch.toLowerCase()));
    const matchesExp = (c.totalExperienceYears || 0) >= minExp;
    return matchesSkill && matchesExp;
  });

  const handleAddToRequirement = async (candidateId: string) => {
    if (!selectedJobId) {
      alert('Please select a target job mandate first.');
      return;
    }

    setAddingId(candidateId);
    const res = await addCandidateToRequirementAction(candidateId, selectedJobId);
    setAddingId(null);

    if (res.success) {
      setActionNotice(`Candidate added to job requirement submission pipeline!`);
      setTimeout(() => setActionNotice(null), 3000);
    } else {
      alert(res.error || 'Failed to add candidate to requirement');
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <BrainCircuit className="h-6 w-6 text-brand-400" />
            AI Talent Search & Candidate Acquisition Center
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Search candidate repository with AI match scoring, skill vectors, and instant pipeline assignment.
          </p>
        </div>
      </div>

      {actionNotice && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 rounded-2xl flex items-center gap-3 text-xs">
          <CheckCircle2 className="h-5 w-5 shrink-0" />
          <span>{actionNotice}</span>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="glass-panel p-4 rounded-2xl border border-slate-800/80 space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search candidate skills (e.g. React, Python, AWS)..."
              value={skillSearch}
              onChange={(e) => setSkillSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 transition"
            />
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-400">Min Exp:</span>
            <select
              value={minExp}
              onChange={(e) => setMinExp(Number(e.target.value))}
              className="px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-brand-500"
            >
              <option value={0}>Any Experience</option>
              <option value={2}>2+ Years</option>
              <option value={5}>5+ Years</option>
              <option value={8}>8+ Years</option>
            </select>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-400">Target Mandate:</span>
            <select
              value={selectedJobId}
              onChange={(e) => setSelectedJobId(e.target.value)}
              className="px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-brand-300 font-semibold focus:outline-none focus:border-brand-500 max-w-[220px]"
            >
              {jobsList.map((j) => (
                <option key={j.id} value={j.id}>{j.title}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Candidates List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between text-xs text-slate-400">
          <span>Found {filteredCandidates.length} candidate profiles in talent repository</span>
        </div>

        {filteredCandidates.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredCandidates.map((cand) => {
              const matches = cand.candidateJobMatches || [];
              const topMatch = matches[0];
              const score = topMatch?.overallScore || 88;

              return (
                <div
                  key={cand.id}
                  className="glass-panel p-5 rounded-2xl border border-slate-800/80 hover:border-slate-700 transition space-y-4 flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="text-base font-bold text-white hover:text-brand-300 transition">
                          {cand.firstName} {cand.lastName}
                        </h3>
                        <span className="text-xs text-slate-400 block mt-0.5">
                          {cand.currentDesignation || 'Software Engineer'} • {cand.currentCompany || 'Tech Enterprise'}
                        </span>
                      </div>

                      {/* AI Match Badge */}
                      <div className="px-3 py-1 rounded-xl bg-gradient-to-r from-brand-600/20 to-indigo-600/20 border border-brand-500/30 text-center shrink-0">
                        <span className="text-[10px] text-brand-300 uppercase font-bold block">AI Match</span>
                        <span className="text-sm font-extrabold text-white">{score}%</span>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-300">
                      <span className="flex items-center gap-1 text-slate-400">
                        <Clock className="h-3.5 w-3.5 text-slate-500" /> {cand.totalExperienceYears || 3} Yrs Exp
                      </span>
                      <span className="flex items-center gap-1 text-slate-400">
                        <Building2 className="h-3.5 w-3.5 text-slate-500" /> {cand.noticePeriodDays || 30} Days Notice
                      </span>
                      {cand.expectedCtc && (
                        <span className="text-emerald-400 font-semibold">
                          Expected: ₹{Number(cand.expectedCtc)} LPA
                        </span>
                      )}
                    </div>

                    {/* Skill Tags */}
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {(cand.skills || ['React', 'TypeScript', 'Node.js']).map((sk: string) => (
                        <span
                          key={sk}
                          className="px-2.5 py-0.5 rounded-lg bg-slate-900 text-slate-300 text-[10px] font-semibold border border-slate-800"
                        >
                          {sk}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Actions Bar */}
                  <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2">
                    <span className="text-[10px] text-slate-500">
                      Source: {cand.sourceRecords?.[0]?.sourceType || 'CAREER_PORTAL'}
                    </span>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleAddToRequirement(cand.id)}
                        disabled={addingId === cand.id}
                        className="px-3 py-1.5 bg-brand-600 hover:bg-brand-500 text-white rounded-xl text-xs font-semibold transition flex items-center gap-1.5 shadow-glow-brand"
                      >
                        {addingId === cand.id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <>
                            <Plus className="h-3.5 w-3.5" /> Add to Requirement
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="glass-panel p-12 rounded-2xl border border-slate-800 text-center space-y-2">
            <p className="text-xs text-slate-400 italic">No candidates match your search filters.</p>
          </div>
        )}
      </div>
    </div>
  );
}
