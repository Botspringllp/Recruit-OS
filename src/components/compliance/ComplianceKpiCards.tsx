import React from 'react';

interface KpiProps {
  totalDocs: number;
  pendingCount: number;
  verifiedCount: number;
  expiredCount: number;
  verificationRate: number;
  blockedCandidatesCount: number;
}

export function ComplianceKpiCards({
  totalDocs,
  pendingCount,
  verifiedCount,
  expiredCount,
  verificationRate,
  blockedCandidatesCount
}: KpiProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
      {/* Total Documents */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs hover:shadow-md hover:border-amber-400 transition-all duration-200">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Documents</span>
          <div className="p-2 bg-blue-50 text-blue-700 rounded-xl border border-blue-200">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
        </div>
        <p className="text-2xl font-black text-slate-900 mt-2">{totalDocs}</p>
        <span className="text-xs text-slate-500 font-medium mt-1 inline-block">Registered in radar</span>
      </div>

      {/* Pending Review */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs hover:shadow-md hover:border-amber-400 transition-all duration-200">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Pending Review</span>
          <div className="p-2 bg-amber-50 text-amber-800 rounded-xl border border-amber-300">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>
        <p className="text-2xl font-black text-amber-800 mt-2">{pendingCount}</p>
        <span className="text-xs text-amber-800 font-bold mt-1 inline-block">Requires verification</span>
      </div>

      {/* Verified Rate */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs hover:shadow-md hover:border-amber-400 transition-all duration-200">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Compliance Rate</span>
          <div className="p-2 bg-emerald-50 text-emerald-800 rounded-xl border border-emerald-300">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>
        <p className="text-2xl font-black text-emerald-700 mt-2">{verificationRate}%</p>
        <span className="text-xs text-slate-500 font-medium mt-1 inline-block">{verifiedCount} verified docs</span>
      </div>

      {/* Expiring / Expired */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs hover:shadow-md hover:border-amber-400 transition-all duration-200">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Expiring / Expired</span>
          <div className="p-2 bg-rose-50 text-rose-800 rounded-xl border border-rose-300">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
        </div>
        <p className="text-2xl font-black text-rose-700 mt-2">{expiredCount}</p>
        <span className="text-xs text-rose-700 font-bold mt-1 inline-block">Action required</span>
      </div>

      {/* Blocked Candidates */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs hover:shadow-md hover:border-amber-400 transition-all duration-200">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Joining Gate Blocked</span>
          <div className="p-2 bg-purple-50 text-purple-800 rounded-xl border border-purple-300">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
            </svg>
          </div>
        </div>
        <p className="text-2xl font-black text-purple-700 mt-2">{blockedCandidatesCount}</p>
        <span className="text-xs text-purple-700 font-medium mt-1 inline-block">Pending onboarding check</span>
      </div>
    </div>
  );
}
