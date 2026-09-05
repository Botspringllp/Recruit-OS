import React from 'react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { getCurrentUser, hasPermission } from '@/lib/rbac';
import { InvoiceForm } from '@/components/finance/InvoiceForm';
import { ArrowLeft, Receipt } from 'lucide-react';

export const revalidate = 0;

export default async function NewInvoicePage() {
  const dbUser = await getCurrentUser();
  if (!dbUser || !hasPermission(dbUser, 'finance.create')) {
    redirect('/403');
  }

  const agencyId = dbUser.agencyId;

  const clients = await prisma.client.findMany({
    where: { agencyId },
    select: { id: true, companyName: true },
    orderBy: { companyName: 'asc' }
  });

  return (
    <div className="space-y-6 pb-12 max-w-4xl mx-auto">
      {/* Top Header */}
      <div className="flex items-center gap-3 border-b border-slate-800/80 pb-4">
        <Link
          href="/finance"
          className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>

        <div>
          <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <Receipt className="h-5 w-5 text-brand-400" />
            Generate New Invoice
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Manually record client placement fee billing or agency service invoices
          </p>
        </div>
      </div>

      <InvoiceForm clients={clients} isEdit={false} />
    </div>
  );
}
