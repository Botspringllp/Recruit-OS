import React from 'react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getCurrentUser, hasPermission } from '@/lib/rbac';
import { SettingsHeaderTabs } from '@/components/settings/SettingsHeaderTabs';
import { Settings, Building, Save, Users, ArrowRight, Globe } from 'lucide-react';
import { prisma } from '@/lib/prisma';

export const revalidate = 0;

export default async function SettingsPage() {
  const dbUser = await getCurrentUser();
  if (!dbUser || !hasPermission(dbUser, 'user.manage')) {
    redirect('/403');
  }

  const roleStr = String(dbUser.role || '').toUpperCase();
  let agencyId = dbUser.agencyId || dbUser.agency?.id;

  let demoAgency = null;
  if (agencyId) {
    demoAgency = await (prisma.agency as any).findFirst({
      where: { id: agencyId, deletedAt: null },
      select: { id: true, name: true, subdomain: true, subscriptionTier: true, widgetEnabled: true }
    }).catch(() => null);
  }

  if (!demoAgency && (roleStr === 'SUPER_ADMIN' || roleStr === 'MASTER_OWNER')) {
    demoAgency = await (prisma.agency as any).findFirst({
      where: { deletedAt: null },
      select: { id: true, name: true, subdomain: true, subscriptionTier: true, widgetEnabled: true }
    }).catch(() => null);
  }

  return (
    <div className="space-y-6 pb-12 text-slate-900 font-sans">
      {/* Navigation Tabs */}
      <SettingsHeaderTabs />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <Settings className="h-6 w-6 text-amber-500" />
            Agency Settings Hub
          </h1>
          <p className="text-xs font-semibold text-slate-600 mt-1">
            Organization branding, portal domains, widget capture & team access control
          </p>
        </div>

        <button className="px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-xl text-xs font-black transition-all duration-200 flex items-center gap-2 shadow-md shadow-amber-500/20 self-start sm:self-auto">
          <Save className="h-4 w-4" />
          <span>Save Changes</span>
        </button>
      </div>

      {/* Website & Widget Management Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
              <Globe className="h-5 w-5 text-amber-500" />
              Website & Requirement Capture Widget
            </h2>
            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase border ${
              demoAgency?.widgetEnabled
                ? 'bg-emerald-100 text-emerald-950 border-emerald-300'
                : 'bg-slate-100 text-slate-600 border-slate-300'
            }`}>
              {demoAgency?.widgetEnabled ? 'Widget Enabled' : 'Widget Access Disabled'}
            </span>
          </div>
          <p className="text-xs font-semibold text-slate-600">
            Collect hiring requirements directly from client website leads into your RecruitOS Intake Queue. Test preview & download standalone ZIP package.
          </p>
        </div>
        <Link
          href="/agency-settings/widget"
          className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-black text-xs rounded-xl transition-all shadow-md flex items-center gap-2 shrink-0"
        >
          <span>Open Widget Manager</span>
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      {/* User & Team Management Link Card */}
      <div className="bg-white rounded-2xl border border-amber-200 shadow-sm p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
            <Users className="h-5 w-5 text-amber-500" />
            User & Team Management
          </h2>
          <p className="text-xs font-semibold text-slate-600">
            Manage agency team members, role assignments, reporting managers & feature permissions
          </p>
        </div>
        <Link
          href="/settings/users"
          className="px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs rounded-xl transition-all shadow-md shadow-amber-500/20 flex items-center gap-2 shrink-0"
        >
          <span>Manage Team Users</span>
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      {/* Agency Details */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
        <h2 className="text-sm font-black text-slate-900 flex items-center gap-2">
          <Building className="h-4 w-4 text-amber-500" />
          Organization Profile
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="space-y-1.5">
            <label className="text-slate-600 font-extrabold">Agency Name</label>
            <input
              type="text"
              readOnly
              value={demoAgency?.name || 'RecruitOS Agency'}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-slate-600 font-extrabold">Subdomain</label>
            <input
              type="text"
              readOnly
              value={`${demoAgency?.subdomain || 'agency'}.recruitos.in`}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-slate-600 font-extrabold">Subscription Tier</label>
            <input
              type="text"
              readOnly
              value={demoAgency?.subscriptionTier || 'ENTERPRISE'}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-amber-600"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-slate-600 font-extrabold">Agency ID</label>
            <input
              type="text"
              readOnly
              value={demoAgency?.id || 'N/A'}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold text-slate-800"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
