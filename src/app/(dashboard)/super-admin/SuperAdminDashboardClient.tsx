'use client';

import React, { useState, useTransition } from 'react';
import {
  activateAgencyAction,
  suspendAgencyAction,
  deleteAgencyAction,
  restoreAgencyAction,
  permanentlyDeleteAgencyAction
} from '@/app/actions/agencies';
import { Building2, PauseCircle, PlayCircle, Trash2, RotateCcw, ShieldAlert } from 'lucide-react';

export interface AgencyItem {
  id: string;
  name: string;
  subdomain: string;
  status: 'ACTIVE' | 'SUSPENDED' | 'TRIAL' | 'EXPIRED';
  plan: string;
  createdAt: string | Date;
  deletedAt?: string | Date | null;
  ownerName: string;
  ownerEmail: string;
}

interface SuperAdminDashboardClientProps {
  initialAgencies: AgencyItem[];
  initialDeletedAgencies?: AgencyItem[];
}

export const SuperAdminDashboardClient: React.FC<SuperAdminDashboardClientProps> = ({
  initialAgencies,
  initialDeletedAgencies = []
}) => {
  const [agencies, setAgencies] = useState<AgencyItem[]>(initialAgencies);
  const [deletedAgencies, setDeletedAgencies] = useState<AgencyItem[]>(initialDeletedAgencies);
  const [activeTab, setActiveTab] = useState<'ACTIVE' | 'DELETED'>('ACTIVE');

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

  const handleDelete = (agency: AgencyItem) => {
    if (!confirm(`Are you sure you want to move agency "${agency.name}" to Deleted Agencies?`)) return;

    setActiveActionId(agency.id);
    startTransition(async () => {
      const res = await deleteAgencyAction(agency.id);
      if (res.success) {
        setAgencies(prev => prev.filter(a => a.id !== agency.id));
        setDeletedAgencies(prev => [
          { ...agency, deletedAt: new Date().toISOString() },
          ...prev
        ]);
      }
      setActiveActionId(null);
    });
  };

  const handleRestore = (agency: AgencyItem) => {
    setActiveActionId(agency.id);
    startTransition(async () => {
      const res = await restoreAgencyAction(agency.id);
      if (res.success) {
        setDeletedAgencies(prev => prev.filter(a => a.id !== agency.id));
        setAgencies(prev => [
          { ...agency, status: 'ACTIVE', deletedAt: null },
          ...prev
        ]);
      }
      setActiveActionId(null);
    });
  };

  const handlePermanentDelete = (agency: AgencyItem) => {
    if (!confirm(`WARNING: Permanent deletion of "${agency.name}" cannot be undone! Delete permanently?`)) return;

    setActiveActionId(agency.id);
    startTransition(async () => {
      const res = await permanentlyDeleteAgencyAction(agency.id);
      if (res.success) {
        setDeletedAgencies(prev => prev.filter(a => a.id !== agency.id));
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
      {/* Tab Controls & Table Header */}
      <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-extrabold text-slate-900 tracking-tight">
            Agency Tenants Management
          </h2>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Manage active agency tenants or restore/purge soft-deleted agencies.
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1.5 p-1.5 bg-slate-100 rounded-2xl border border-slate-200">
          <button
            onClick={() => setActiveTab('ACTIVE')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 ${
              activeTab === 'ACTIVE'
                ? 'bg-white text-slate-900 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Building2 className="h-4 w-4 text-indigo-600" />
            <span>Registered Agencies ({agencies.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('DELETED')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 ${
              activeTab === 'DELETED'
                ? 'bg-rose-500 text-white shadow-2xs'
                : 'text-slate-600 hover:text-rose-600'
            }`}
          >
            <Trash2 className="h-4 w-4" />
            <span>Deleted Agencies ({deletedAgencies.length})</span>
          </button>
        </div>
      </div>

      {/* Active Agencies Table */}
      {activeTab === 'ACTIVE' && (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-700 font-extrabold uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="px-6 py-4">Agency & Tenant</th>
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
                    No active agencies registered in system yet. Click "Provision New Agency" to start.
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
                            <span>Activate</span>
                          </button>
                        ) : (
                          <button
                            onClick={() => handleToggleStatus(agency)}
                            disabled={isPending && activeActionId === agency.id}
                            className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 active:scale-95 font-extrabold text-[11px] shadow-2xs flex items-center gap-1.5 transition-all disabled:opacity-50"
                          >
                            <PauseCircle className="h-3.5 w-3.5" />
                            <span>Suspend</span>
                          </button>
                        )}

                        <button
                          onClick={() => handleDelete(agency)}
                          disabled={isPending && activeActionId === agency.id}
                          className="px-3 py-1.5 rounded-xl bg-rose-50 text-rose-700 hover:bg-rose-600 hover:text-white border border-rose-200 active:scale-95 font-extrabold text-[11px] flex items-center gap-1.5 transition-all disabled:opacity-50"
                          title="Move to Deleted Agencies"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          <span>Delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Deleted Agencies Table */}
      {activeTab === 'DELETED' && (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-rose-50/70 text-rose-950 font-extrabold uppercase tracking-wider border-b border-rose-200">
              <tr>
                <th className="px-6 py-4">Deleted Agency Tenant</th>
                <th className="px-6 py-4">Owner Contact</th>
                <th className="px-6 py-4">SaaS Plan</th>
                <th className="px-6 py-4">Date Deleted</th>
                <th className="px-6 py-4 text-right">Restore or Permanent Delete</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
              {deletedAgencies.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-400 font-bold">
                    No deleted agencies found.
                  </td>
                </tr>
              ) : (
                deletedAgencies.map(agency => (
                  <tr key={agency.id} className="hover:bg-rose-50/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center font-black text-xs">
                          {agency.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-extrabold text-slate-900 text-sm line-through opacity-75">{agency.name}</div>
                          <div className="text-[11px] font-mono text-slate-400">{agency.subdomain}.recruitos.com</div>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-800">{agency.ownerName}</div>
                      <div className="text-[11px] text-slate-500">{agency.ownerEmail}</div>
                    </td>

                    <td className="px-6 py-4">
                      <span className="px-2.5 py-1 text-[11px] font-bold rounded-md bg-slate-100 text-slate-600 border border-slate-200">
                        {agency.plan}
                      </span>
                    </td>

                    <td className="px-6 py-4 text-rose-700 font-bold">
                      {agency.deletedAt ? new Date(agency.deletedAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      }) : 'Recently'}
                    </td>

                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleRestore(agency)}
                          disabled={isPending && activeActionId === agency.id}
                          className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-[11px] shadow-2xs flex items-center gap-1.5 transition-all disabled:opacity-50"
                        >
                          <RotateCcw className="h-3.5 w-3.5" />
                          <span>Restore Tenant</span>
                        </button>
                        <button
                          onClick={() => handlePermanentDelete(agency)}
                          disabled={isPending && activeActionId === agency.id}
                          className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-[11px] shadow-2xs flex items-center gap-1.5 transition-all disabled:opacity-50"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          <span>Delete Permanently</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
