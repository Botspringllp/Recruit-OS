'use client';

import React, { useState, useTransition } from 'react';
import { updateOfferStatusAction } from '@/app/actions/offers';
import { Award, CheckCircle, XCircle, Clock, Send, UserCheck, AlertTriangle } from 'lucide-react';

interface OfferStatusDropdownProps {
  offerId: string;
  currentStatus: string;
}

export function OfferStatusDropdown({ offerId, currentStatus }: OfferStatusDropdownProps) {
  const [isPending, startTransition] = useTransition();
  const [status, setStatus] = useState(currentStatus);

  const handleStatusChange = (newStatus: string) => {
    startTransition(async () => {
      const res = await updateOfferStatusAction(offerId, newStatus);
      if (res.success) {
        setStatus(newStatus);
      } else {
        alert(res.error || 'Failed to update offer status');
      }
    });
  };

  return (
    <div className="relative inline-block text-left">
      <select
        disabled={isPending}
        value={status}
        onChange={(e) => handleStatusChange(e.target.value)}
        className={`px-3 py-1.5 rounded-xl text-xs font-extrabold border outline-none cursor-pointer transition ${
          status === 'JOINED'
            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
            : status === 'ACCEPTED'
            ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
            : status === 'SENT'
            ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40'
            : status === 'DECLINED' || status === 'WITHDRAWN'
            ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
            : status === 'EXPIRED'
            ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
            : 'bg-slate-800 text-slate-300 border-slate-700'
        }`}
      >
        <option value="DRAFT" className="bg-slate-900 text-slate-300">DRAFT</option>
        <option value="SENT" className="bg-slate-900 text-indigo-300">SENT</option>
        <option value="ACCEPTED" className="bg-slate-900 text-cyan-300">ACCEPTED</option>
        <option value="JOINED" className="bg-slate-900 text-emerald-300">JOINED (PLANTED)</option>
        <option value="DECLINED" className="bg-slate-900 text-rose-300">DECLINED</option>
        <option value="EXPIRED" className="bg-slate-900 text-amber-300">EXPIRED</option>
        <option value="WITHDRAWN" className="bg-slate-900 text-rose-400">WITHDRAWN</option>
      </select>
    </div>
  );
}
