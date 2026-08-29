'use client';

import React, { useEffect } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

export default function CockpitError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Cockpit Error Boundary Caught Exception:', error);
  }, [error]);

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center space-y-6">
      <div className="h-16 w-16 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center shadow-lg">
        <AlertTriangle className="h-8 w-8 animate-bounce" />
      </div>

      <div className="space-y-2 max-w-md">
        <h2 className="text-xl font-bold text-white tracking-tight">
          Unable to Load Recruiter Cockpit
        </h2>
        <p className="text-xs text-slate-400 leading-relaxed">
          An unexpected error occurred while processing tenant telemetry data. Please verify your agency credentials or retry the request.
        </p>
        {error.digest && (
          <p className="text-[10px] font-mono text-slate-400 bg-slate-900/80 px-2 py-1 rounded border border-slate-800 inline-block mt-2">
            Digest Code: {error.digest}
          </p>
        )}
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={() => reset()}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white text-xs font-semibold shadow-glow-brand transition-all duration-200"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          <span>Retry Cockpit</span>
        </button>

        <a
          href="/cockpit"
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700 transition-colors"
        >
          <Home className="h-3.5 w-3.5" />
          <span>Dashboard Home</span>
        </a>
      </div>
    </div>
  );
}
