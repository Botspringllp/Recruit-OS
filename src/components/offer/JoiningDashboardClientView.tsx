'use client';

import React, { useState, useTransition } from 'react';
import {
  UserCheck,
  CheckCircle2,
  Clock,
  FileCheck,
  ShieldCheck,
  Building2,
  Calendar,
  AlertCircle,
  Upload,
  Sparkles,
  Search,
  ExternalLink,
  ChevronRight
} from 'lucide-react';
import { updateJoiningDocumentAction, confirmJoiningAction } from '@/app/actions/offerActions';

interface JoiningDashboardClientViewProps {
  initialData: {
    joinings: any[];
    metrics: any;
  };
}

export function JoiningDashboardClientView({ initialData }: JoiningDashboardClientViewProps) {
  const [joinings, setJoinings] = useState(initialData.joinings || []);
  const [metrics, setMetrics] = useState(initialData.metrics || {});
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedJoining, setSelectedJoining] = useState<any | null>(null);

  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const filteredJoinings = joinings.filter((j) => {
    const nameMatch = `${j.candidate.firstName} ${j.candidate.lastName}`.toLowerCase().includes(searchTerm.toLowerCase());
    const jobMatch = j.job.title.toLowerCase().includes(searchTerm.toLowerCase());
    const companyMatch = (j.job.companyName || j.client?.companyName || '').toLowerCase().includes(searchTerm.toLowerCase());
    return nameMatch || jobMatch || companyMatch;
  });

  const handleDocStatusChange = (joiningId: string, docKey: string, newStatus: 'VERIFIED' | 'REJECTED' | 'UPLOADED') => {
    setFeedback(null);
    startTransition(async () => {
      const res = await updateJoiningDocumentAction(joiningId, docKey, newStatus);
      if (res.success) {
        setFeedback({ type: 'success', message: `Document status updated to ${newStatus}` });
        window.location.reload();
      } else {
        setFeedback({ type: 'error', message: res.error || 'Failed to update document status' });
      }
    });
  };

  const handleConfirmJoining = (joiningId: string, party: 'RECRUITER' | 'CLIENT') => {
    setFeedback(null);
    startTransition(async () => {
      const res = await confirmJoiningAction(joiningId, party);
      if (res.success) {
        setFeedback({
          type: 'success',
          message: res.fullyConfirmed
            ? '🎉 Double confirmation complete! Placement closed & revenue recorded!'
            : `${party === 'RECRUITER' ? 'Recruiter' : 'Client'} confirmation recorded.`
        });
        window.location.reload();
      } else {
        setFeedback({ type: 'error', message: res.error || 'Failed to confirm joining' });
      }
    });
  };

  return (
    <div className="space-y-8 p-6 max-w-7xl mx-auto">
      
      {/* Title */}
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
          <UserCheck className="h-7 w-7 text-emerald-600" /> Candidate Joining Tracker & Verification
        </h1>
        <p className="text-xs text-slate-500 font-medium">
          Track pre-joining document verification, double-confirmation (Recruiter & Client), and automated placement transition.
        </p>
      </div>

      {feedback && (
        <div
          className={`p-4 rounded-2xl border text-xs font-bold flex items-center gap-2 ${
            feedback.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-rose-50 text-rose-800 border-rose-200'
          }`}
        >
          <Sparkles className="h-4 w-4 shrink-0" />
          <span>{feedback.message}</span>
        </div>
      )}

      {/* KPI Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-5 bg-white rounded-3xl border border-slate-200 shadow-sm space-y-1">
          <span className="text-[10px] font-black uppercase text-slate-400">Accepted Joinings</span>
          <div className="text-2xl font-black text-slate-900">{metrics.totalAccepted || 0}</div>
          <span className="text-[10px] text-slate-500 font-bold">Offer Accepted Pipeline</span>
        </div>

        <div className="p-5 bg-white rounded-3xl border border-slate-200 shadow-sm space-y-1">
          <span className="text-[10px] font-black uppercase text-slate-400">Confirmed Joined</span>
          <div className="text-2xl font-black text-emerald-600">{metrics.totalJoined || 0}</div>
          <span className="text-[10px] text-emerald-600 font-bold">Placement Placed</span>
        </div>

        <div className="p-5 bg-white rounded-3xl border border-slate-200 shadow-sm space-y-1">
          <span className="text-[10px] font-black uppercase text-slate-400">Pending Docs</span>
          <div className="text-2xl font-black text-amber-600">{metrics.totalPendingDocs || 0}</div>
          <span className="text-[10px] text-amber-600 font-bold">Verification Needed</span>
        </div>

        <div className="p-5 bg-white rounded-3xl border border-slate-200 shadow-sm space-y-1">
          <span className="text-[10px] font-black uppercase text-slate-400">Joining Success Rate</span>
          <div className="text-2xl font-black text-indigo-600">{metrics.joiningRate || 0}%</div>
          <span className="text-[10px] text-indigo-600 font-bold">Offer to Joining Ratio</span>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-3xl border border-slate-200">
        <div className="relative max-w-md">
          <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search candidate, job, client..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
      </div>

      {/* Joinings List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredJoinings.map((j) => {
          const docs: any[] = j.requiredDocuments || [];
          const verifiedDocsCount = docs.filter((d) => d.status === 'VERIFIED').length;
          const isFullyConfirmed = j.recruiterConfirmed && j.clientConfirmed;

          return (
            <div key={j.id} className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-6">
              
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-base font-black text-slate-900">
                    {j.candidate.firstName} {j.candidate.lastName}
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">
                    {j.job.title} • {j.job.companyName || j.client?.companyName || 'Hiring Client'}
                  </p>
                </div>

                <span
                  className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                    j.status === 'JOINED'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : 'bg-amber-50 text-amber-700 border-amber-200'
                  }`}
                >
                  {j.status}
                </span>
              </div>

              {/* Joining Date & Documents Progress */}
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
                  <span className="text-[10px] font-black uppercase text-slate-400">Joining Date</span>
                  <div className="font-extrabold text-slate-800 mt-1 flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5 text-emerald-600" />
                    {new Date(j.joiningDate).toLocaleDateString()}
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
                  <span className="text-[10px] font-black uppercase text-slate-400">Document Verification</span>
                  <div className="font-extrabold text-slate-800 mt-1 flex items-center gap-1.5">
                    <FileCheck className="h-3.5 w-3.5 text-indigo-600" />
                    {verifiedDocsCount} / {docs.length} Verified
                  </div>
                </div>
              </div>

              {/* Double Confirmation Status */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-3">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Double-Verification Status</span>

                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-700">Recruiter Confirmation</span>
                  {j.recruiterConfirmed ? (
                    <span className="text-emerald-600 font-black flex items-center gap-1">
                      <CheckCircle2 className="h-3.5 w-3.5" /> Confirmed
                    </span>
                  ) : (
                    <button
                      onClick={() => handleConfirmJoining(j.id, 'RECRUITER')}
                      disabled={isPending}
                      className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl text-[11px]"
                    >
                      Confirm Joining
                    </button>
                  )}
                </div>

                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-700">Client HR Confirmation</span>
                  {j.clientConfirmed ? (
                    <span className="text-emerald-600 font-black flex items-center gap-1">
                      <CheckCircle2 className="h-3.5 w-3.5" /> Confirmed
                    </span>
                  ) : (
                    <button
                      onClick={() => handleConfirmJoining(j.id, 'CLIENT')}
                      disabled={isPending}
                      className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold rounded-xl text-[11px]"
                    >
                      Confirm Client HR
                    </button>
                  )}
                </div>
              </div>

              {/* Document Checklist Accordion / Details */}
              <div className="space-y-2">
                <span className="text-[10px] font-black uppercase text-slate-400">Document Checklist</span>
                <div className="space-y-2">
                  {docs.map((doc: any) => (
                    <div key={doc.key} className="flex items-center justify-between p-2.5 rounded-xl border border-slate-100 bg-white text-xs">
                      <span className="font-bold text-slate-700">{doc.name}</span>
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                            doc.status === 'VERIFIED'
                              ? 'bg-emerald-100 text-emerald-800'
                              : doc.status === 'REJECTED'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {doc.status}
                        </span>

                        {doc.status !== 'VERIFIED' && (
                          <button
                            onClick={() => handleDocStatusChange(j.id, doc.key, 'VERIFIED')}
                            disabled={isPending}
                            className="px-2 py-0.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-[10px] font-extrabold rounded-lg border border-emerald-200"
                          >
                            Verify
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          );
        })}
      </div>

    </div>
  );
}
