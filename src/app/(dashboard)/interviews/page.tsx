import React from 'react';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { Calendar, Plus, Search, Filter, Video, Clock, User, Briefcase, ChevronLeft, ChevronRight, ExternalLink } from 'lucide-react';
import { InterviewStatusDropdown } from '@/components/interviews/InterviewStatusDropdown';

import { getCurrentUser } from '@/lib/rbac';

export const revalidate = 0;

interface InterviewsPageProps {
  searchParams: {
    q?: string;
    status?: string;
    type?: string;
    mode?: string;
    page?: string;
  };
}

export default async function InterviewsPage({ searchParams }: InterviewsPageProps) {
  const dbUser = await getCurrentUser();
  const agencyId = dbUser?.agencyId;

  const searchQuery = (searchParams.q || '').trim();
  const statusFilter = (searchParams.status || '').trim();
  const typeFilter = (searchParams.type || '').trim();
  const modeFilter = (searchParams.mode || '').trim();
  const currentPage = Math.max(1, parseInt(searchParams.page || '1', 10));
  const pageSize = 10;

  const whereClause: any = { agencyId };

  if (statusFilter && statusFilter !== 'ALL') {
    whereClause.status = statusFilter;
  }

  if (typeFilter && typeFilter !== 'ALL') {
    whereClause.roundType = typeFilter;
  }

  if (modeFilter && modeFilter !== 'ALL') {
    whereClause.mode = modeFilter;
  }

  if (searchQuery) {
    whereClause.submission = {
      OR: [
        { candidate: { firstName: { contains: searchQuery, mode: 'insensitive' } } },
        { candidate: { lastName: { contains: searchQuery, mode: 'insensitive' } } },
        { candidate: { email: { contains: searchQuery, mode: 'insensitive' } } },
        { job: { title: { contains: searchQuery, mode: 'insensitive' } } }
      ]
    };
  }

  const [totalCount, interviews] = await Promise.all([
    prisma.interviewSchedule.count({ where: whereClause }),
    prisma.interviewSchedule.findMany({
      where: whereClause,
      include: {
        submission: {
          include: {
            candidate: true,
            job: {
              include: { client: true }
            }
          }
        }
      },
      orderBy: { confirmedStartTime: 'asc' },
      skip: (currentPage - 1) * pageSize,
      take: pageSize
    })
  ]);

  const totalPages = Math.ceil(totalCount / pageSize) || 1;

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Calendar className="h-6 w-6 text-indigo-600" />
            Interview Management System
          </h1>
          <p className="text-xs font-semibold text-slate-600 mt-1">
            Schedule, manage status transitions, and evaluate candidate interview rounds in real time.
          </p>
        </div>

        <Link
          href="/interviews/new"
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-extrabold shadow-md shadow-indigo-600/20 interactive-hover transition-all duration-200 self-start sm:self-auto"
        >
          <Plus className="h-4 w-4" />
          Schedule New Interview
        </Link>
      </div>

      {/* Controls Bar: Search & Filters */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm shadow-slate-200/50 space-y-4">
        <form method="GET" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Search Box */}
          <div className="lg:col-span-2 relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-indigo-600" />
            <input
              type="text"
              name="q"
              defaultValue={searchQuery}
              placeholder="Search candidate name, email, job title..."
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 font-bold placeholder:text-slate-500 focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20 transition-all duration-200"
            />
          </div>

          {/* Status Filter */}
          <div>
            <select
              name="status"
              defaultValue={statusFilter}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 font-bold focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20 transition-all duration-200"
            >
              <option value="">All Statuses</option>
              <option value="SCHEDULED">SCHEDULED</option>
              <option value="CONFIRMED">CONFIRMED</option>
              <option value="RESCHEDULED">RESCHEDULED</option>
              <option value="COMPLETED">COMPLETED</option>
              <option value="CANCELLED">CANCELLED</option>
              <option value="NO_SHOW">NO_SHOW</option>
            </select>
          </div>

          {/* Round Type Filter */}
          <div>
            <select
              name="type"
              defaultValue={typeFilter}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 font-bold focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20 transition-all duration-200"
            >
              <option value="">All Round Types</option>
              <option value="HR_ROUND">HR Round</option>
              <option value="TECHNICAL_ASSESSMENT">Technical Assessment</option>
              <option value="CLIENT_ROUND_1">Client Round 1</option>
              <option value="CLIENT_ROUND_2">Client Round 2</option>
              <option value="FINAL_MANAGERIAL">Final Managerial</option>
              <option value="INTERNAL_SCREENING">Internal Screening</option>
            </select>
          </div>

          {/* Filter Submit Button */}
          <div>
            <button
              type="submit"
              className="w-full py-2 bg-slate-900 hover:bg-indigo-600 text-white rounded-xl text-xs font-extrabold flex items-center justify-center gap-1.5 interactive-hover transition-all duration-200 shadow-2xs"
            >
              <Filter className="h-3.5 w-3.5" />
              Apply Filters
            </button>
          </div>
        </form>
      </div>

      {/* Interviews Grid / List */}
      <div className="space-y-4">
        {interviews.length > 0 ? (
          interviews.map((interview) => {
            const candidate = interview.submission.candidate;
            const job = interview.submission.job;
            const scheduledTime = new Date(interview.confirmedStartTime);

            return (
              <div
                key={interview.id}
                className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm shadow-slate-200/50 hover:shadow-md hover:border-indigo-500/60 transition-all duration-200 flex flex-col md:flex-row md:items-center justify-between gap-5 group"
              >
                {/* Left Side: Info */}
                <div className="space-y-3 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-indigo-100 text-indigo-950 border border-indigo-300 uppercase tracking-wide">
                      {interview.roundType ? interview.roundType.replace('_', ' ') : 'INTERVIEW ROUND'}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-purple-100 text-purple-950 border border-purple-300 uppercase tracking-wide">
                      {interview.mode ? interview.mode.replace('_', ' ') : 'VIRTUAL'}
                    </span>
                    <span className="text-xs text-slate-700 font-bold flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5 text-indigo-600" />
                      {scheduledTime.toLocaleDateString()} at {scheduledTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} ({interview.durationMinutes} mins)
                    </span>
                  </div>

                  <div>
                    <h3 className="text-base font-extrabold text-slate-900 group-hover:text-indigo-600 transition-colors flex items-center gap-2">
                      <User className="h-4 w-4 text-indigo-600" />
                      {candidate.firstName} {candidate.lastName}
                    </h3>
                    <p className="text-xs text-slate-600 mt-0.5 flex items-center gap-2 font-semibold">
                      <Briefcase className="h-3.5 w-3.5 text-slate-500" />
                      <span className="text-slate-900 font-extrabold">{job.title}</span>
                      <span className="text-slate-400">•</span>
                      <span>{job.client?.companyName}</span>
                    </p>
                  </div>

                  {interview.meetingLink && (
                    <div className="pt-1">
                      <a
                        href={interview.meetingLink}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs text-indigo-600 hover:text-indigo-800 font-extrabold hover:underline"
                      >
                        <Video className="h-3.5 w-3.5 text-indigo-600" />
                        Join Meeting Link
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  )}

                  {interview.notes && (
                    <p className="text-xs text-slate-700 font-medium bg-slate-50 p-2.5 rounded-xl border border-slate-200 max-w-xl italic">
                      "{interview.notes}"
                    </p>
                  )}
                </div>

                {/* Right Side: Status Dropdown & Action Controls */}
                <div className="flex flex-col sm:flex-row md:flex-col items-start md:items-end gap-3 justify-between border-t md:border-t-0 border-slate-100 pt-4 md:pt-0">
                  <InterviewStatusDropdown
                    interviewId={interview.id}
                    currentStatus={interview.status}
                    currentOutcome={interview.outcome}
                  />

                  <div className="flex items-center gap-2">
                    <Link
                      href={`/interviews/${interview.id}`}
                      className="px-3.5 py-2 bg-slate-900 hover:bg-indigo-600 text-white border border-slate-800 hover:border-indigo-600 rounded-xl text-xs font-extrabold interactive-hover transition-all duration-200 shadow-2xs"
                    >
                      Details & Feedback
                    </Link>
                    <Link
                      href={`/interviews/${interview.id}/edit`}
                      className="px-3.5 py-2 bg-slate-900 hover:bg-indigo-600 text-white border border-slate-800 hover:border-indigo-600 rounded-xl text-xs font-extrabold interactive-hover transition-all duration-200 shadow-2xs"
                    >
                      Edit / Reschedule
                    </Link>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center space-y-3 shadow-2xs">
            <Calendar className="h-10 w-10 text-slate-400 mx-auto" />
            <h3 className="text-base font-extrabold text-slate-900">No Interview Schedules Found</h3>
            <p className="text-xs text-slate-600 max-w-md mx-auto font-medium">
              No interview records match your filter criteria. Click "Schedule New Interview" to arrange a round.
            </p>
            <div className="pt-2">
              <Link
                href="/interviews/new"
                className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-extrabold interactive-hover transition-all duration-200"
              >
                <Plus className="h-4 w-4" />
                Schedule Interview
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* Pagination Footer */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-4 border-t border-slate-200 text-xs text-slate-600 font-bold">
          <div>
            Showing Page <span className="font-extrabold text-slate-900">{currentPage}</span> of{' '}
            <span className="font-extrabold text-slate-900">{totalPages}</span> ({totalCount} total interviews)
          </div>
          <div className="flex items-center gap-2">
            {currentPage > 1 ? (
              <Link
                href={`/interviews?page=${currentPage - 1}&q=${searchQuery}&status=${statusFilter}`}
                className="p-2 bg-white border border-slate-300 hover:bg-slate-100 rounded-xl text-slate-800 transition-all duration-200 shadow-2xs"
              >
                <ChevronLeft className="h-4 w-4" />
              </Link>
            ) : (
              <button disabled className="p-2 bg-slate-100 border border-slate-200 rounded-xl text-slate-400 cursor-not-allowed">
                <ChevronLeft className="h-4 w-4" />
              </button>
            )}

            {currentPage < totalPages ? (
              <Link
                href={`/interviews?page=${currentPage + 1}&q=${searchQuery}&status=${statusFilter}`}
                className="p-2 bg-white border border-slate-300 hover:bg-slate-100 rounded-xl text-slate-800 transition-all duration-200 shadow-2xs"
              >
                <ChevronRight className="h-4 w-4" />
              </Link>
            ) : (
              <button disabled className="p-2 bg-slate-100 border border-slate-200 rounded-xl text-slate-400 cursor-not-allowed">
                <ChevronRight className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
