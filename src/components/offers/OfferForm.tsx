'use client';

import React, { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { createOfferAction, updateOfferAction, OfferActionResult } from '@/app/actions/offers';
import { DollarSign, Calendar, FileText, User, Briefcase, AlertCircle } from 'lucide-react';

interface SubmissionOption {
  id: string;
  candidateName: string;
  jobTitle: string;
  clientName: string;
}

interface OfferFormProps {
  submissions?: SubmissionOption[];
  initialData?: {
    id?: string;
    submissionId?: string;
    offeredFixedCtc?: number | string;
    offeredVariableCtc?: number | string;
    joiningDate?: string;
    expiryDate?: string;
    noticeBuyout?: number | string;
    status?: string;
    notes?: string;
  };
  isEdit?: boolean;
}

export function OfferForm({ submissions = [], initialData = {}, isEdit = false }: OfferFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const [submissionId, setSubmissionId] = useState(initialData.submissionId || (submissions[0]?.id || ''));
  const [offeredFixedCtc, setOfferedFixedCtc] = useState(initialData.offeredFixedCtc || '');
  const [offeredVariableCtc, setOfferedVariableCtc] = useState(initialData.offeredVariableCtc || '0');
  const [joiningDate, setJoiningDate] = useState(initialData.joiningDate || '');
  const [expiryDate, setExpiryDate] = useState(initialData.expiryDate || '');
  const [noticeBuyout, setNoticeBuyout] = useState(initialData.noticeBuyout || '0');
  const [status, setStatus] = useState(initialData.status || 'DRAFT');
  const [notes, setNotes] = useState(initialData.notes || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setFieldErrors({});

    const formData = new FormData();
    formData.append('submissionId', submissionId);
    formData.append('offeredFixedCtc', offeredFixedCtc.toString());
    formData.append('offeredVariableCtc', offeredVariableCtc.toString());
    formData.append('joiningDate', joiningDate);
    formData.append('expiryDate', expiryDate);
    formData.append('noticeBuyout', noticeBuyout.toString());
    formData.append('status', status);
    formData.append('notes', notes);

    startTransition(async () => {
      let res: OfferActionResult;
      if (isEdit && initialData.id) {
        res = await updateOfferAction(initialData.id, formData);
      } else {
        res = await createOfferAction(null, formData);
      }

      if (res.success) {
        router.push(isEdit && initialData.id ? `/offers/${initialData.id}` : '/offers');
      } else {
        if (res.error) setError(res.error);
        if (res.errors) setFieldErrors(res.errors);
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-3xl">
      {error && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-2xl flex items-center gap-3 text-xs text-rose-300">
          <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
          <span>{error}</span>
        </div>
      )}

      {/* Select Candidate Submission */}
      {!isEdit && (
        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-300 flex items-center gap-2">
            <User className="h-4 w-4 text-brand-400" />
            Candidate Submission Record *
          </label>
          <select
            value={submissionId}
            onChange={(e) => setSubmissionId(e.target.value)}
            disabled={isPending}
            className="w-full px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-brand-500 transition"
          >
            <option value="">Select Candidate & Job Requisition</option>
            {submissions.map((sub) => (
              <option key={sub.id} value={sub.id}>
                {sub.candidateName} — {sub.jobTitle} ({sub.clientName})
              </option>
            ))}
          </select>
          {fieldErrors.submissionId && <p className="text-[11px] text-rose-400">{fieldErrors.submissionId}</p>}
        </div>
      )}

      {/* Offered CTC Breakdown */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-300 flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-emerald-400" />
            Fixed Offered CTC (Annual / LPA) *
          </label>
          <input
            type="number"
            step="0.01"
            min="0.1"
            placeholder="e.g. 24.50"
            value={offeredFixedCtc}
            onChange={(e) => setOfferedFixedCtc(e.target.value)}
            disabled={isPending}
            className="w-full px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-600 focus:outline-none focus:border-brand-500 transition"
          />
          {fieldErrors.offeredFixedCtc && <p className="text-[11px] text-rose-400">{fieldErrors.offeredFixedCtc}</p>}
        </div>

        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-300 flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-cyan-400" />
            Variable Offered CTC / Performance Bonus
          </label>
          <input
            type="number"
            step="0.01"
            min="0"
            placeholder="e.g. 3.00"
            value={offeredVariableCtc}
            onChange={(e) => setOfferedVariableCtc(e.target.value)}
            disabled={isPending}
            className="w-full px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-600 focus:outline-none focus:border-brand-500 transition"
          />
          {fieldErrors.offeredVariableCtc && <p className="text-[11px] text-rose-400">{fieldErrors.offeredVariableCtc}</p>}
        </div>
      </div>

      {/* Dates: Joining & Expiry */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-300 flex items-center gap-2">
            <Calendar className="h-4 w-4 text-indigo-400" />
            Expected Joining Date *
          </label>
          <input
            type="date"
            value={joiningDate}
            onChange={(e) => setJoiningDate(e.target.value)}
            disabled={isPending}
            className="w-full px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-brand-500 transition"
          />
          {fieldErrors.joiningDate && <p className="text-[11px] text-rose-400">{fieldErrors.joiningDate}</p>}
        </div>

        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-300 flex items-center gap-2">
            <Calendar className="h-4 w-4 text-amber-400" />
            Offer Expiry Date
          </label>
          <input
            type="date"
            value={expiryDate}
            onChange={(e) => setExpiryDate(e.target.value)}
            disabled={isPending}
            className="w-full px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-brand-500 transition"
          />
          {fieldErrors.expiryDate && <p className="text-[11px] text-rose-400">{fieldErrors.expiryDate}</p>}
        </div>
      </div>

      {/* Notice Buyout & Initial Status */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-300 flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-purple-400" />
            Notice Period Buyout Amount
          </label>
          <input
            type="number"
            step="0.01"
            min="0"
            placeholder="0.00"
            value={noticeBuyout}
            onChange={(e) => setNoticeBuyout(e.target.value)}
            disabled={isPending}
            className="w-full px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-600 focus:outline-none focus:border-brand-500 transition"
          />
          {fieldErrors.noticeBuyout && <p className="text-[11px] text-rose-400">{fieldErrors.noticeBuyout}</p>}
        </div>

        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-300 flex items-center gap-2">
            <Briefcase className="h-4 w-4 text-slate-400" />
            Initial Offer Status
          </label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            disabled={isPending}
            className="w-full px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-brand-500 transition"
          >
            <option value="DRAFT">DRAFT</option>
            <option value="SENT">SENT</option>
            <option value="ACCEPTED">ACCEPTED</option>
            <option value="JOINED">JOINED</option>
          </select>
        </div>
      </div>

      {/* Offer Notes */}
      <div className="space-y-2">
        <label className="text-xs font-semibold text-slate-300 flex items-center gap-2">
          <FileText className="h-4 w-4 text-slate-400" />
          Offer Negotiation & Internal Terms Notes
        </label>
        <textarea
          rows={4}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Add details regarding agreed perks, ESOPs, relocation allowance, or special clauses..."
          disabled={isPending}
          className="w-full px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-600 focus:outline-none focus:border-brand-500 transition"
        />
      </div>

      {/* Buttons */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800/80">
        <button
          type="button"
          onClick={() => router.back()}
          disabled={isPending}
          className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 rounded-xl text-xs font-semibold transition"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isPending}
          className="px-6 py-2.5 bg-brand-500 hover:bg-brand-600 text-white rounded-xl text-xs font-bold shadow-lg shadow-brand-500/20 transition flex items-center gap-2"
        >
          {isPending ? 'Saving Offer...' : isEdit ? 'Update Offer Record' : 'Generate & Issue Offer'}
        </button>
      </div>
    </form>
  );
}
