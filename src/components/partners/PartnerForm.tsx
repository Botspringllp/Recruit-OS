'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Building2, User, Mail, Phone, Percent, FileText, CheckCircle2, AlertCircle, ArrowLeft } from 'lucide-react';
import { createPartnerAction, updatePartnerAction } from '@/app/actions/partners';

interface PartnerFormProps {
  initialData?: {
    id: string;
    name: string;
    contactPerson?: string | null;
    email?: string | null;
    phone?: string | null;
    defaultSplitPercentage: number | string;
    isActive: boolean;
    notes?: string | null;
  };
}

export default function PartnerForm({ initialData }: PartnerFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEdit = !!initialData;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);

    let res;
    if (isEdit && initialData) {
      res = await updatePartnerAction(initialData.id, formData);
    } else {
      res = await createPartnerAction(formData);
    }

    setLoading(false);

    if (res.success) {
      router.push('/partners');
      router.refresh();
    } else {
      setError(res.error || 'An error occurred while saving the partner agency');
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl font-sans">
      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-xs font-bold text-rose-700 flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-4">
        <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
          <Building2 className="h-4 w-4 text-amber-600" />
          Partner Agency Information
        </h3>

        {/* Agency Name */}
        <div>
          <label className="block text-xs font-extrabold text-slate-900 uppercase tracking-wider mb-1.5">
            Partner Agency Name *
          </label>
          <input
            type="text"
            name="name"
            required
            defaultValue={initialData?.name || ''}
            placeholder="e.g. TalentEdge Search Partners"
            className="w-full bg-white border border-slate-300 rounded-xl px-4 py-2.5 text-xs text-slate-900 font-bold placeholder:text-slate-400 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all"
          />
        </div>

        {/* Contact Person & Email */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-extrabold text-slate-900 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <User className="h-3.5 w-3.5 text-amber-600" /> Contact Person
            </label>
            <input
              type="text"
              name="contactPerson"
              defaultValue={initialData?.contactPerson || ''}
              placeholder="e.g. Rajesh Kumar"
              className="w-full bg-white border border-slate-300 rounded-xl px-4 py-2.5 text-xs text-slate-900 font-bold placeholder:text-slate-400 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-extrabold text-slate-900 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <Mail className="h-3.5 w-3.5 text-amber-600" /> Email Address
            </label>
            <input
              type="email"
              name="email"
              defaultValue={initialData?.email || ''}
              placeholder="rajesh@talentedge.com"
              className="w-full bg-white border border-slate-300 rounded-xl px-4 py-2.5 text-xs text-slate-900 font-bold placeholder:text-slate-400 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all"
            />
          </div>
        </div>

        {/* Phone & Default Split */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-extrabold text-slate-900 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <Phone className="h-3.5 w-3.5 text-amber-600" /> Phone Number
            </label>
            <input
              type="text"
              name="phone"
              defaultValue={initialData?.phone || ''}
              placeholder="+91 98765 43210"
              className="w-full bg-white border border-slate-300 rounded-xl px-4 py-2.5 text-xs text-slate-900 font-bold placeholder:text-slate-400 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-extrabold text-slate-900 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <Percent className="h-3.5 w-3.5 text-amber-600" /> Default Revenue Split (%)
            </label>
            <input
              type="number"
              name="defaultSplitPercentage"
              min="0"
              max="100"
              step="0.5"
              defaultValue={initialData ? Number(initialData.defaultSplitPercentage) : 50}
              className="w-full bg-white border border-slate-300 rounded-xl px-4 py-2.5 text-xs text-slate-900 font-bold placeholder:text-slate-400 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all"
            />
          </div>
        </div>

        {/* Active Status (if edit) */}
        {isEdit && (
          <div className="flex items-center gap-3 pt-2">
            <input
              type="checkbox"
              id="isActive"
              name="isActive"
              defaultChecked={initialData?.isActive}
              className="h-4 w-4 rounded border-slate-300 bg-white text-amber-600 focus:ring-amber-500/20"
            />
            <label htmlFor="isActive" className="text-xs font-bold text-slate-900">
              Partner Agency Active
            </label>
          </div>
        )}

        {/* Notes */}
        <div>
          <label className="block text-xs font-extrabold text-slate-900 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
            <FileText className="h-3.5 w-3.5 text-amber-600" /> Collaboration Notes
          </label>
          <textarea
            name="notes"
            rows={3}
            defaultValue={initialData?.notes || ''}
            placeholder="Special terms, niche expertise (e.g. Specialized in Java Tech Stacks)"
            className="w-full bg-white border border-slate-300 rounded-xl p-3 text-xs text-slate-900 font-bold placeholder:text-slate-400 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all"
          />
        </div>
      </div>

      {/* Buttons */}
      <div className="flex items-center justify-between pt-2">
        <button
          type="button"
          onClick={() => router.back()}
          className="px-5 py-2.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-extrabold transition flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Cancel
        </button>

        <button
          type="submit"
          disabled={loading}
          className="px-6 py-2.5 bg-gradient-to-r from-amber-500 via-amber-600 to-yellow-600 hover:from-amber-600 hover:to-yellow-700 text-slate-950 rounded-xl text-xs font-black transition flex items-center gap-2 shadow-md shadow-amber-500/20 disabled:opacity-50"
        >
          <CheckCircle2 className="h-4 w-4 stroke-[2.5]" />
          {loading ? 'Saving...' : isEdit ? 'Update Partner' : 'Create Partner'}
        </button>
      </div>
    </form>
  );
}
