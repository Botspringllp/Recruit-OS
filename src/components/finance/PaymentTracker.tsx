'use client';

import React, { useState, useTransition } from 'react';
import { recordPaymentAction } from '@/app/actions/finance';
import { DollarSign, Loader2, Plus, Calendar, Hash, FileText } from 'lucide-react';

interface PaymentTrackerProps {
  invoiceId: string;
  balanceDue: number;
  currency: string;
}

export function PaymentTracker({ invoiceId, balanceDue, currency }: PaymentTrackerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      const result = await recordPaymentAction(invoiceId, formData);
      if (result.success) {
        setIsOpen(false);
      } else {
        setError(result.error || 'Failed to record payment');
      }
    });
  };

  return (
    <div>
      <button
        onClick={() => setIsOpen(true)}
        disabled={balanceDue <= 0}
        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 disabled:text-slate-600 disabled:cursor-not-allowed text-white rounded-xl text-xs font-semibold transition flex items-center gap-1.5 shadow-sm"
      >
        <Plus className="h-3.5 w-3.5" />
        Record Payment
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 w-full max-w-md shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-emerald-400" />
                Record Payment
              </h3>
              <button
                onClick={() => setIsOpen(false)}
                className="text-slate-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-400">
              Outstanding Balance Due:{' '}
              <span className="font-bold text-amber-400">
                {currency} {balanceDue.toLocaleString('en-IN')}
              </span>
            </p>

            {error && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1">
                  Payment Amount ({currency}) *
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                  <input
                    type="number"
                    step="0.01"
                    name="paymentAmount"
                    defaultValue={balanceDue}
                    required
                    max={balanceDue * 1.5}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-brand-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1">
                  Payment Date *
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                  <input
                    type="date"
                    name="paymentDate"
                    defaultValue={new Date().toISOString().split('T')[0]}
                    required
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-brand-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1">
                  Reference / Transaction ID
                </label>
                <div className="relative">
                  <Hash className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                  <input
                    type="text"
                    name="referenceNumber"
                    placeholder="e.g. UTR-9823481239 or Chq #00129"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-brand-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1">
                  Payment Remarks / Notes
                </label>
                <div className="relative">
                  <FileText className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                  <input
                    type="text"
                    name="notes"
                    placeholder="e.g. Bank Transfer via HDFC"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-brand-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl text-xs font-semibold transition flex items-center gap-2"
                >
                  {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  Confirm Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
