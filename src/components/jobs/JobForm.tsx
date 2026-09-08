'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Briefcase,
  Building2,
  Users,
  DollarSign,
  Percent,
  Layers,
  Save,
  ArrowLeft,
  Loader2,
  ChevronDown,
  ChevronUp,
  Globe,
  GraduationCap,
  Sparkles,
  FileText,
  MapPin
} from 'lucide-react';
import { MandateStatus } from '@prisma/client';
import { JobActionResult } from '@/app/actions/jobs';

type ClientOption = {
  id: string;
  companyName: string;
};

export type JobInitialData = {
  id?: string;
  clientId?: string | null;
  clientName?: string;
  title?: string;
  industry?: string;
  employmentType?: string;
  experience?: string;
  education?: string;
  skills?: string;
  description?: string;
  companyOverview?: string;
  location?: string;
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
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);

  // Form State initialized with extracted or existing values
  const [title, setTitle] = useState(initialData?.title || '');
  const [companyName, setCompanyName] = useState(initialData?.clientName || '');
  const [industry, setIndustry] = useState(initialData?.industry || '');
  const [employmentType, setEmploymentType] = useState(initialData?.employmentType || 'Full-Time');
  const [experience, setExperience] = useState(initialData?.experience || '');
  const [education, setEducation] = useState(initialData?.education || '');
  const [skills, setSkills] = useState(initialData?.skills || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [companyOverview, setCompanyOverview] = useState(initialData?.companyOverview || '');
  const [location, setLocation] = useState(initialData?.location || '');

  // Advanced Optional Fields
  const [headcount, setHeadcount] = useState(initialData?.headcount ? String(initialData.headcount) : '1');
  const [minCtcLpa, setMinCtcLpa] = useState(initialData?.minCtcLpa ? String(initialData.minCtcLpa) : '');
  const [maxCtcLpa, setMaxCtcLpa] = useState(initialData?.maxCtcLpa ? String(initialData.maxCtcLpa) : '');
  const [feePercentage, setFeePercentage] = useState(initialData?.feePercentage ? String(initialData.feePercentage) : '8.33');
  const [status, setStatus] = useState<string>(initialData?.status || 'OPEN');

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setErrorMessage(null);

    const formData = new FormData();
    formData.append('title', title.trim() || 'Untitled Job Mandate');
    formData.append('companyName', companyName.trim());
    formData.append('industry', industry.trim());
    formData.append('employmentType', employmentType);
    formData.append('experience', experience.trim());
    formData.append('education', education.trim());
    formData.append('skills', skills.trim());
    formData.append('description', description.trim());
    formData.append('companyOverview', companyOverview.trim());
    formData.append('location', location.trim());

    formData.append('headcount', headcount || '1');
    if (minCtcLpa) formData.append('minCtcLpa', minCtcLpa);
    if (maxCtcLpa) formData.append('maxCtcLpa', maxCtcLpa);
    formData.append('feePercentage', feePercentage || '8.33');
    formData.append('status', status || 'OPEN');

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
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-8 max-w-4xl font-sans">
      {errorMessage && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-xs font-bold text-rose-700">
          {errorMessage}
        </div>
      )}

      {/* Primary Section: Recruiter Job Requirements */}
      <div className="space-y-6">
        <div className="border-b border-slate-200 pb-3">
          <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <Briefcase className="h-4 w-4 text-amber-500" />
            1. Job Requirement Profile
          </h2>
          <p className="text-xs text-slate-500 font-semibold mt-0.5">
            Key job specifications for candidate matching and client requirement intake
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
          {/* Position Title */}
          <div className="space-y-1.5 md:col-span-2">
            <label className="text-slate-900 font-extrabold uppercase tracking-wider text-[11px] block">
              Position Title <span className="text-rose-500 font-bold ml-0.5">*</span>
            </label>
            <input
              type="text"
              name="title"
              required
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g. Senior Full Stack Engineer (Node + React)"
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-bold placeholder:text-slate-400 focus:outline-none focus:border-amber-500 focus:bg-white focus:ring-2 focus:ring-amber-500/20 transition-all"
            />
          </div>

          {/* Company Name */}
          <div className="space-y-1.5">
            <label className="text-slate-900 font-extrabold uppercase tracking-wider text-[11px] flex items-center gap-1.5">
              <Building2 className="h-3.5 w-3.5 text-amber-600" />
              Company Name <span className="text-rose-500 font-bold ml-0.5">*</span>
            </label>
            <input
              type="text"
              name="companyName"
              required
              value={companyName}
              onChange={e => setCompanyName(e.target.value)}
              placeholder="e.g. Acme Corporation, Google, TCS..."
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-bold placeholder:text-slate-400 focus:outline-none focus:border-amber-500 focus:bg-white focus:ring-2 focus:ring-amber-500/20 transition-all"
            />
          </div>

          {/* Industry Type */}
          <div className="space-y-1.5">
            <label className="text-slate-900 font-extrabold uppercase tracking-wider text-[11px] flex items-center gap-1.5">
              <Globe className="h-3.5 w-3.5 text-amber-600" />
              Industry Type <span className="text-rose-500 font-bold ml-0.5">*</span>
            </label>
            <input
              type="text"
              name="industry"
              required
              value={industry}
              onChange={e => setIndustry(e.target.value)}
              placeholder="e.g. IT Services / FinTech / Healthcare"
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-bold placeholder:text-slate-400 focus:outline-none focus:border-amber-500 focus:bg-white transition-all"
            />
          </div>

          {/* Employment Type */}
          <div className="space-y-1.5">
            <label className="text-slate-900 font-extrabold uppercase tracking-wider text-[11px] block">
              Employment Type <span className="text-rose-500 font-bold ml-0.5">*</span>
            </label>
            <select
              name="employmentType"
              required
              value={employmentType}
              onChange={e => setEmploymentType(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-bold focus:outline-none focus:border-amber-500 focus:bg-white transition-all"
            >
              <option value="Full-Time">Full-Time (Permanent)</option>
              <option value="Contract">Contract</option>
              <option value="Part-Time">Part-Time</option>
              <option value="Remote">Remote</option>
              <option value="Hybrid">Hybrid</option>
            </select>
          </div>

          {/* Experience Required */}
          <div className="space-y-1.5">
            <label className="text-slate-900 font-extrabold uppercase tracking-wider text-[11px] block">
              Experience Required (Years) <span className="text-rose-500 font-bold ml-0.5">*</span>
            </label>
            <input
              type="text"
              name="experience"
              required
              value={experience}
              onChange={e => setExperience(e.target.value)}
              placeholder="e.g. 3 - 5 Years"
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-bold placeholder:text-slate-400 focus:outline-none focus:border-amber-500 focus:bg-white transition-all"
            />
          </div>

          {/* Job Location */}
          <div className="space-y-1.5">
            <label className="text-slate-900 font-extrabold uppercase tracking-wider text-[11px] flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5 text-amber-600" />
              Job Location <span className="text-rose-500 font-bold ml-0.5">*</span>
            </label>
            <input
              type="text"
              name="location"
              required
              value={location}
              onChange={e => setLocation(e.target.value)}
              placeholder="e.g. Bangalore, Mumbai, Remote, Hybrid, Delhi NCR..."
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-bold placeholder:text-slate-400 focus:outline-none focus:border-amber-500 focus:bg-white focus:ring-2 focus:ring-amber-500/20 transition-all"
            />
          </div>

          {/* Education Requirements */}
          <div className="space-y-1.5 md:col-span-2">
            <label className="text-slate-900 font-extrabold uppercase tracking-wider text-[11px] flex items-center gap-1.5">
              <GraduationCap className="h-3.5 w-3.5 text-amber-600" />
              Education Requirements <span className="text-rose-500 font-bold ml-0.5">*</span>
            </label>
            <input
              type="text"
              name="education"
              required
              value={education}
              onChange={e => setEducation(e.target.value)}
              placeholder="e.g. B.Tech / B.E. / M.C.A / M.B.A"
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-bold placeholder:text-slate-400 focus:outline-none focus:border-amber-500 focus:bg-white transition-all"
            />
          </div>

          {/* Key Skills */}
          <div className="space-y-1.5 md:col-span-2">
            <label className="text-slate-900 font-extrabold uppercase tracking-wider text-[11px] flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-amber-600" />
              Key Skills Required <span className="text-rose-500 font-bold ml-0.5">*</span>
            </label>
            <input
              type="text"
              name="skills"
              required
              value={skills}
              onChange={e => setSkills(e.target.value)}
              placeholder="e.g. React.js, Node.js, TypeScript, PostgreSQL, AWS"
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-bold placeholder:text-slate-400 focus:outline-none focus:border-amber-500 focus:bg-white transition-all"
            />
          </div>

          {/* Job Description */}
          <div className="space-y-1.5 md:col-span-2">
            <label className="text-slate-900 font-extrabold uppercase tracking-wider text-[11px] flex items-center gap-1.5">
              <FileText className="h-3.5 w-3.5 text-amber-600" />
              Job Description & Responsibilities <span className="text-rose-500 font-bold ml-0.5">*</span>
            </label>
            <textarea
              name="description"
              required
              rows={4}
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Detail job responsibilities, key deliverables, and team context..."
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-medium placeholder:text-slate-400 focus:outline-none focus:border-amber-500 focus:bg-white transition-all"
            />
          </div>

          {/* Company Overview */}
          <div className="space-y-1.5 md:col-span-2">
            <label className="text-slate-900 font-extrabold uppercase tracking-wider text-[11px] flex items-center gap-1.5">
              <Building2 className="h-3.5 w-3.5 text-amber-600" />
              Company Overview / About Company <span className="text-rose-500 font-bold ml-0.5">*</span>
            </label>
            <textarea
              name="companyOverview"
              required
              rows={3}
              value={companyOverview}
              onChange={e => setCompanyOverview(e.target.value)}
              placeholder="Company background, culture, mission, and work environment..."
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-medium placeholder:text-slate-400 focus:outline-none focus:border-amber-500 focus:bg-white transition-all"
            />
          </div>
        </div>
      </div>

      {/* Advanced Recruitment Details Section (Optional Collapsible Accordion) */}
      <div className="bg-slate-50 rounded-2xl border border-slate-200 overflow-hidden transition-all">
        <div
          onClick={() => setIsAdvancedOpen(!isAdvancedOpen)}
          className="p-5 flex items-center justify-between cursor-pointer hover:bg-slate-100/80 transition-colors select-none"
        >
          <div>
            <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Layers className="h-4 w-4 text-amber-600" />
              2. Advanced Recruitment Details (Optional)
            </h3>
            <p className="text-[11px] text-slate-500 font-semibold mt-0.5">
              Headcount, CTC salary budget, placement fees & pipeline status
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-white text-slate-600 border border-slate-200">
              {isAdvancedOpen ? 'Hide Details' : 'Show Details'}
            </span>
            {isAdvancedOpen ? <ChevronUp className="h-4 w-4 text-slate-500" /> : <ChevronDown className="h-4 w-4 text-slate-500" />}
          </div>
        </div>

        {isAdvancedOpen && (
          <div className="p-5 pt-0 border-t border-slate-200 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs mt-4">
            {/* Open Positions Headcount */}
            <div className="space-y-1.5">
              <label className="text-slate-900 font-extrabold uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                <Users className="h-3.5 w-3.5 text-amber-600" />
                Open Positions (Headcount)
              </label>
              <input
                type="number"
                name="headcount"
                min="1"
                value={headcount}
                onChange={e => setHeadcount(e.target.value)}
                placeholder="1"
                className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 font-bold focus:outline-none focus:border-amber-500 transition-all"
              />
            </div>

            {/* Fee Percentage */}
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
                value={feePercentage}
                onChange={e => setFeePercentage(e.target.value)}
                placeholder="8.33"
                className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 font-bold focus:outline-none focus:border-amber-500 transition-all"
              />
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
                value={minCtcLpa}
                onChange={e => setMinCtcLpa(e.target.value)}
                placeholder="e.g. 15.0"
                className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 font-bold focus:outline-none focus:border-amber-500 transition-all"
              />
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
                value={maxCtcLpa}
                onChange={e => setMaxCtcLpa(e.target.value)}
                placeholder="e.g. 25.0"
                className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 font-bold focus:outline-none focus:border-amber-500 transition-all"
              />
            </div>

            {/* Mandate Status */}
            <div className="space-y-1.5 md:col-span-2">
              <label className="text-slate-900 font-extrabold uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                <Layers className="h-3.5 w-3.5 text-amber-600" />
                Mandate Pipeline Status
              </label>
              <select
                name="status"
                value={status}
                onChange={e => setStatus(e.target.value)}
                className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 font-bold focus:outline-none focus:border-amber-500 transition-all"
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
        )}
      </div>

      {/* Buttons */}
      <div className="flex items-center justify-between pt-4 border-t border-slate-200">
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
              Saving Mandate...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 stroke-[2.5]" />
              {isEdit ? 'Update Job Mandate' : 'Save Job Mandate'}
            </>
          )}
        </button>
      </div>
    </form>
  );
}
