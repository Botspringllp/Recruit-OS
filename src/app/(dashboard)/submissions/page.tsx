import React from 'react';
import Link from 'next/link';
import { Layers, Search, Filter, Plus, Building2, User, ArrowUpRight, Clock, AlertTriangle, ShieldCheck } from 'lucide-react';
import { prisma } from '@/lib/prisma';
import { PipelineStage, SlaStatus } from '@prisma/client';
import { SubmissionStageSelector } from '@/components/submissions/SubmissionStageSelector';
import { calculateSlaStatus } from '@/lib/sla';

import { getCurrentUser } from '@/lib/rbac';

export const revalidate = 0;

interface SubmissionsPageProps {
  searchParams?: {
    q?: string;
    jobId?: string;
    sla?: string;
  };
}

export default async function SubmissionsPage({ searchParams }: SubmissionsPageProps) {
  const query = (searchParams?.q || '').trim();
  const filterJobId = searchParams?.jobId || '';
  const filterSla = searchParams?.sla || '';

  const dbUser = await getCurrentUser();
  const agencyId = dbUser?.agencyId;

  const whereClause: any = { agencyId };

  if (filterJobId) {
    whereClause.jobId = filterJobId;
  }

  if (filterSla && Object.values(SlaStatus).includes(filterSla as SlaStatus)) {
    whereClause.slaStatus = filterSla as SlaStatus;
  }

  if (query) {
    whereClause.OR = [
      { candidate: { firstName: { contains: query, mode: 'insensitive' } } },
      { candidate: { lastName: { contains: query, mode: 'insensitive' } } },
      { candidate: { email: { contains: query, mode: 'insensitive' } } },
      { job: { title: { contains: query, mode: 'insensitive' } } }
    ];
  }

  const [submissionsList, jobsList] = await Promise.all([
    prisma.candidateSubmission.findMany({
      where: whereClause,
      orderBy: { updatedAt: 'desc' },
      include: {
        candidate: { select: { id: true, firstName: true, lastName: true, email: true, phone: true, currentCompany: true, currentDesignation: true } },
        job: { select: { id: true, title: true, client: { select: { companyName: true } } } }
      }
    }).catch(() => []),
    prisma.jobMandate.findMany({
      where: { agencyId },
      select: { id: true, title: true }
    }).catch(() => [])
  ]);

  const pipelineStages: { stage: PipelineStage; title: string; color: string }[] = [
    { stage: PipelineStage.SCREENED, title: 'Screened', color: 'border-slate-700 bg-slate-900/60' },
    { stage: PipelineStage.SUBMITTED_TO_CLIENT, title: 'Submitted to Client', color: 'border-brand-500/30 bg-brand-500/5' },
    { stage: PipelineStage.INTERVIEW_SCHEDULED, title: 'Interview Scheduled', color: 'border-cyan-500/30 bg-cyan-500/5' },
    { stage: PipelineStage.OFFER_EXTENDED, title: 'Offer Extended', color: 'border-purple-500/30 bg-purple-500/5' },
    { stage: PipelineStage.COMPLIANCE_AUDIT, title: 'Compliance Audit', color: 'border-amber-500/30 bg-amber-500/5' },
    { stage: PipelineStage.JOINED, title: 'Joined / Placed', color: 'border-emerald-500/30 bg-emerald-500/5' },
    { stage: PipelineStage.REJECTED, title: 'Rejected', color: 'border-rose-500/30 bg-rose-500/5' }
  ];

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <Layers className="h-6 w-6 text-brand-400" />
            Recruitment Pipeline Kanban
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-time candidate submission tracking & SLA watchdog pipeline ({submissionsList.length} total active submissions)
          </p>
        </div>

        <Link
          href="/submissions/new"
          className="px-4 py-2 bg-gradient-to-r from-brand-600 to-indigo-600 text-white rounded-xl text-xs font-semibold hover:brightness-110 transition flex items-center gap-2 shadow-glow-brand self-start sm:self-auto"
        >
          <Plus className="h-4 w-4" />
          Submit Candidate
        </Link>
      </div>

      {/* Filter and Search Bar */}
      <div className="glass-panel p-4 rounded-2xl border border-slate-800/80 flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs">
        <form method="GET" action="/submissions" className="flex flex-wrap items-center gap-3 flex-1">
          <div className="relative flex-1 min-w-[200px] max-w-xs">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              name="q"
              defaultValue={query}
              placeholder="Search candidate name, email, mandate..."
              className="w-full pl-9 pr-4 py-2 bg-slate-900/80 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 transition"
            />
          </div>

          {/* Mandate Filter */}
          <select
            name="jobId"
            defaultValue={filterJobId}
            className="px-3 py-2 bg-slate-900/80 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-brand-500 transition"
          >
            <option value="">All Job Mandates</option>
            {jobsList.map((j) => (
              <option key={j.id} value={j.id}>{j.title}</option>
            ))}
          </select>

          {/* SLA Filter */}
          <select
            name="sla"
            defaultValue={filterSla}
            className="px-3 py-2 bg-slate-900/80 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-brand-500 transition"
          >
            <option value="">All SLA Statuses</option>
            <option value="HEALTHY">HEALTHY</option>
            <option value="ON_TRACK">ON_TRACK</option>
            <option value="AT_RISK">AT_RISK</option>
            <option value="WARNING">WARNING</option>
            <option value="BREACHED">BREACHED</option>
          </select>

          <button
            type="submit"
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-semibold transition"
          >
            Filter
          </button>
        </form>
      </div>

      {/* Kanban Stages Grid */}
      <div className="flex gap-4 overflow-x-auto pb-6">
        {pipelineStages.map((ps) => {
          const stageSubmissions = submissionsList.filter((s) => s.stage === ps.stage);

          return (
            <div
              key={ps.stage}
              className={`w-72 shrink-0 glass-panel p-4 rounded-2xl border ${ps.color} space-y-3 flex flex-col justify-between`}
            >
              {/* Column Header */}
              <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
                <h3 className="font-bold text-xs text-white flex items-center gap-1.5">
                  {ps.title}
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700">
                  {stageSubmissions.length}
                </span>
              </div>

              {/* Submission Cards Stack */}
              <div className="space-y-3 flex-1 min-h-[300px]">
                {stageSubmissions.length > 0 ? (
                  stageSubmissions.map((sub) => {
                    const currentSla = calculateSlaStatus(sub.createdAt, sub.updatedAt);

                    return (
                      <div
                        key={sub.id}
                        className="p-3.5 bg-slate-900/90 rounded-xl border border-slate-800 space-y-3 hover:border-slate-700 transition"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <Link href={`/submissions/${sub.id}`} className="font-semibold text-xs text-white hover:text-brand-400 transition block">
                              {sub.candidate.firstName} {sub.candidate.lastName}
                            </Link>
                            <span className="text-[10px] text-slate-400 block truncate mt-0.5">
                              {sub.candidate.currentDesignation || 'Candidate'}
                            </span>
                          </div>

                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border shrink-0 ${
                            currentSla === 'HEALTHY' || currentSla === 'ON_TRACK'
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                              : currentSla === 'AT_RISK'
                              ? 'bg-amber-500/10 text-amber-300 border-amber-500/20'
                              : 'bg-rose-500/10 text-rose-400 border-rose-500/20 animate-pulse'
                          }`}>
                            {currentSla}
                          </span>
                        </div>

                        <div className="text-[11px] text-slate-300 space-y-1">
                          <div className="flex items-center gap-1.5 text-slate-400">
                            <Building2 className="h-3 w-3 text-slate-500 shrink-0" />
                            <span className="truncate">{sub.job.title}</span>
                          </div>
                          <div className="text-[10px] text-slate-500">
                            Client: {sub.job.client?.companyName || 'N/A'}
                          </div>
                        </div>

                        {/* Interactive Stage Move Control */}
                        <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
                          <SubmissionStageSelector submissionId={sub.id} currentStage={sub.stage} />

                          <Link
                            href={`/submissions/${sub.id}`}
                            className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white transition"
                            title="View Submission Details"
                          >
                            <ArrowUpRight className="h-3.5 w-3.5" />
                          </Link>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="py-12 text-center text-slate-500 text-[11px] italic">
                    No candidates in stage
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
