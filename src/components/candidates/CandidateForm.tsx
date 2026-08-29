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
    <form onSubmit={handleSubmit} className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6 max-w-3xl font-sans">
      {errorMessage && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-xs font-bold text-rose-700">
          {errorMessage}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
        {/* First Name */}
        <div className="space-y-1.5">
          <label className="text-slate-900 font-extrabold uppercase tracking-wider text-[11px] flex items-center gap-1.5">
            <User className="h-3.5 w-3.5 text-amber-600" />
            First Name <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            name="firstName"
            defaultValue={initialData?.firstName || ''}
            placeholder="e.g. Rahul"
            required
            className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 font-bold placeholder:text-slate-400 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all"
          />
          {errors.firstName && <p className="text-[11px] font-bold text-rose-500">{errors.firstName}</p>}
        </div>

        {/* Last Name */}
        <div className="space-y-1.5">
          <label className="text-slate-900 font-extrabold uppercase tracking-wider text-[11px] flex items-center gap-1.5">
            <User className="h-3.5 w-3.5 text-amber-600" />
            Last Name <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            name="lastName"
            defaultValue={initialData?.lastName || ''}
            placeholder="e.g. Sharma"
            required
            className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 font-bold placeholder:text-slate-400 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all"
          />
          {errors.lastName && <p className="text-[11px] font-bold text-rose-500">{errors.lastName}</p>}
        </div>

        {/* Email */}
        <div className="space-y-1.5">
          <label className="text-slate-900 font-extrabold uppercase tracking-wider text-[11px] flex items-center gap-1.5">
            <Mail className="h-3.5 w-3.5 text-amber-600" />
            Email Address <span className="text-rose-500">*</span>
          </label>
          <input
            type="email"
            name="email"
            defaultValue={initialData?.email || ''}
            placeholder="e.g. rahul.sharma@example.com"
            required
            className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 font-bold placeholder:text-slate-400 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all"
          />
          {errors.email && <p className="text-[11px] font-bold text-rose-500">{errors.email}</p>}
        </div>

        {/* Phone */}
        <div className="space-y-1.5">
          <label className="text-slate-900 font-extrabold uppercase tracking-wider text-[11px] flex items-center gap-1.5">
            <Phone className="h-3.5 w-3.5 text-amber-600" />
            Phone Number <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            name="phone"
            defaultValue={initialData?.phone || ''}
            placeholder="e.g. +919876543210"
            required
            className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 font-bold placeholder:text-slate-400 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all"
          />
          {errors.phone && <p className="text-[11px] font-bold text-rose-500">{errors.phone}</p>}
        </div>

        {/* Current Company */}
        <div className="space-y-1.5">
          <label className="text-slate-900 font-extrabold uppercase tracking-wider text-[11px] flex items-center gap-1.5">
            <Building className="h-3.5 w-3.5 text-amber-600" />
            Current Company
          </label>
          <input
            type="text"
            name="currentCompany"
            defaultValue={initialData?.currentCompany || ''}
            placeholder="e.g. TechCorp Solutions"
            className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 font-bold placeholder:text-slate-400 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all"
          />
        </div>

        {/* Designation */}
        <div className="space-y-1.5">
          <label className="text-slate-900 font-extrabold uppercase tracking-wider text-[11px] flex items-center gap-1.5">
            <Briefcase className="h-3.5 w-3.5 text-amber-600" />
            Designation / Role
          </label>
          <input
            type="text"
            name="currentDesignation"
            defaultValue={initialData?.currentDesignation || ''}
            placeholder="e.g. Senior Software Engineer"
            className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 font-bold placeholder:text-slate-400 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all"
          />
        </div>

        {/* Total Experience */}
        <div className="space-y-1.5">
          <label className="text-slate-900 font-extrabold uppercase tracking-wider text-[11px] flex items-center gap-1.5">
            <Award className="h-3.5 w-3.5 text-amber-600" />
            Total Experience (Years)
          </label>
          <input
            type="number"
            step="0.5"
            min="0"
            name="totalExperienceYears"
            defaultValue={initialData?.totalExperienceYears ? String(initialData.totalExperienceYears) : ''}
            placeholder="e.g. 5.5"
            className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 font-bold placeholder:text-slate-400 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all"
          />
          {errors.totalExperienceYears && <p className="text-[11px] font-bold text-rose-500">{errors.totalExperienceYears}</p>}
        </div>

        {/* Current Location */}
        <div className="space-y-1.5">
          <label className="text-slate-900 font-extrabold uppercase tracking-wider text-[11px] flex items-center gap-1.5">
            <MapPin className="h-3.5 w-3.5 text-amber-600" />
            Location
          </label>
          <input
            type="text"
            name="currentLocation"
            defaultValue={initialData?.currentLocation || ''}
            placeholder="e.g. Bengaluru, India"
            className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 font-bold placeholder:text-slate-400 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all"
          />
        </div>

        {/* Candidate Source */}
        <div className="space-y-1.5 md:col-span-2">
          <label className="text-slate-900 font-extrabold uppercase tracking-wider text-[11px] flex items-center gap-1.5">
            <Layers className="h-3.5 w-3.5 text-amber-600" />
            Candidate Source
          </label>
          <select
            name="source"
            defaultValue={initialData?.source || 'DIRECT_INTAKE'}
            className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 font-bold focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all"
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
              {isEdit ? 'Update Candidate Profile' : 'Save Candidate Record'}
            </>
          )}
        </button>
      </div>
    </form>
  );
}
