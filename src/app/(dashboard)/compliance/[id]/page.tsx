import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { ComplianceStatusDropdown } from '@/components/compliance/ComplianceStatusDropdown';
import { CandidateComplianceTimeline } from '@/components/compliance/CandidateComplianceTimeline';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function DocumentDetailPage({
  params
}: {
  params: { id: string };
}) {
  const agency = await prisma.agency.findFirst({
    where: { subdomain: 'demo' },
    select: { id: true }
  });

  const doc = await prisma.candidateComplianceDoc.findFirst({
    where: { id: params.id, agencyId: agency?.id, deletedAt: null },
    include: {
      candidate: true,
      submission: {
        include: {
          job: {
            include: { client: true }
          }
        }
      },
      auditLogs: {
        orderBy: { createdAt: 'desc' }
      }
    }
  });

  if (!doc) {
    notFound();
  }

  const candidateName = doc.candidate
    ? `${doc.candidate.firstName} ${doc.candidate.lastName}`
    : 'Unassigned Candidate';

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Back button & Header */}
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
              <h1 className="text-xl font-bold text-white tracking-tight">{doc.fileName}</h1>
              <ComplianceStatusDropdown docId={doc.id} currentStatus={doc.status} />
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Category: <span className="text-cyan-400 font-semibold">{doc.documentCategory.replace(/_/g, ' ')}</span> | Candidate: {candidateName}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href={`/compliance/${doc.id}/edit`}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white rounded-xl transition-colors"
          >
            Edit Details
          </Link>
          {doc.candidate && (
            <Link
              href={`/compliance/candidate/${doc.candidate.id}`}
              className="px-4 py-2 bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-400 text-xs font-semibold rounded-xl transition-colors border border-cyan-500/30"
            >
              Candidate Matrix
            </Link>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column: Details & Document Box */}
        <div className="md:col-span-2 space-y-6">
          {/* Document Summary Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Document Metadata</h3>
            
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-slate-500 block">Candidate Name</span>
                <span className="text-white font-medium">{candidateName}</span>
              </div>

              <div>
                <span className="text-slate-500 block">Category</span>
                <span className="text-cyan-400 font-medium">{doc.documentCategory}</span>
              </div>

              <div>
                <span className="text-slate-500 block">Verification Status</span>
                <span className="text-emerald-400 font-bold">{doc.status}</span>
              </div>

              <div>
                <span className="text-slate-500 block">Expiry Date</span>
                <span className="text-slate-300">
                  {doc.expiryDate ? new Date(doc.expiryDate).toLocaleDateString() : 'N/A'}
                </span>
              </div>

              <div>
                <span className="text-slate-500 block">Uploaded On</span>
                <span className="text-slate-300">{new Date(doc.createdAt).toLocaleString()}</span>
              </div>

              <div>
                <span className="text-slate-500 block">File Size</span>
                <span className="text-slate-300">{Math.round(doc.fileSize / 1024)} KB</span>
              </div>
            </div>

            {doc.rejectionReason && (
              <div className="bg-rose-500/10 border border-rose-500/30 rounded-xl p-3 text-xs text-rose-300">
                <span className="font-bold">Rejection Reason:</span> {doc.rejectionReason}
              </div>
            )}

            {doc.notes && (
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-300">
                <span className="font-bold text-slate-400">Reviewer Notes:</span> {doc.notes}
              </div>
            )}
          </div>

          {/* Document Preview Box */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl text-center space-y-4">
            <div className="p-4 bg-cyan-500/10 text-cyan-400 rounded-2xl w-16 h-16 mx-auto flex items-center justify-center">
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">{doc.fileName}</h4>
              <p className="text-xs text-slate-500 mt-0.5">Secure Document Attachment</p>
            </div>
            <a
              href={doc.fileUrl || '#'}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-xs font-bold text-white rounded-xl shadow-lg transition-all"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              View / Download File
            </a>
          </div>
        </div>

        {/* Right Column: Audit Timeline */}
        <div className="space-y-6">
          <CandidateComplianceTimeline candidateName={candidateName} auditLogs={doc.auditLogs} />
        </div>
      </div>
    </div>
  );
}
