import React from 'react';
import Link from 'next/link';
import { Users, Search, Plus, ArrowUpRight, ChevronLeft, ChevronRight, Edit3 } from 'lucide-react';
import { prisma } from '@/lib/prisma';
import { DeleteCandidateButton } from '@/components/candidates/DeleteCandidateButton';

export const revalidate = 0;

interface CandidatesPageProps {
  searchParams?: {
    q?: string;
    page?: string;
  };
}

export default async function CandidatesPage({ searchParams }: CandidatesPageProps) {
  const query = (searchParams?.q || '').trim();
  const currentPage = Math.max(1, parseInt(searchParams?.page || '1', 10) || 1);
  const pageSize = 10;
  const skip = (currentPage - 1) * pageSize;

  const demoAgency = await prisma.agency.findFirst({
    where: { subdomain: 'demo' },
    select: { id: true }
  }).catch(() => null);
  const agencyId = demoAgency?.id;

  const whereClause: any = {
    agencyId,
    deletedAt: null
  };

  if (query) {
    whereClause.OR = [
      { firstName: { contains: query, mode: 'insensitive' } },
      { lastName: { contains: query, mode: 'insensitive' } },
      { email: { contains: query, mode: 'insensitive' } },
      { phone: { contains: query, mode: 'insensitive' } },
      { currentCompany: { contains: query, mode: 'insensitive' } },
      { currentDesignation: { contains: query, mode: 'insensitive' } }
    ];
  }

  const [totalCandidates, candidateList] = await Promise.all([
    prisma.candidateRecord.count({ where: whereClause }).catch(() => 0),
    prisma.candidateRecord.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      skip,
      take: pageSize,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        currentCompany: true,
        currentDesignation: true,
        totalExperienceYears: true,
        currentLocation: true,
        source: true,
        createdAt: true
      }
    }).catch(() => [])
  ]);

  const totalPages = Math.ceil(totalCandidates / pageSize) || 1;

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <Users className="h-6 w-6 text-indigo-600" />
            Candidate Repository
          </h1>
          <p className="text-xs font-semibold text-slate-600 mt-1">
            Centralized talent pipeline & active candidate profiles ({totalCandidates} total candidates)
          </p>
        </div>

        <Link
          href="/candidates/new"
          className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-extrabold shadow-md shadow-indigo-600/20 interactive-hover flex items-center gap-2 self-start sm:self-auto"
        >
          <Plus className="h-4 w-4" />
          Add Candidate
        </Link>
      </div>

      {/* Candidate List Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm shadow-slate-200/50 overflow-hidden">
        {/* Search Bar */}
        <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <form method="GET" action="/candidates" className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-indigo-600" />
            <input
              type="text"
              name="q"
              defaultValue={query}
              placeholder="Search name, email, phone, company..."
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 font-bold placeholder:text-slate-500 focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20 transition-all duration-200"
            />
          </form>
          <span className="text-xs font-bold text-slate-600">
            Showing {candidateList.length > 0 ? skip + 1 : 0}-{skip + candidateList.length} of {totalCandidates}
          </span>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-800">
            <thead className="bg-slate-50 border-b border-slate-200 text-[11px] uppercase tracking-wider text-slate-700 font-extrabold">
              <tr>
                <th className="py-3.5 px-4">Candidate Name</th>
                <th className="py-3.5 px-4">Current Role & Company</th>
                <th className="py-3.5 px-4">Experience</th>
                <th className="py-3.5 px-4">Location</th>
                <th className="py-3.5 px-4">Source</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {candidateList.length > 0 ? (
                candidateList.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3.5 px-4 font-extrabold text-slate-900">
                      <Link href={`/candidates/${c.id}`} className="hover:text-indigo-600 transition-colors">
                        {c.firstName} {c.lastName}
                      </Link>
                      <div className="text-[10px] font-semibold text-slate-500">{c.email} | {c.phone}</div>
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-900">
                      {c.currentDesignation || 'Candidate'}
                      <div className="text-[10px] text-slate-500 font-semibold">{c.currentCompany || 'N/A'}</div>
                    </td>
                    <td className="py-3.5 px-4 font-extrabold text-slate-900">
                      {c.totalExperienceYears ? `${Number(c.totalExperienceYears)} Yrs` : 'N/A'}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-700">{c.currentLocation || 'N/A'}</td>
                    <td className="py-3.5 px-4">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-indigo-100 text-indigo-950 border border-indigo-300">
                        {c.source}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Link
                          href={`/candidates/${c.id}`}
                          title="View candidate details"
                          className="p-1.5 rounded-lg bg-slate-100 hover:bg-indigo-600 text-slate-700 hover:text-white transition-all duration-200"
                        >
                          <ArrowUpRight className="h-4 w-4" />
                        </Link>

                        <Link
                          href={`/candidates/${c.id}/edit`}
                          title="Edit candidate profile"
                          className="p-1.5 rounded-lg bg-slate-100 hover:bg-amber-500 text-slate-700 hover:text-slate-950 transition-all duration-200"
                        >
                          <Edit3 className="h-4 w-4" />
                        </Link>

                        <DeleteCandidateButton
                          candidateId={c.id}
                          candidateName={`${c.firstName} ${c.lastName}`}
                        />
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-slate-600 font-bold">
                    No candidate records found matching your search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Server-Side Pagination */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-slate-200 flex items-center justify-between text-xs font-bold">
            <span className="text-slate-600">
              Page <span className="font-black text-slate-900">{currentPage}</span> of{' '}
              <span className="font-black text-slate-900">{totalPages}</span>
            </span>

            <div className="flex items-center gap-2">
              {currentPage > 1 ? (
                <Link
                  href={`/candidates?page=${currentPage - 1}${query ? `&q=${encodeURIComponent(query)}` : ''}`}
                  className="px-3.5 py-1.5 bg-white border border-slate-300 text-slate-800 hover:bg-slate-100 rounded-lg flex items-center gap-1 transition-all duration-200 shadow-2xs"
                >
                  <ChevronLeft className="h-4 w-4" /> Previous
                </Link>
              ) : (
                <span className="px-3.5 py-1.5 bg-slate-100 border border-slate-200 text-slate-400 rounded-lg flex items-center gap-1 cursor-not-allowed">
                  <ChevronLeft className="h-4 w-4" /> Previous
                </span>
              )}

              {currentPage < totalPages ? (
                <Link
                  href={`/candidates?page=${currentPage + 1}${query ? `&q=${encodeURIComponent(query)}` : ''}`}
                  className="px-3.5 py-1.5 bg-white border border-slate-300 text-slate-800 hover:bg-slate-100 rounded-lg flex items-center gap-1 transition-all duration-200 shadow-2xs"
                >
                  Next <ChevronRight className="h-4 w-4" />
                </Link>
              ) : (
                <span className="px-3.5 py-1.5 bg-slate-100 border border-slate-200 text-slate-400 rounded-lg flex items-center gap-1 cursor-not-allowed">
                  Next <ChevronRight className="h-4 w-4" />
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
