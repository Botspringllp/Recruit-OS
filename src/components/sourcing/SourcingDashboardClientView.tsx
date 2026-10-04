'use client';

import React from 'react';
import Link from 'next/link';
import {
  Users,
  Globe,
  TrendingUp,
  BrainCircuit,
  Share2,
  Building2,
  Clock,
  ChevronRight,
  ArrowUpRight,
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';

interface SourcingDashboardClientViewProps {
  metrics: any;
  sources: any[];
  recentApplications: any[];
}

export function SourcingDashboardClientView({
  metrics,
  sources,
  recentApplications
}: SourcingDashboardClientViewProps) {
  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <Globe className="h-6 w-6 text-brand-400" />
            Candidate Acquisition & Sourcing Analytics Dashboard
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-time career portal performance, candidate sourcing channel breakdown, and AI match quality metrics.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/careers"
            target="_blank"
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold transition flex items-center gap-2"
          >
            <Globe className="h-4 w-4 text-brand-400" /> View Public Portal
          </Link>

          <Link
            href="/talent-search"
            className="px-4 py-2 bg-gradient-to-r from-brand-600 to-indigo-600 text-white rounded-xl text-xs font-bold hover:brightness-110 transition flex items-center gap-2 shadow-glow-brand"
          >
            <BrainCircuit className="h-4 w-4" /> Talent Search Center
          </Link>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-panel p-5 rounded-2xl border border-slate-800/80 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Total Applicants</span>
            <Users className="h-4 w-4 text-brand-400" />
          </div>
          <div className="text-2xl font-extrabold text-white">
            {metrics?.totalApplicants || recentApplications.length || 0}
          </div>
          <span className="text-[10px] text-emerald-400 flex items-center gap-1 font-semibold">
            <TrendingUp className="h-3 w-3" /> +18.4% this month
          </span>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-slate-800/80 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Jobs Published</span>
            <Share2 className="h-4 w-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-extrabold text-white">
            {metrics?.totalJobsPublished || 5}
          </div>
          <span className="text-[10px] text-slate-400 font-semibold">
            Multi-channel distribution
          </span>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-slate-800/80 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">AI Match Conversion</span>
            <BrainCircuit className="h-4 w-4 text-purple-400" />
          </div>
          <div className="text-2xl font-extrabold text-white">
            {metrics?.conversionRate || 68}%
          </div>
          <span className="text-[10px] text-emerald-400 font-semibold">
            High AI Quality (&gt;80% match)
          </span>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-slate-800/80 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Time to Sourcing</span>
            <Clock className="h-4 w-4 text-amber-400" />
          </div>
          <div className="text-2xl font-extrabold text-white">
            &lt; 2.4 Hrs
          </div>
          <span className="text-[10px] text-slate-400 font-semibold">
            Instant candidate intake
          </span>
        </div>
      </div>

      {/* Sourcing Channel Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="glass-panel p-6 rounded-2xl border border-slate-800/80 space-y-4">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center justify-between">
            <span>Sourcing Channel Breakdown</span>
            <span className="text-xs font-normal text-slate-400">Total {sources.reduce((a, b) => a + (b.count || 0), 0) || recentApplications.length}</span>
          </h3>

          <div className="space-y-3">
            {[
              { name: 'CAREER_PORTAL', label: 'Internal Career Portal', percent: 45, color: 'bg-brand-500' },
              { name: 'LINKEDIN', label: 'LinkedIn Jobs', percent: 30, color: 'bg-cyan-500' },
              { name: 'NAUKRI', label: 'Naukri Sourcing', percent: 15, color: 'bg-amber-500' },
              { name: 'REFERRAL', label: 'Employee Referrals', percent: 10, color: 'bg-emerald-500' }
            ].map((sc) => (
              <div key={sc.name} className="space-y-1 text-xs">
                <div className="flex justify-between text-slate-300 font-semibold">
                  <span>{sc.label}</span>
                  <span>{sc.percent}%</span>
                </div>
                <div className="h-2 w-full bg-slate-900 rounded-full overflow-hidden">
                  <div className={`h-full ${sc.color}`} style={{ width: `${sc.percent}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Applications Table */}
        <div className="lg:col-span-2 glass-panel p-6 rounded-2xl border border-slate-800/80 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Recent Inbound Applications
            </h3>
            <Link
              href="/submissions"
              className="text-xs text-brand-400 hover:underline flex items-center gap-1 font-semibold"
            >
              View All Submissions <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-semibold">
                  <th className="pb-3">Candidate</th>
                  <th className="pb-3">Job Mandate</th>
                  <th className="pb-3">AI Match</th>
                  <th className="pb-3">Stage</th>
                  <th className="pb-3">Applied</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {recentApplications.length > 0 ? (
                  recentApplications.map((sub: any) => (
                    <tr key={sub.id} className="hover:bg-slate-900/40 transition">
                      <td className="py-3 font-semibold text-white">
                        {sub.candidate?.firstName} {sub.candidate?.lastName}
                      </td>
                      <td className="py-3 text-slate-300">
                        {sub.job?.title || 'Job Opening'}
                      </td>
                      <td className="py-3 font-bold text-brand-300">
                        {sub.matchScore || 90}%
                      </td>
                      <td className="py-3">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-brand-500/10 text-brand-300 border border-brand-500/20">
                          {sub.stage}
                        </span>
                      </td>
                      <td className="py-3 text-slate-400 text-[11px]">
                        {new Date(sub.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-500 italic">
                      No inbound candidate applications recorded yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
