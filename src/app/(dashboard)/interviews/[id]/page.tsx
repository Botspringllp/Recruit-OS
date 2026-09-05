import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { Calendar, ArrowLeft, User, Briefcase, Video, Clock, Building2, ExternalLink, Edit, FileText } from 'lucide-react';
import { InterviewStatusDropdown } from '@/components/interviews/InterviewStatusDropdown';

import { getCurrentUser, hasPermission } from '@/lib/rbac';
import { redirect } from 'next/navigation';

export const revalidate = 0;

interface InterviewDetailPageProps {
  params: {
    id: string;
  };
}

export default async function InterviewDetailPage({ params }: InterviewDetailPageProps) {
  const dbUser = await getCurrentUser();
  if (!dbUser || !hasPermission(dbUser, 'interview.view')) {
    redirect('/403');
  }

  const agencyId = dbUser?.agencyId;

  const interview = await prisma.interviewSchedule.findFirst({
    where: { id: params.id, agencyId },
    include: {
      submission: {
        include: {
          candidate: true,
          job: { include: { client: true } }
        }
      }
    }
  }).catch(() => null);

  if (!interview) {
    notFound();
  }

  const candidate = interview.submission.candidate;
  const job = interview.submission.job;
  const scheduledTime = new Date(interview.confirmedStartTime);

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-5">
        <div className="flex items-center gap-3">
          <Link
            href="/interviews"
            className="p-2 bg-slate-900 border border-slate-800 rounded-xl text-slate-400 hover:text-white transition"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-white tracking-tight">
                {candidate.firstName} {candidate.lastName}
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 uppercase">
                {interview.roundType ? interview.roundType.replace('_', ' ') : 'INTERVIEW ROUND'}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Job Requisition: <span className="text-slate-200 font-semibold">{job.title}</span> ({job.client?.companyName})
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 self-start sm:self-auto">
          <InterviewStatusDropdown
            interviewId={interview.id}
            currentStatus={interview.status}
            currentOutcome={interview.outcome}
          />
          <Link
            href={`/interviews/${interview.id}/edit`}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold transition"
          >
            <Edit className="h-3.5 w-3.5" />
            Edit / Reschedule
          </Link>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Details Cards */}
        <div className="space-y-6 lg:col-span-1">
          {/* Schedule Info Card */}
          <div className="glass-panel p-5 rounded-2xl border border-slate-800/80 space-y-4">
            <h3 className="font-semibold text-xs text-white uppercase tracking-wider flex items-center gap-2 border-b border-slate-800/60 pb-3">
              <Calendar className="h-4 w-4 text-emerald-400" />
              Schedule Specifications
            </h3>
            <div className="space-y-3 text-xs text-slate-300">
              <div>
                <span className="text-slate-400 text-[11px] block">Date & Time</span>
                <span className="font-bold text-white text-sm">
                  {scheduledTime.toLocaleDateString()} at {scheduledTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <div>
                <span className="text-slate-400 text-[11px] block">Duration</span>
                <span>{interview.durationMinutes} Minutes</span>
              </div>
              <div>
                <span className="text-slate-400 text-[11px] block">Interview Mode</span>
                <span className="font-semibold text-purple-300">
                  {interview.mode ? interview.mode.replace('_', ' ') : 'VIRTUAL'}
                </span>
              </div>
              {interview.meetingLink && (
                <div>
                  <span className="text-slate-400 text-[11px] block">Meeting Link</span>
                  <a
                    href={interview.meetingLink}
                    target="_blank"
                    rel="noreferrer"
                    className="text-cyan-400 hover:underline flex items-center gap-1 mt-0.5"
                  >
                    <Video className="h-3.5 w-3.5" />
                    Join Online Meeting
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* Candidate Card */}
          <div className="glass-panel p-5 rounded-2xl border border-slate-800/80 space-y-4">
            <h3 className="font-semibold text-xs text-white uppercase tracking-wider flex items-center gap-2 border-b border-slate-800/60 pb-3">
              <User className="h-4 w-4 text-brand-400" />
              Candidate Profile
            </h3>
            <div className="space-y-2.5 text-xs text-slate-300">
              <p className="font-semibold text-white">{candidate.firstName} {candidate.lastName}</p>
              <p className="text-slate-400">{candidate.email}</p>
              <p className="text-slate-400">{candidate.phone}</p>
            </div>
            <div className="pt-2 border-t border-slate-800/60">
              <Link href={`/candidates/${candidate.id}`} className="text-xs font-semibold text-brand-400 hover:underline">
                View Full Candidate Record →
              </Link>
            </div>
          </div>
        </div>

        {/* Right Column: Recruiter Notes & Pipeline Integration Status */}
        <div className="lg:col-span-2 space-y-6">
          <div className="glass-panel p-6 rounded-2xl border border-slate-800/80 space-y-4">
            <h3 className="font-semibold text-sm text-white flex items-center gap-2 border-b border-slate-800/60 pb-3">
              <FileText className="h-4 w-4 text-brand-400" />
              Recruiter Preparation & Interview Notes
            </h3>
            <div className="p-4 bg-slate-900/60 rounded-xl border border-slate-800/60 text-xs text-slate-300 whitespace-pre-wrap leading-relaxed">
              {interview.notes || 'No interview preparation notes provided.'}
            </div>
          </div>

          <div className="glass-panel p-6 rounded-2xl border border-slate-800/80 space-y-4">
            <h3 className="font-semibold text-sm text-white flex items-center gap-2 border-b border-slate-800/60 pb-3">
              <Briefcase className="h-4 w-4 text-indigo-400" />
              Candidate Submission Pipeline Linkage
            </h3>
            <div className="flex items-center justify-between p-4 bg-slate-900/60 rounded-xl border border-slate-800/60 text-xs">
              <div>
                <span className="text-slate-400 block text-[11px]">Current Pipeline Stage</span>
                <span className="font-bold text-white text-sm">{interview.submission.stage}</span>
              </div>
              <Link
                href={`/submissions/${interview.submission.id}`}
                className="px-4 py-2 bg-brand-500/10 hover:bg-brand-500/20 border border-brand-500/30 text-brand-400 font-semibold rounded-xl transition"
              >
                View Pipeline Record →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
