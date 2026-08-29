import React from 'react';
import { DollarSign, AlertCircle, CheckCircle, Clock, Percent, TrendingUp } from 'lucide-react';

interface RevenueSummaryCardsProps {
  stats: {
    totalRevenue: number;
    outstandingReceivables: number;
    invoicesSentCount: number;
    invoicesPaidCount: number;
    overdueCount: number;
    collectionRate: number;
  };
}

export function RevenueSummaryCards({ stats }: RevenueSummaryCardsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
      {/* Total Revenue Billed */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm shadow-slate-200/50 hover:shadow-md hover:border-indigo-400 transition-all duration-200 group">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500">Total Billed</span>
          <div className="p-2 rounded-xl bg-indigo-50 text-indigo-700 border border-indigo-200">
            <DollarSign className="h-4 w-4" />
          </div>
        </div>
        <div className="mt-3">
          <div className="text-xl font-black text-slate-900 tracking-tight">
            ₹{stats.totalRevenue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
          </div>
          <p className="text-[10px] text-slate-600 font-bold mt-0.5 flex items-center gap-1">
            <TrendingUp className="h-3 w-3 text-emerald-600 inline" /> Total invoice value
          </p>
        </div>
      </div>

      {/* Outstanding Receivables */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm shadow-slate-200/50 hover:shadow-md hover:border-amber-400 transition-all duration-200 group">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500">Receivables</span>
          <div className="p-2 rounded-xl bg-amber-50 text-amber-800 border border-amber-300">
            <Clock className="h-4 w-4" />
          </div>
        </div>
        <div className="mt-3">
          <div className="text-xl font-black text-amber-800 tracking-tight">
            ₹{stats.outstandingReceivables.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
          </div>
          <p className="text-[10px] text-amber-800 font-bold mt-0.5">Pending client payments</p>
        </div>
      </div>

      {/* Invoices Sent */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm shadow-slate-200/50 hover:shadow-md hover:border-indigo-400 transition-all duration-200 group">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500">Invoices Sent</span>
          <div className="p-2 rounded-xl bg-indigo-50 text-indigo-700 border border-indigo-200">
            <Clock className="h-4 w-4" />
          </div>
        </div>
        <div className="mt-3">
          <div className="text-xl font-black text-slate-900 tracking-tight">{stats.invoicesSentCount}</div>
          <p className="text-[10px] text-slate-600 font-semibold mt-0.5">Dispatched to clients</p>
        </div>
      </div>

      {/* Invoices Paid */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm shadow-slate-200/50 hover:shadow-md hover:border-emerald-400 transition-all duration-200 group">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500">Paid Invoices</span>
          <div className="p-2 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-300">
            <CheckCircle className="h-4 w-4" />
          </div>
        </div>
        <div className="mt-3">
          <div className="text-xl font-black text-emerald-700 tracking-tight">{stats.invoicesPaidCount}</div>
          <p className="text-[10px] text-slate-600 font-semibold mt-0.5">Fully collected</p>
        </div>
      </div>

      {/* Overdue Invoices */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm shadow-slate-200/50 hover:shadow-md hover:border-rose-400 transition-all duration-200 group">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500">Overdue</span>
          <div className="p-2 rounded-xl bg-rose-50 text-rose-800 border border-rose-300">
            <AlertCircle className="h-4 w-4" />
          </div>
        </div>
        <div className="mt-3">
          <div className="text-xl font-black text-rose-700 tracking-tight">{stats.overdueCount}</div>
          <p className="text-[10px] text-rose-700 font-extrabold mt-0.5">Passed due date</p>
        </div>
      </div>

      {/* Collection Rate % */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm shadow-slate-200/50 hover:shadow-md hover:border-blue-400 transition-all duration-200 group">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500">Collection Rate</span>
          <div className="p-2 rounded-xl bg-blue-50 text-blue-800 border border-blue-300">
            <Percent className="h-4 w-4" />
          </div>
        </div>
        <div className="mt-3">
          <div className="text-xl font-black text-blue-900 tracking-tight">{stats.collectionRate.toFixed(1)}%</div>
          <p className="text-[10px] text-slate-600 font-semibold mt-0.5">Realized revenue ratio</p>
        </div>
      </div>
    </div>
  );
}
