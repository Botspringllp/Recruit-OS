'use client';

import React from 'react';
import { Briefcase, Users, AlertTriangle, Calendar, TrendingUp, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { KpiMetricItem } from '@/types/cockpit';

interface KpiMetricStripProps {
  metrics: KpiMetricItem[];
}

export const KpiMetricStrip: React.FC<KpiMetricStripProps> = ({ metrics }) => {
  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'Briefcase':
        return <Briefcase className="h-5 w-5 text-indigo-600" />;
      case 'Users':
        return <Users className="h-5 w-5 text-blue-600" />;
      case 'AlertTriangle':
        return <AlertTriangle className="h-5 w-5 text-amber-600 animate-pulse" />;
      case 'Calendar':
        return <Calendar className="h-5 w-5 text-purple-600" />;
      case 'TrendingUp':
        return <TrendingUp className="h-5 w-5 text-emerald-600" />;
      default:
        return <Briefcase className="h-5 w-5 text-indigo-600" />;
    }
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
      {metrics.map(metric => (
        <div
          key={metric.id}
          className="rounded-2xl bg-white border border-slate-200 p-5 flex flex-col justify-between shadow-sm shadow-slate-200/50 hover:shadow-md hover:border-indigo-400 transition-all duration-200 group cursor-pointer"
        >
          {/* Header row */}
          <div className="flex items-center justify-between gap-2 mb-3">
            <span className="text-xs font-extrabold uppercase tracking-wider text-slate-600 group-hover:text-slate-900 transition-colors">
              {metric.title}
            </span>
            <div className="h-9 w-9 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center shadow-2xs group-hover:scale-105 transition-transform duration-200">
              {getIcon(metric.icon)}
            </div>
          </div>

          {/* Value row */}
          <div className="flex items-baseline justify-between gap-2">
            <div className="text-2xl font-black text-slate-900 tracking-tight">
              {metric.value}
            </div>

            {metric.badgeText && (
              <span
                className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border ${
                  metric.badgeVariant === 'amber'
                    ? 'bg-amber-100 text-amber-950 border-amber-300'
                    : metric.badgeVariant === 'emerald'
                    ? 'bg-emerald-100 text-emerald-950 border-emerald-300'
                    : 'bg-indigo-100 text-indigo-950 border-indigo-300'
                }`}
              >
                {metric.badgeText}
              </span>
            )}
          </div>

          {/* Trend row */}
          <div className="flex items-center gap-1.5 mt-3 pt-2.5 border-t border-slate-100 text-xs">
            {metric.isPositiveTrend ? (
              <ArrowUpRight className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
            ) : (
              <ArrowDownRight className="h-3.5 w-3.5 text-rose-600 shrink-0" />
            )}
            <span
              className={metric.isPositiveTrend ? 'text-emerald-700 font-extrabold' : 'text-rose-700 font-extrabold'}
            >
              {metric.changeTrend}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
};
