import React from 'react';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { getCurrentUser, hasPermission } from '@/lib/rbac';
import { OfferForm } from '@/components/offers/OfferForm';
import { Award, ArrowLeft } from 'lucide-react';

export const revalidate = 0;

interface EditOfferPageProps {
  params: {
    id: string;
  };
}

export default async function EditOfferPage({ params }: EditOfferPageProps) {
  const dbUser = await getCurrentUser();
  if (!dbUser || !hasPermission(dbUser, 'offer.edit')) {
    redirect('/403');
  }

  const agencyId = dbUser.agencyId;

  const offer = await prisma.jobOfferAudit.findFirst({
    where: { id: params.id, agencyId }
  }).catch(() => null);

  if (!offer) {
    notFound();
  }

  const initialData = {
    id: offer.id,
    submissionId: offer.submissionId,
    offeredFixedCtc: offer.offeredFixedCtc ? parseFloat(offer.offeredFixedCtc.toString()) : '',
    offeredVariableCtc: offer.offeredVariableCtc ? parseFloat(offer.offeredVariableCtc.toString()) : '0',
    joiningDate: offer.joiningDate ? new Date(offer.joiningDate).toISOString().split('T')[0] : '',
    expiryDate: offer.expiryDate ? new Date(offer.expiryDate).toISOString().split('T')[0] : '',
    noticeBuyout: offer.noticeBuyout ? parseFloat(offer.noticeBuyout.toString()) : '0',
    status: offer.status || 'DRAFT',
    notes: offer.notes || ''
  };

  return (
    <div className="space-y-6 pb-12">
      <div className="flex items-center gap-3 border-b border-slate-800/80 pb-5">
        <Link
          href={`/offers/${params.id}`}
          className="p-2 bg-slate-900 border border-slate-800 rounded-xl text-slate-400 hover:text-white transition"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <Award className="h-6 w-6 text-brand-400" />
            Edit Job Offer Details
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Update offered CTC figures, joining timelines, notice buyout amounts, or offer notes.
          </p>
        </div>
      </div>

      <div className="glass-panel p-6 sm:p-8 rounded-2xl border border-slate-800/80">
        <OfferForm initialData={initialData} isEdit={true} />
      </div>
    </div>
  );
}
