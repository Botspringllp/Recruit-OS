import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { MANDATORY_COMPLIANCE_CATEGORIES } from '@/lib/constants/compliance';
import { ComplianceStatusDropdown } from '@/components/compliance/ComplianceStatusDropdown';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function CandidateComplianceMatrixPage({
  params
}: {
  params: { candidateId: string };
}) {
  const agency = await prisma.agency.findFirst({
    where: { subdomain: 'demo' },
    select: { id: true }
  });

  const candidate = await prisma.candidateRecord.findFirst({
    where: { id: params.candidateId, agencyId: agency?.id, deletedAt: null },
    include: {
      submissions: {
        include: {
          job: {
            include: { client: true }
          },
          offerAudit: true
        }
      }
    }
  });

  if (!candidate) {
    notFound();
  }

  const docs = await prisma.candidateComplianceDoc.findMany({
    where: { candidateId: candidate.id, agencyId: agency?.id, deletedAt: null },
    include: {
      auditLogs: { orderBy: { createdAt: 'desc' } }
    }
  });

  const mandatoryCategories = MANDATORY_COMPLIANCE_CATEGORIES;

  // Compute checklist matrix
  const categoryDocMap = new Map<string, typeof docs[0]>();
  docs.forEach((d) => {
    categoryDocMap.set(d.documentCategory, d);
  });

  const verifiedCount = docs.filter((d) => d.status === 'VERIFIED').length;
  const isFullyCompliant = verifiedCount >= 5;

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Back button & Candidate Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link
            href="/compliance"
            className="p-2 bg-slate-900 border border-slate-800 rounded-xl text-slate-400 hover:text-white transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-bold text-white tracking-tight">
                {candidate.firstName} {candidate.lastName} — Compliance Matrix
              </h1>
              <span
                className={`px-3 py-1 text-xs font-bold rounded-full border ${
                  isFullyCompliant
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-800'
                    : 'bg-amber-500/10 text-amber-400 border-amber-800'
                }`}
              >
                {isFullyCompliant ? 'GATE PASSED (Ready to Join)' : 'GATE BLOCKED (Incomplete)'}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Email: {candidate.email} | Phone: {candidate.phone || 'N/A'} | Current Company: {candidate.currentCompany || 'N/A'}
            </p>
          </div>
        </div>

        <Link
          href={`/compliance/new?candidateId=${candidate.id}`}
          className="px-4 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-xs font-bold text-white rounded-xl shadow-lg transition-all"
        >
          + Upload Document
        </Link>
      </div>

      {/* Mandatory Document Matrix Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
            Mandatory Document Checklist Matrix ({verifiedCount} / {mandatoryCategories.length} Verified)
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] font-semibold tracking-wider border-b border-slate-800">
              <tr>
                <th className="p-4">Category</th>
                <th className="p-4">Checklist Requirement</th>
                <th className="p-4">File Status</th>
                <th className="p-4">Verification Action</th>
                <th className="p-4">Uploaded File</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {mandatoryCategories.map((cat) => {
                const doc = categoryDocMap.get(cat);
                const isEssential = ['RESUME', 'AADHAAR', 'PAN', 'BGV_REPORT', 'OFFER_LETTER'].includes(cat);

                return (
                  <tr key={cat} className="hover:bg-slate-800/40 transition-colors">
                    {/* Category */}
                    <td className="p-4 font-bold text-white flex items-center gap-2">
                      <span>{cat.replace(/_/g, ' ')}</span>
                      {isEssential && (
                        <span className="px-1.5 py-0.5 bg-rose-500/10 text-rose-400 text-[9px] font-bold rounded">
                          MANDATORY
                        </span>
                      )}
                    </td>

                    {/* Requirement */}
                    <td className="p-4 text-slate-400">
                      {isEssential ? 'Required before JOINED transition' : 'Optional / Standard Onboarding'}
                    </td>

                    {/* File Status */}
                    <td className="p-4">
                      {doc ? (
                        <ComplianceStatusDropdown docId={doc.id} currentStatus={doc.status} />
                      ) : (
                        <span className="px-2.5 py-1 text-[11px] font-semibold text-rose-400 bg-rose-500/10 border border-rose-800 rounded-full">
                          MISSING
                        </span>
                      )}
                    </td>

                    {/* Verification Action */}
                    <td className="p-4 text-slate-300">
                      {doc?.status === 'VERIFIED' ? (
                        <span className="text-emerald-400 font-bold flex items-center gap-1">
                          ✓ Verified
                        </span>
                      ) : doc ? (
                        <span className="text-amber-400 italic">Pending Review</span>
                      ) : (
                        <span className="text-slate-600">Action Required</span>
                      )}
                    </td>

                    {/* Uploaded File */}
                    <td className="p-4">
                      {doc ? (
                        <span className="text-slate-300 font-mono text-[11px]">{doc.fileName}</span>
                      ) : (
                        <span className="text-slate-600 italic">No File Uploaded</span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="p-4 text-right">
                      {doc ? (
                        <Link
                          href={`/compliance/${doc.id}`}
                          className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-cyan-400 rounded-lg"
                        >
                          Review
                        </Link>
                      ) : (
                        <Link
                          href={`/compliance/new?candidateId=${candidate.id}&category=${cat}`}
                          className="px-3 py-1 bg-cyan-600/20 hover:bg-cyan-600/30 text-xs font-semibold text-cyan-400 rounded-lg border border-cyan-500/30"
                        >
                          Upload
                        </Link>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
