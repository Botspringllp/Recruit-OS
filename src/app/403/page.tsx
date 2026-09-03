import React from 'react';
import Link from 'next/link';
import { ShieldAlert, ArrowLeft, Lock } from 'lucide-react';

export default function ForbiddenPage() {
  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-slate-800 border border-slate-700 rounded-xl p-8 text-center shadow-2xl">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-500/10 text-red-400 mb-6 border border-red-500/20">
          <ShieldAlert className="w-8 h-8" />
        </div>

        <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">Access Denied</h1>

        <p className="text-slate-400 text-sm mb-6 leading-relaxed">
          You do not have permission to access this resource. If you believe this is an error, please contact your Agency Owner or System Administrator.
        </p>

        <div className="bg-slate-900/50 border border-slate-700/60 rounded-lg p-3 text-xs text-slate-500 mb-6 flex items-center justify-center gap-2">
          <Lock className="w-4 h-4 text-amber-500" />
          <span>HTTP 403 Forbidden • Role-Based Access Control Enforced</span>
        </div>

        <Link
          href="/"
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium text-sm transition-all duration-200 shadow-lg shadow-blue-500/25"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </Link>
      </div>
    </div>
  );
}
