import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { InvoiceStatusDropdown } from '@/components/finance/InvoiceStatusDropdown';
import { PaymentTracker } from '@/components/finance/PaymentTracker';
import { InvoicePdfButton } from '@/components/finance/InvoicePdfButton';
import { ArrowLeft, Edit, Building, Calendar, DollarSign, FileText, CheckCircle, Clock } from 'lucide-react';

export const revalidate = 0;

interface InvoiceDetailPageProps {
  params: {
    id: string;
  };
}

export default async function InvoiceDetailPage({ params }: InvoiceDetailPageProps) {
  const demoAgency = await prisma.agency.findFirst({
    where: { subdomain: 'demo' },
    select: { id: true, name: true }
  });
  const agencyId = demoAgency?.id;

  const invoice = await prisma.invoiceRecord.findFirst({
    where: { id: params.id, agencyId },
    include: {
      client: {
        select: {
          companyName: true,
          standardFeePercentage: true,
          paymentTermsDays: true
        }
      },
      offerAudit: {
        include: {
          submission: {
            include: {
              candidate: { select: { firstName: true, lastName: true, email: true, phone: true } },
              job: { select: { title: true } }
            }
          }
        }
      }
    }
  });

  if (!invoice) {
    notFound();
  }

  const baseFeeVal = parseFloat(invoice.baseFeeAmount.toString());
  const gstPercentVal = parseFloat(invoice.gstPercentage.toString());
  const gstAmountVal = parseFloat(invoice.gstAmount.toString());
  const totalVal = parseFloat(invoice.totalInvoiceAmount.toString());
  const receivedVal = parseFloat(invoice.amountReceived.toString());
  const balanceVal = parseFloat(invoice.balanceDue.toString());

  const candidate = invoice.offerAudit?.submission.candidate;
  const job = invoice.offerAudit?.submission.job;

  return (
    <div className="space-y-6 pb-12 max-w-5xl mx-auto">
      {/* Top Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-4 print:hidden">
        <div className="flex items-center gap-3">
          <Link
            href="/finance"
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>

          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-bold text-white tracking-tight">{invoice.invoiceNumber}</h1>
              <InvoiceStatusDropdown invoiceId={invoice.id} currentStatus={invoice.invoiceStatus} />
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Client: <span className="text-slate-200 font-semibold">{invoice.client.companyName}</span>
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <PaymentTracker invoiceId={invoice.id} balanceDue={balanceVal} currency={invoice.currency} />

          <InvoicePdfButton invoiceNumber={invoice.invoiceNumber} />

          <Link
            href={`/finance/${invoice.id}/edit`}
            className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold transition border border-slate-700/60 flex items-center gap-1.5"
          >
            <Edit className="h-3.5 w-3.5 text-brand-400" />
            Edit Terms
          </Link>
        </div>
      </div>

      {/* Printable Invoice Container */}
      <div className="glass-panel p-8 rounded-3xl border border-slate-800/80 bg-slate-900/80 space-y-8 print:bg-white print:text-black print:p-0 print:border-none">
        {/* Header Branding */}
        <div className="flex items-start justify-between border-b border-slate-800 print:border-gray-200 pb-6">
          <div>
            <h2 className="text-2xl font-extrabold text-white print:text-black tracking-tight">
              {demoAgency?.name || 'RecruitOS Agency'}
            </h2>
            <p className="text-xs text-slate-400 print:text-gray-600 mt-1">
              Executive Recruitment & Placement Services
            </p>
          </div>

          <div className="text-right">
            <span className="text-sm font-bold text-brand-400 print:text-indigo-600 uppercase tracking-widest block">
              TAX INVOICE
            </span>
            <span className="text-lg font-mono font-bold text-white print:text-black mt-1 block">
              {invoice.invoiceNumber}
            </span>
          </div>
        </div>

        {/* Client & Billing Meta Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
          <div className="space-y-2 p-4 bg-slate-950/60 print:bg-gray-50 rounded-2xl border border-slate-800/60 print:border-gray-200">
            <span className="text-[10px] font-bold text-slate-400 print:text-gray-500 uppercase tracking-wider block">
              BILLED TO (CLIENT)
            </span>
            <h3 className="font-bold text-sm text-white print:text-black">{invoice.client.companyName}</h3>
            {candidate && (
              <div className="text-slate-300 print:text-gray-700 mt-1 space-y-0.5">
                <p>
                  <strong className="text-slate-400">Candidate:</strong> {candidate.firstName} {candidate.lastName}
                </p>
                {job && (
                  <p>
                    <strong className="text-slate-400">Position / Mandate:</strong> {job.title}
                  </p>
                )}
              </div>
            )}
          </div>

          <div className="space-y-2 p-4 bg-slate-950/60 print:bg-gray-50 rounded-2xl border border-slate-800/60 print:border-gray-200">
            <span className="text-[10px] font-bold text-slate-400 print:text-gray-500 uppercase tracking-wider block">
              INVOICE DATES & STATUS
            </span>
            <div className="grid grid-cols-2 gap-2 text-slate-300 print:text-gray-700">
              <div>
                <span className="text-slate-400 print:text-gray-500 block">Issue Date:</span>
                <strong className="text-white print:text-black">{new Date(invoice.issuedDate).toLocaleDateString('en-IN')}</strong>
              </div>
              <div>
                <span className="text-slate-400 print:text-gray-500 block">Payment Due:</span>
                <strong className="text-white print:text-black">{new Date(invoice.dueDate).toLocaleDateString('en-IN')}</strong>
              </div>
              {invoice.paidAt && (
                <div className="col-span-2">
                  <span className="text-slate-400 print:text-gray-500 block">Paid Date:</span>
                  <strong className="text-emerald-400 print:text-emerald-600">{new Date(invoice.paidAt).toLocaleDateString('en-IN')}</strong>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Itemized Calculation Table */}
        <div className="overflow-hidden rounded-2xl border border-slate-800 print:border-gray-200">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 print:bg-gray-100 text-slate-400 print:text-gray-700 uppercase tracking-wider font-semibold">
              <tr>
                <th className="p-4">Description</th>
                <th className="p-4 text-right">Base Amount</th>
                <th className="p-4 text-right">GST Rate</th>
                <th className="p-4 text-right">Total (INR)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 print:divide-gray-200 text-slate-200 print:text-black">
              <tr>
                <td className="p-4">
                  <div className="font-semibold text-white print:text-black">Executive Placement Service Fee</div>
                  <div className="text-[11px] text-slate-400 print:text-gray-500 mt-0.5">
                    {job?.title ? `Mandate: ${job.title}` : 'Professional recruitment commission fee'}
                    {candidate ? ` (Candidate: ${candidate.firstName} ${candidate.lastName})` : ''}
                  </div>
                </td>
                <td className="p-4 text-right font-medium">₹{baseFeeVal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                <td className="p-4 text-right">{gstPercentVal}%</td>
                <td className="p-4 text-right font-bold text-white print:text-black">
                  ₹{baseFeeVal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Total Summary Breakdown */}
        <div className="flex flex-col sm:flex-row justify-between items-start gap-6 border-t border-slate-800 print:border-gray-200 pt-6">
          <div className="max-w-md text-xs text-slate-400 print:text-gray-600 space-y-1">
            <span className="font-bold text-slate-300 print:text-black block mb-1 uppercase tracking-wider">
              Terms & Remittance Notes
            </span>
            <p>{invoice.notes || 'Please remit payment within the specified due date.'}</p>
          </div>

          <div className="w-full sm:w-72 space-y-2 text-xs">
            <div className="flex justify-between text-slate-300 print:text-gray-700">
              <span>Subtotal Base Fee:</span>
              <span className="font-semibold">₹{baseFeeVal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="flex justify-between text-slate-300 print:text-gray-700">
              <span>GST ({gstPercentVal}%):</span>
              <span className="font-semibold text-amber-400 print:text-gray-900">
                ₹{gstAmountVal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div className="flex justify-between text-base font-bold text-white print:text-black pt-2 border-t border-slate-800 print:border-gray-200">
              <span>Total Invoice:</span>
              <span className="text-emerald-400 print:text-indigo-600">
                INR {totalVal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </span>
            </div>

            {/* Paid & Balance Breakdown */}
            <div className="p-3 bg-slate-950/80 print:bg-gray-50 rounded-xl border border-slate-800/80 print:border-gray-200 space-y-1 mt-3">
              <div className="flex justify-between text-slate-400 print:text-gray-600 text-[11px]">
                <span>Amount Paid:</span>
                <span className="text-emerald-400 font-semibold">₹{receivedVal.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-[11px] font-bold">
                <span className="text-slate-300 print:text-black">Balance Due:</span>
                <span className={balanceVal > 0 ? 'text-amber-400' : 'text-slate-400'}>
                  ₹{balanceVal.toLocaleString('en-IN')}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
