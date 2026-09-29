'use client';

import React, { useState, useEffect } from 'react';
import {
  Share2,
  X,
  Briefcase,
  Building2,
  MessageSquare,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Copy,
  ExternalLink,
  Mail,
  Check,
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
  const [jobs, setJobs] = useState<ActiveJobOption[]>([]);
  const [selectedJobId, setSelectedJobId] = useState<string>('');
  const [clientEmail, setClientEmail] = useState<string>('');
  const [recruiterMessage, setRecruiterMessage] = useState<string>('');

  const [isLoadingJobs, setIsLoadingJobs] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Success state after submission
  const [submissionSuccess, setSubmissionSuccess] = useState<boolean>(false);
  const [successData, setSuccessData] = useState<{
    reviewUrl: string;
    emailSubject: string;
    emailBodyText: string;
    emailHtml: string;
    clientEmail: string;
  } | null>(null);

  const [copiedLink, setCopiedLink] = useState<boolean>(false);
  const [copiedEmailBody, setCopiedEmailBody] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'FORM' | 'PREVIEW'>('FORM');

  // Reset modal state when opened
  useEffect(() => {
    if (isOpen) {
      setError(null);
      setSelectedJobId('');
      setClientEmail('');
      setRecruiterMessage('');
      setSubmissionSuccess(false);
      setSuccessData(null);
      setCopiedLink(false);
      setCopiedEmailBody(false);
      setActiveTab('FORM');
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
        
        let initialEmail = firstJob.clientEmail || '';
        if (initialEmail.endsWith('@botspringhq.in')) {
          initialEmail = initialEmail.replace('@botspringhq.in', '@botspring.in');
        }
        setClientEmail(initialEmail);
      }
    } else {
      setError(res.error || 'Failed to load active job mandates.');
    }
  }

  // Update clientEmail when job selection changes
  function handleJobChange(jobId: string) {
    setSelectedJobId(jobId);
    const selected = jobs.find(j => j.id === jobId);
    if (selected) {
      let email = selected.clientEmail || '';
      if (email.endsWith('@botspringhq.in')) {
        email = email.replace('@botspringhq.in', '@botspring.in');
      }
      setClientEmail(email);
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

    // Sanitize clientEmail domain typo if present
    let cleanEmail = clientEmail.trim();
    if (cleanEmail.endsWith('@botspringhq.in')) {
      cleanEmail = cleanEmail.replace('@botspringhq.in', '@botspring.in');
    }

    const res = await createCandidateSubmissionsAction({
      candidateIds: selectedCandidateIds,
      jobId: selectedJobId,
      clientEmail: cleanEmail || undefined,
      recruiterMessage: recruiterMessage.trim() || undefined
    });

    setIsSubmitting(false);

    if (res.success && res.reviewUrl) {
      setSuccessData({
        reviewUrl: res.reviewUrl,
        emailSubject: res.emailSubject || `Candidate Profiles for Review – ${selectedJob?.title || ''}`,
        emailBodyText: res.emailBodyText || '',
        emailHtml: res.emailHtml || '',
        clientEmail: cleanEmail
      });
      setSubmissionSuccess(true);
      setActiveTab('PREVIEW');
      onSuccess();
    } else {
      setError(res.error || 'Failed to submit candidates to client.');
    }
  }

  // Copy Review Portal Link
  async function handleCopyLink() {
    if (!successData?.reviewUrl) return;
    try {
      await navigator.clipboard.writeText(successData.reviewUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    } catch (err) {
      console.warn('Copy link error:', err);
    }
  }

  // Copy Formatted Email Content & HTML Table to Clipboard
  async function handleCopyEmailContent() {
    if (!successData) return;
    try {
      if (navigator.clipboard && window.ClipboardItem) {
        const textBlob = new Blob([successData.emailBodyText], { type: 'text/plain' });
        const htmlBlob = new Blob([successData.emailHtml], { type: 'text/html' });
        await navigator.clipboard.write([
          new ClipboardItem({
            'text/plain': textBlob,
            'text/html': htmlBlob
          })
        ]);
      } else {
        await navigator.clipboard.writeText(successData.emailBodyText);
      }
      setCopiedEmailBody(true);
      setTimeout(() => setCopiedEmailBody(false), 2500);
    } catch (err) {
      console.warn('Copy email content error:', err);
      await navigator.clipboard.writeText(successData.emailBodyText);
      setCopiedEmailBody(true);
      setTimeout(() => setCopiedEmailBody(false), 2500);
    }
  }

  // Single Click Trigger for OS Desktop Mail Client (Outlook / Mail)
  function handleOpenEmailApp() {
    if (!successData) return;

    const recipient = encodeURIComponent(successData.clientEmail || '');
    const subject = encodeURIComponent(successData.emailSubject);
    const mailtoBody = encodeURIComponent(
      `Please review the candidate profiles for ${selectedJob?.title || 'this mandate'}.\n\n` +
      `Client Review Portal Link:\n${successData.reviewUrl}\n\n` +
      `Regards,\nRecruitment Team`
    );

    const mailtoUrl = `mailto:${recipient}?subject=${subject}&body=${mailtoBody}`;
    window.location.href = mailtoUrl;
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200 font-sans">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
        
        {/* Modal Header */}
        <div className="p-5 bg-slate-900 text-white flex items-center justify-between shrink-0">
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

          <div className="flex items-center gap-2">
            {submissionSuccess && (
              <div className="flex items-center gap-1 bg-slate-800 p-1 rounded-xl text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setActiveTab('PREVIEW')}
                  className={`px-3 py-1 rounded-lg transition ${
                    activeTab === 'PREVIEW' ? 'bg-amber-500 text-slate-950 font-black' : 'text-slate-300 hover:text-white'
                  }`}
                >
                  Email & Tracker Preview
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('FORM')}
                  className={`px-3 py-1 rounded-lg transition ${
                    activeTab === 'FORM' ? 'bg-amber-500 text-slate-950 font-black' : 'text-slate-300 hover:text-white'
                  }`}
                >
                  Job Details
                </button>
              </div>
            )}

            <button
              onClick={onClose}
              disabled={isSubmitting}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Modal Body (Scrollable) */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {error && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl text-rose-900 font-extrabold flex items-center gap-2 text-xs">
              <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {activeTab === 'FORM' && (
            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
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
                    onChange={e => handleJobChange(e.target.value)}
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

              {/* 2. Client Details & Recipient Email (NO hardcoded emails) */}
              {selectedJob && (
                <div className="space-y-3">
                  <div className="p-3 bg-amber-50/80 border border-amber-200/80 rounded-2xl flex items-center justify-between">
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

                  <div>
                    <label className="block text-[11px] font-extrabold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                      <Mail className="h-3.5 w-3.5 text-amber-500" />
                      Client Recipient Email
                    </label>
                    <input
                      type="email"
                      value={clientEmail}
                      onChange={e => setClientEmail(e.target.value)}
                      placeholder="e.g. client@company.com"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:outline-none focus:border-amber-500 transition text-xs"
                    />
                  </div>
                </div>
              )}

              {/* 3. Recruiter Cover Note */}
              <div>
                <label className="block text-[11px] font-extrabold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                  <MessageSquare className="h-3.5 w-3.5 text-amber-500" />
                  Recruiter Cover Note / Message (Optional)
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
                      <span>Submitting Candidates...</span>
                    </>
                  ) : (
                    <>
                      <Share2 className="h-4 w-4 stroke-[2.5]" />
                      <span>Submit Candidates ({selectedCandidateIds.length})</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {activeTab === 'PREVIEW' && successData && (
            /* EMAIL & TRACKER LIVE PREVIEW PANEL */
            <div className="space-y-5 text-xs">
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-black text-emerald-950 text-sm">
                    Candidate Submissions Registered Successfully!
                  </h4>
                  <p className="text-xs font-semibold text-emerald-800 mt-0.5">
                    Review and verify the email content, tracker table, and portal link below.
                  </p>
                </div>
              </div>

              {/* Review Portal Link Box */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block">
                  Client Review Portal URL
                </span>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={successData.reviewUrl}
                    className="flex-1 bg-white border border-slate-200 rounded-xl px-3 py-2 font-mono text-[11px] text-slate-800 selection:bg-amber-500"
                  />
                  <button
                    type="button"
                    onClick={handleCopyLink}
                    className="py-2 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs flex items-center gap-1.5 transition"
                  >
                    {copiedLink ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                    <span>{copiedLink ? 'Copied!' : 'Copy Link'}</span>
                  </button>
                  <a
                    href={successData.reviewUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="py-2 px-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs flex items-center gap-1 transition"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    <span>Open Portal</span>
                  </a>
                </div>
              </div>

              {/* EMAIL CONTENT & TRACKER TABLE VISUAL PREVIEW BOX */}
              <div className="space-y-2 border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-xs">
                <div className="p-3 bg-slate-100 border-b border-slate-200 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-slate-800 font-extrabold text-xs">
                    <FileText className="h-4 w-4 text-amber-600" />
                    <span>Live Email & Candidate Tracker Table Preview</span>
                  </div>
                  {successData.clientEmail && (
                    <span className="text-[11px] font-bold text-slate-600">
                      To: <strong>{successData.clientEmail}</strong>
                    </span>
                  )}
                </div>

                {/* Rendered HTML Email Frame */}
                <div
                  className="p-4 overflow-x-auto max-h-[320px] text-xs font-sans border-0"
                  dangerouslySetInnerHTML={{ __html: successData.emailHtml }}
                />
              </div>

              {/* ACTION BUTTONS: EMAIL LAUNCHER & COPY TABLE */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={handleOpenEmailApp}
                  className="py-3 px-4 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs flex items-center justify-center gap-2 shadow-md transition cursor-pointer"
                >
                  <Mail className="h-4 w-4" />
                  <span>Open Email App (Outlook / Mail)</span>
                </button>

                <button
                  type="button"
                  onClick={handleCopyEmailContent}
                  className="py-3 px-4 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs flex items-center justify-center gap-2 shadow-md transition cursor-pointer"
                >
                  {copiedEmailBody ? <Check className="h-4 w-4 text-slate-950" /> : <Copy className="h-4 w-4" />}
                  <span>{copiedEmailBody ? 'Table & Email Copied!' : 'Copy Formatted Email & Table'}</span>
                </button>
              </div>

              {/* Done / Close Button */}
              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-6 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-black transition cursor-pointer"
                >
                  Done & Close
                </button>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
