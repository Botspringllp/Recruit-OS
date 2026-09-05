import React from 'react';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { ArrowLeft, Building2 } from 'lucide-react';
import { prisma } from '@/lib/prisma';
import { getCurrentUser, hasPermission } from '@/lib/rbac';
import PartnerForm from '@/components/partners/PartnerForm';

export const revalidate = 0;

interface EditPartnerPageProps {
  params: { id: string };
}

export default async function EditPartnerPage({ params }: EditPartnerPageProps) {
  const dbUser = await getCurrentUser();
  if (!dbUser || !hasPermission(dbUser, 'partner.edit')) {
    redirect('/403');
  }

  const agencyId = dbUser.agencyId;

  const partner = await (prisma as any).partnerAgency.findFirst({
    where: { id: params.id, agencyId }
  });

  if (!partner) {
    notFound();
  }

  return (
    <div className="space-y-6 pb-12">
      <div className="flex items-center gap-3 border-b border-slate-800/80 pb-5">
        <Link
          href={`/partners/${partner.id}`}
          className="p-2 bg-slate-800/80 hover:bg-slate-700 text-slate-300 rounded-xl transition"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <Building2 className="h-5 w-5 text-purple-400" />
            Edit Partner: {partner.name}
          </h1>
          <p className="text-xs text-slate-400">
            Update contact details, status, or revenue split terms for this co-broker partner
          </p>
        </div>
      </div>

      <PartnerForm initialData={{
        ...partner,
        defaultSplitPercentage: Number(partner.defaultSplitPercentage)
      }} />
    </div>
  );
}
