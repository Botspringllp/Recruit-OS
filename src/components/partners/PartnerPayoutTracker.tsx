'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { DollarSign, CheckCircle2, Clock, ShieldCheck, AlertCircle } from 'lucide-react';
import { updatePartnerPayoutStatusAction } from '@/app/actions/partners';

interface PartnerPayoutTrackerProps {
  ledgers: Array<{
    id: string;
    totalPlacementFee: number | string;
    hostAgencyShare: number | string;
    partnerAgencyShare: number | string;
    payoutStatus: string;
    settledAt?: Date | string | null;
    partnerAgency?: { name: string } | null;
    submission: {
      candidate: { fullName: string };
      job: { title: string };
    };
  }>;
}

export default function PartnerPayoutTracker({ ledgers }: PartnerPayoutTrackerProps) {
  const router = useRouter();
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  async function handleStatusChange(ledgerId: string, newStatus: string) {
    setUpdatingId(ledgerId);
    await updatePartnerPayoutStatusAction(ledgerId, newStatus);
    setUpdatingId(null);
    router.refresh();
  }

  function getStatusBadge(status: string) {
    switch (status) {
      case 'PAID':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'APPROVED':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      default:
        return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-white flex items-center gap-2">
          <DollarSign className="h-4 w-4 text-emerald-400" />
          Partner Placement Revenue Split & Payout Ledger
        </h3>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-800/80 bg-slate-900/40">
        <table className="w-full text-left text-xs text-slate-300">
          <thead className="bg-slate-950/80 text-[11px] font-medium text-slate-400 border-b border-slate-800 uppercase tracking-wider">
            <tr>
              <th className="px-4 py-3">Partner Agency</th>
              <th className="px-4 py-3">Candidate & Mandate</th>
              <th className="px-4 py-3 text-right">Total Placement Fee</th>
              <th className="px-4 py-3 text-right">Partner Payout</th>
              <th className="px-4 py-3">Payout Status</th>
              <th className="px-4 py-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {ledgers.length > 0 ? (
              ledgers.map((l) => (
                <tr key={l.id} className="hover:bg-slate-900/60 transition">
                  <td className="px-4 py-3 font-semibold text-white">
                    {l.partnerAgency?.name || 'Partner Co-Broker'}
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-medium text-slate-200">{l.submission.candidate.fullName}</div>
                    <div className="text-[11px] text-slate-400">{l.submission.job.title}</div>
                  </td>
                  <td className="px-4 py-3 text-right font-mono font-medium text-slate-300">
                    ₹{Number(l.totalPlacementFee).toLocaleString('en-IN')}
                  </td>
                  <td className="px-4 py-3 text-right font-mono font-semibold text-purple-300">
                    ₹{Number(l.partnerAgencyShare).toLocaleString('en-IN')}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${getStatusBadge(l.payoutStatus)}`}>
                      {l.payoutStatus}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <select
                      value={l.payoutStatus}
                      disabled={updatingId === l.id}
                      onChange={(e) => handleStatusChange(l.id, e.target.value)}
                      className="bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-[11px] text-slate-200 focus:outline-none focus:border-purple-500 transition"
                    >
                      <option value="PENDING">PENDING</option>
                      <option value="APPROVED">APPROVED</option>
                      <option value="PAID">MARK PAID</option>
                    </select>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="py-6 text-center text-slate-400">
                  No revenue split payouts recorded yet. Payout entries are automatically generated upon successful partner placements (`JOINED`).
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
