'use client';

import React, { useState, useTransition } from 'react';
import { activateAgencyAction, suspendAgencyAction } from '@/app/actions/agencies';
import { Building2, Shield, PauseCircle, PlayCircle, ExternalLink, AlertTriangle } from 'lucide-react';

interface AgencyItem {
  id: string;
  name: string;
  subdomain: string;
  status: 'ACTIVE' | 'SUSPENDED' | 'TRIAL' | 'EXPIRED';
  plan: string;
  createdAt: string | Date;
  ownerName: string;
  ownerEmail: string;
}

interface SuperAdminDashboardClientProps {
  initialAgencies: AgencyItem[];
}

export const SuperAdminDashboardClient: React.FC<SuperAdminDashboardClientProps> = ({ initialAgencies }) => {
  const [agencies, setAgencies] = useState<AgencyItem[]>(initialAgencies);
  const [isPending, startTransition] = useTransition();
  const [activeActionId, setActiveActionId] = useState<string | null>(null);

  const handleToggleStatus = (agency: AgencyItem) => {
    setActiveActionId(agency.id);
    startTransition(async () => {
      if (agency.status === 'SUSPENDED') {
        const res = await activateAgencyAction(agency.id);
        if (res.success) {
          setAgencies(prev =>
            prev.map(a => (a.id === agency.id ? { ...a, status: 'ACTIVE' } : a))
          );
        }
      } else {
        const res = await suspendAgencyAction(agency.id);
        if (res.success) {
          setAgencies(prev =>
            prev.map(a => (a.id === agency.id ? { ...a, status: 'SUSPENDED' } : a))
          );
        }
      }
      setActiveActionId(null);
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return <span className="px-2.5 py-1 text-[11px] font-extrabold rounded-md bg-emerald-100 text-emerald-800 border border-emerald-300">ACTIVE</span>;
      case 'SUSPENDED':
        return <span className="px-2.5 py-1 text-[11px] font-extrabold rounded-md bg-rose-100 text-rose-800 border border-rose-300">SUSPENDED</span>;
      case 'TRIAL':
        return <span className="px-2.5 py-1 text-[11px] font-extrabold rounded-md bg-amber-100 text-amber-800 border border-amber-300">TRIAL</span>;
      default:
        return <span className="px-2.5 py-1 text-[11px] font-extrabold rounded-md bg-slate-100 text-slate-800 border border-slate-300">{status}</span>;
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden space-y-4">
      <div className="p-6 border-b border-slate-100 flex items-center justify-between">
        <div>
          <h2 className="text-base font-extrabold text-slate-900 tracking-tight">
            Registered Agency Tenants ({agencies.length})
          </h2>
          <p className="text-xs text-slate-500 font-medium">
            Super Admin views agency administrative metadata only. Tenant business records remain private.
          </p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 text-slate-700 font-extrabold uppercase tracking-wider border-b border-slate-200">
            <tr>
              <th className="px-6 py-4">Agency & Subdomain</th>
              <th className="px-6 py-4">Owner Contact</th>
              <th className="px-6 py-4">SaaS Plan</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4">Provisioned Date</th>
              <th className="px-6 py-4 text-right">Administrative Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
            {agencies.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-slate-400 font-bold">
                  No agencies registered in system yet. Click "Provision New Agency" to start.
                </td>
              </tr>
            ) : (
              agencies.map(agency => (
                <tr key={agency.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-xl bg-slate-900 text-amber-500 flex items-center justify-center font-black text-xs shadow-2xs">
                        {agency.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-extrabold text-slate-900 text-sm">{agency.name}</div>
                        <div className="text-[11px] font-mono text-slate-500">{agency.subdomain}.recruitos.com</div>
                      </div>
                    </div>
                  </td>

                  <td className="px-6 py-4">
                    <div className="font-bold text-slate-900">{agency.ownerName}</div>
                    <div className="text-[11px] text-slate-500">{agency.ownerEmail}</div>
                  </td>

                  <td className="px-6 py-4">
                    <span className="px-2.5 py-1 text-[11px] font-bold rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200">
                      {agency.plan}
                    </span>
                  </td>

                  <td className="px-6 py-4">
                    {getStatusBadge(agency.status)}
                  </td>

                  <td className="px-6 py-4 text-slate-600">
                    {new Date(agency.createdAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric'
                    })}
                  </td>

                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {agency.status === 'SUSPENDED' ? (
                        <button
                          onClick={() => handleToggleStatus(agency)}
                          disabled={isPending && activeActionId === agency.id}
                          className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-extrabold text-[11px] shadow-2xs flex items-center gap-1.5 transition-all disabled:opacity-50"
                        >
                          <PlayCircle className="h-3.5 w-3.5" />
                          <span>Activate Tenant</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => handleToggleStatus(agency)}
                          disabled={isPending && activeActionId === agency.id}
                          className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 active:scale-95 text-white font-extrabold text-[11px] shadow-2xs flex items-center gap-1.5 transition-all disabled:opacity-50"
                        >
                          <PauseCircle className="h-3.5 w-3.5" />
                          <span>Suspend Tenant</span>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
