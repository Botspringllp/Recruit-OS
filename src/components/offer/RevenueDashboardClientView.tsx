'use client';

import React, { useState, useTransition } from 'react';
import {
  DollarSign,
  Trophy,
  Briefcase,
  Building2,
  CheckCircle2,
  Calendar,
  Sparkles,
  Search,
  FileCheck,
  TrendingUp,
  Receipt
} from 'lucide-react';
import { closePlacementAction } from '@/app/actions/offerActions';

interface RevenueDashboardClientViewProps {
  initialData: {
    placements: any[];
    revenues: any[];
    metrics: any;
    leaderboard: any[];
  };
}

export function RevenueDashboardClientView({ initialData }: RevenueDashboardClientViewProps) {
  const [placements] = useState(initialData.placements || []);
  const [metrics] = useState(initialData.metrics || {});
  const [leaderboard] = useState(initialData.leaderboard || []);

  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const handleClosePlacement = (placementId: string) => {
    setFeedback(null);
    startTransition(async () => {
      const res = await closePlacementAction(placementId);
      if (res.success) {
        setFeedback({ type: 'success', message: 'Placement closed and invoice record generated.' });
        window.location.reload();
      } else {
        setFeedback({ type: 'error', message: res.error || 'Failed to close placement' });
      }
    });
  };

  const totalRevLpa = (metrics.totalRevenueSum / 100000).toFixed(2);

  return (
    <div className="space-y-8 p-6 max-w-7xl mx-auto">
      
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
          <DollarSign className="h-7 w-7 text-emerald-600" /> Revenue Engine & Placement Ledger
        </h1>
        <p className="text-xs text-slate-500 font-medium">
          Placement closure ledger, automated agency revenue calculation, and recruiter commission leaderboard.
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

      {/* Revenue KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 bg-gradient-to-r from-emerald-600 to-teal-700 rounded-3xl text-white shadow-xl space-y-2">
          <span className="text-xs font-black uppercase tracking-wider text-emerald-100">Total Agency Revenue</span>
          <div className="text-3xl font-black">₹{metrics.totalRevenueSum?.toLocaleString() || 0}</div>
          <span className="text-xs text-emerald-100 font-bold flex items-center gap-1">
            <TrendingUp className="h-4 w-4" /> ₹{totalRevLpa} Lakhs Earned
          </span>
        </div>

        <div className="p-6 bg-white rounded-3xl border border-slate-200 shadow-sm space-y-2">
          <span className="text-xs font-black uppercase text-slate-400">Successful Placements</span>
          <div className="text-3xl font-black text-slate-900">{metrics.totalPlacements || 0}</div>
          <span className="text-xs text-slate-500 font-bold">Confirmed Joined Candidates</span>
        </div>

        <div className="p-6 bg-white rounded-3xl border border-slate-200 shadow-sm space-y-2">
          <span className="text-xs font-black uppercase text-slate-400">Closed Placements</span>
          <div className="text-3xl font-black text-indigo-600">{metrics.closedPlacements || 0}</div>
          <span className="text-xs text-indigo-600 font-bold">Invoiced & Billed</span>
        </div>
      </div>

      {/* PART K: Recruiter Leaderboard */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
        <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
          <Trophy className="h-5 w-5 text-amber-500" /> Recruiter Performance Leaderboard
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-black uppercase tracking-wider text-slate-400">
                <th className="py-3 px-4">Rank & Recruiter</th>
                <th className="py-3 px-4">Role</th>
                <th className="py-3 px-4">Submissions</th>
                <th className="py-3 px-4">Offers Sent</th>
                <th className="py-3 px-4">Placements</th>
                <th className="py-3 px-4 text-right">Revenue Generated</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
              {leaderboard.map((r, idx) => (
                <tr key={r.recruiterId} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3 px-4 font-black text-slate-900 flex items-center gap-2">
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black ${
                      idx === 0 ? 'bg-amber-100 text-amber-800' : idx === 1 ? 'bg-slate-200 text-slate-800' : 'bg-slate-100 text-slate-600'
                    }`}>
                      #{idx + 1}
                    </span>
                    {r.name}
                  </td>
                  <td className="py-3 px-4 text-slate-500 font-bold">{r.role}</td>
                  <td className="py-3 px-4 font-bold">{r.submissions}</td>
                  <td className="py-3 px-4 font-bold">{r.offers}</td>
                  <td className="py-3 px-4 font-extrabold text-emerald-600">{r.placements}</td>
                  <td className="py-3 px-4 text-right font-black text-emerald-600">₹{r.revenue.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Placement Records Ledger Table */}
      <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm space-y-4 p-6">
        <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
          <Receipt className="h-5 w-5 text-indigo-600" /> Placement & Revenue Ledger
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-black uppercase tracking-wider text-slate-400">
                <th className="py-4 px-6">Candidate</th>
                <th className="py-4 px-6">Position & Client</th>
                <th className="py-4 px-6">Joining Date</th>
                <th className="py-4 px-6">Annual Salary</th>
                <th className="py-4 px-6">Calculated Revenue</th>
                <th className="py-4 px-6">Status</th>
                <th className="py-4 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
              {placements.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400 font-medium">
                    No confirmed placements yet. Complete candidate joining double-confirmation in Joining Tracker to generate placement records.
                  </td>
                </tr>
              ) : (
                placements.map((p) => {
                  const rev = p.revenueRecord;
                  const salaryLpa = (Number(p.finalSalary) / 100000).toFixed(2);
                  const revValue = rev ? Number(rev.totalRevenue) : 0;

                  return (
                    <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-4 px-6">
                        <div className="font-extrabold text-slate-900">{p.candidate.firstName} {p.candidate.lastName}</div>
                      </td>

                      <td className="py-4 px-6">
                        <div className="font-extrabold text-slate-900">{p.job.title}</div>
                        <div className="text-[11px] text-slate-500 font-semibold">{p.job.companyName || p.client?.companyName || 'Hiring Client'}</div>
                      </td>

                      <td className="py-4 px-6 font-bold text-slate-700">
                        {new Date(p.joiningDate).toLocaleDateString()}
                      </td>

                      <td className="py-4 px-6 font-black text-slate-900">
                        ₹{salaryLpa} LPA
                      </td>

                      <td className="py-4 px-6 font-black text-emerald-600">
                        ₹{revValue.toLocaleString()} ({rev?.feePercentage || 8.33}%)
                      </td>

                      <td className="py-4 px-6">
                        <span
                          className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                            p.placementStatus === 'CLOSED'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-indigo-50 text-indigo-700 border-indigo-200'
                          }`}
                        >
                          {p.placementStatus}
                        </span>
                      </td>

                      <td className="py-4 px-6 text-right">
                        {p.placementStatus !== 'CLOSED' && (
                          <button
                            onClick={() => handleClosePlacement(p.id)}
                            disabled={isPending}
                            className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold rounded-xl text-[11px]"
                          >
                            Close Placement
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
