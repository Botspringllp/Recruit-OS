'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { User, Mail, Phone, Building, Briefcase, MapPin, Award, Layers, Save, ArrowLeft, Loader2 } from 'lucide-react';
import { CandidateSource } from '@prisma/client';
import { ActionResult } from '@/app/actions/candidates';

type CandidateInitialData = {
  id?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  currentCompany?: string | null;
  currentDesignation?: string | null;
  totalExperienceYears?: number | null | any;
  currentLocation?: string | null;
  source?: CandidateSource | string;
};

interface CandidateFormProps {
  initialData?: CandidateInitialData;
  action: (prevState: any, formData: FormData) => Promise<ActionResult>;
  isEdit?: boolean;
}

export function CandidateForm({ initialData, action, isEdit = false }: CandidateFormProps) {
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
      if (res.candidateId && !isEdit) {
        router.push(`/candidates/${res.candidateId}`);
      } else if (initialData?.id) {
        router.push(`/candidates/${initialData.id}`);
      } else {
        router.push('/candidates');
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
        {/* First Name */}
        <div className="space-y-1.5">
          <label className="text-slate-300 font-medium flex items-center gap-1.5">
            <User className="h-3.5 w-3.5 text-brand-400" />
            First Name <span className="text-rose-400">*</span>
          </label>
          <input
            type="text"
            name="firstName"
            defaultValue={initialData?.firstName || ''}
            placeholder="e.g. Rahul"
            required
            className="w-full px-3.5 py-2.5 bg-slate-900/80 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 transition"
          />
          {errors.firstName && <p className="text-[11px] text-rose-400">{errors.firstName}</p>}
        </div>

        {/* Last Name */}
        <div className="space-y-1.5">
          <label className="text-slate-300 font-medium flex items-center gap-1.5">
            <User className="h-3.5 w-3.5 text-brand-400" />
            Last Name <span className="text-rose-400">*</span>
          </label>
          <input
            type="text"
            name="lastName"
            defaultValue={initialData?.lastName || ''}
            placeholder="e.g. Sharma"
            required
            className="w-full px-3.5 py-2.5 bg-slate-900/80 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 transition"
          />
          {errors.lastName && <p className="text-[11px] text-rose-400">{errors.lastName}</p>}
        </div>

        {/* Email */}
        <div className="space-y-1.5">
          <label className="text-slate-300 font-medium flex items-center gap-1.5">
            <Mail className="h-3.5 w-3.5 text-cyan-400" />
            Email Address <span className="text-rose-400">*</span>
          </label>
          <input
            type="email"
            name="email"
            defaultValue={initialData?.email || ''}
            placeholder="e.g. rahul.sharma@example.com"
            required
            className="w-full px-3.5 py-2.5 bg-slate-900/80 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 transition"
          />
          {errors.email && <p className="text-[11px] text-rose-400">{errors.email}</p>}
        </div>

        {/* Phone */}
        <div className="space-y-1.5">
          <label className="text-slate-300 font-medium flex items-center gap-1.5">
            <Phone className="h-3.5 w-3.5 text-emerald-400" />
            Phone Number <span className="text-rose-400">*</span>
          </label>
          <input
            type="text"
            name="phone"
            defaultValue={initialData?.phone || ''}
            placeholder="e.g. +919876543210"
            required
            className="w-full px-3.5 py-2.5 bg-slate-900/80 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 transition"
          />
          {errors.phone && <p className="text-[11px] text-rose-400">{errors.phone}</p>}
        </div>

        {/* Current Company */}
        <div className="space-y-1.5">
          <label className="text-slate-300 font-medium flex items-center gap-1.5">
            <Building className="h-3.5 w-3.5 text-slate-400" />
            Current Company
          </label>
          <input
            type="text"
            name="currentCompany"
            defaultValue={initialData?.currentCompany || ''}
            placeholder="e.g. TechCorp Solutions"
            className="w-full px-3.5 py-2.5 bg-slate-900/80 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 transition"
          />
        </div>

        {/* Designation */}
        <div className="space-y-1.5">
          <label className="text-slate-300 font-medium flex items-center gap-1.5">
            <Briefcase className="h-3.5 w-3.5 text-indigo-400" />
            Designation / Role
          </label>
          <input
            type="text"
            name="currentDesignation"
            defaultValue={initialData?.currentDesignation || ''}
            placeholder="e.g. Senior Software Engineer"
            className="w-full px-3.5 py-2.5 bg-slate-900/80 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 transition"
          />
        </div>

        {/* Total Experience */}
        <div className="space-y-1.5">
          <label className="text-slate-300 font-medium flex items-center gap-1.5">
            <Award className="h-3.5 w-3.5 text-amber-400" />
            Total Experience (Years)
          </label>
          <input
            type="number"
            step="0.5"
            min="0"
            name="totalExperienceYears"
            defaultValue={initialData?.totalExperienceYears ? String(initialData.totalExperienceYears) : ''}
            placeholder="e.g. 5.5"
            className="w-full px-3.5 py-2.5 bg-slate-900/80 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 transition"
          />
          {errors.totalExperienceYears && <p className="text-[11px] text-rose-400">{errors.totalExperienceYears}</p>}
        </div>

        {/* Current Location */}
        <div className="space-y-1.5">
          <label className="text-slate-300 font-medium flex items-center gap-1.5">
            <MapPin className="h-3.5 w-3.5 text-rose-400" />
            Location
          </label>
          <input
            type="text"
            name="currentLocation"
            defaultValue={initialData?.currentLocation || ''}
            placeholder="e.g. Bengaluru, India"
            className="w-full px-3.5 py-2.5 bg-slate-900/80 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 transition"
          />
        </div>

        {/* Candidate Source */}
        <div className="space-y-1.5 md:col-span-2">
          <label className="text-slate-300 font-medium flex items-center gap-1.5">
            <Layers className="h-3.5 w-3.5 text-purple-400" />
            Candidate Source
          </label>
          <select
            name="source"
            defaultValue={initialData?.source || 'DIRECT_INTAKE'}
            className="w-full px-3.5 py-2.5 bg-slate-900/80 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-brand-500 transition"
          >
            <option value="DIRECT_INTAKE">Direct Intake</option>
            <option value="LINKEDIN">LinkedIn</option>
            <option value="PORTAL_JOB_BOARD">Portal Job Board</option>
            <option value="REFERRAL">Referral</option>
            <option value="AGENCY_PARTNER">Agency Partner</option>
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
              {isEdit ? 'Update Candidate Profile' : 'Save Candidate Record'}
            </>
          )}
        </button>
      </div>
    </form>
  );
}
