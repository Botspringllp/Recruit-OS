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
    <form onSubmit={handleSubmit} className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6 max-w-3xl font-sans">
      {errorMessage && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-xs font-bold text-rose-700">
          {errorMessage}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
        {/* Position Title */}
        <div className="space-y-1.5 md:col-span-2">
          <label className="text-slate-900 font-extrabold uppercase tracking-wider text-[11px] flex items-center gap-1.5">
            <Briefcase className="h-3.5 w-3.5 text-amber-600" />
            Position Title <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            name="title"
            defaultValue={initialData?.title || ''}
            placeholder="e.g. Senior Full Stack Engineer (Node + React)"
            required
            className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 font-bold placeholder:text-slate-400 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all"
          />
          {errors.title && <p className="text-[11px] font-bold text-rose-500">{errors.title}</p>}
        </div>

        {/* Client */}
        <div className="space-y-1.5">
          <label className="text-slate-900 font-extrabold uppercase tracking-wider text-[11px] flex items-center gap-1.5">
            <Building2 className="h-3.5 w-3.5 text-amber-600" />
            Client Company
          </label>
          <select
            name="clientId"
            defaultValue={initialData?.clientId || ''}
            className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 font-bold focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all"
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
          <label className="text-slate-900 font-extrabold uppercase tracking-wider text-[11px] flex items-center gap-1.5">
            <Users className="h-3.5 w-3.5 text-amber-600" />
            Open Positions (Headcount) <span className="text-rose-500">*</span>
          </label>
          <input
            type="number"
            name="headcount"
            min="1"
            defaultValue={initialData?.headcount || 1}
            required
            className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 font-bold placeholder:text-slate-400 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all"
          />
          {errors.headcount && <p className="text-[11px] font-bold text-rose-500">{errors.headcount}</p>}
        </div>

        {/* Min Salary */}
        <div className="space-y-1.5">
          <label className="text-slate-900 font-extrabold uppercase tracking-wider text-[11px] flex items-center gap-1.5">
            <DollarSign className="h-3.5 w-3.5 text-amber-600" />
            Min Salary (CTC LPA)
          </label>
          <input
            type="number"
            step="0.5"
            min="0"
            name="minCtcLpa"
            defaultValue={initialData?.minCtcLpa ? String(initialData.minCtcLpa) : ''}
            placeholder="e.g. 15.0"
            className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 font-bold placeholder:text-slate-400 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all"
          />
          {errors.minCtcLpa && <p className="text-[11px] font-bold text-rose-500">{errors.minCtcLpa}</p>}
        </div>

        {/* Max Salary */}
        <div className="space-y-1.5">
          <label className="text-slate-900 font-extrabold uppercase tracking-wider text-[11px] flex items-center gap-1.5">
            <DollarSign className="h-3.5 w-3.5 text-amber-600" />
            Max Salary (CTC LPA)
          </label>
          <input
            type="number"
            step="0.5"
            min="0"
            name="maxCtcLpa"
            defaultValue={initialData?.maxCtcLpa ? String(initialData.maxCtcLpa) : ''}
            placeholder="e.g. 25.0"
            className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 font-bold placeholder:text-slate-400 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all"
          />
          {errors.maxCtcLpa && <p className="text-[11px] font-bold text-rose-500">{errors.maxCtcLpa}</p>}
        </div>

        {/* Placement Fee Percentage */}
        <div className="space-y-1.5">
          <label className="text-slate-900 font-extrabold uppercase tracking-wider text-[11px] flex items-center gap-1.5">
            <Percent className="h-3.5 w-3.5 text-amber-600" />
            Fee Percentage (%)
          </label>
          <input
            type="number"
            step="0.01"
            min="0"
            name="feePercentage"
            defaultValue={initialData?.feePercentage ? String(initialData.feePercentage) : '8.33'}
            placeholder="e.g. 8.33"
            className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 font-bold placeholder:text-slate-400 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all"
          />
        </div>

        {/* Mandate Status */}
        <div className="space-y-1.5">
          <label className="text-slate-900 font-extrabold uppercase tracking-wider text-[11px] flex items-center gap-1.5">
            <Layers className="h-3.5 w-3.5 text-amber-600" />
            Mandate Status
          </label>
          <select
            name="status"
            defaultValue={initialData?.status || 'OPEN'}
            className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 font-bold focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all"
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
      <div className="flex items-center justify-between pt-6 border-t border-slate-100">
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
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 stroke-[2.5]" />
              {isEdit ? 'Update Mandate' : 'Create Job Mandate'}
            </>
          )}
        </button>
      </div>
    </form>
  );
}
