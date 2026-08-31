'use client';

import React, { useState, useTransition } from 'react';
import { UserX, Loader2 } from 'lucide-react';
import { disableUserAction } from '@/app/actions/users';

interface DisableUserButtonProps {
  userId: string;
  userName: string;
  isAlreadyDisabled?: boolean;
}

export function DisableUserButton({ userId, userName, isAlreadyDisabled }: DisableUserButtonProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleDisable = () => {
    if (isAlreadyDisabled) return;
    if (!confirm(`Are you sure you want to disable ${userName}? They will lose access to the platform.`)) {
      return;
    }

    setError(null);
    startTransition(async () => {
      const result = await disableUserAction(userId);
      if (!result.success) {
        setError(result.error || 'Failed to disable user');
      }
    });
  };

  if (isAlreadyDisabled) {
    return (
      <span className="px-2.5 py-1 text-xs font-semibold text-gray-600 bg-gray-100 border border-gray-300 rounded-lg inline-flex items-center gap-1 cursor-not-allowed">
        <UserX className="h-3.5 w-3.5" /> Disabled
      </span>
    );
  }

  return (
    <div className="inline-flex flex-col items-end">
      <button
        onClick={handleDisable}
        disabled={isPending}
        title="Disable User Account"
        className="px-2.5 py-1.5 text-xs font-bold text-rose-700 bg-rose-50 border border-rose-200 hover:bg-rose-100 rounded-lg transition-all duration-150 inline-flex items-center gap-1.5 disabled:opacity-50"
      >
        {isPending ? (
          <>
            <Loader2 className="h-3.5 w-3.5 animate-spin text-rose-600" />
            <span>Disabling...</span>
          </>
        ) : (
          <>
            <UserX className="h-3.5 w-3.5 text-rose-600" />
            <span>Disable</span>
          </>
        )}
      </button>
      {error && <span className="text-[10px] text-rose-600 mt-1 font-semibold">{error}</span>}
    </div>
  );
}
