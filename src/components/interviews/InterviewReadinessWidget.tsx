import React from 'react';
import { Calendar, Send, BookOpenCheck, CheckCircle2, AlertTriangle, Sparkles } from 'lucide-react';
import { getInterviewReadinessMetricsAction } from '@/app/actions/interviewPrep';

interface InterviewReadinessWidgetProps {
  agencyId?: string;
}

export async function InterviewReadinessWidget({ agencyId }: InterviewReadinessWidgetProps) {
  const metrics = await getInterviewReadinessMetricsAction(agencyId);

  return (
    <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 border border-indigo-800/40 shadow-xl text-white space-y-4">
      <div className="flex items-center justify-between border-b border-indigo-800/40 pb-3">
        <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-amber-400">
          <Sparkles className="h-4 w-4 text-amber-400" />
          <span>Interview Readiness Tracking Engine (IW-03)</span>
        </div>
        <span className="text-[10px] font-extrabold bg-indigo-500/20 border border-indigo-400/30 text-indigo-200 px-3 py-1 rounded-full">
          Real-Time Tracking
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {/* Metric 1 */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-3.5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] font-extrabold uppercase tracking-wider">Total Scheduled</span>
            <Calendar className="h-4 w-4 text-indigo-400" />
          </div>
          <div className="mt-2 text-xl font-black text-white">{metrics.totalScheduled}</div>
        </div>

        {/* Metric 2 */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-3.5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-sky-400">Prep Sent</span>
            <Send className="h-4 w-4 text-sky-400" />
          </div>
          <div className="mt-2 text-xl font-black text-sky-300">{metrics.prepSent}</div>
        </div>

        {/* Metric 3 */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-3.5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-purple-400">Prep Opened</span>
            <BookOpenCheck className="h-4 w-4 text-purple-400" />
          </div>
          <div className="mt-2 text-xl font-black text-purple-300">{metrics.prepOpened}</div>
        </div>

        {/* Metric 4 */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-3.5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-400">Completed</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="mt-2 text-xl font-black text-emerald-300">{metrics.prepCompleted}</div>
        </div>

        {/* Metric 5 */}
        <div className="bg-slate-900/80 border border-amber-500/30 rounded-2xl p-3.5 flex flex-col justify-between col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between text-amber-400">
            <span className="text-[10px] font-extrabold uppercase tracking-wider">Needs Follow-Up</span>
            <AlertTriangle className="h-4 w-4 text-amber-400" />
          </div>
          <div className="mt-2 text-xl font-black text-amber-400">{metrics.needsFollowUp}</div>
        </div>
      </div>
    </div>
  );
}
