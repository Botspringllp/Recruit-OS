import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, Building2, User, Mail, Phone, Percent, Edit3, Share2, Users, DollarSign } from 'lucide-react';
import { prisma } from '@/lib/prisma';

export const revalidate = 0;

interface PartnerDetailPageProps {
  params: { id: string };
}

export default async function PartnerDetailPage({ params }: PartnerDetailPageProps) {
  const demoAgency = await prisma.agency.findFirst({
    where: { subdomain: 'demo' },
    select: { id: true }
  }).catch(() => null);
  const agencyId = demoAgency?.id || 'adaa404d-0ce3-4b72-9981-882a8f31a2af';

  const partner = await (prisma as any).partnerAgency.findFirst({
    where: { id: params.id, agencyId },
    include: {
      shares: {
        include: {
          job: { select: { title: true, client: { select: { companyName: true } } } },
          partnerSubmissions: {
            include: { candidate: { select: { firstName: true, lastName: true } } }
          }
        },
        orderBy: { createdAt: 'desc' }
      },
      splits: {
        include: {
          submission: {
            select: {
              candidate: { select: { firstName: true, lastName: true } },
              job: { select: { title: true } }
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      }
    }
  });

  if (!partner) {
    notFound();
  }

  const totalPayouts = (partner?.splits || []).reduce((acc: number, s: any) => acc + Number(s.partnerAgencyShare), 0);

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-5">
        <div className="flex items-center gap-3">
          <Link
            href="/partners"
            className="p-2 bg-slate-800/80 hover:bg-slate-700 text-slate-300 rounded-xl transition"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
              <Building2 className="h-5 w-5 text-purple-400" />
              {partner.name}
            </h1>
            <p className="text-xs text-slate-400">
              Co-Broker Partner Agency Profile
            </p>
          </div>
        </div>

        <Link
          href={`/partners/${partner.id}/edit`}
          className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-medium transition flex items-center gap-2 self-start sm:self-auto border border-slate-700"
        >
          <Edit3 className="h-4 w-4" />
          Edit Partner Profile
        </Link>
      </div>

      {/* Details Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Contact & Info */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-800/80 space-y-4">
          <h3 className="text-sm font-semibold text-white border-b border-slate-800 pb-3 flex items-center gap-2">
            <Building2 className="h-4 w-4 text-purple-400" />
            Agency Overview
          </h3>

          <div className="space-y-3 text-xs">
            <div>
              <span className="text-slate-400 block text-[11px]">Contact Person</span>
              <span className="font-semibold text-slate-200 flex items-center gap-1.5 mt-0.5">
                <User className="h-3.5 w-3.5 text-slate-400" /> {partner.contactPerson || 'Not provided'}
              </span>
            </div>

            <div>
              <span className="text-slate-400 block text-[11px]">Email Address</span>
              <span className="font-semibold text-slate-200 flex items-center gap-1.5 mt-0.5">
                <Mail className="h-3.5 w-3.5 text-slate-400" /> {partner.email || 'Not provided'}
              </span>
            </div>

            <div>
              <span className="text-slate-400 block text-[11px]">Phone</span>
              <span className="font-semibold text-slate-200 flex items-center gap-1.5 mt-0.5">
                <Phone className="h-3.5 w-3.5 text-slate-400" /> {partner.phone || 'Not provided'}
              </span>
            </div>

            <div>
              <span className="text-slate-400 block text-[11px]">Default Revenue Split</span>
              <span className="font-semibold text-purple-300 flex items-center gap-1.5 mt-0.5">
                <Percent className="h-3.5 w-3.5 text-purple-400" /> {Number(partner.defaultSplitPercentage)}% Partner Share
              </span>
            </div>

            <div>
              <span className="text-slate-400 block text-[11px]">Status</span>
              <span className={`inline-block mt-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${
                partner.isActive
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                  : 'bg-slate-800 text-slate-400 border-slate-700'
              }`}>
                {partner.isActive ? 'Active Collaboration' : 'Inactive'}
              </span>
            </div>

            {partner.notes && (
              <div className="pt-2 border-t border-slate-800">
                <span className="text-slate-400 block text-[11px]">Notes</span>
                <p className="text-slate-300 mt-1 italic">{partner.notes}</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Shared Mandates & Payouts */}
        <div className="lg:col-span-2 space-y-6">
          {/* Shared Mandates */}
          <div className="glass-panel p-5 rounded-2xl border border-slate-800/80 space-y-4">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
              <Share2 className="h-4 w-4 text-indigo-400" />
              Shared Job Mandates ({partner.shares.length})
            </h3>

            <div className="space-y-3">
              {partner.shares.length > 0 ? (
                (partner.shares as any[]).map((share: any) => (
                  <div key={share.id} className="p-4 bg-slate-900/60 rounded-xl border border-slate-800/60 flex flex-col md:flex-row md:items-center justify-between gap-3">
                    <div>
                      <h4 className="font-semibold text-xs text-white">{share.job.title}</h4>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Client: <span className="text-slate-300">{share.job?.client?.companyName || 'Direct'}</span>
                      </p>
                    </div>

                    <div className="flex items-center gap-4 text-xs">
                      <span className="text-slate-400">
                        Split: <span className="font-semibold text-purple-300">{Number(share.splitPercentage)}%</span>
                      </span>
                      <span className="text-slate-400">
                        Submissions: <span className="font-semibold text-white">{share.partnerSubmissions?.length || 0}</span>
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-6 text-center text-slate-400 text-xs">
                  No job mandates currently shared with this partner.
                </div>
              )}
            </div>
          </div>

          {/* Revenue Split Payouts */}
          <div className="glass-panel p-5 rounded-2xl border border-slate-800/80 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-emerald-400" />
                Revenue Split Payouts ({partner.splits.length})
              </h3>
              <span className="text-xs font-semibold text-emerald-400 font-mono">
                Total: ₹{totalPayouts.toLocaleString('en-IN')}
              </span>
            </div>

            <div className="space-y-3">
              {partner.splits.length > 0 ? (
                partner.splits.map((s: any) => (
                  <div key={s.id} className="p-4 bg-slate-900/60 rounded-xl border border-slate-800/60 flex items-center justify-between text-xs">
                    <div>
                      <div className="font-semibold text-white">{s.submission?.candidate?.firstName} {s.submission?.candidate?.lastName}</div>
                      <div className="text-[11px] text-slate-400">{s.submission?.job?.title}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-purple-300 font-mono">₹{Number(s.partnerAgencyShare).toLocaleString('en-IN')}</div>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                        {s.payoutStatus}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-6 text-center text-slate-400 text-xs">
                  No placement revenue split payouts recorded for this partner agency yet.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
