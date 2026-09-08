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
      {loading && <Loader2 className="h-4 w-4 animate-spin text-amber-600" />}

      {/* Pause Button */}
      {currentStatus !== MandateStatus.PAUSED && currentStatus !== MandateStatus.CLOSED && currentStatus !== MandateStatus.CANCELLED && (
        <button
          onClick={() => handleStatusChange(MandateStatus.PAUSED)}
          disabled={loading}
          title="Pause Mandate Hiring"
          className="px-3.5 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-xl text-xs font-black transition flex items-center gap-1.5 shadow-sm disabled:opacity-50 cursor-pointer"
        >
          <Pause className="h-3.5 w-3.5 fill-current" />
          Pause
        </button>
      )}

      {/* Activate Button */}
      {(currentStatus === MandateStatus.PAUSED || currentStatus === MandateStatus.ON_HOLD || currentStatus === MandateStatus.DRAFT || currentStatus === MandateStatus.OPEN) && (
        <button
          onClick={() => handleStatusChange(MandateStatus.ACTIVE)}
          disabled={loading}
          title="Activate Mandate"
          className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black transition flex items-center gap-1.5 shadow-sm disabled:opacity-50 cursor-pointer"
        >
          <Play className="h-3.5 w-3.5 fill-current" />
          Activate
        </button>
      )}

      {/* Close Button */}
      {currentStatus !== MandateStatus.CLOSED && (
        <button
          onClick={() => handleStatusChange(MandateStatus.CLOSED)}
          disabled={loading}
          title="Soft Close Mandate"
          className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-black transition flex items-center gap-1.5 shadow-sm disabled:opacity-50 cursor-pointer"
        >
          <CheckCircle className="h-3.5 w-3.5 text-emerald-400" />
          Close
        </button>
      )}

      {/* Cancel Button */}
      {currentStatus !== MandateStatus.CANCELLED && (
        <button
          onClick={() => handleStatusChange(MandateStatus.CANCELLED)}
          disabled={loading}
          title="Cancel Mandate"
          className="px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-black transition flex items-center gap-1.5 shadow-sm disabled:opacity-50 cursor-pointer"
        >
          <XCircle className="h-3.5 w-3.5" />
          Cancel
        </button>
      )}
    </div>
  );
}
