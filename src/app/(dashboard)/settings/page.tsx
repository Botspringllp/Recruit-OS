import React from 'react';
import { Settings, Building, Save } from 'lucide-react';
import { prisma } from '@/lib/prisma';

export const revalidate = 0;

export default async function SettingsPage() {
  const demoAgency = await prisma.agency.findFirst({
    where: { subdomain: 'demo' },
    select: { id: true, name: true, subdomain: true, subscriptionTier: true }
  }).catch(() => null);

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <Settings className="h-6 w-6 text-indigo-600" />
            Agency Settings
          </h1>
          <p className="text-xs font-semibold text-slate-600 mt-1">
            Organization branding, portal domains & security preferences
          </p>
        </div>

        <button className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-extrabold transition-all duration-200 flex items-center gap-2 shadow-md shadow-indigo-600/20 interactive-hover self-start sm:self-auto">
          <Save className="h-4 w-4" />
          Save Changes
        </button>
      </div>

      {/* Agency Details */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm shadow-slate-200/50 p-6 space-y-6">
        <h2 className="text-sm font-black text-slate-900 flex items-center gap-2">
          <Building className="h-4 w-4 text-indigo-600" />
          Organization Profile
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="space-y-1.5">
            <label className="text-slate-600 font-extrabold">Agency Name</label>
            <input
              type="text"
              readOnly
              defaultValue={demoAgency?.name || 'RecruitOS Demo Agency'}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-extrabold focus:outline-none"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-slate-600 font-extrabold">Agency Subdomain</label>
            <input
              type="text"
              readOnly
              defaultValue={demoAgency?.subdomain || 'demo'}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-indigo-700 font-extrabold focus:outline-none"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-slate-600 font-extrabold">Subscription Tier</label>
            <input
              type="text"
              readOnly
              defaultValue={demoAgency?.subscriptionTier || 'ENTERPRISE'}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-emerald-800 font-extrabold focus:outline-none"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-slate-600 font-extrabold">Multi-Tenant Status</label>
            <input
              type="text"
              readOnly
              defaultValue="PostgreSQL RLS Active (Tenant Isolated)"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-indigo-900 font-extrabold focus:outline-none"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
