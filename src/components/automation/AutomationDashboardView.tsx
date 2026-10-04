'use client';

import React, { useState, useTransition } from 'react';
import {
  Activity,
  Play,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  Mail,
  Zap,
  ShieldAlert,
  Server,
  Terminal,
  Check,
  Calendar
} from 'lucide-react';
import { runSingleJobNowAction, runAllJobsNowAction } from '@/app/actions/automation';

interface JobStat {
  jobName: string;
  description: string;
  category: string;
  lastRunAt: string | null;
  status: string;
  durationMs: number;
  processedCount: number;
  failedCount: number;
  errorMessage: string | null;
}

interface EmailQueueStats {
  pending: number;
  failed: number;
  sent: number;
}

interface AutomationDashboardViewProps {
  systemHealth: 'HEALTHY' | 'WARNING' | 'FAILED';
  totalRegisteredJobs: number;
  lastRunTime: string | null;
  totalRuns: number;
  successRate: number;
  emailQueue: EmailQueueStats;
  jobStats: JobStat[];
  recentLogs: any[];
}

export function AutomationDashboardView({
  systemHealth: initialHealth,
  totalRegisteredJobs,
  lastRunTime: initialLastRun,
  totalRuns,
  successRate: initialSuccessRate,
  emailQueue: initialQueue,
  jobStats: initialJobStats,
  recentLogs: initialLogs
}: AutomationDashboardViewProps) {
  const [isPending, startTransition] = useTransition();
  const [runningJobName, setRunningJobName] = useState<string | null>(null);
  const [isRunningAll, setIsRunningAll] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const handleRunSingleJob = (jobName: string) => {
    setRunningJobName(jobName);
    setNotification(null);

    startTransition(async () => {
      const res = await runSingleJobNowAction(jobName);
      setRunningJobName(null);

      if (res.success) {
        setNotification({
          type: 'success',
          message: `Job '${jobName}' completed in ${res.durationMs}ms. Processed: ${res.processed}, Failed: ${res.failed}`
        });
      } else {
        setNotification({
          type: 'error',
          message: `Job '${jobName}' failed: ${res.errorMessage || res.error || 'Unknown error'}`
        });
      }
    });
  };

  const handleRunAllJobs = () => {
    setIsRunningAll(true);
    setNotification(null);

    startTransition(async () => {
      const res = await runAllJobsNowAction();
      setIsRunningAll(false);

      if (res.success) {
        setNotification({
          type: 'success',
          message: `All ${res.jobsExecuted} jobs executed successfully in ${res.durationMs}ms! Processed: ${res.processed}`
        });
      } else {
        setNotification({
          type: 'error',
          message: `Executed ${res.jobsExecuted} jobs with ${res.failed} failures in ${res.durationMs}ms.`
        });
      }
    });
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner Header */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 sm:p-8 border border-indigo-800/40 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Zap className="h-6 w-6 text-amber-400" />
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Automation & Job Scheduler Engine
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-300 font-semibold max-w-2xl leading-relaxed">
            Centralized background job infrastructure (PHASE CR-01). Monitors automated interview reminders, email queue retries, subscription expiry alerts, and candidate follow-ups.
          </p>
        </div>

        <button
          onClick={handleRunAllJobs}
          disabled={isPending || isRunningAll}
          className="inline-flex items-center gap-2.5 px-6 py-3.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-black rounded-2xl text-xs sm:text-sm shadow-lg shadow-amber-500/20 hover:scale-105 active:scale-95 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
        >
          <RefreshCw className={`h-4 w-4 ${isRunningAll ? 'animate-spin' : ''}`} />
          <span>{isRunningAll ? 'Executing All Jobs...' : 'Run All Jobs Now'}</span>
        </button>
      </div>

      {/* Toast Notification Alert */}
      {notification && (
        <div
          className={`p-4 rounded-2xl border text-xs font-bold flex items-center justify-between shadow-md transition-all ${
            notification.type === 'success'
              ? 'bg-emerald-50 text-emerald-950 border-emerald-300'
              : 'bg-rose-50 text-rose-950 border-rose-300'
          }`}
        >
          <div className="flex items-center gap-2">
            {notification.type === 'success' ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
            ) : (
              <XCircle className="h-4 w-4 text-rose-600 shrink-0" />
            )}
            <span>{notification.message}</span>
          </div>
          <button
            onClick={() => setNotification(null)}
            className="text-slate-400 hover:text-slate-700 font-extrabold text-sm ml-4"
          >
            ×
          </button>
        </div>
      )}

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Metric 1: System Health */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm shadow-slate-200/50 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">System Health</span>
            <Activity className="h-4 w-4 text-indigo-600" />
          </div>
          <div className="mt-3 flex items-center gap-2">
            {initialHealth === 'HEALTHY' ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-emerald-100 text-emerald-900 border border-emerald-300">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                HEALTHY
              </span>
            ) : initialHealth === 'WARNING' ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-amber-100 text-amber-900 border border-amber-300">
                <span className="h-2 w-2 rounded-full bg-amber-500" />
                WARNING
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-rose-100 text-rose-900 border border-rose-300">
                <span className="h-2 w-2 rounded-full bg-rose-500" />
                CRITICAL
              </span>
            )}
          </div>
        </div>

        {/* Metric 2: Registered Jobs */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm shadow-slate-200/50 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">Registered Jobs</span>
            <Server className="h-4 w-4 text-indigo-600" />
          </div>
          <div className="mt-3">
            <span className="text-2xl font-black text-slate-900">{totalRegisteredJobs}</span>
            <span className="text-xs text-slate-500 font-bold ml-1">active</span>
          </div>
        </div>

        {/* Metric 3: Success Rate */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm shadow-slate-200/50 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">Success Rate</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          </div>
          <div className="mt-3">
            <span className="text-2xl font-black text-slate-900">{initialSuccessRate}%</span>
            <span className="text-[11px] text-slate-500 font-bold ml-1">({totalRuns} runs)</span>
          </div>
        </div>

        {/* Metric 4: Email Queue Status */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm shadow-slate-200/50 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">Email Queue</span>
            <Mail className="h-4 w-4 text-sky-600" />
          </div>
          <div className="mt-3 flex items-center gap-2 text-xs font-bold">
            <span className="text-amber-600 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
              {initialQueue.pending} PENDING
            </span>
            <span className="text-rose-600 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
              {initialQueue.failed} FAILED
            </span>
          </div>
        </div>

        {/* Metric 5: Last Run Time */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm shadow-slate-200/50 flex flex-col justify-between col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">Last Scheduler Run</span>
            <Clock className="h-4 w-4 text-slate-500" />
          </div>
          <div className="mt-3 text-xs font-extrabold text-slate-800">
            {initialLastRun ? new Date(initialLastRun).toLocaleString() : 'Never Executed'}
          </div>
        </div>
      </div>

      {/* Registered Automation Jobs Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm shadow-slate-200/50 overflow-hidden space-y-4 p-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
              <Terminal className="h-5 w-5 text-indigo-600" />
              Registered Automation Jobs
            </h2>
            <p className="text-xs text-slate-500 font-semibold mt-0.5">
              Individual job registry details, execution state, and instant manual trigger controls.
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-500 uppercase text-[10px] font-black border-b border-slate-200">
                <th className="py-3 px-4">Job Name</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Description</th>
                <th className="py-3 px-4">Last Status</th>
                <th className="py-3 px-4">Duration</th>
                <th className="py-3 px-4">Processed</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {initialJobStats.map((job) => {
                const isRunning = runningJobName === job.jobName;

                return (
                  <tr key={job.jobName} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4 font-black text-slate-900 font-mono text-xs">
                      {job.jobName}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-indigo-50 text-indigo-700 border border-indigo-200">
                        {job.category}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-medium text-slate-600 max-w-xs">
                      {job.description}
                    </td>
                    <td className="py-3.5 px-4">
                      {job.status === 'SUCCESS' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300">
                          <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                          SUCCESS
                        </span>
                      ) : job.status === 'FAILED' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-rose-100 text-rose-800 border border-rose-300">
                          <XCircle className="h-3 w-3 text-rose-600" />
                          FAILED
                        </span>
                      ) : job.status === 'PARTIAL_SUCCESS' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-100 text-amber-800 border border-amber-300">
                          <AlertTriangle className="h-3 w-3 text-amber-600" />
                          PARTIAL
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600">
                          NEVER RUN
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-700">
                      {job.durationMs ? `${job.durationMs}ms` : '-'}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-700">
                      {job.processedCount}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => handleRunSingleJob(job.jobName)}
                        disabled={isPending || isRunning}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-indigo-600 text-white rounded-xl text-xs font-black transition-all shadow-2xs disabled:opacity-50"
                      >
                        <Play className={`h-3 w-3 ${isRunning ? 'animate-spin' : ''}`} />
                        <span>{isRunning ? 'Running...' : 'Run Now'}</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent Job Execution Logs */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm shadow-slate-200/50 p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
            <Activity className="h-5 w-5 text-indigo-600" />
            Execution Audit Logs (AutomationJobLog)
          </h2>
        </div>

        <div className="overflow-x-auto max-h-96 overflow-y-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-500 uppercase text-[10px] font-black border-b border-slate-200">
                <th className="py-3 px-4">Started At</th>
                <th className="py-3 px-4">Job Name</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Duration</th>
                <th className="py-3 px-4">Processed / Failed</th>
                <th className="py-3 px-4">Error Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {initialLogs.length > 0 ? (
                initialLogs.map((log: any) => (
                  <tr key={log.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-2.5 px-4 font-bold text-slate-600 text-[11px]">
                      {new Date(log.startedAt).toLocaleString()}
                    </td>
                    <td className="py-2.5 px-4 font-mono font-bold text-slate-900">
                      {log.jobName}
                    </td>
                    <td className="py-2.5 px-4">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-black ${
                          log.status === 'SUCCESS'
                            ? 'bg-emerald-100 text-emerald-800'
                            : log.status === 'FAILED'
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {log.status}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 font-bold text-slate-700">
                      {log.durationMs ? `${log.durationMs}ms` : '-'}
                    </td>
                    <td className="py-2.5 px-4 font-bold text-slate-700">
                      {log.processedCount} / {log.failedCount}
                    </td>
                    <td className="py-2.5 px-4 text-slate-500 truncate max-w-xs font-mono text-[11px]">
                      {log.errorMessage || '-'}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400 font-bold">
                    No automation job execution logs recorded yet. Click "Run All Jobs Now" to trigger a cycle.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
