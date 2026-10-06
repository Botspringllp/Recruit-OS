import React from 'react';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { Calendar, ArrowLeft, User, Briefcase, Video, Clock, ExternalLink, Edit, FileText } from 'lucide-react';
import { InterviewStatusDropdown } from '@/components/interviews/InterviewStatusDropdown';
import { DeleteInterviewButton } from '@/components/interviews/DeleteInterviewButton';
import { getCurrentUser, hasPermission } from '@/lib/rbac';

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
  const hasConfirmedTime = Boolean(interview.confirmedStartTime);
  const scheduledTime = hasConfirmedTime ? new Date(interview.confirmedStartTime!) : null;

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div className="flex items-center gap-3">
          <Link
            href="/interviews"
            className="p-2 bg-white border border-slate-300 rounded-xl text-slate-700 hover:text-indigo-600 hover:bg-slate-100 transition shadow-2xs"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                {candidate.firstName} {candidate.lastName}
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-indigo-100 text-indigo-950 border border-indigo-300 uppercase">
                {interview.roundType ? interview.roundType.replace('_', ' ') : 'INTERVIEW ROUND'}
              </span>
            </div>
            <p className="text-xs font-semibold text-slate-600 mt-1">
              Job Requisition: <span className="text-slate-900 font-extrabold">{job.title}</span> ({job.client?.companyName})
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
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-indigo-600 text-white rounded-xl text-xs font-extrabold transition shadow-2xs"
          >
            <Edit className="h-3.5 w-3.5" />
            Edit / Reschedule
          </Link>
          <DeleteInterviewButton
            interviewId={interview.id}
            candidateName={`${candidate.firstName} ${candidate.lastName}`}
          />
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Details Cards */}
        <div className="space-y-6 lg:col-span-1">
          {/* Schedule Info Card */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm shadow-slate-200/50 space-y-4">
            <h3 className="font-extrabold text-xs text-slate-900 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-3">
              <Calendar className="h-4 w-4 text-indigo-600" />
              Schedule Specifications
            </h3>
            <div className="space-y-3 text-xs text-slate-700 font-bold">
              <div>
                <span className="text-slate-600 text-[11px] block font-semibold">Date & Time</span>
                <span className="font-black text-slate-900 text-sm">
                  {scheduledTime
                    ? `${scheduledTime.toLocaleDateString()} at ${scheduledTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                    : 'Awaiting Candidate Slot Selection'}
                </span>
              </div>
              <div>
                <span className="text-slate-600 text-[11px] block font-semibold">Duration</span>
                <span>{interview.durationMinutes} Minutes</span>
              </div>
              <div>
                <span className="text-slate-600 text-[11px] block font-semibold">Interview Mode</span>
                <span className="font-extrabold text-purple-700">
                  {interview.mode ? interview.mode.replace('_', ' ') : 'VIRTUAL'}
                </span>
              </div>
              {interview.meetingLink && (
                <div>
                  <span className="text-slate-600 text-[11px] block font-semibold">Meeting Link</span>
                  <a
                    href={interview.meetingLink}
                    target="_blank"
                    rel="noreferrer"
                    className="text-indigo-600 hover:text-indigo-800 font-extrabold flex items-center gap-1 mt-0.5 hover:underline"
                  >
                    <Video className="h-3.5 w-3.5 text-indigo-600" />
                    Join Online Meeting
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* Candidate Card */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm shadow-slate-200/50 space-y-4">
            <h3 className="font-extrabold text-xs text-slate-900 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-3">
              <User className="h-4 w-4 text-indigo-600" />
              Candidate Profile
            </h3>
            <div className="space-y-2 text-xs text-slate-700 font-semibold">
              <p className="font-black text-slate-900 text-sm">{candidate.firstName} {candidate.lastName}</p>
              <p className="text-slate-600">{candidate.email}</p>
              <p className="text-slate-600">{candidate.phone}</p>
            </div>
            <div className="pt-2 border-t border-slate-100">
              <Link href={`/candidates/${candidate.id}`} className="text-xs font-extrabold text-indigo-600 hover:text-indigo-800 hover:underline">
                View Full Candidate Record →
              </Link>
            </div>
          </div>
        </div>

        {/* Right Column: Recruiter Notes & Pipeline Integration Status */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm shadow-slate-200/50 space-y-4">
            <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
              <FileText className="h-4 w-4 text-indigo-600" />
              Recruiter Preparation & Interview Notes
            </h3>
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-900 font-medium whitespace-pre-wrap leading-relaxed">
              {interview.notes || 'No interview preparation notes provided.'}
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm shadow-slate-200/50 space-y-4">
            <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
              <Briefcase className="h-4 w-4 text-indigo-600" />
              Candidate Submission Pipeline Linkage
            </h3>
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs">
              <div>
                <span className="text-slate-600 block text-[11px] font-semibold">Current Pipeline Stage</span>
                <span className="font-black text-slate-900 text-sm">{interview.submission.stage}</span>
              </div>
              <Link
                href={`/submissions/${interview.submission.id}`}
                className="px-4 py-2 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-700 font-extrabold rounded-xl transition"
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
