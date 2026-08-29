'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Building2, User, Mail, Phone, Percent, FileText, CheckCircle2, AlertCircle } from 'lucide-react';
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
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-xs text-red-400 flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="glass-panel p-6 rounded-2xl border border-slate-800/80 space-y-4">
        <h3 className="text-sm font-semibold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
          <Building2 className="h-4 w-4 text-purple-400" />
          Partner Agency Information
        </h3>

        {/* Agency Name */}
        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1.5">
            Partner Agency Name *
          </label>
          <input
            type="text"
            name="name"
            required
            defaultValue={initialData?.name || ''}
            placeholder="e.g. TalentEdge Search Partners"
            className="w-full bg-slate-900/80 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 transition"
          />
        </div>

        {/* Contact Person & Email */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5 flex items-center gap-1.5">
              <User className="h-3.5 w-3.5 text-slate-400" /> Contact Person
            </label>
            <input
              type="text"
              name="contactPerson"
              defaultValue={initialData?.contactPerson || ''}
              placeholder="e.g. Rajesh Kumar"
              className="w-full bg-slate-900/80 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 transition"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5 flex items-center gap-1.5">
              <Mail className="h-3.5 w-3.5 text-slate-400" /> Email Address
            </label>
            <input
              type="email"
              name="email"
              defaultValue={initialData?.email || ''}
              placeholder="rajesh@talentedge.com"
              className="w-full bg-slate-900/80 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 transition"
            />
          </div>
        </div>

        {/* Phone & Default Split */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5 flex items-center gap-1.5">
              <Phone className="h-3.5 w-3.5 text-slate-400" /> Phone Number
            </label>
            <input
              type="text"
              name="phone"
              defaultValue={initialData?.phone || ''}
              placeholder="+91 98765 43210"
              className="w-full bg-slate-900/80 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 transition"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5 flex items-center gap-1.5">
              <Percent className="h-3.5 w-3.5 text-slate-400" /> Default Revenue Split (%)
            </label>
            <input
              type="number"
              name="defaultSplitPercentage"
              min="0"
              max="100"
              step="0.5"
              defaultValue={initialData ? Number(initialData.defaultSplitPercentage) : 50}
              className="w-full bg-slate-900/80 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 transition"
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
              className="h-4 w-4 rounded border-slate-800 bg-slate-900 text-purple-600 focus:ring-purple-500/20"
            />
            <label htmlFor="isActive" className="text-xs font-medium text-slate-300">
              Partner Agency Active
            </label>
          </div>
        )}

        {/* Notes */}
        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1.5 flex items-center gap-1.5">
            <FileText className="h-3.5 w-3.5 text-slate-400" /> Collaboration Notes
          </label>
          <textarea
            name="notes"
            rows={3}
            defaultValue={initialData?.notes || ''}
            placeholder="Special terms, niche expertise (e.g. Specialized in Java Tech Stacks)"
            className="w-full bg-slate-900/80 border border-slate-800 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 transition"
          />
        </div>
      </div>

      {/* Buttons */}
      <div className="flex items-center justify-end gap-3">
        <button
          type="button"
          onClick={() => router.back()}
          className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl text-xs font-medium hover:bg-slate-700 transition"
        >
          Cancel
        </button>

        <button
          type="submit"
          disabled={loading}
          className="px-5 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl text-xs font-semibold hover:brightness-110 transition flex items-center gap-2 shadow-glow-purple disabled:opacity-50"
        >
          <CheckCircle2 className="h-4 w-4" />
          {loading ? 'Saving...' : isEdit ? 'Update Partner' : 'Create Partner'}
        </button>
      </div>
    </form>
  );
}
