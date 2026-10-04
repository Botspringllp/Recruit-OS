'use client';

import React, { useState, useTransition } from 'react';
import {
  CheckCircle2,
  XCircle,
  HelpCircle,
  Briefcase,
  Building2,
  Calendar,
  MapPin,
  DollarSign,
  ShieldAlert,
  Sparkles,
  MessageSquare,
  Clock,
  ChevronRight,
  FileText
} from 'lucide-react';
import {
  acceptOfferAction,
  declineOfferAction,
  requestOfferClarificationAction
} from '@/app/actions/offerActions';

interface PublicOfferClientViewProps {
  offer: any;
}

export function PublicOfferClientView({ offer }: PublicOfferClientViewProps) {
  const [status, setStatus] = useState(offer.status);
  const [clarifications, setClarifications] = useState(offer.clarifications || []);
  const [isPending, startTransition] = useTransition();

  // Decline Modal State
  const [showDeclineModal, setShowDeclineModal] = useState(false);
  const [declineReason, setDeclineReason] = useState('');

  // Clarification Modal State
  const [showClarificationModal, setShowClarificationModal] = useState(false);
  const [qTitle, setQTitle] = useState('');
  const [qDetails, setQDetails] = useState('');

  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const handleAccept = () => {
    setFeedback(null);
    startTransition(async () => {
      const res = await acceptOfferAction(offer.token);
      if (res.success) {
        setStatus('ACCEPTED');
        setFeedback({ type: 'success', message: 'Congratulations! You have accepted the employment offer.' });
      } else {
        setFeedback({ type: 'error', message: res.error || 'Failed to accept offer' });
      }
    });
  };

  const handleDeclineSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!declineReason.trim()) return;
    setFeedback(null);

    startTransition(async () => {
      const res = await declineOfferAction(offer.token, declineReason);
      if (res.success) {
        setStatus('DECLINED');
        setShowDeclineModal(false);
        setFeedback({ type: 'success', message: 'You have submitted your offer decline response.' });
      } else {
        setFeedback({ type: 'error', message: res.error || 'Failed to submit decline response' });
      }
    });
  };

  const handleClarificationSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!qTitle.trim() || !qDetails.trim()) return;
    setFeedback(null);

    startTransition(async () => {
      const res = await requestOfferClarificationAction(offer.token, qTitle, qDetails);
      if (res.success) {
        setStatus('CLARIFICATION_REQUESTED');
        setClarifications((prev: any) => [
          ...prev,
          {
            id: `temp-${Date.now()}`,
            senderRole: 'CANDIDATE',
            senderName: `${offer.candidate.firstName} ${offer.candidate.lastName}`,
            questionTitle: qTitle,
            questionDetails: qDetails,
            createdAt: new Date().toISOString()
          }
        ]);
        setShowClarificationModal(false);
        setQTitle('');
        setQDetails('');
        setFeedback({ type: 'success', message: 'Clarification request submitted to hiring team.' });
      } else {
        setFeedback({ type: 'error', message: res.error || 'Failed to submit clarification' });
      }
    });
  };

  const ctcLpa = (Number(offer.offeredCTC) / 100000).toFixed(2);
  const fixedLpa = offer.fixedSalary ? (Number(offer.fixedSalary) / 100000).toFixed(2) : null;
  const variableLpa = offer.variableSalary ? (Number(offer.variableSalary) / 100000).toFixed(2) : null;
  const companyName = offer.job.companyName || offer.client?.companyName || 'Hiring Enterprise';

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-10 px-4 sm:px-6 lg:px-8 font-sans selection:bg-amber-500 selection:text-slate-950">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Top Header Card */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 sm:p-10 border border-indigo-800/40 shadow-2xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-amber-500/20 text-amber-400 rounded-2xl border border-amber-500/30">
                <Building2 className="h-8 w-8" />
              </div>
              <div>
                <span className="text-xs font-black uppercase tracking-wider text-amber-400">Official Employment Offer</span>
                <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">{companyName}</h1>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span
                className={`px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-wider border ${
                  status === 'ACCEPTED'
                    ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                    : status === 'DECLINED'
                    ? 'bg-rose-500/20 text-rose-400 border-rose-500/40'
                    : status === 'CLARIFICATION_REQUESTED'
                    ? 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                    : 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40'
                }`}
              >
                {status}
              </span>
            </div>
          </div>

          <div className="p-6 bg-slate-900/90 rounded-2xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-1">
              <h2 className="text-xl font-extrabold text-white">{offer.title}</h2>
              <p className="text-xs text-slate-400 font-semibold flex items-center gap-3">
                <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5 text-slate-500" /> {offer.workLocation || 'Remote / Hybrid'}</span>
                <span className="flex items-center gap-1"><Briefcase className="h-3.5 w-3.5 text-slate-500" /> {offer.employmentType}</span>
              </p>
            </div>

            <div className="text-left md:text-right border-t md:border-t-0 md:border-l border-slate-800 pt-4 md:pt-0 md:pl-6">
              <span className="text-[11px] font-black uppercase tracking-wider text-slate-400">Offered CTC</span>
              <div className="text-2xl sm:text-3xl font-black text-emerald-400">₹{ctcLpa} LPA</div>
              <span className="text-[10px] text-slate-400 font-bold">Annual Gross Compensation</span>
            </div>
          </div>
        </div>

        {feedback && (
          <div
            className={`p-4 rounded-2xl border text-xs font-bold flex items-center gap-2 ${
              feedback.type === 'success'
                ? 'bg-emerald-950/80 text-emerald-300 border-emerald-700/50'
                : 'bg-rose-950/80 text-rose-300 border-rose-700/50'
            }`}
          >
            <Sparkles className="h-4 w-4 shrink-0" />
            <span>{feedback.message}</span>
          </div>
        )}

        {/* Action CTAs Header Bar (PART C & E) */}
        {status !== 'ACCEPTED' && status !== 'DECLINED' && (
          <div className="p-5 bg-slate-900 rounded-3xl border border-slate-800 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="text-xs text-slate-300 font-semibold">
              Expected Joining Date: <strong className="text-white font-black">{new Date(offer.joiningDate).toLocaleDateString()}</strong>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowClarificationModal(true)}
                disabled={isPending}
                className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-amber-300 font-bold rounded-2xl text-xs flex items-center gap-1.5 transition-all"
              >
                <HelpCircle className="h-4 w-4 text-amber-400" /> Request Clarification
              </button>

              <button
                onClick={() => setShowDeclineModal(true)}
                disabled={isPending}
                className="px-4 py-2.5 bg-slate-800 hover:bg-rose-900/60 text-rose-300 font-bold rounded-2xl text-xs flex items-center gap-1.5 transition-all"
              >
                <XCircle className="h-4 w-4 text-rose-400" /> Decline
              </button>

              <button
                onClick={handleAccept}
                disabled={isPending}
                className="px-6 py-2.5 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-slate-950 font-black rounded-2xl text-xs flex items-center gap-1.5 shadow-lg shadow-emerald-500/20 hover:scale-105 active:scale-95 transition-all"
              >
                <CheckCircle2 className="h-4 w-4" /> Accept Offer
              </button>
            </div>
          </div>
        )}

        {/* 1. Compensation Breakdown */}
        <div className="bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-800 space-y-4">
          <h3 className="text-base font-black text-white flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-emerald-400" /> 1. Compensation Structure
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
              <span className="text-[10px] font-black uppercase text-slate-400">Total Offered CTC</span>
              <div className="text-xl font-black text-emerald-400">₹{ctcLpa} LPA</div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
              <span className="text-[10px] font-black uppercase text-slate-400">Fixed Component</span>
              <div className="text-xl font-black text-slate-200">{fixedLpa ? `₹${fixedLpa} LPA` : 'As per policy'}</div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
              <span className="text-[10px] font-black uppercase text-slate-400">Variable / Performance</span>
              <div className="text-xl font-black text-slate-200">{variableLpa ? `₹${variableLpa} LPA` : 'N/A'}</div>
            </div>
          </div>
        </div>

        {/* 2. Employment Terms */}
        <div className="bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-800 space-y-4">
          <h3 className="text-base font-black text-white flex items-center gap-2">
            <FileText className="h-5 w-5 text-indigo-400" /> 2. Employment Terms & Provisions
          </h3>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
            <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800">
              <span className="text-[10px] font-black uppercase text-slate-400">Work Location</span>
              <div className="font-extrabold text-white mt-1">{offer.workLocation || 'Hybrid'}</div>
            </div>

            <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800">
              <span className="text-[10px] font-black uppercase text-slate-400">Notice Period</span>
              <div className="font-extrabold text-white mt-1">{offer.noticePeriod || 'Standard Policy'}</div>
            </div>

            <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800">
              <span className="text-[10px] font-black uppercase text-slate-400">Probation Period</span>
              <div className="font-extrabold text-white mt-1">{offer.probationPeriod || '3 Months'}</div>
            </div>

            <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800">
              <span className="text-[10px] font-black uppercase text-slate-400">Service Bond</span>
              <div className="font-extrabold text-white mt-1">{offer.bondPeriod || 'None'}</div>
            </div>
          </div>

          {offer.benefits && (
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
              <span className="text-[10px] font-black uppercase text-slate-400">Benefits & Perks</span>
              <p className="text-xs text-slate-300 leading-relaxed font-medium whitespace-pre-wrap">{offer.benefits}</p>
            </div>
          )}

          {offer.specialTerms && (
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
              <span className="text-[10px] font-black uppercase text-slate-400">Special Terms</span>
              <p className="text-xs text-slate-300 leading-relaxed font-medium whitespace-pre-wrap">{offer.specialTerms}</p>
            </div>
          )}
        </div>

        {/* PART D: Clarification Thread */}
        {clarifications.length > 0 && (
          <div className="bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-800 space-y-4">
            <h3 className="text-base font-black text-white flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-amber-400" /> Offer Clarifications Thread
            </h3>

            <div className="space-y-3">
              {clarifications.map((item: any) => (
                <div key={item.id} className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between text-xs font-extrabold">
                    <span className="text-amber-400">{item.questionTitle}</span>
                    <span className="text-[10px] text-slate-400">{new Date(item.createdAt).toLocaleString()}</span>
                  </div>
                  <p className="text-xs text-slate-300 font-medium">{item.questionDetails}</p>

                  {item.response && (
                    <div className="mt-2 pt-2 border-t border-slate-800 text-xs text-emerald-300 font-semibold">
                      <strong>Hiring Team Response:</strong> {item.response}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Decline Modal */}
        {showDeclineModal && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full space-y-4">
              <h3 className="text-lg font-black text-white">Decline Employment Offer</h3>
              <p className="text-xs text-slate-400">Please let us know your reason for declining so we can inform the client.</p>

              <form onSubmit={handleDeclineSubmit} className="space-y-4">
                <textarea
                  rows={4}
                  required
                  placeholder="e.g. Accepted another offer, relocation issues..."
                  value={declineReason}
                  onChange={(e) => setDeclineReason(e.target.value)}
                  className="w-full p-3 bg-slate-950 border border-slate-800 rounded-2xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-rose-500"
                />

                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowDeclineModal(false)}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isPending}
                    className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white font-black rounded-xl text-xs"
                  >
                    Submit Decline
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Clarification Modal */}
        {showClarificationModal && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full space-y-4">
              <h3 className="text-lg font-black text-white">Request Offer Clarification</h3>
              <p className="text-xs text-slate-400">Submit your query directly to the recruiter & hiring manager.</p>

              <form onSubmit={handleClarificationSubmit} className="space-y-3">
                <input
                  type="text"
                  required
                  placeholder="Question Title (e.g. Joining Bonus Clarification)"
                  value={qTitle}
                  onChange={(e) => setQTitle(e.target.value)}
                  className="w-full p-3 bg-slate-950 border border-slate-800 rounded-2xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                />

                <textarea
                  rows={4}
                  required
                  placeholder="Detailed Question Details..."
                  value={qDetails}
                  onChange={(e) => setQDetails(e.target.value)}
                  className="w-full p-3 bg-slate-950 border border-slate-800 rounded-2xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                />

                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowClarificationModal(false)}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isPending}
                    className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black rounded-xl text-xs"
                  >
                    Submit Question
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
