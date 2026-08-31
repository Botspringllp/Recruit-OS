import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { DocumentUploadForm } from '@/components/compliance/DocumentUploadForm';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function EditDocumentPage({
  params
}: {
  params: { id: string };
}) {
  const agency = await prisma.agency.findFirst({
    where: { subdomain: 'demo' },
    select: { id: true }
  });

  const doc = await prisma.candidateComplianceDoc.findFirst({
    where: { id: params.id, agencyId: agency?.id, deletedAt: null }
  });

  if (!doc) {
    notFound();
  }

  const candidates = await prisma.candidateRecord.findMany({
    where: { agencyId: agency?.id, deletedAt: null },
    select: { id: true, firstName: true, lastName: true, email: true }
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
          href={`/compliance/${doc.id}`}
          className="p-2 bg-slate-900 border border-slate-800 rounded-xl text-slate-400 hover:text-white transition-colors"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
        </Link>
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">Edit Candidate Document</h1>
          <p className="text-xs text-slate-400 mt-0.5">Update category, document attachment, or expiry dates.</p>
        </div>
      </div>

      <DocumentUploadForm
        candidates={mappedCandidates}
        initialData={{
          id: doc.id,
          candidateId: doc.candidateId || '',
          documentCategory: doc.documentCategory,
          fileName: doc.fileName || '',
          fileUrl: doc.fileUrl || '',
          expiryDate: doc.expiryDate ? doc.expiryDate.toISOString() : undefined,
          notes: doc.notes || undefined
        }}
        isEdit={true}
      />
    </div>
  );
}
