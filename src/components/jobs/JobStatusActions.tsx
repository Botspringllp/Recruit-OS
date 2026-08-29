'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Play, Pause, XCircle, CheckCircle, Loader2 } from 'lucide-react';
import { MandateStatus } from '@prisma/client';
import { updateJobStatusAction } from '@/app/actions/jobs';

interface JobStatusActionsProps {
  jobId: string;
  currentStatus: MandateStatus;
}

export function JobStatusActions({ jobId, currentStatus }: JobStatusActionsProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleStatusChange(targetStatus: MandateStatus) {
    if (!confirm(`Are you sure you want to transition mandate status to ${targetStatus}?`)) {
      return;
    }

    setLoading(true);
    const res = await updateJobStatusAction(jobId, targetStatus);
    setLoading(false);

    if (res.success) {
      router.refresh();
    } else {
      alert(res.error || 'Failed to update status transition');
    }
  }

  return (
    <div className="flex items-center gap-2">
      {loading && <Loader2 className="h-4 w-4 animate-spin text-brand-400" />}

      {/* Pause Button */}
      {currentStatus !== MandateStatus.PAUSED && currentStatus !== MandateStatus.CLOSED && currentStatus !== MandateStatus.CANCELLED && (
        <button
          onClick={() => handleStatusChange(MandateStatus.PAUSED)}
          disabled={loading}
          title="Pause Mandate Hiring"
          className="px-3 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 disabled:opacity-50"
        >
          <Pause className="h-3.5 w-3.5" />
          Pause
        </button>
      )}

      {/* Activate Button */}
      {(currentStatus === MandateStatus.PAUSED || currentStatus === MandateStatus.ON_HOLD || currentStatus === MandateStatus.DRAFT || currentStatus === MandateStatus.OPEN) && (
        <button
          onClick={() => handleStatusChange(MandateStatus.ACTIVE)}
          disabled={loading}
          title="Activate Mandate"
          className="px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 disabled:opacity-50"
        >
          <Play className="h-3.5 w-3.5" />
          Activate
        </button>
      )}

      {/* Close Button */}
      {currentStatus !== MandateStatus.CLOSED && (
        <button
          onClick={() => handleStatusChange(MandateStatus.CLOSED)}
          disabled={loading}
          title="Soft Close Mandate"
          className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 disabled:opacity-50"
        >
          <CheckCircle className="h-3.5 w-3.5 text-cyan-400" />
          Close
        </button>
      )}

      {/* Cancel Button */}
      {currentStatus !== MandateStatus.CANCELLED && (
        <button
          onClick={() => handleStatusChange(MandateStatus.CANCELLED)}
          disabled={loading}
          title="Cancel Mandate"
          className="px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 disabled:opacity-50"
        >
          <XCircle className="h-3.5 w-3.5" />
          Cancel
        </button>
      )}
    </div>
  );
}
