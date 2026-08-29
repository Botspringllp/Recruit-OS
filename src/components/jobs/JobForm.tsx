'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Briefcase, Building2, Users, DollarSign, Percent, Layers, Save, ArrowLeft, Loader2 } from 'lucide-react';
import { MandateStatus } from '@prisma/client';
import { JobActionResult } from '@/app/actions/jobs';

type ClientOption = {
  id: string;
  companyName: string;
};

type JobInitialData = {
  id?: string;
  clientId?: string | null;
  title?: string;
  headcount?: number;
  minCtcLpa?: number | null | any;
  maxCtcLpa?: number | null | any;
  feePercentage?: number | null | any;
  status?: MandateStatus | string;
};

interface JobFormProps {
  clients: ClientOption[];
  initialData?: JobInitialData;
  action: (prevState: any, formData: FormData) => Promise<JobActionResult>;
  isEdit?: boolean;
}

export function JobForm({ clients, initialData, action, isEdit = false }: JobFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setErrorMessage(null);
    setErrors({});

    const formData = new FormData(e.currentTarget);
    const res = await action(null, formData);

    setLoading(false);

    if (res.success) {
      if (res.jobId && !isEdit) {
        router.push(`/jobs/${res.jobId}`);
      } else if (initialData?.id) {
        router.push(`/jobs/${initialData.id}`);
      } else {
        router.push('/jobs');
      }
      router.refresh();
    } else {
      if (res.error) setErrorMessage(res.error);
      if (res.errors) setErrors(res.errors);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-6 max-w-3xl">
      {errorMessage && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-300">
          {errorMessage}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
        {/* Position Title */}
        <div className="space-y-1.5 md:col-span-2">
          <label className="text-slate-300 font-medium flex items-center gap-1.5">
            <Briefcase className="h-3.5 w-3.5 text-indigo-400" />
            Position Title <span className="text-rose-400">*</span>
          </label>
          <input
            type="text"
            name="title"
            defaultValue={initialData?.title || ''}
            placeholder="e.g. Senior Full Stack Engineer (Node + React)"
            required
            className="w-full px-3.5 py-2.5 bg-slate-900/80 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 transition font-medium"
          />
          {errors.title && <p className="text-[11px] text-rose-400">{errors.title}</p>}
        </div>

        {/* Client */}
        <div className="space-y-1.5">
          <label className="text-slate-300 font-medium flex items-center gap-1.5">
            <Building2 className="h-3.5 w-3.5 text-slate-400" />
            Client Company
          </label>
          <select
            name="clientId"
            defaultValue={initialData?.clientId || ''}
            className="w-full px-3.5 py-2.5 bg-slate-900/80 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-brand-500 transition"
          >
            <option value="">Unassigned Client</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.companyName}
              </option>
            ))}
          </select>
        </div>

        {/* Open Positions Headcount */}
        <div className="space-y-1.5">
          <label className="text-slate-300 font-medium flex items-center gap-1.5">
            <Users className="h-3.5 w-3.5 text-brand-400" />
            Open Positions (Headcount) <span className="text-rose-400">*</span>
          </label>
          <input
            type="number"
            name="headcount"
            min="1"
            defaultValue={initialData?.headcount || 1}
            required
            className="w-full px-3.5 py-2.5 bg-slate-900/80 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 transition"
          />
          {errors.headcount && <p className="text-[11px] text-rose-400">{errors.headcount}</p>}
        </div>

        {/* Min Salary */}
        <div className="space-y-1.5">
          <label className="text-slate-300 font-medium flex items-center gap-1.5">
            <DollarSign className="h-3.5 w-3.5 text-emerald-400" />
            Min Salary (CTC LPA)
          </label>
          <input
            type="number"
            step="0.5"
            min="0"
            name="minCtcLpa"
            defaultValue={initialData?.minCtcLpa ? String(initialData.minCtcLpa) : ''}
            placeholder="e.g. 15.0"
            className="w-full px-3.5 py-2.5 bg-slate-900/80 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 transition"
          />
          {errors.minCtcLpa && <p className="text-[11px] text-rose-400">{errors.minCtcLpa}</p>}
        </div>

        {/* Max Salary */}
        <div className="space-y-1.5">
          <label className="text-slate-300 font-medium flex items-center gap-1.5">
            <DollarSign className="h-3.5 w-3.5 text-emerald-400" />
            Max Salary (CTC LPA)
          </label>
          <input
            type="number"
            step="0.5"
            min="0"
            name="maxCtcLpa"
            defaultValue={initialData?.maxCtcLpa ? String(initialData.maxCtcLpa) : ''}
            placeholder="e.g. 25.0"
            className="w-full px-3.5 py-2.5 bg-slate-900/80 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 transition"
          />
          {errors.maxCtcLpa && <p className="text-[11px] text-rose-400">{errors.maxCtcLpa}</p>}
        </div>

        {/* Placement Fee Percentage */}
        <div className="space-y-1.5">
          <label className="text-slate-300 font-medium flex items-center gap-1.5">
            <Percent className="h-3.5 w-3.5 text-purple-400" />
            Fee Percentage (%)
          </label>
          <input
            type="number"
            step="0.01"
            min="0"
            name="feePercentage"
            defaultValue={initialData?.feePercentage ? String(initialData.feePercentage) : '8.33'}
            placeholder="e.g. 8.33"
            className="w-full px-3.5 py-2.5 bg-slate-900/80 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 transition"
          />
        </div>

        {/* Mandate Status */}
        <div className="space-y-1.5">
          <label className="text-slate-300 font-medium flex items-center gap-1.5">
            <Layers className="h-3.5 w-3.5 text-cyan-400" />
            Mandate Status
          </label>
          <select
            name="status"
            defaultValue={initialData?.status || 'OPEN'}
            className="w-full px-3.5 py-2.5 bg-slate-900/80 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-brand-500 transition"
          >
            <option value="DRAFT">DRAFT</option>
            <option value="OPEN">OPEN</option>
            <option value="ACTIVE">ACTIVE</option>
            <option value="ON_HOLD">ON_HOLD</option>
            <option value="PAUSED">PAUSED</option>
            <option value="FILLED">FILLED</option>
            <option value="CLOSED">CLOSED</option>
            <option value="CANCELLED">CANCELLED</option>
          </select>
        </div>
      </div>

      {/* Buttons */}
      <div className="flex items-center justify-between pt-4 border-t border-slate-800/80">
        <button
          type="button"
          onClick={() => router.back()}
          className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Cancel
        </button>

        <button
          type="submit"
          disabled={loading}
          className="px-5 py-2.5 bg-gradient-to-r from-brand-600 to-indigo-600 text-white rounded-xl text-xs font-semibold hover:brightness-110 transition flex items-center gap-2 shadow-glow-brand disabled:opacity-50"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              {isEdit ? 'Update Mandate' : 'Create Job Mandate'}
            </>
          )}
        </button>
      </div>
    </form>
  );
}
