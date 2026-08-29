import React from 'react';

export default function CockpitLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header Skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800/60">
        <div className="space-y-2">
          <div className="h-7 w-48 bg-slate-800/80 rounded-lg" />
          <div className="h-4 w-72 bg-slate-800/50 rounded-md" />
        </div>
        <div className="flex items-center gap-3">
          <div className="h-9 w-32 bg-slate-800/80 rounded-xl" />
          <div className="h-9 w-28 bg-brand-600/30 rounded-xl" />
        </div>
      </div>

      {/* KPI Stat Cards Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="h-28 rounded-2xl glass-panel p-4 space-y-3">
            <div className="flex justify-between items-center">
              <div className="h-4 w-24 bg-slate-800/80 rounded" />
              <div className="h-8 w-8 bg-slate-800/80 rounded-lg" />
            </div>
            <div className="h-7 w-20 bg-slate-800/90 rounded" />
            <div className="h-3 w-32 bg-slate-800/50 rounded" />
          </div>
        ))}
      </div>

      {/* 2-Column Dashboard Shell Grid Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Grid (2 cols) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="h-64 rounded-2xl glass-panel p-6 space-y-4">
            <div className="h-5 w-40 bg-slate-800/80 rounded" />
            <div className="grid grid-cols-2 gap-4">
              <div className="h-40 bg-slate-800/50 rounded-xl" />
              <div className="h-40 bg-slate-800/50 rounded-xl" />
            </div>
          </div>

          <div className="h-48 rounded-2xl glass-panel p-6 space-y-3">
            <div className="h-5 w-48 bg-slate-800/80 rounded" />
            <div className="h-10 bg-slate-800/50 rounded-xl" />
            <div className="h-10 bg-slate-800/50 rounded-xl" />
          </div>
        </div>

        {/* Right Sidebar Widget (1 col) */}
        <div className="space-y-6">
          <div className="h-80 rounded-2xl glass-panel p-6 space-y-4">
            <div className="h-5 w-36 bg-slate-800/80 rounded" />
            <div className="space-y-3">
              {[1, 2, 3, 4].map(j => (
                <div key={j} className="h-12 bg-slate-800/40 rounded-xl" />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
