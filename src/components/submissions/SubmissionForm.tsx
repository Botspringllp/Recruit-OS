'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { UserCheck, Briefcase, FileText, Send, ArrowLeft, Loader2 } from 'lucide-react';
import { SubmissionActionResult } from '@/app/actions/submissions';

type CandidateOption = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  currentDesignation?: string | null;
};

type JobOption = {
  id: string;
  title: string;
  clientName?: string;
};

interface SubmissionFormProps {
  candidates: CandidateOption[];
  jobs: JobOption[];
  action: (prevState: any, formData: FormData) => Promise<SubmissionActionResult>;
}

export function SubmissionForm({ candidates, jobs, action }: SubmissionFormProps) {
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
      if (res.submissionId) {
        router.push(`/submissions/${res.submissionId}`);
      } else {
        router.push('/submissions');
      }
      router.refresh();
    } else {
      if (res.error) setErrorMessage(res.error);
      if (res.errors) setErrors(res.errors);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6 max-w-2xl font-sans">
      {errorMessage && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-xs font-bold text-rose-700">
          {errorMessage}
        </div>
      )}

      <div className="space-y-5 text-xs">
        {/* Candidate Selection */}
        <div className="space-y-1.5">
          <label className="text-slate-900 font-extrabold uppercase tracking-wider text-[11px] flex items-center gap-1.5">
            <UserCheck className="h-3.5 w-3.5 text-amber-600" />
            Select Candidate <span className="text-rose-500">*</span>
          </label>
          <select
            name="candidateId"
            required
            className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 font-bold focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all"
          >
            <option value="">-- Choose Candidate --</option>
            {candidates.map((c) => (
              <option key={c.id} value={c.id}>
                {c.firstName} {c.lastName} ({c.email}) {c.currentDesignation ? `- ${c.currentDesignation}` : ''}
              </option>
            ))}
          </select>
          {errors.candidateId && <p className="text-[11px] font-bold text-rose-500">{errors.candidateId}</p>}
        </div>

        {/* Job Mandate Selection */}
        <div className="space-y-1.5">
          <label className="text-slate-900 font-extrabold uppercase tracking-wider text-[11px] flex items-center gap-1.5">
            <Briefcase className="h-3.5 w-3.5 text-amber-600" />
            Select Job Mandate Requisition <span className="text-rose-500">*</span>
          </label>
          <select
            name="jobId"
            required
            className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 font-bold focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all"
          >
            <option value="">-- Choose Job Mandate --</option>
            {jobs.map((j) => (
              <option key={j.id} value={j.id}>
                {j.title} {j.clientName ? `[${j.clientName}]` : ''}
              </option>
            ))}
          </select>
          {errors.jobId && <p className="text-[11px] font-bold text-rose-500">{errors.jobId}</p>}
        </div>

        {/* Recruiter Intake Notes */}
        <div className="space-y-1.5">
          <label className="text-slate-900 font-extrabold uppercase tracking-wider text-[11px] flex items-center gap-1.5">
            <FileText className="h-3.5 w-3.5 text-amber-600" />
            Recruiter Intake & Screening Notes
          </label>
          <textarea
            name="notes"
            rows={4}
            placeholder="Add candidate evaluation summary, notice period flexibility, expected CTC breakdown..."
            className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 font-bold placeholder:text-slate-400 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all"
          />
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
              Submitting Candidate...
            </>
          ) : (
            <>
              <Send className="h-4 w-4 stroke-[2.5]" />
              Submit Candidate to Pipeline
            </>
          )}
        </button>
      </div>
    </form>
  );
}
