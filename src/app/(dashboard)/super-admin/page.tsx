import React from 'react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/rbac';
import { getAgenciesAction } from '@/app/actions/agencies';
import { SuperAdminDashboardClient } from './SuperAdminDashboardClient';
import { Building2, Plus, ShieldAlert, CheckCircle2, PauseCircle, Clock } from 'lucide-react';

export const revalidate = 0;

export default async function SuperAdminDashboardPage() {
  const currentUser = await getCurrentUser();
  const roleStr = String(currentUser?.role || '');

  // Super Admin security check
  if (!currentUser || (roleStr !== 'SUPER_ADMIN' && roleStr !== 'MASTER_OWNER')) {
    redirect('/403');
  }

  const res = await getAgenciesAction(currentUser);
  const agencies = res.success && res.data ? res.data.agencies : [];
  const kpis = res.success && res.data ? res.data.kpis : {
    totalAgencies: 0,
    activeAgencies: 0,
    trialAgencies: 0,
    suspendedAgencies: 0
  };

  return (
    <div className="bg-slate-50 min-h-screen p-6 sm:p-8 space-y-8 text-slate-900">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 text-white p-6 rounded-3xl border border-slate-800 shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 text-[10px] font-extrabold uppercase bg-amber-500 text-slate-950 rounded-md">
              Platform Admin Console
            </span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-2">
            <Building2 className="h-6 w-6 text-amber-500" />
            Agency Provisioning & SaaS Control
          </h1>
          <p className="text-xs text-slate-400 font-medium">
            Manage agency tenants, provision owner accounts, and control system-wide access.
          </p>
        </div>

        <Link
          href="/super-admin/agencies/new"
          className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-amber-500 hover:bg-amber-600 active:scale-95 text-slate-950 font-extrabold text-xs shadow-lg shadow-amber-500/20 transition-all shrink-0"
        >
          <Plus className="h-4 w-4 stroke-[3]" />
          <span>Provision New Agency</span>
        </Link>
      </div>

      {/* KPI Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">Total Agencies</span>
            <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
              <Building2 className="h-5 w-5" />
            </div>
          </div>
          <p className="text-3xl font-black text-slate-900">{kpis.totalAgencies}</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">Active Tenants</span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
              <CheckCircle2 className="h-5 w-5" />
            </div>
          </div>
          <p className="text-3xl font-black text-slate-900">{kpis.activeAgencies}</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">Trial Tenants</span>
            <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
              <Clock className="h-5 w-5" />
            </div>
          </div>
          <p className="text-3xl font-black text-slate-900">{kpis.trialAgencies}</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">Suspended Tenants</span>
            <div className="p-2 rounded-xl bg-rose-50 text-rose-600">
              <PauseCircle className="h-5 w-5" />
            </div>
          </div>
          <p className="text-3xl font-black text-slate-900">{kpis.suspendedAgencies}</p>
        </div>
      </div>

      {/* Interactive Agency List Table */}
      <SuperAdminDashboardClient initialAgencies={agencies} />
    </div>
  );
}
