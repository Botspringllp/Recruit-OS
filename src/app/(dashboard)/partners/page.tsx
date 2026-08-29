import React from 'react';
import Link from 'next/link';
import { Handshake, Share2, Plus, Building2, Users, DollarSign } from 'lucide-react';
import { prisma } from '@/lib/prisma';
import PartnerPayoutTracker from '@/components/partners/PartnerPayoutTracker';
import ShareMandateModalWrapper from '@/components/partners/ShareMandateModalWrapper';

export const revalidate = 0;

export default async function PartnersPage() {
  const demoAgency = await prisma.agency.findFirst({
    where: { subdomain: 'demo' },
    select: { id: true }
  }).catch(() => null);
  const agencyId = demoAgency?.id || 'adaa404d-0ce3-4b72-9981-882a8f31a2af';

  // Fetch Partner Agencies
  const partners = await (prisma as any).partnerAgency.findMany({
    where: { agencyId },
    orderBy: { createdAt: 'desc' },
    include: {
      _count: { select: { shares: true, splits: true } }
    }
  }).catch(() => []);

  // Fetch Shared Mandates
  const partnerShares = await (prisma as any).partnerMandateShare.findMany({
    where: { agencyId },
    orderBy: { createdAt: 'desc' },
    take: 15,
    include: {
      job: { select: { title: true, client: { select: { companyName: true } } } },
      partnerAgency: { select: { name: true } }
    }
  }).catch(() => []);

  // Fetch Active Job Mandates for Share Modal
  const jobs = await (prisma as any).jobMandate.findMany({
    where: { agencyId, status: { in: ['OPEN', 'ACTIVE'] } },
    select: { id: true, title: true }
  }).catch(() => []);

  // Fetch Split Ledger Payouts
  const ledgers = await (prisma as any).partnerSplitLedger.findMany({
    where: { agencyId },
    orderBy: { createdAt: 'desc' },
    include: {
      partnerAgency: { select: { name: true } },
      submission: {
        select: {
          candidate: { select: { firstName: true, lastName: true } },
          job: { select: { title: true } }
        }
      }
    }
  }).catch(() => []);

  // KPI Calculations
  const activePartnersCount = (partners as any[]).filter((p: any) => p.isActive).length;
  const sharedMandatesCount = (partnerShares as any[]).length;

  const partnerPlacementsCount = await prisma.partnerCandidateSubmission.count({
    where: { agencyId }
  }).catch(() => 0);

  const outstandingPayoutsSum = (ledgers as any[])
    .filter((l: any) => l.payoutStatus !== 'PAID')
    .reduce((acc: number, l: any) => acc + Number(l.partnerAgencyShare || 0), 0);

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <Handshake className="h-6 w-6 text-indigo-600" />
            Partner Co-Broker Network
          </h1>
          <p className="text-xs font-semibold text-slate-600 mt-1">
            Co-broker agency directory, mandate sharing, revenue split tracking & payouts
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/partners/new"
            className="px-4 py-2.5 bg-slate-900 hover:bg-indigo-600 text-white rounded-xl text-xs font-extrabold transition-all duration-200 flex items-center gap-1.5 interactive-hover shadow-2xs"
          >
            <Plus className="h-3.5 w-3.5" />
            Add Partner Agency
          </Link>

          <ShareMandateModalWrapper jobs={jobs} partners={partners} />
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm shadow-slate-200/50 space-y-1 hover:shadow-md hover:border-indigo-400 transition-all duration-200">
          <div className="flex items-center justify-between text-xs font-extrabold text-slate-500 uppercase tracking-wider">
            <span>Active Partners</span>
            <Building2 className="h-4 w-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-black text-slate-900">{activePartnersCount}</div>
          <div className="text-[11px] font-semibold text-slate-600">Registered co-broker agencies</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm shadow-slate-200/50 space-y-1 hover:shadow-md hover:border-indigo-400 transition-all duration-200">
          <div className="flex items-center justify-between text-xs font-extrabold text-slate-500 uppercase tracking-wider">
            <span>Shared Mandates</span>
            <Share2 className="h-4 w-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-black text-slate-900">{sharedMandatesCount}</div>
          <div className="text-[11px] font-semibold text-slate-600">Mandates shared for co-sourcing</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm shadow-slate-200/50 space-y-1 hover:shadow-md hover:border-indigo-400 transition-all duration-200">
          <div className="flex items-center justify-between text-xs font-extrabold text-slate-500 uppercase tracking-wider">
            <span>Partner Submissions</span>
            <Users className="h-4 w-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-black text-slate-900">{partnerPlacementsCount}</div>
          <div className="text-[11px] font-semibold text-slate-600">Candidate submissions via partners</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm shadow-slate-200/50 space-y-1 hover:shadow-md hover:border-amber-400 transition-all duration-200">
          <div className="flex items-center justify-between text-xs font-extrabold text-slate-500 uppercase tracking-wider">
            <span>Outstanding Payouts</span>
            <DollarSign className="h-4 w-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-slate-900">
            ₹{outstandingPayoutsSum.toLocaleString('en-IN')}
          </div>
          <div className="text-[11px] text-amber-800 font-extrabold">Pending or approved payouts</div>
        </div>
      </div>

      {/* Partner Directory Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm shadow-slate-200/50 p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-black text-slate-900 flex items-center gap-2">
            <Building2 className="h-4 w-4 text-indigo-600" />
            Partner Agency Directory ({partners.length})
          </h2>

          <Link
            href="/partners/new"
            className="text-xs text-indigo-600 hover:text-indigo-800 font-extrabold transition-colors flex items-center gap-1"
          >
            <span>+ Add Agency</span>
          </Link>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full text-left text-xs text-slate-800">
            <thead className="bg-slate-50 text-[11px] font-extrabold text-slate-700 uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="px-4 py-3">Partner Agency</th>
                <th className="px-4 py-3">Contact Person</th>
                <th className="px-4 py-3">Email & Phone</th>
                <th className="px-4 py-3 text-center">Default Split</th>
                <th className="px-4 py-3 text-center">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white font-medium">
              {(partners as any[]).length > 0 ? (
                (partners as any[]).map((p: any) => (
                  <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3">
                      <Link href={`/partners/${p.id}`} className="font-extrabold text-slate-900 hover:text-indigo-600 transition-colors">
                        {p.name}
                      </Link>
                      {p.notes && <div className="text-[11px] text-slate-500 font-semibold line-clamp-1">{p.notes}</div>}
                    </td>
                    <td className="px-4 py-3 font-bold text-slate-800">{p.contactPerson || 'N/A'}</td>
                    <td className="px-4 py-3 font-semibold">
                      <div className="text-slate-900 font-bold">{p.email || 'N/A'}</div>
                      <div className="text-[11px] text-slate-500">{p.phone || ''}</div>
                    </td>
                    <td className="px-4 py-3 text-center font-black text-indigo-700">
                      {Number(p.defaultSplitPercentage)}%
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border ${
                        p.isActive
                          ? 'bg-emerald-100 text-emerald-950 border-emerald-300'
                          : 'bg-slate-100 text-slate-700 border-slate-300'
                      }`}>
                        {p.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right space-x-2">
                      <Link
                        href={`/partners/${p.id}`}
                        className="px-2.5 py-1 bg-slate-900 hover:bg-indigo-600 text-white rounded-lg text-xs font-extrabold transition-all duration-200"
                      >
                        View
                      </Link>
                      <Link
                        href={`/partners/${p.id}/edit`}
                        className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-extrabold border border-slate-300 transition-all duration-200"
                      >
                        Edit
                      </Link>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="py-6 text-center text-slate-600 font-bold">
                    No partner agencies registered yet. Click &quot;Add Partner Agency&quot; to build your co-broker network.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Active Shared Mandates Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm shadow-slate-200/50 p-5 space-y-4">
        <h2 className="text-sm font-black text-slate-900 flex items-center gap-2">
          <Share2 className="h-4 w-4 text-indigo-600" />
          Active Co-Broker Shared Mandates ({partnerShares.length})
        </h2>

        <div className="space-y-3">
          {(partnerShares as any[]).length > 0 ? (
            (partnerShares as any[]).map((share: any) => (
              <div key={share.id} className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-extrabold text-xs text-slate-900">
                      {share.partnerAgency?.name || share.partnerAgencyName}
                    </h4>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-indigo-100 text-indigo-950 border border-indigo-300">
                      Co-Broker Active
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 font-semibold mt-1">
                    Job Mandate: <span className="text-slate-900 font-extrabold">{share.job?.title}</span> ({share.job?.client?.companyName || 'Direct'})
                  </p>
                  {share.notes && <p className="text-[11px] text-slate-500 mt-0.5 italic font-medium">&quot;{share.notes}&quot;</p>}
                </div>

                <div className="flex items-center gap-4 text-xs">
                  <div className="text-right">
                    <div className="text-slate-700 font-bold">Split: <span className="font-black text-indigo-700">{Number(share.splitPercentage)}%</span></div>
                    <div className="text-[10px] font-mono font-semibold text-slate-500">Token: {share.partnerAccessToken?.substring(0, 12)}...</div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="py-8 text-center text-slate-600 font-bold text-xs">
              No active partner mandate shares. Click &quot;Share Mandate&quot; to collaborate with co-brokers.
            </div>
          )}
        </div>
      </div>

      {/* Revenue Split & Payout Ledger Component */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm shadow-slate-200/50 p-5">
        <PartnerPayoutTracker ledgers={ledgers as any[]} />
      </div>
    </div>
  );
}
