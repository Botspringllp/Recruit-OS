'use client';

import React from 'react';
import Link from 'next/link';
import { AlertCircle, Clock, ArrowUpRight, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { SlaWatchdogItem } from '@/types/cockpit';

interface SlaWatchdogWidgetProps {
  items: SlaWatchdogItem[];
}

export const SlaWatchdogWidget: React.FC<SlaWatchdogWidgetProps> = ({ items }) => {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-amber-50 border border-amber-200 text-amber-600">
            <ShieldAlert className="h-4.5 w-4.5" />
          </div>
          <div>
            <h3 className="text-sm font-black text-slate-900 tracking-tight">SLA Watchdog & Telemetry</h3>
            <p className="text-[11px] text-slate-600 font-semibold">
              Live monitoring of pipeline SLA risks, delayed feedback & response gaps
            </p>
          </div>
        </div>

        <span className={`px-2.5 py-0.5 text-[11px] font-black rounded-full border ${
          items.length > 0 ? 'bg-amber-100 text-amber-950 border-amber-300' : 'bg-emerald-100 text-emerald-950 border-emerald-300'
        }`}>
          {items.length > 0 ? `${items.length} Live Risk Alerts` : 'All SLAs Healthy'}
        </span>
      </div>

      {items.length === 0 ? (
        <div className="p-6 rounded-xl bg-slate-50 border border-slate-200 text-center space-y-1">
          <CheckCircle2 className="h-6 w-6 text-emerald-600 mx-auto" />
          <h4 className="text-xs font-black text-slate-900">Zero SLA Breaches Detected</h4>
          <p className="text-[11px] text-slate-500 font-medium">
            All active job mandates and candidate pipeline stages are operating within target turnaround times.
          </p>
        </div>
      ) : (
        <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
          {items.map((item) => (
            <div
              key={item.id}
              className="p-3.5 rounded-xl bg-slate-50/80 border border-slate-200 hover:border-amber-400 hover:bg-white transition-all duration-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
            >
              <div className="flex items-start gap-3">
                <div className={`p-2 rounded-lg shrink-0 mt-0.5 ${
                  item.severity === 'BREACHED'
                    ? 'bg-rose-100 text-rose-700 border border-rose-200'
                    : item.severity === 'HIGH_RISK'
                    ? 'bg-amber-100 text-amber-700 border border-amber-200'
                    : 'bg-blue-100 text-blue-700 border border-blue-200'
                }`}>
                  <AlertCircle className="h-4 w-4" />
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-slate-900">{item.title}</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-black border ${
                      item.severity === 'BREACHED'
                        ? 'bg-rose-100 text-rose-800 border-rose-300'
                        : 'bg-amber-100 text-amber-800 border-amber-300'
                    }`}>
                      {item.severity}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 font-semibold mt-0.5">
                    {item.entityTitle} {item.clientName ? `• ${item.clientName}` : ''}
                  </p>
                  <p className="text-[10px] text-slate-400 font-medium mt-0.5">
                    {item.message}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between sm:justify-end gap-3 border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-200 shrink-0">
                {(item.hoursElapsed || item.daysElapsed) && (
                  <div className="flex items-center gap-1 text-[11px] font-extrabold text-slate-600">
                    <Clock className="h-3.5 w-3.5 text-amber-600" />
                    <span>
                      {item.daysElapsed ? `${item.daysElapsed}d Elapsed` : `${item.hoursElapsed}h Elapsed`}
                    </span>
                  </div>
                )}

                <Link
                  href={item.href}
                  className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[11px] flex items-center gap-1 shadow-2xs transition-colors"
                >
                  <span>Inspect</span>
                  <ArrowUpRight className="h-3 w-3" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
