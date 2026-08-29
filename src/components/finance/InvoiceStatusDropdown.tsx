'use client';

import React, { useState, useTransition } from 'react';
import { updateInvoiceStatusAction } from '@/app/actions/finance';
import { ChevronDown, Loader2 } from 'lucide-react';

interface InvoiceStatusDropdownProps {
  invoiceId: string;
  currentStatus: string;
}

const STATUS_CONFIG: Record<string, { label: string; colorClass: string }> = {
  DRAFT: { label: 'Draft', colorClass: 'bg-slate-500/10 text-slate-400 border-slate-500/20' },
  GENERATED: { label: 'Generated', colorClass: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
  SENT_TO_CLIENT: { label: 'Sent to Client', colorClass: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' },
  PARTIALLY_PAID: { label: 'Partially Paid', colorClass: 'bg-amber-500/10 text-amber-300 border-amber-500/20' },
  PAID: { label: 'Paid', colorClass: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
  OVERDUE: { label: 'Overdue', colorClass: 'bg-rose-500/10 text-rose-400 border-rose-500/20' },
  CANCELLED: { label: 'Cancelled', colorClass: 'bg-slate-700/30 text-slate-500 border-slate-700/50' }
};

export function InvoiceStatusDropdown({ invoiceId, currentStatus }: InvoiceStatusDropdownProps) {
  const [status, setStatus] = useState(currentStatus);
  const [isPending, startTransition] = useTransition();

  const handleStatusChange = (newStatus: string) => {
    if (newStatus === status) return;
    setStatus(newStatus);

    startTransition(async () => {
      const result = await updateInvoiceStatusAction(invoiceId, newStatus);
      if (!result.success) {
        setStatus(currentStatus);
        alert(result.error || 'Failed to update invoice status');
      }
    });
  };

  const currentConfig = STATUS_CONFIG[status] || {
    label: status,
    colorClass: 'bg-slate-500/10 text-slate-400 border-slate-500/20'
  };

  return (
    <div className="relative inline-block text-left">
      <div className="flex items-center gap-1.5">
        <span
          className={`px-2.5 py-1 rounded-full text-[11px] font-bold border flex items-center gap-1.5 ${currentConfig.colorClass}`}
        >
          {isPending && <Loader2 className="h-3 w-3 animate-spin" />}
          {currentConfig.label}
        </span>

        <select
          value={status}
          disabled={isPending}
          onChange={(e) => handleStatusChange(e.target.value)}
          className="opacity-0 absolute inset-0 w-full h-full cursor-pointer disabled:cursor-not-allowed"
          aria-label="Update Invoice Status"
        >
          <option value="DRAFT">Draft</option>
          <option value="GENERATED">Generated</option>
          <option value="SENT_TO_CLIENT">Sent to Client</option>
          <option value="PARTIALLY_PAID">Partially Paid</option>
          <option value="PAID">Paid</option>
          <option value="OVERDUE">Overdue</option>
          <option value="CANCELLED">Cancelled</option>
        </select>
        <ChevronDown className="h-3 w-3 text-slate-400 pointer-events-none -ml-4" />
      </div>
    </div>
  );
}
