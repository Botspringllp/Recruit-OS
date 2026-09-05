import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Briefcase, Building2, Users, DollarSign, Percent, ArrowLeft, Edit3, Calendar, CheckCircle2, Clock, Video } from 'lucide-react';
import { prisma } from '@/lib/prisma';
import { JobStatusActions } from '@/components/jobs/JobStatusActions';

import { getCurrentUser } from '@/lib/rbac';

export const revalidate = 0;

interface JobDetailPageProps {
  params: {
    id: string;
  };
}

export default async function JobDetailPage({ params }: JobDetailPageProps) {
  const dbUser = await getCurrentUser();
  const agencyId = dbUser?.agencyId;

  const job = await prisma.jobMandate.findFirst({
    where: {
      id: params.id,
      agencyId
    },
    include: {
      client: true,
      submissions: {
        orderBy: { createdAt: 'desc' },
        include: {
          candidate: { select: { firstName: true, lastName: true, email: true, phone: true } },
          interviewSchedules: { select: { id: true, confirmedStartTime: true, status: true } }
        }
      }
    }
  }).catch(() => null);

  if (!job) {
    notFound();
  }

  // Calculate metrics
  const totalSubmissions = job.submissions.length;
  const placementsCount = job.submissions.filter(s => s.stage === 'JOINED').length;
  const interviewsCount = job.submissions.reduce((acc, s) => acc + s.interviewSchedules.length, 0);

  return (
    <div className="space-y-6 pb-12">
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-5">
        <div className="flex items-center gap-3">
          <Link
            href="/jobs"
            className="p-2 bg-slate-900 border border-slate-800 rounded-xl text-slate-400 hover:text-white transition"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-white tracking-tight">{job.title}</h1>
              <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                job.status === 'ACTIVE' || job.status === 'OPEN'
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                  : job.status === 'PAUSED' || job.status === 'ON_HOLD'
                  ? 'bg-amber-500/10 text-amber-300 border-amber-500/20'
                  : 'bg-slate-800 text-slate-400 border-slate-700'
              }`}>
                {job.status}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Client: <span className="text-slate-200 font-semibold">{job.client?.companyName || 'Unassigned Client'}</span>
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 self-start sm:self-auto">
          {/* Status Actions */}
          <JobStatusActions jobId={job.id} currentStatus={job.status} />

          <Link
            href={`/jobs/${job.id}/edit`}
            className="px-4 py-2 bg-gradient-to-r from-brand-600 to-indigo-600 text-white rounded-xl text-xs font-semibold hover:brightness-110 transition flex items-center gap-2 shadow-glow-brand"
          >
            <Edit3 className="h-4 w-4" />
            Edit Mandate
          </Link>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
        <div className="glass-panel p-4 rounded-2xl border border-slate-800/80 space-y-1">
          <span className="text-[10px] uppercase font-medium text-slate-400">Total Submissions</span>
          <div className="text-2xl font-bold text-white flex items-center gap-2">
            <Users className="h-5 w-5 text-brand-400" />
            {totalSubmissions}
          </div>
        </div>

        <div className="glass-panel p-4 rounded-2xl border border-slate-800/80 space-y-1">
          <span className="text-[10px] uppercase font-medium text-slate-400">Interviews Conducted</span>
          <div className="text-2xl font-bold text-white flex items-center gap-2">
            <Video className="h-5 w-5 text-cyan-400" />
            {interviewsCount}
          </div>
        </div>

        <div className="glass-panel p-4 rounded-2xl border border-slate-800/80 space-y-1">
          <span className="text-[10px] uppercase font-medium text-slate-400">Placements Joined</span>
          <div className="text-2xl font-bold text-white flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-emerald-400" />
            {placementsCount} / {job.headcount}
          </div>
        </div>

        <div className="glass-panel p-4 rounded-2xl border border-slate-800/80 space-y-1">
          <span className="text-[10px] uppercase font-medium text-slate-400">Compensation CTC Range</span>
          <div className="text-lg font-bold text-emerald-400 flex items-center gap-1.5 pt-1">
            <DollarSign className="h-4 w-4" />
            {job.minCtcLpa ? `${Number(job.minCtcLpa)} - ${Number(job.maxCtcLpa || 0)} LPA` : 'Competitive'}
          </div>
        </div>
      </div>

      {/* Main Details & Submissions Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Mandate Info Panel */}
        <div className="lg:col-span-1 glass-panel p-6 rounded-2xl border border-slate-800/80 space-y-5 self-start">
          <h3 className="font-semibold text-sm text-white flex items-center gap-2 border-b border-slate-800/60 pb-3">
            <Briefcase className="h-4 w-4 text-indigo-400" />
            Mandate Specification
          </h3>

          <div className="space-y-3.5 text-xs text-slate-300">
            <div>
              <span className="text-slate-400 block text-[11px]">Client Company</span>
              <span className="font-semibold text-white">{job.client?.companyName || 'Unassigned'}</span>
            </div>

            <div>
              <span className="text-slate-400 block text-[11px]">Industry</span>
              <span>{job.client?.industry || 'N/A'}</span>
            </div>

            <div>
              <span className="text-slate-400 block text-[11px]">Open Headcount</span>
              <span className="font-semibold text-white">{job.headcount} Positions</span>
            </div>

            <div>
              <span className="text-slate-400 block text-[11px]">Placement Fee</span>
              <span className="font-semibold text-purple-300">{Number(job.feePercentage)}%</span>
            </div>

            <div>
              <span className="text-slate-400 block text-[11px]">Created Date</span>
              <span>{new Date(job.createdAt).toLocaleString()}</span>
            </div>

            <div>
              <span className="text-slate-400 block text-[11px]">Last Updated</span>
              <span>{new Date(job.updatedAt).toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Candidate Pipeline */}
        <div className="lg:col-span-2 glass-panel p-6 rounded-2xl border border-slate-800/80 space-y-4">
          <h3 className="font-semibold text-sm text-white flex items-center gap-2">
            <Users className="h-4 w-4 text-brand-400" />
            Active Submissions Pipeline ({job.submissions.length})
          </h3>

          <div className="space-y-3 pt-1">
            {job.submissions.length > 0 ? (
              job.submissions.map((sub) => (
                <div key={sub.id} className="p-4 bg-slate-900/60 rounded-xl border border-slate-800/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h4 className="font-semibold text-xs text-white">
                      {sub.candidate.firstName} {sub.candidate.lastName}
                    </h4>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      {sub.candidate.email} | {sub.candidate.phone}
                    </p>
                  </div>

                  <div className="flex items-center gap-3 text-xs">
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-brand-500/10 text-brand-400 border border-brand-500/20">
                      {sub.stage}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      {sub.slaStatus}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-8 text-center text-slate-400 text-xs">
                No candidates submitted to this mandate yet.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
