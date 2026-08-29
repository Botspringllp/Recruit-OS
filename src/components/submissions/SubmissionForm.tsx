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
    <form onSubmit={handleSubmit} className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-6 max-w-2xl">
      {errorMessage && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-300">
          {errorMessage}
        </div>
      )}

      <div className="space-y-5 text-xs">
        {/* Candidate Selection */}
        <div className="space-y-1.5">
          <label className="text-slate-300 font-medium flex items-center gap-1.5">
            <UserCheck className="h-3.5 w-3.5 text-brand-400" />
            Select Candidate <span className="text-rose-400">*</span>
          </label>
          <select
            name="candidateId"
            required
            className="w-full px-3.5 py-2.5 bg-slate-900/80 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-brand-500 transition"
          >
            <option value="">-- Choose Candidate --</option>
            {candidates.map((c) => (
              <option key={c.id} value={c.id}>
                {c.firstName} {c.lastName} ({c.email}) {c.currentDesignation ? `- ${c.currentDesignation}` : ''}
              </option>
            ))}
          </select>
          {errors.candidateId && <p className="text-[11px] text-rose-400">{errors.candidateId}</p>}
        </div>

        {/* Job Mandate Selection */}
        <div className="space-y-1.5">
          <label className="text-slate-300 font-medium flex items-center gap-1.5">
            <Briefcase className="h-3.5 w-3.5 text-indigo-400" />
            Select Job Mandate Requisition <span className="text-rose-400">*</span>
          </label>
          <select
            name="jobId"
            required
            className="w-full px-3.5 py-2.5 bg-slate-900/80 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-brand-500 transition"
          >
            <option value="">-- Choose Job Mandate --</option>
            {jobs.map((j) => (
              <option key={j.id} value={j.id}>
                {j.title} {j.clientName ? `[${j.clientName}]` : ''}
              </option>
            ))}
          </select>
          {errors.jobId && <p className="text-[11px] text-rose-400">{errors.jobId}</p>}
        </div>

        {/* Recruiter Intake Notes */}
        <div className="space-y-1.5">
          <label className="text-slate-300 font-medium flex items-center gap-1.5">
            <FileText className="h-3.5 w-3.5 text-cyan-400" />
            Recruiter Intake & Screening Notes
          </label>
          <textarea
            name="notes"
            rows={4}
            placeholder="Add candidate evaluation summary, notice period flexibility, expected CTC breakdown..."
            className="w-full px-3.5 py-2.5 bg-slate-900/80 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 transition"
          />
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
              Submitting Candidate...
            </>
          ) : (
            <>
              <Send className="h-4 w-4" />
              Submit Candidate to Pipeline
            </>
          )}
        </button>
      </div>
    </form>
  );
}
