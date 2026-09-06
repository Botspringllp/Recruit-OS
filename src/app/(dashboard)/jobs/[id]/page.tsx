import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Briefcase, Building2, Users, DollarSign, Percent, ArrowLeft, Edit3, Calendar, CheckCircle2, Clock, Video } from 'lucide-react';
import { prisma } from '@/lib/prisma';
import { JobStatusActions } from '@/components/jobs/JobStatusActions';

import { getCurrentUser, hasPermission } from '@/lib/rbac';
import { redirect } from 'next/navigation';

export const revalidate = 0;

interface JobDetailPageProps {
  params: {
    id: string;
  };
}

export default async function JobDetailPage({ params }: JobDetailPageProps) {
  const dbUser = await getCurrentUser();
  if (!dbUser || !hasPermission(dbUser, 'job.view')) {
    redirect('/403');
  }

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
    <div className="space-y-6 pb-12 font-sans">
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div className="flex items-center gap-3">
          <Link
            href="/jobs"
            className="p-2 bg-white border border-slate-300 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">{job.title}</h1>
              <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-extrabold border ${
                job.status === 'ACTIVE' || job.status === 'OPEN'
                  ? 'bg-emerald-100 text-emerald-950 border-emerald-300'
                  : job.status === 'PAUSED' || job.status === 'ON_HOLD'
                  ? 'bg-amber-100 text-amber-950 border-amber-300'
                  : 'bg-slate-100 text-slate-700 border-slate-300'
              }`}>
                {job.status}
              </span>
            </div>
            <p className="text-xs font-semibold text-slate-500 mt-1">
              Client: <span className="text-slate-900 font-extrabold">{job.client?.companyName || 'Unassigned Client'}</span>
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 self-start sm:self-auto">
          {/* Status Actions */}
          <JobStatusActions jobId={job.id} currentStatus={job.status} />

          <Link
            href={`/jobs/${job.id}/edit`}
            className="px-4 py-2 bg-gradient-to-r from-amber-500 via-amber-600 to-yellow-600 hover:from-amber-600 hover:to-yellow-700 text-slate-950 rounded-xl text-xs font-black transition flex items-center gap-2 shadow-md shadow-amber-500/20"
          >
            <Edit3 className="h-4 w-4" />
            Edit Mandate
          </Link>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <span className="text-[10px] uppercase font-bold text-slate-500">Total Submissions</span>
          <div className="text-2xl font-black text-slate-900 flex items-center gap-2">
            <Users className="h-5 w-5 text-amber-600" />
            {totalSubmissions}
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <span className="text-[10px] uppercase font-bold text-slate-500">Interviews Conducted</span>
          <div className="text-2xl font-black text-slate-900 flex items-center gap-2">
            <Video className="h-5 w-5 text-cyan-600" />
            {interviewsCount}
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <span className="text-[10px] uppercase font-bold text-slate-500">Placements Joined</span>
          <div className="text-2xl font-black text-slate-900 flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-emerald-600" />
            {placementsCount} / {job.headcount}
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <span className="text-[10px] uppercase font-bold text-slate-500">Compensation CTC Range</span>
          <div className="text-lg font-black text-emerald-700 flex items-center gap-1.5 pt-1">
            <DollarSign className="h-4 w-4" />
            {job.minCtcLpa ? `${Number(job.minCtcLpa)} - ${Number(job.maxCtcLpa || 0)} LPA` : 'Competitive'}
          </div>
        </div>
      </div>

      {/* Main Details & Submissions Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Mandate Info Panel */}
        <div className="lg:col-span-1 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-5 self-start">
          <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
            <Briefcase className="h-4 w-4 text-amber-600" />
            Mandate Specification
          </h3>

          <div className="space-y-3.5 text-xs text-slate-700">
            <div>
              <span className="text-slate-500 block text-[11px] font-bold uppercase">Client Company</span>
              <span className="font-extrabold text-slate-900">{job.client?.companyName || 'Unassigned'}</span>
            </div>

            <div>
              <span className="text-slate-500 block text-[11px] font-bold uppercase">Industry</span>
              <span className="font-semibold text-slate-800">{job.client?.industry || 'N/A'}</span>
            </div>

            <div>
              <span className="text-slate-500 block text-[11px] font-bold uppercase">Open Headcount</span>
              <span className="font-extrabold text-slate-900">{job.headcount} Positions</span>
            </div>

            <div>
              <span className="text-slate-500 block text-[11px] font-bold uppercase">Placement Fee</span>
              <span className="font-extrabold text-amber-700">{Number(job.feePercentage)}%</span>
            </div>

            <div>
              <span className="text-slate-500 block text-[11px] font-bold uppercase">Created Date</span>
              <span className="font-semibold text-slate-700">{new Date(job.createdAt).toLocaleString()}</span>
            </div>

            <div>
              <span className="text-slate-500 block text-[11px] font-bold uppercase">Last Updated</span>
              <span className="font-semibold text-slate-700">{new Date(job.updatedAt).toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Candidate Pipeline */}
        <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
          <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
            <Users className="h-4 w-4 text-amber-600" />
            Active Submissions Pipeline ({job.submissions.length})
          </h3>

          <div className="space-y-3 pt-1">
            {job.submissions.length > 0 ? (
              job.submissions.map((sub) => (
                <div key={sub.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h4 className="font-extrabold text-xs text-slate-900">
                      {sub.candidate.firstName} {sub.candidate.lastName}
                    </h4>
                    <p className="text-[11px] font-semibold text-slate-500 mt-0.5">
                      {sub.candidate.email} | {sub.candidate.phone}
                    </p>
                  </div>

                  <div className="flex items-center gap-3 text-xs">
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-amber-100 text-amber-950 border border-amber-300">
                      {sub.stage}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-950 border border-emerald-300">
                      {sub.slaStatus}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-8 text-center text-slate-500 text-xs font-semibold">
                No candidates submitted to this mandate yet.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
