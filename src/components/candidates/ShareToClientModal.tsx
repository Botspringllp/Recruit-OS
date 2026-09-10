'use client';

import React, { useState, useEffect } from 'react';
import {
  Share2,
  X,
  Briefcase,
  Building2,
  MessageSquare,
  Loader2,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Mail,
  Send,
  ArrowLeft,
  ArrowRight,
  Eye,
  FileText
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
  const [step, setStep] = useState<1 | 2>(1); // Step 1: Configure, Step 2: Email Preview & Send
  const [jobs, setJobs] = useState<ActiveJobOption[]>([]);
  const [selectedJobId, setSelectedJobId] = useState<string>('');
  const [recruiterMessage, setRecruiterMessage] = useState<string>('');
  const [recipientEmail, setRecipientEmail] = useState<string>('');
  const [emailSubject, setEmailSubject] = useState<string>('');

  const [isLoadingJobs, setIsLoadingJobs] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [successData, setSuccessData] = useState<{
    count: number;
    reviewUrl: string;
  } | null>(null);

  // Fetch active mandates when modal opens
  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setError(null);
      setSuccessData(null);
      setSelectedJobId('');
      setRecruiterMessage('');
      setRecipientEmail('');
      setEmailSubject('');
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
        const firstJob = res.jobs[0];
        setSelectedJobId(firstJob.id);
        if (firstJob.defaultContactEmail) {
          setRecipientEmail(firstJob.defaultContactEmail);
        }
        setEmailSubject(`Candidate Profiles for Review – ${firstJob.title}`);
      }
    } else {
      setError(res.error || 'Failed to load active job mandates.');
    }
  }

  const selectedJob = jobs.find(j => j.id === selectedJobId);

  // Update default email & subject when job selection changes
  function handleJobChange(jobId: string) {
    setSelectedJobId(jobId);
    const found = jobs.find(j => j.id === jobId);
    if (found) {
      if (found.defaultContactEmail) {
        setRecipientEmail(found.defaultContactEmail);
      }
      setEmailSubject(`Candidate Profiles for Review – ${found.title}`);
    }
  }

  function handleGoToPreview(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedJobId) {
      setError('Please select a Job Mandate.');
      return;
    }
    setError(null);
    setStep(2);
  }

  async function handleSendEmail() {
    if (!recipientEmail || !recipientEmail.includes('@')) {
      setError('Please enter a valid recipient email address.');
      return;
    }

    if (!emailSubject.trim()) {
      setError('Please enter an email subject.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const res = await createCandidateSubmissionsAction({
      candidateIds: selectedCandidateIds,
      jobId: selectedJobId,
      recipientEmail: recipientEmail.trim(),
      emailSubject: emailSubject.trim(),
      recruiterMessage: recruiterMessage.trim() || undefined
    });

    setIsSubmitting(false);

    if (res.success && res.reviewUrl) {
      setSuccessData({
        count: res.count || selectedCandidateIds.length,
        reviewUrl: res.reviewUrl
      });
      setTimeout(() => {
        onSuccess();
      }, 5000);
    } else {
      setError(res.error || 'Failed to submit candidates to client.');
    }
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200 font-sans">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Modal Header */}
        <div className="p-5 sm:p-6 bg-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
              {step === 1 ? <Share2 className="h-5 w-5" /> : <Mail className="h-5 w-5" />}
            </div>
            <div>
              <h3 className="font-black text-base tracking-tight text-white flex items-center gap-2">
                Share Candidates to Client
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  Step {step} of 2
                </span>
              </h3>
              <p className="text-xs font-semibold text-slate-400">
                {step === 1
                  ? `Select Job Mandate for ${selectedCandidateIds.length} candidate(s)`
                  : `Review draft email & confirm sending to client`}
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

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1 text-xs text-slate-800">
          {successData ? (
            <div className="py-8 text-center space-y-4">
              <div className="h-16 w-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto border border-emerald-200">
                <CheckCircle2 className="h-10 w-10" />
              </div>
              <div className="space-y-1.5">
                <h4 className="font-black text-xl text-slate-900">Email Sent & Candidates Shared!</h4>
                <p className="text-xs font-semibold text-slate-600 max-w-md mx-auto">
                  {successData.count} candidate profile(s) submitted to <strong>{selectedJob?.companyName}</strong> via email to <strong>{recipientEmail}</strong>.
                </p>
              </div>

              <div className="pt-4">
                <a
                  href={successData.reviewUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="px-5 py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl text-xs font-black inline-flex items-center gap-2 transition shadow-lg"
                >
                  <ExternalLink className="h-4 w-4 text-amber-400" />
                  <span>Open Client Review Portal</span>
                </a>
              </div>
            </div>
          ) : step === 1 ? (
            /* STEP 1: JOB SELECTION & RECRUITER NOTE */
            <form onSubmit={handleGoToPreview} className="space-y-5">
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
                  <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-slate-500 font-bold flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin text-amber-500" />
                    <span>Loading active job mandates...</span>
                  </div>
                ) : jobs.length > 0 ? (
                  <select
                    value={selectedJobId}
                    onChange={e => handleJobChange(e.target.value)}
                    required
                    className="w-full px-3.5 py-3 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-900 focus:outline-none focus:border-amber-500 transition"
                  >
                    {jobs.map(job => (
                      <option key={job.id} value={job.id}>
                        {job.title} — ({job.companyName})
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl text-rose-800 font-bold">
                    No active job mandates found. Please create an active job mandate first.
                  </div>
                )}
              </div>

              {/* 2. Target Client Display */}
              {selectedJob && (
                <div className="p-4 bg-amber-50/80 border border-amber-200/80 rounded-2xl flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 border border-amber-500/20">
                      <Building2 className="h-5 w-5" />
                    </div>
                    <div>
                      <span className="text-[10px] font-extrabold text-amber-800 uppercase tracking-wider block">Target Client Company</span>
                      <span className="font-black text-slate-900 text-sm">{selectedJob.companyName}</span>
                    </div>
                  </div>
                  <span className="px-3 py-1 rounded-full text-[10px] font-black bg-white text-slate-800 border border-amber-300 shadow-sm">
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
                  className="w-full px-3.5 py-3 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-900 focus:outline-none focus:border-amber-500 transition resize-y text-xs"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-extrabold transition cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={!selectedJobId}
                  className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-black transition flex items-center gap-2 shadow cursor-pointer disabled:opacity-50"
                >
                  <span>Preview & Edit Email</span>
                  <ArrowRight className="h-4 w-4 text-amber-400" />
                </button>
              </div>
            </form>
          ) : (
            /* STEP 2: EMAIL PREVIEW & CONFIRM SEND */
            <div className="space-y-5">
              {error && (
                <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl text-rose-900 font-extrabold flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Editable Email Headers */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                <div className="flex items-center gap-3">
                  <span className="w-16 text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">To Email:</span>
                  <input
                    type="email"
                    value={recipientEmail}
                    onChange={e => setRecipientEmail(e.target.value)}
                    placeholder="e.g. client.hr@company.com"
                    required
                    className="flex-1 px-3 py-1.5 bg-white border border-slate-300 rounded-xl font-bold text-slate-900 focus:outline-none focus:border-amber-500 transition text-xs"
                  />
                </div>

                <div className="flex items-center gap-3">
                  <span className="w-16 text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">Subject:</span>
                  <input
                    type="text"
                    value={emailSubject}
                    onChange={e => setEmailSubject(e.target.value)}
                    placeholder="e.g. Candidate Profiles for Review"
                    required
                    className="flex-1 px-3 py-1.5 bg-white border border-slate-300 rounded-xl font-bold text-slate-900 focus:outline-none focus:border-amber-500 transition text-xs"
                  />
                </div>
              </div>

              {/* Live Email Content Preview Card */}
              <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                <div className="px-4 py-2.5 bg-slate-900 text-white flex items-center justify-between text-[11px] font-extrabold">
                  <div className="flex items-center gap-2">
                    <Eye className="h-3.5 w-3.5 text-amber-400" />
                    <span>Client Email Layout Preview</span>
                  </div>
                  <span className="text-slate-400 font-semibold">{selectedCandidateIds.length} Candidate(s)</span>
                </div>

                <div className="p-5 bg-white space-y-4 text-xs">
                  <div className="border-b border-slate-100 pb-3 space-y-1">
                    <h5 className="font-black text-base text-slate-900">
                      {emailSubject}
                    </h5>
                    <p className="text-xs text-slate-500 font-semibold">
                      Client: <strong>{selectedJob?.companyName}</strong> | Position: <strong>{selectedJob?.title}</strong>
                    </p>
                  </div>

                  {recruiterMessage && (
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 italic text-xs">
                      <strong>Note from Recruiter:</strong> "{recruiterMessage}"
                    </div>
                  )}

                  <div className="p-3.5 bg-amber-50/70 border border-amber-200/70 rounded-xl space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-slate-900">Candidate Profiles Table included in Email</span>
                      <span className="text-[10px] font-black uppercase tracking-wider bg-amber-200 text-amber-900 px-2 py-0.5 rounded-md">
                        16 Candidate Fields + Resume Link
                      </span>
                    </div>
                    <p className="text-[11px] font-medium text-slate-600">
                      Full candidate details (Experience, Salary, Notice Period, Resume links, etc.) will be cleanly formatted inside the email body.
                    </p>
                  </div>

                  <div className="text-center pt-2">
                    <span className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500 text-slate-950 font-black rounded-xl text-xs shadow-sm">
                      <ExternalLink className="h-3.5 w-3.5" />
                      Review Submitted Candidates (Client Portal Link)
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  disabled={isSubmitting}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-extrabold transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <ArrowLeft className="h-4 w-4" />
                  <span>Back to Edit</span>
                </button>

                <button
                  type="button"
                  onClick={handleSendEmail}
                  disabled={isSubmitting || !recipientEmail}
                  className="px-6 py-2.5 bg-gradient-to-r from-amber-500 via-amber-600 to-yellow-600 hover:from-amber-600 hover:to-yellow-700 text-slate-950 rounded-xl text-xs font-black transition flex items-center gap-2 shadow-lg shadow-amber-500/20 cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Sending Email to Client...</span>
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 stroke-[2.5]" />
                      <span>Send Email to Client</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
