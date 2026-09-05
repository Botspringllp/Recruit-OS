import React from 'react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { getCurrentUser, hasPermission } from '@/lib/rbac';
import { logger } from '@/lib/logger';
import { ComplianceKpiCards } from '@/components/compliance/ComplianceKpiCards';
import { ComplianceStatusDropdown } from '@/components/compliance/ComplianceStatusDropdown';

interface SearchParams {
  query?: string;
  category?: string;
  status?: string;
  candidateId?: string;
  page?: string;
}

export default async function ComplianceDashboardPage({
  searchParams
}: {
  searchParams: SearchParams;
}) {
  const currentUser = await getCurrentUser();
  if (!hasPermission(currentUser, 'compliance.view')) {
    logger.warn({
      event: 'ACCESS_DENIED_PAGE_REDIRECT',
      userId: currentUser?.id || 'ANONYMOUS',
      agencyId: currentUser?.agencyId || 'GLOBAL',
      page: '/compliance',
      requiredPermission: 'compliance.view'
    }, '🚫 [ACCESS_DENIED] Unauthorized page access redirected to /403');
    redirect('/403');
  }

  const agencyId = currentUser?.agencyId || '';

  const query = searchParams.query || '';
  const category = searchParams.category || '';
  const statusFilter = searchParams.status || '';
  const candidateFilter = searchParams.candidateId || '';
  const currentPage = parseInt(searchParams.page || '1', 10);
  const pageSize = 10;

  const where: any = {
    agencyId,
    deletedAt: null
  };

  if (category) {
    where.documentCategory = category;
  }

  if (statusFilter) {
    where.status = statusFilter;
  }

  if (candidateFilter) {
    where.candidateId = candidateFilter;
  }

  if (query) {
    where.OR = [
      { fileName: { contains: query, mode: 'insensitive' } },
      { notes: { contains: query, mode: 'insensitive' } },
      { candidate: { firstName: { contains: query, mode: 'insensitive' } } },
      { candidate: { lastName: { contains: query, mode: 'insensitive' } } }
    ];
  }

  const [totalCount, docs] = await Promise.all([
    prisma.candidateComplianceDoc.count({ where }),
    prisma.candidateComplianceDoc.findMany({
      where,
      include: {
        candidate: {
          select: { id: true, firstName: true, lastName: true, email: true }
        }
      },
      orderBy: { createdAt: 'desc' },
      skip: (currentPage - 1) * pageSize,
      take: pageSize
    })
  ]);

  const [allDocs, candidatesCount] = await Promise.all([
    prisma.candidateComplianceDoc.findMany({
      where: { agencyId, deletedAt: null },
      select: { status: true, isVerified: true, expiryDate: true, candidateId: true }
    }),
    prisma.candidateRecord.count({ where: { agencyId, deletedAt: null } })
  ]);

  const totalDocs = allDocs.length;
  const pendingCount = allDocs.filter((d) => d.status === 'PENDING' || d.status === 'SUBMITTED' || d.status === 'UNDER_REVIEW').length;
  const verifiedCount = allDocs.filter((d) => d.status === 'VERIFIED' && d.isVerified).length;
  const now = new Date();
  const expiredCount = allDocs.filter(
    (d) => d.status === 'EXPIRED' || (d.expiryDate && new Date(d.expiryDate) < now)
  ).length;

  const verificationRate = totalDocs > 0 ? Math.round((verifiedCount / totalDocs) * 100) : 0;

  const candidateDocsMap = new Map<string, string[]>();
  allDocs.forEach((d) => {
    if (d.candidateId) {
      const arr = candidateDocsMap.get(d.candidateId) || [];
      if (d.status === 'VERIFIED') arr.push(d.status);
      candidateDocsMap.set(d.candidateId, arr);
    }
  });

  const blockedCandidatesCount = Array.from(candidateDocsMap.values()).filter((arr) => arr.length < 3).length;

  const candidates = await prisma.candidateRecord.findMany({
    where: { agencyId, deletedAt: null },
    select: { id: true, firstName: true, lastName: true },
    take: 100
  });

  const totalPages = Math.ceil(totalCount / pageSize);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <span className="p-2 bg-indigo-100 text-indigo-700 rounded-xl">📡</span>
            Compliance Radar & Verification Center
          </h1>
          <p className="text-xs font-semibold text-slate-600 mt-1">
            Monitor candidate documentation, verify identity proofs, track expiry alerts, and enforce joining compliance.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/compliance/new"
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-xs font-extrabold text-white rounded-xl shadow-md shadow-indigo-600/20 interactive-hover transition-all flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Upload Document
          </Link>
        </div>
      </div>

      <ComplianceKpiCards
        totalDocs={totalDocs}
        pendingCount={pendingCount}
        verifiedCount={verifiedCount}
        expiredCount={expiredCount}
        verificationRate={verificationRate}
        blockedCandidatesCount={blockedCandidatesCount}
      />

      {expiredCount > 0 && (
        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 flex items-center justify-between shadow-2xs">
          <div className="flex items-center gap-3">
            <span className="p-2 bg-rose-100 text-rose-700 rounded-xl text-lg">⚠️</span>
            <div>
              <h4 className="text-xs font-extrabold text-rose-950">Expiring / Expired Document Alert</h4>
              <p className="text-xs text-rose-800 font-medium mt-0.5">
                {expiredCount} document(s) have expired or require urgent renewal before onboarding can proceed.
              </p>
            </div>
          </div>
          <Link
            href="/compliance?status=EXPIRED"
            className="px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-extrabold rounded-xl transition-all duration-200 shadow-2xs interactive-hover"
          >
            View Alert Documents
          </Link>
        </div>
      )}

      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm shadow-slate-200/50">
        <form method="GET" action="/compliance" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <div>
            <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-1">
              Search Document / Candidate
            </label>
            <input
              type="text"
              name="query"
              defaultValue={query}
              placeholder="FileName, Candidate name..."
              className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs text-slate-900 font-bold placeholder:text-slate-500 focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20 transition-all duration-200"
            />
          </div>

          <div>
            <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-1">
              Category
            </label>
            <select
              name="category"
              defaultValue={category}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs text-slate-900 font-bold focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20 transition-all duration-200"
            >
              <option value="">All Categories</option>
              <option value="RESUME">Resume</option>
              <option value="AADHAAR">Aadhaar</option>
              <option value="PAN">PAN</option>
              <option value="PASSPORT">Passport</option>
              <option value="OFFER_LETTER">Offer Letter</option>
              <option value="RELIEVING_LETTER">Relieving Letter</option>
              <option value="EXPERIENCE_LETTER">Experience Letter</option>
              <option value="SALARY_SLIPS">Salary Slips</option>
              <option value="EDUCATION_CERTIFICATES">Education</option>
              <option value="JOINING_DOCUMENTS">Joining Docs</option>
              <option value="BGV_REPORT">BGV Report</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-1">
              Status
            </label>
            <select
              name="status"
              defaultValue={statusFilter}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs text-slate-900 font-bold focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20 transition-all duration-200"
            >
              <option value="">All Statuses</option>
              <option value="PENDING">PENDING</option>
              <option value="SUBMITTED">SUBMITTED</option>
              <option value="UNDER_REVIEW">UNDER_REVIEW</option>
              <option value="VERIFIED">VERIFIED</option>
              <option value="REJECTED">REJECTED</option>
              <option value="EXPIRED">EXPIRED</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-1">
              Candidate
            </label>
            <select
              name="candidateId"
              defaultValue={candidateFilter}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs text-slate-900 font-bold focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20 transition-all duration-200"
            >
              <option value="">All Candidates</option>
              {candidates.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.firstName} {c.lastName}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-end gap-2">
            <button
              type="submit"
              className="w-full py-2.5 bg-slate-900 hover:bg-indigo-600 text-xs font-extrabold text-white rounded-xl interactive-hover transition-all duration-200 shadow-2xs"
            >
              Apply Filter
            </button>
            <Link
              href="/compliance"
              className="py-2.5 px-3 bg-slate-100 hover:bg-slate-200 text-xs font-extrabold text-slate-700 rounded-xl border border-slate-300 transition-all duration-200"
            >
              Reset
            </Link>
          </div>
        </form>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm shadow-slate-200/50 overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">
            Candidate Documents ({totalCount})
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-800">
            <thead className="bg-slate-50 text-slate-700 uppercase text-[10px] font-extrabold tracking-wider border-b border-slate-200">
              <tr>
                <th className="p-4">Candidate</th>
                <th className="p-4">Category</th>
                <th className="p-4">Document / File</th>
                <th className="p-4">Status</th>
                <th className="p-4">Uploaded Date</th>
                <th className="p-4">Expiry Date</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {docs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-600 italic font-semibold">
                    No compliance documents found matching your criteria.
                  </td>
                </tr>
              ) : (
                docs.map((doc) => {
                  const candidateName = doc.candidate
                    ? `${doc.candidate.firstName} ${doc.candidate.lastName}`
                    : 'Unassigned Candidate';

                  return (
                    <tr key={doc.id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-4 font-extrabold text-slate-900">
                        {doc.candidate ? (
                          <Link
                            href={`/compliance/candidate/${doc.candidate.id}`}
                            className="hover:text-indigo-600 transition-colors flex items-center gap-2"
                          >
                            <span className="p-1 bg-indigo-100 text-indigo-800 rounded-lg text-[10px]">👤</span>
                            {candidateName}
                          </Link>
                        ) : (
                          <span>{candidateName}</span>
                        )}
                      </td>

                      <td className="p-4">
                        <span className="px-2.5 py-1 bg-slate-100 text-slate-800 font-mono text-[10px] font-bold rounded-md border border-slate-300">
                          {(doc.documentCategory || 'RESUME').replace(/_/g, ' ')}
                        </span>
                      </td>

                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <span className="text-slate-900 font-bold">{doc.fileName || 'document.pdf'}</span>
                        </div>
                      </td>

                      <td className="p-4">
                        <ComplianceStatusDropdown docId={doc.id} currentStatus={doc.status} />
                      </td>

                      <td className="p-4 text-slate-700 font-semibold">{new Date(doc.createdAt).toLocaleDateString()}</td>

                      <td className="p-4 text-slate-700 font-semibold">
                        {doc.expiryDate ? (
                          <span
                            className={
                              new Date(doc.expiryDate) < new Date()
                                ? 'text-rose-700 font-black'
                                : 'text-slate-900 font-bold'
                            }
                          >
                            {new Date(doc.expiryDate).toLocaleDateString()}
                          </span>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>

                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            href={`/compliance/${doc.id}`}
                            className="px-3 py-1.5 bg-slate-900 hover:bg-indigo-600 text-white text-[11px] font-extrabold rounded-xl interactive-hover transition-all duration-200 shadow-2xs"
                          >
                            Review
                          </Link>
                          <Link
                            href={`/compliance/${doc.id}/edit`}
                            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-[11px] font-extrabold rounded-xl border border-slate-300 transition-all duration-200"
                          >
                            Edit
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="p-4 border-t border-slate-200 flex items-center justify-between font-bold text-xs">
            <span className="text-slate-600">
              Showing page <span className="font-black text-slate-900">{currentPage}</span> of {totalPages}
            </span>
            <div className="flex items-center gap-2">
              {currentPage > 1 && (
                <Link
                  href={`/compliance?page=${currentPage - 1}&query=${query}&category=${category}&status=${statusFilter}&candidateId=${candidateFilter}`}
                  className="px-3.5 py-1.5 bg-white border border-slate-300 text-slate-800 rounded-xl hover:bg-slate-100 transition-all duration-200 shadow-2xs font-extrabold"
                >
                  Previous
                </Link>
              )}
              {currentPage < totalPages && (
                <Link
                  href={`/compliance?page=${currentPage + 1}&query=${query}&category=${category}&status=${statusFilter}&candidateId=${candidateFilter}`}
                  className="px-3.5 py-1.5 bg-white border border-slate-300 text-slate-800 rounded-xl hover:bg-slate-100 transition-all duration-200 shadow-2xs font-extrabold"
                >
                  Next
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
