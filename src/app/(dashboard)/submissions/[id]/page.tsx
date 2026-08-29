import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { User, Briefcase, Building2, Clock, ArrowLeft, Activity, Mail, Phone, MapPin } from 'lucide-react';
import { prisma } from '@/lib/prisma';
import { SubmissionStageSelector } from '@/components/submissions/SubmissionStageSelector';
import { calculateSlaStatus } from '@/lib/sla';

export const revalidate = 0;

interface SubmissionDetailPageProps {
  params: {
    id: string;
  };
}

export default async function SubmissionDetailPage({ params }: SubmissionDetailPageProps) {
  const demoAgency = await prisma.agency.findFirst({
    where: { subdomain: 'demo' },
    select: { id: true }
  }).catch(() => null);
  const agencyId = demoAgency?.id;

  const submission = await prisma.candidateSubmission.findFirst({
    where: {
      id: params.id,
      agencyId
    },
    include: {
      candidate: true,
      job: { include: { client: true } },
      slaLogs: {
        orderBy: { createdAt: 'desc' }
      }
    }
  }).catch(() => null);

  if (!submission) {
    notFound();
  }

  const currentSla = calculateSlaStatus(submission.createdAt, submission.updatedAt);

  return (
    <div className="space-y-6 pb-12">
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-5">
        <div className="flex items-center gap-3">
          <Link
            href="/submissions"
            className="p-2 bg-slate-900 border border-slate-800 rounded-xl text-slate-400 hover:text-white transition"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-white tracking-tight">
                {submission.candidate.firstName} {submission.candidate.lastName}
              </h1>
              <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                currentSla === 'HEALTHY' || currentSla === 'ON_TRACK'
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                  : currentSla === 'AT_RISK'
                  ? 'bg-amber-500/10 text-amber-300 border-amber-500/20'
                  : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
              }`}>
                SLA: {currentSla}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Requisition: <span className="text-slate-200 font-semibold">{submission.job.title}</span> ({submission.job.client?.companyName})
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 self-start sm:self-auto">
          <span className="text-xs text-slate-400">Current Stage:</span>
          <SubmissionStageSelector submissionId={submission.id} currentStage={submission.stage} />
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Candidate & Job Details */}
        <div className="space-y-6 lg:col-span-1">
          {/* Candidate Card */}
          <div className="glass-panel p-5 rounded-2xl border border-slate-800/80 space-y-4">
            <h3 className="font-semibold text-xs text-white uppercase tracking-wider flex items-center gap-2 border-b border-slate-800/60 pb-3">
              <User className="h-4 w-4 text-brand-400" />
              Candidate Profile
            </h3>
            <div className="space-y-3 text-xs text-slate-300">
              <div className="flex items-center gap-2">
                <Mail className="h-3.5 w-3.5 text-cyan-400" />
                <span className="truncate">{submission.candidate.email}</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="h-3.5 w-3.5 text-emerald-400" />
                <span>{submission.candidate.phone}</span>
              </div>
              <div className="flex items-center gap-2">
                <Building2 className="h-3.5 w-3.5 text-slate-400" />
                <span>{submission.candidate.currentCompany || 'N/A'}</span>
              </div>
              <div className="flex items-center gap-2">
                <Briefcase className="h-3.5 w-3.5 text-indigo-400" />
                <span>{submission.candidate.currentDesignation || 'N/A'}</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="h-3.5 w-3.5 text-rose-400" />
                <span>{submission.candidate.currentLocation || 'N/A'}</span>
              </div>
            </div>
            <div className="pt-2 border-t border-slate-800/60">
              <Link href={`/candidates/${submission.candidate.id}`} className="text-xs font-semibold text-brand-400 hover:underline">
                View Full Candidate Record →
              </Link>
            </div>
          </div>

          {/* Job Mandate Card */}
          <div className="glass-panel p-5 rounded-2xl border border-slate-800/80 space-y-4">
            <h3 className="font-semibold text-xs text-white uppercase tracking-wider flex items-center gap-2 border-b border-slate-800/60 pb-3">
              <Briefcase className="h-4 w-4 text-indigo-400" />
              Mandate Specifications
            </h3>
            <div className="space-y-3 text-xs text-slate-300">
              <div>
                <span className="text-slate-400 text-[11px] block">Position Title</span>
                <span className="font-semibold text-white">{submission.job.title}</span>
              </div>
              <div>
                <span className="text-slate-400 text-[11px] block">Client Company</span>
                <span>{submission.job.client?.companyName || 'N/A'}</span>
              </div>
              <div>
                <span className="text-slate-400 text-[11px] block">Fee Percentage</span>
                <span className="font-semibold text-purple-300">{Number(submission.job.feePercentage)}%</span>
              </div>
            </div>
            <div className="pt-2 border-t border-slate-800/60">
              <Link href={`/jobs/${submission.job.id}`} className="text-xs font-semibold text-indigo-400 hover:underline">
                View Full Job Requisition →
              </Link>
            </div>
          </div>
        </div>

        {/* Right Column: Activity Timeline & SLA Audit Log */}
        <div className="lg:col-span-2 glass-panel p-6 rounded-2xl border border-slate-800/80 space-y-5">
          <h3 className="font-semibold text-sm text-white flex items-center gap-2 border-b border-slate-800/60 pb-3">
            <Activity className="h-4 w-4 text-brand-400" />
            Candidate Pipeline Activity & SLA Watchdog Log ({submission.slaLogs.length})
          </h3>

          <div className="space-y-4 pt-1">
            {submission.slaLogs.length > 0 ? (
              submission.slaLogs.map((log) => (
                <div key={log.id} className="p-4 bg-slate-900/60 rounded-xl border border-slate-800/60 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-brand-500/10 text-brand-400 border border-brand-500/20">
                      Stage: {log.newStage}
                    </span>
                    <span className="text-[11px] text-slate-400 flex items-center gap-1">
                      <Clock className="h-3 w-3 text-slate-500" />
                      {new Date(log.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-300">
                    SLA Status at Transition: <span className="font-semibold text-brand-300">{log.slaStatusAtTransition}</span>
                  </div>
                  <div className="text-[10px] text-slate-500">
                    Hours Elapsed in Stage: <span className="text-slate-400">{log.timeInStageHours} hrs</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-8 text-center text-slate-400 text-xs">
                No activity events recorded yet.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
