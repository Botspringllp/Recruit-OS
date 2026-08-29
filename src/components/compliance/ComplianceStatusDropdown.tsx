'use client';

import React, { useState, useTransition } from 'react';
import { updateDocumentStatusAction } from '@/app/actions/compliance';

interface Props {
  docId: string;
  currentStatus: string;
}

export function ComplianceStatusDropdown({ docId, currentStatus }: Props) {
  const [status, setStatus] = useState(currentStatus);
  const [isOpen, setIsOpen] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [reviewerNotes, setReviewerNotes] = useState('');
  const [isPending, startTransition] = useTransition();

  const statuses = [
    { label: 'PENDING', bg: 'bg-slate-500/10 text-slate-400 border-slate-700' },
    { label: 'SUBMITTED', bg: 'bg-blue-500/10 text-blue-400 border-blue-800' },
    { label: 'UNDER_REVIEW', bg: 'bg-amber-500/10 text-amber-400 border-amber-800' },
    { label: 'VERIFIED', bg: 'bg-emerald-500/10 text-emerald-400 border-emerald-800' },
    { label: 'REJECTED', bg: 'bg-rose-500/10 text-rose-400 border-rose-800' },
    { label: 'EXPIRED', bg: 'bg-purple-500/10 text-purple-400 border-purple-800' }
  ];

  const currentBadge = statuses.find((s) => s.label === status) || statuses[0];

  const handleSelect = (newStatus: string) => {
    setIsOpen(false);
    if (newStatus === 'REJECTED') {
      setShowRejectModal(true);
      return;
    }

    startTransition(async () => {
      const res = await updateDocumentStatusAction(docId, newStatus);
      if (res.success) {
        setStatus(newStatus);
      } else {
        alert(res.error || 'Failed to update status');
      }
    });
  };

  const handleConfirmReject = () => {
    if (!rejectionReason.trim()) {
      alert('Please provide a reason for rejecting the document');
      return;
    }

    startTransition(async () => {
      const res = await updateDocumentStatusAction(docId, 'REJECTED', reviewerNotes, rejectionReason);
      if (res.success) {
        setStatus('REJECTED');
        setShowRejectModal(false);
      } else {
        alert(res.error || 'Failed to reject document');
      }
    });
  };

  return (
    <div className="relative inline-block text-left">
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={isPending}
        className={`px-3 py-1 text-xs font-semibold rounded-full border flex items-center gap-1.5 transition-all ${currentBadge.bg} ${
          isPending ? 'opacity-50 cursor-not-allowed' : 'hover:brightness-125'
        }`}
      >
        <span>{status}</span>
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="origin-top-right absolute right-0 mt-2 w-44 rounded-xl shadow-xl bg-slate-900 border border-slate-800 z-50 py-1 focus:outline-none">
          {statuses.map((item) => (
            <button
              key={item.label}
              onClick={() => handleSelect(item.label)}
              className={`w-full text-left px-4 py-2 text-xs hover:bg-slate-800 transition-colors flex items-center justify-between ${
                item.label === status ? 'text-cyan-400 font-bold' : 'text-slate-300'
              }`}
            >
              <span>{item.label}</span>
              {item.label === status && (
                <svg className="w-4 h-4 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              )}
            </button>
          ))}
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
              <span className="p-1.5 bg-rose-500/10 text-rose-400 rounded-lg">⚠️</span>
              Reject Compliance Document
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Please specify the rejection reason and reviewer notes. The candidate will be flagged as unverified for joining.
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Rejection Reason <span className="text-rose-400">*</span>
                </label>
                <textarea
                  rows={2}
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="e.g. Expired document image, mismatch in Aadhaar number, illegible scan"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Internal Reviewer Notes</label>
                <textarea
                  rows={2}
                  value={reviewerNotes}
                  onChange={(e) => setReviewerNotes(e.target.value)}
                  placeholder="Optional internal audit remarks"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowRejectModal(false)}
                className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmReject}
                disabled={isPending}
                className="px-4 py-2 text-xs font-medium bg-rose-600 hover:bg-rose-500 text-white rounded-lg transition-colors flex items-center gap-2"
              >
                {isPending ? 'Saving...' : 'Confirm Rejection'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
