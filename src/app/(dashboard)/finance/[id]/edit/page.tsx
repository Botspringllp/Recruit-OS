import React from 'react';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { getCurrentUser, hasPermission } from '@/lib/rbac';
import { InvoiceForm } from '@/components/finance/InvoiceForm';
import { ArrowLeft, Edit } from 'lucide-react';

export const revalidate = 0;

interface EditInvoicePageProps {
  params: {
    id: string;
  };
}

export default async function EditInvoicePage({ params }: EditInvoicePageProps) {
  const dbUser = await getCurrentUser();
  if (!dbUser || !hasPermission(dbUser, 'finance.edit')) {
    redirect('/403');
  }

  const agencyId = dbUser.agencyId;

  const invoice = await prisma.invoiceRecord.findFirst({
    where: { id: params.id, agencyId }
  });

  if (!invoice) {
    notFound();
  }

  const initialData = {
    id: invoice.id,
    clientId: invoice.clientId,
    jobId: invoice.jobId || undefined,
    submissionId: invoice.submissionId || undefined,
    baseFeeAmount: parseFloat(invoice.baseFeeAmount.toString()),
    gstPercentage: parseFloat(invoice.gstPercentage.toString()),
    dueDate: new Date(invoice.dueDate).toISOString().split('T')[0],
    invoiceStatus: invoice.invoiceStatus,
    notes: invoice.notes || ''
  };

  return (
    <div className="space-y-6 pb-12 max-w-4xl mx-auto">
      {/* Top Header */}
      <div className="flex items-center gap-3 border-b border-slate-800/80 pb-4">
        <Link
          href={`/finance/${invoice.id}`}
          className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>

        <div>
          <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <Edit className="h-5 w-5 text-brand-400" />
            Edit Invoice {invoice.invoiceNumber}
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Modify base fee, tax rate, payment due date or workflow status
          </p>
        </div>
      </div>

      <InvoiceForm initialData={initialData} isEdit={true} />
    </div>
  );
}
