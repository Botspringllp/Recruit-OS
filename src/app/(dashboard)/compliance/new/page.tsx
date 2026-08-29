import React from 'react';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { DocumentUploadForm } from '@/components/compliance/DocumentUploadForm';

export default async function NewDocumentPage() {
  const agency = await prisma.agency.findFirst({
    where: { subdomain: 'demo' },
    select: { id: true }
  });

  const candidates = await prisma.candidateRecord.findMany({
    where: { agencyId: agency?.id, deletedAt: null },
    select: { id: true, firstName: true, lastName: true, email: true },
    orderBy: { createdAt: 'desc' },
    take: 100
  });

  const mappedCandidates = candidates.map((c) => ({
    id: c.id,
    name: `${c.firstName} ${c.lastName}`,
    email: c.email
  }));

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
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
          <h1 className="text-xl font-bold text-white tracking-tight">Upload Candidate Compliance Document</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Register identity proof, qualification certificates, background checks, or joining documentation.
          </p>
        </div>
      </div>

      <DocumentUploadForm candidates={mappedCandidates} />
    </div>
  );
}
