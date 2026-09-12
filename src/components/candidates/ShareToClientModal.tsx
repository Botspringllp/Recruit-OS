'use client';

import React, { useState, useEffect } from 'react';
import {
  Share2,
  X,
  Briefcase,
  Building2,
  MessageSquare,
  Loader2,
  AlertCircle
} from 'lucide-react';
import {
  getActiveMandatesForShareAction,
  createCandidateSubmissionsAction,
  ActiveJobOption
} from '@/app/actions/clientSubmissions';

interface ShareToClientModalProps {
  isOpen: boolean;
  selectedCandidateIds: string[];
  onClose: () => void;
  onSuccess: () => void;
}

export function ShareToClientModal({
  isOpen,
  selectedCandidateIds,
  onClose,
  onSuccess
}: ShareToClientModalProps) {
  const [jobs, setJobs] = useState<ActiveJobOption[]>([]);
  const [selectedJobId, setSelectedJobId] = useState<string>('');
  const [recruiterMessage, setRecruiterMessage] = useState<string>('');

  const [isLoadingJobs, setIsLoadingJobs] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch active mandates when modal opens
  useEffect(() => {
    if (isOpen) {
      setError(null);
      setSelectedJobId('');
      setRecruiterMessage('');
      fetchJobs();
    }
  }, [isOpen]);

  async function fetchJobs() {
    setIsLoadingJobs(true);
    const res = await getActiveMandatesForShareAction();
    setIsLoadingJobs(false);

    if (res.success && res.jobs) {
      setJobs(res.jobs);
      if (res.jobs.length > 0) {
        setSelectedJobId(res.jobs[0].id);
      }
    } else {
      setError(res.error || 'Failed to load active job mandates.');
    }
  }

  const selectedJob = jobs.find(j => j.id === selectedJobId);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedJobId) {
      setError('Please select a Job Mandate.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const res = await createCandidateSubmissionsAction({
      candidateIds: selectedCandidateIds,
      jobId: selectedJobId,
      recruiterMessage: recruiterMessage.trim() || undefined
    });

    setIsSubmitting(false);

    if (res.success && res.reviewUrl) {
      const mailtoUrl = `mailto:?subject=${encodeURIComponent(
        res.emailSubject || ''
      )}&body=${encodeURIComponent(res.emailBodyText || '')}`;

      // 1. Immediately trigger Email App draft
      try {
        window.location.href = mailtoUrl;
      } catch (err) {
        console.warn('Mailto trigger warning:', err);
      }

      // 2. Immediately close modal and clear selection (no intermediate success page)
      onSuccess();
      onClose();
    } else {
      setError(res.error || 'Failed to submit candidates to client.');
    }
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200 font-sans">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="p-6 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
              <Share2 className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-black text-base tracking-tight text-white">
                Share Candidates to Client
              </h3>
              <p className="text-xs font-semibold text-slate-400">
                Submitting {selectedCandidateIds.length} candidate(s) for client review
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body Form */}
        <div className="p-6 space-y-5">
          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            {error && (
              <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl text-rose-900 font-extrabold flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* 1. Job Mandate Selection */}
            <div>
              <label className="block text-[11px] font-extrabold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Briefcase className="h-3.5 w-3.5 text-amber-500" />
                Job Mandate (Required)
              </label>
              {isLoadingJobs ? (
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-500 font-bold flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin text-amber-500" />
                  <span>Loading active mandates...</span>
                </div>
              ) : jobs.length > 0 ? (
                <select
                  value={selectedJobId}
                  onChange={e => setSelectedJobId(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:outline-none focus:border-amber-500 transition"
                >
                  {jobs.map(job => (
                    <option key={job.id} value={job.id}>
                      {job.title} ({job.companyName})
                    </option>
                  ))}
                </select>
              ) : (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 font-bold">
                  No active job mandates found. Please create an active job mandate first.
                </div>
              )}
            </div>

            {/* 2. Client Auto-Resolution */}
            {selectedJob && (
              <div className="p-3.5 bg-amber-50/80 border border-amber-200/80 rounded-2xl flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <Building2 className="h-4 w-4 text-amber-600 shrink-0" />
                  <div>
                    <span className="text-[10px] font-extrabold text-amber-800 uppercase tracking-wider block">Target Client</span>
                    <span className="font-black text-slate-900 text-xs">{selectedJob.companyName}</span>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-white text-slate-800 border border-amber-300">
                  Auto-Resolved
                </span>
              </div>
            )}

            {/* 3. Recruiter Message */}
            <div>
              <label className="block text-[11px] font-extrabold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <MessageSquare className="h-3.5 w-3.5 text-amber-500" />
                Recruiter Message / Cover Note (Optional)
              </label>
              <textarea
                rows={3}
                value={recruiterMessage}
                onChange={e => setRecruiterMessage(e.target.value)}
                placeholder="e.g. Please find shortlisted profiles for Frontend Developer. All candidates are available for round 1 interviews this week."
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:outline-none focus:border-amber-500 transition resize-y text-xs"
              />
            </div>

            {/* Form Action Buttons */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-extrabold transition cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={isSubmitting || !selectedJobId}
                className="px-5 py-2.5 bg-gradient-to-r from-amber-500 via-amber-600 to-yellow-600 hover:from-amber-600 hover:to-yellow-700 text-slate-950 rounded-xl text-xs font-black transition flex items-center gap-2 shadow-md shadow-amber-500/20 cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Opening Email App...</span>
                  </>
                ) : (
                  <>
                    <Share2 className="h-4 w-4 stroke-[2.5]" />
                    <span>Share to Client ({selectedCandidateIds.length})</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
