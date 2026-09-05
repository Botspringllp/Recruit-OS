import React from 'react';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { Award, Plus, Search, Filter, Calendar, ExternalLink, ChevronLeft, ChevronRight, User, Briefcase } from 'lucide-react';
import { OfferStatusDropdown } from '@/components/offers/OfferStatusDropdown';

import { getCurrentUser } from '@/lib/rbac';

export const revalidate = 0;

interface OffersPageProps {
  searchParams: {
    q?: string;
    status?: string;
    page?: string;
  };
}

export default async function OffersPage({ searchParams }: OffersPageProps) {
  const dbUser = await getCurrentUser();
  const agencyId = dbUser?.agencyId;

  const searchQuery = (searchParams.q || '').trim();
  const statusFilter = (searchParams.status || '').trim();
  const currentPage = Math.max(1, parseInt(searchParams.page || '1', 10));
  const pageSize = 10;

  const whereClause: any = { agencyId };

  if (statusFilter) {
    whereClause.status = statusFilter;
  }

  if (searchQuery) {
    whereClause.OR = [
      { submission: { candidate: { firstName: { contains: searchQuery, mode: 'insensitive' } } } },
      { submission: { candidate: { lastName: { contains: searchQuery, mode: 'insensitive' } } } },
      { submission: { candidate: { email: { contains: searchQuery, mode: 'insensitive' } } } },
      { submission: { job: { title: { contains: searchQuery, mode: 'insensitive' } } } },
      { submission: { job: { client: { companyName: { contains: searchQuery, mode: 'insensitive' } } } } }
    ];
  }

  const [totalRecords, offers] = await Promise.all([
    prisma.jobOfferAudit.count({ where: whereClause }),
    prisma.jobOfferAudit.findMany({
      where: whereClause,
      include: {
        submission: {
          include: {
            candidate: { select: { id: true, firstName: true, lastName: true, email: true, phone: true } },
            job: {
              select: {
                id: true,
                title: true,
                client: { select: { companyName: true } }
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      skip: (currentPage - 1) * pageSize,
      take: pageSize
    })
  ]);

  const totalPages = Math.ceil(totalRecords / pageSize);

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Award className="h-6 w-6 text-indigo-600" />
            Offer Management System
          </h1>
          <p className="text-xs font-semibold text-slate-600 mt-1">
            Track extended job offers, CTC structures, notice buyouts, acceptance statuses, and joining conversions.
          </p>
        </div>

        <Link
          href="/offers/new"
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-extrabold shadow-md shadow-indigo-600/20 interactive-hover transition-all duration-200 self-start sm:self-auto"
        >
          <Plus className="h-4 w-4" />
          Issue New Job Offer
        </Link>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm shadow-slate-200/50 flex flex-col sm:flex-row gap-4 justify-between items-center">
        <form method="GET" action="/offers" className="w-full sm:w-auto flex flex-col sm:flex-row gap-3 items-center flex-1">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-indigo-600" />
            <input
              type="text"
              name="q"
              defaultValue={searchQuery}
              placeholder="Search candidate, job, client..."
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 font-bold placeholder:text-slate-500 focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20 transition-all duration-200"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Filter className="h-4 w-4 text-slate-500 shrink-0" />
            <select
              name="status"
              defaultValue={statusFilter}
              className="px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 font-bold focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20 transition-all duration-200 w-full sm:w-auto"
            >
              <option value="">All Statuses</option>
              <option value="DRAFT">DRAFT</option>
              <option value="SENT">SENT</option>
              <option value="ACCEPTED">ACCEPTED</option>
              <option value="JOINED">JOINED</option>
              <option value="DECLINED">DECLINED</option>
              <option value="EXPIRED">EXPIRED</option>
              <option value="WITHDRAWN">WITHDRAWN</option>
            </select>
          </div>

          <button
            type="submit"
            className="px-4 py-2 bg-slate-900 hover:bg-indigo-600 text-white rounded-xl text-xs font-extrabold interactive-hover transition-all duration-200 shadow-2xs w-full sm:w-auto"
          >
            Apply Filters
          </button>
        </form>

        <div className="text-xs text-slate-600 font-bold whitespace-nowrap">
          Total Offers: <span className="text-slate-900 font-black">{totalRecords}</span>
        </div>
      </div>

      {/* Offers Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm shadow-slate-200/50 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 uppercase text-[10px] tracking-wider font-extrabold">
              <tr>
                <th className="py-3.5 px-4">Candidate & Requisition</th>
                <th className="py-3.5 px-4">Client Company</th>
                <th className="py-3.5 px-4">Offered CTC</th>
                <th className="py-3.5 px-4">Expected Joining</th>
                <th className="py-3.5 px-4">Offer Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-800 font-medium">
              {offers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-600 font-bold">
                    No job offer records found matching criteria.
                  </td>
                </tr>
              ) : (
                offers.map((offer) => {
                  const candidate = offer.submission.candidate;
                  const job = offer.submission.job;
                  const joiningDateStr = offer.joiningDate
                    ? new Date(offer.joiningDate).toLocaleDateString()
                    : 'N/A';

                  const fixedCtc = offer.offeredFixedCtc ? parseFloat(offer.offeredFixedCtc.toString()) : 0;
                  const variableCtc = offer.offeredVariableCtc ? parseFloat(offer.offeredVariableCtc.toString()) : 0;
                  const totalCtc = fixedCtc + variableCtc;

                  return (
                    <tr key={offer.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-extrabold text-slate-900 flex items-center gap-1.5">
                          <User className="h-3.5 w-3.5 text-indigo-600 shrink-0" />
                          <Link href={`/offers/${offer.id}`} className="hover:text-indigo-600 transition-colors">
                            {candidate.firstName} {candidate.lastName}
                          </Link>
                        </div>
                        <div className="text-[11px] text-slate-500 font-semibold flex items-center gap-1 mt-0.5">
                          <Briefcase className="h-3 w-3 text-slate-400 shrink-0" />
                          {job.title}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 font-bold text-slate-900">
                        {job.client?.companyName || 'N/A'}
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-black text-emerald-700">
                          ₹{totalCtc.toFixed(2)} LPA
                        </div>
                        <div className="text-[10px] text-slate-500 font-semibold">
                          Fixed: ₹{fixedCtc.toFixed(2)} | Var: ₹{variableCtc.toFixed(2)}
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1 text-slate-800 font-bold">
                          <Calendar className="h-3.5 w-3.5 text-indigo-600" />
                          {joiningDateStr}
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <OfferStatusDropdown offerId={offer.id} currentStatus={offer.status} />
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <Link
                          href={`/offers/${offer.id}`}
                          className="inline-flex items-center gap-1 px-3.5 py-1.5 bg-slate-900 hover:bg-indigo-600 text-white rounded-xl text-xs font-extrabold interactive-hover transition-all duration-200 shadow-2xs"
                        >
                          View Details
                          <ExternalLink className="h-3 w-3" />
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Server Pagination */}
        {totalPages > 1 && (
          <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between font-bold text-xs">
            <span className="text-slate-600">
              Page <span className="text-slate-900 font-black">{currentPage}</span> of {totalPages}
            </span>
            <div className="flex items-center gap-2">
              <Link
                href={`/offers?page=${currentPage - 1}&q=${searchQuery}&status=${statusFilter}`}
                className={`p-2 bg-white border border-slate-300 rounded-xl text-slate-800 transition-all duration-200 shadow-2xs ${
                  currentPage <= 1 ? 'pointer-events-none opacity-40' : 'hover:bg-slate-100'
                }`}
              >
                <ChevronLeft className="h-4 w-4" />
              </Link>
              <Link
                href={`/offers?page=${currentPage + 1}&q=${searchQuery}&status=${statusFilter}`}
                className={`p-2 bg-white border border-slate-300 rounded-xl text-slate-800 transition-all duration-200 shadow-2xs ${
                  currentPage >= totalPages ? 'pointer-events-none opacity-40' : 'hover:bg-slate-100'
                }`}
              >
                <ChevronRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
