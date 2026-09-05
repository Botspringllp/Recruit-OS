import React from 'react';
import Link from 'next/link';
import { Briefcase, Search, Filter, Plus, Building2, Users, ArrowUpRight, ChevronLeft, ChevronRight, Edit3 } from 'lucide-react';
import { prisma } from '@/lib/prisma';
import { MandateStatus } from '@prisma/client';

import { getCurrentUser } from '@/lib/rbac';

export const revalidate = 0;

interface JobsPageProps {
  searchParams?: {
    q?: string;
    status?: string;
    sort?: string;
    page?: string;
  };
}

export default async function JobsPage({ searchParams }: JobsPageProps) {
  const query = (searchParams?.q || '').trim();
  const statusFilter = (searchParams?.status || 'ALL').toUpperCase();
  const sortOption = searchParams?.sort || 'newest';
  const currentPage = Math.max(1, parseInt(searchParams?.page || '1', 10) || 1);
  const pageSize = 10;
  const skip = (currentPage - 1) * pageSize;

  const dbUser = await getCurrentUser();
  const agencyId = dbUser?.agencyId;

  const whereClause: any = { agencyId };

  if (statusFilter !== 'ALL' && Object.values(MandateStatus).includes(statusFilter as MandateStatus)) {
    whereClause.status = statusFilter as MandateStatus;
  }

  if (query) {
    whereClause.OR = [
      { title: { contains: query, mode: 'insensitive' } },
      { client: { companyName: { contains: query, mode: 'insensitive' } } }
    ];
  }

  let orderBy: any = { createdAt: 'desc' };
  if (sortOption === 'oldest') {
    orderBy = { createdAt: 'asc' };
  } else if (sortOption === 'priority') {
    orderBy = { headcount: 'desc' };
  }

  const [totalJobs, jobList] = await Promise.all([
    prisma.jobMandate.count({ where: whereClause }).catch(() => 0),
    prisma.jobMandate.findMany({
      where: whereClause,
      orderBy,
      skip,
      take: pageSize,
      include: {
        client: { select: { companyName: true } },
        submissions: { select: { id: true } }
      }
    }).catch(() => [])
  ]);

  const totalPages = Math.ceil(totalJobs / pageSize) || 1;
  const statusOptions = ['ALL', 'DRAFT', 'OPEN', 'ACTIVE', 'ON_HOLD', 'PAUSED', 'FILLED', 'CLOSED', 'CANCELLED'];

  return (
    <div className="space-y-6 pb-12 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <Briefcase className="h-6 w-6 text-amber-500" />
            Job Mandates
          </h1>
          <p className="text-xs font-semibold text-slate-500 mt-1">
            Client hiring requisitions & recruitment execution ({totalJobs} total mandates)
          </p>
        </div>

        <Link
          href="/jobs/new"
          className="px-4 py-2.5 bg-gradient-to-r from-amber-500 via-amber-600 to-yellow-600 hover:from-amber-600 hover:to-yellow-700 text-slate-950 rounded-xl text-xs font-black shadow-md shadow-amber-500/20 flex items-center gap-2 self-start sm:self-auto transition-all"
        >
          <Plus className="h-4 w-4 stroke-[3]" />
          Create Mandate
        </Link>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs">
        <form method="GET" action="/jobs" className="flex flex-wrap items-center gap-3 flex-1">
          <div className="relative flex-1 min-w-[200px] max-w-xs">
            <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-amber-500" />
            <input
              type="text"
              name="q"
              defaultValue={query}
              placeholder="Search title, company..."
              className="w-full pl-9 pr-4 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 font-bold placeholder:text-slate-400 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all duration-200"
            />
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1.5">
            <Filter className="h-3.5 w-3.5 text-slate-500" />
            <select
              name="status"
              defaultValue={statusFilter}
              className="px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 font-bold focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all duration-200"
            >
              {statusOptions.map((st) => (
                <option key={st} value={st}>
                  {st === 'ALL' ? 'All Statuses' : st}
                </option>
              ))}
            </select>
          </div>

          {/* Sort Filter */}
          <select
            name="sort"
            defaultValue={sortOption}
            className="px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 font-bold focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all duration-200"
          >
            <option value="newest">Sort: Newest</option>
            <option value="oldest">Sort: Oldest</option>
            <option value="priority">Sort: Headcount Priority</option>
          </select>

          <button
            type="submit"
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-extrabold transition-all duration-200"
          >
            Filter
          </button>
        </form>

        <span className="text-xs text-slate-500 font-bold shrink-0">
          Showing {jobList.length > 0 ? skip + 1 : 0}-{skip + jobList.length} of {totalJobs}
        </span>
      </div>

      {/* Mandate Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {jobList.length > 0 ? (
          jobList.map((job) => (
            <div key={job.id} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:shadow-md hover:border-amber-300 transition-all duration-200 flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <Link href={`/jobs/${job.id}`} className="font-extrabold text-sm text-slate-900 hover:text-amber-600 transition-colors line-clamp-1">
                      {job.title}
                    </Link>
                    <div className="flex items-center gap-1.5 text-xs text-slate-500 font-semibold mt-1">
                      <Building2 className="h-3.5 w-3.5 text-amber-600 shrink-0" />
                      <span className="truncate">{job.client?.companyName || 'Unassigned Client'}</span>
                    </div>
                  </div>
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border shrink-0 ${
                    job.status === 'ACTIVE' || job.status === 'OPEN'
                      ? 'bg-emerald-100 text-emerald-950 border-emerald-300'
                      : job.status === 'PAUSED' || job.status === 'ON_HOLD'
                      ? 'bg-amber-100 text-amber-950 border-amber-300'
                      : 'bg-slate-100 text-slate-700 border-slate-300'
                  }`}>
                    {job.status}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-500 block uppercase font-bold">Submissions</span>
                    <span className="font-extrabold text-slate-900 flex items-center gap-1">
                      <Users className="h-3.5 w-3.5 text-amber-600" />
                      {job.submissions.length} Candidates
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block uppercase font-bold">Headcount</span>
                    <span className="font-extrabold text-slate-900">{job.headcount} Openings</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs">
                <span className="text-[11px] text-slate-700 font-bold">
                  {job.minCtcLpa ? `${Number(job.minCtcLpa)}-${Number(job.maxCtcLpa || 0)} LPA` : 'Competitive'}
                </span>

                <div className="flex items-center gap-1">
                  <Link
                    href={`/jobs/${job.id}`}
                    className="p-1.5 rounded-lg bg-slate-100 hover:bg-amber-500 text-slate-700 hover:text-slate-950 transition-all duration-200"
                    title="View Mandate Details"
                  >
                    <ArrowUpRight className="h-4 w-4" />
                  </Link>

                  <Link
                    href={`/jobs/${job.id}/edit`}
                    className="p-1.5 rounded-lg bg-slate-100 hover:bg-amber-500 text-slate-700 hover:text-slate-950 transition-all duration-200"
                    title="Edit Mandate"
                  >
                    <Edit3 className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full py-12 text-center text-slate-500 bg-white border border-slate-200 rounded-3xl text-xs font-bold shadow-sm">
            No job mandates found matching your search and filter criteria.
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="p-4 border-t border-slate-200 flex items-center justify-between text-xs">
          <span className="text-slate-500 font-bold">
            Page <span className="font-extrabold text-slate-900">{currentPage}</span> of{' '}
            <span className="font-extrabold text-slate-900">{totalPages}</span>
          </span>

          <div className="flex items-center gap-2">
            {currentPage > 1 ? (
              <Link
                href={`/jobs?page=${currentPage - 1}${query ? `&q=${encodeURIComponent(query)}` : ''}${statusFilter !== 'ALL' ? `&status=${statusFilter}` : ''}&sort=${sortOption}`}
                className="px-3.5 py-1.5 bg-white border border-slate-300 text-slate-800 hover:bg-slate-50 font-bold rounded-xl flex items-center gap-1 transition-all duration-200"
              >
                <ChevronLeft className="h-4 w-4" /> Previous
              </Link>
            ) : (
              <span className="px-3.5 py-1.5 bg-slate-100 border border-slate-200 text-slate-400 font-bold rounded-xl flex items-center gap-1 cursor-not-allowed">
                <ChevronLeft className="h-4 w-4" /> Previous
              </span>
            )}

            {currentPage < totalPages ? (
              <Link
                href={`/jobs?page=${currentPage + 1}${query ? `&q=${encodeURIComponent(query)}` : ''}${statusFilter !== 'ALL' ? `&status=${statusFilter}` : ''}&sort=${sortOption}`}
                className="px-3.5 py-1.5 bg-white border border-slate-300 text-slate-800 hover:bg-slate-50 font-bold rounded-xl flex items-center gap-1 transition-all duration-200"
              >
                Next <ChevronRight className="h-4 w-4" />
              </Link>
            ) : (
              <span className="px-3.5 py-1.5 bg-slate-100 border border-slate-200 text-slate-400 font-bold rounded-xl flex items-center gap-1 cursor-not-allowed">
                Next <ChevronRight className="h-4 w-4" />
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
