'use client';

import React, { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { createInvoiceAction, updateInvoiceAction } from '@/app/actions/finance';
import { DollarSign, Calendar, Building, FileText, Loader2, Save, Percent } from 'lucide-react';

interface InvoiceFormProps {
  initialData?: {
    id?: string;
    clientId?: string;
    jobId?: string;
    submissionId?: string;
    baseFeeAmount?: number;
    gstPercentage?: number;
    dueDate?: string;
    invoiceStatus?: string;
    notes?: string;
  };
  clients?: Array<{ id: string; companyName: string }>;
  isEdit?: boolean;
}

export function InvoiceForm({ initialData = {}, clients = [], isEdit = false }: InvoiceFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState<string | null>(null);

  const [baseFee, setBaseFee] = useState<number>(initialData.baseFeeAmount || 0);
  const [gstPercent, setGstPercent] = useState<number>(initialData.gstPercentage ?? 18);

  const calculatedGst = (baseFee * gstPercent) / 100;
  const calculatedTotal = baseFee + calculatedGst;

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormErrors({});
    setServerError(null);

    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      let result;
      if (isEdit && initialData.id) {
        result = await updateInvoiceAction(initialData.id, formData);
      } else {
        result = await createInvoiceAction(null, formData);
      }

      if (result.success && result.invoiceId) {
        router.push(`/finance/${result.invoiceId}`);
      } else if (result.errors) {
        setFormErrors(result.errors);
      } else if (result.error) {
        setServerError(result.error);
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {serverError && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs">
          {serverError}
        </div>
      )}

      <div className="glass-panel rounded-2xl border border-slate-800/80 p-6 space-y-5">
        <h3 className="text-sm font-semibold text-white border-b border-slate-800 pb-3 flex items-center gap-2">
          <DollarSign className="h-4 w-4 text-brand-400" />
          {isEdit ? 'Update Invoice Parameters' : 'Billing & Placement Fee Details'}
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Client Selection (Only for Create) */}
          {!isEdit && (
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Client Company *
              </label>
              <div className="relative">
                <Building className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
                <select
                  name="clientId"
                  defaultValue={initialData.clientId || ''}
                  required
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white focus:outline-none focus:border-brand-500"
                >
                  <option value="">-- Select Client --</option>
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.companyName}
                    </option>
                  ))}
                </select>
              </div>
              {formErrors.clientId && (
                <p className="text-[11px] text-rose-400 mt-1">{formErrors.clientId}</p>
              )}
            </div>
          )}

          {/* Base Fee Amount */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Base Placement Fee (INR) *
            </label>
            <div className="relative">
              <DollarSign className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
              <input
                type="number"
                step="0.01"
                name="baseFeeAmount"
                value={baseFee}
                onChange={(e) => setBaseFee(parseFloat(e.target.value) || 0)}
                placeholder="e.g. 240000"
                required
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white focus:outline-none focus:border-brand-500"
              />
            </div>
            {formErrors.baseFeeAmount && (
              <p className="text-[11px] text-rose-400 mt-1">{formErrors.baseFeeAmount}</p>
            )}
          </div>

          {/* GST Percentage */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              GST Tax Rate (%)
            </label>
            <div className="relative">
              <Percent className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
              <input
                type="number"
                step="0.1"
                name="gstPercentage"
                value={gstPercent}
                onChange={(e) => setGstPercent(parseFloat(e.target.value) || 0)}
                placeholder="18.0"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white focus:outline-none focus:border-brand-500"
              />
            </div>
          </div>

          {/* Due Date */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Payment Due Date *
            </label>
            <div className="relative">
              <Calendar className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
              <input
                type="date"
                name="dueDate"
                defaultValue={initialData.dueDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}
                required
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white focus:outline-none focus:border-brand-500"
              />
            </div>
            {formErrors.dueDate && (
              <p className="text-[11px] text-rose-400 mt-1">{formErrors.dueDate}</p>
            )}
          </div>
        </div>

        {/* Dynamic Calculation Live Breakdown */}
        <div className="p-4 bg-slate-900/60 rounded-xl border border-slate-800/80 flex flex-wrap items-center justify-between gap-4 text-xs">
          <div>
            <span className="text-slate-400">Base Fee: </span>
            <span className="font-semibold text-white">₹{baseFee.toLocaleString('en-IN')}</span>
          </div>
          <div>
            <span className="text-slate-400">GST ({gstPercent}%): </span>
            <span className="font-semibold text-amber-400">₹{calculatedGst.toLocaleString('en-IN')}</span>
          </div>
          <div>
            <span className="text-slate-400">Total Billed: </span>
            <span className="font-bold text-emerald-400 text-sm">₹{calculatedTotal.toLocaleString('en-IN')}</span>
          </div>
        </div>

        {/* Invoice Status (Edit Only) */}
        {isEdit && (
          <div>
            <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Invoice Workflow Status
            </label>
            <select
              name="invoiceStatus"
              defaultValue={initialData.invoiceStatus || 'DRAFT'}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-brand-500"
            >
              <option value="DRAFT">Draft</option>
              <option value="GENERATED">Generated</option>
              <option value="SENT_TO_CLIENT">Sent to Client</option>
              <option value="PARTIALLY_PAID">Partially Paid</option>
              <option value="PAID">Paid</option>
              <option value="OVERDUE">Overdue</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>
        )}

        {/* Invoice Notes */}
        <div>
          <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
            Internal Notes / Instructions
          </label>
          <div className="relative">
            <FileText className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
            <textarea
              name="notes"
              rows={3}
              defaultValue={initialData.notes || ''}
              placeholder="e.g. Include PO number PO-98124 on client remittance notice."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs text-white focus:outline-none focus:border-brand-500"
            />
          </div>
        </div>
      </div>

      <div className="flex items-center justify-end gap-3 pt-2">
        <button
          type="button"
          onClick={() => router.back()}
          className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isPending}
          className="px-6 py-2.5 bg-gradient-to-r from-brand-600 to-indigo-600 hover:brightness-110 text-white rounded-xl text-xs font-semibold transition flex items-center gap-2 shadow-glow-brand"
        >
          {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {isEdit ? 'Update Invoice' : 'Generate Invoice'}
        </button>
      </div>
    </form>
  );
}
