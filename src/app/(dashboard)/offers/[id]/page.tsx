import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { Award, ArrowLeft, User, Briefcase, Calendar, DollarSign, Edit, FileText, ExternalLink, ShieldCheck } from 'lucide-react';
import { OfferStatusDropdown } from '@/components/offers/OfferStatusDropdown';

export const revalidate = 0;

interface OfferDetailPageProps {
  params: {
    id: string;
  };
}

export default async function OfferDetailPage({ params }: OfferDetailPageProps) {
  const demoAgency = await prisma.agency.findFirst({
    where: { subdomain: 'demo' },
    select: { id: true }
  }).catch(() => null);
  const agencyId = demoAgency?.id;

  const offer = await prisma.jobOfferAudit.findFirst({
    where: { id: params.id, agencyId },
    include: {
      submission: {
        include: {
          candidate: { select: { id: true, firstName: true, lastName: true, email: true, phone: true } },
          job: {
            select: {
              id: true,
              title: true,
              client: { select: { id: true, companyName: true } }
            }
          }
        }
      }
    }
  }).catch(() => null);

  if (!offer) {
    notFound();
  }

  const candidate = offer.submission.candidate;
  const job = offer.submission.job;

  const fixedCtc = offer.offeredFixedCtc ? parseFloat(offer.offeredFixedCtc.toString()) : 0;
  const variableCtc = offer.offeredVariableCtc ? parseFloat(offer.offeredVariableCtc.toString()) : 0;
  const totalCtc = fixedCtc + variableCtc;
  const noticeBuyout = offer.noticeBuyout ? parseFloat(offer.noticeBuyout.toString()) : 0;

  const joiningDateStr = offer.joiningDate ? new Date(offer.joiningDate).toLocaleDateString() : 'N/A';
  const expiryDateStr = offer.expiryDate ? new Date(offer.expiryDate).toLocaleDateString() : 'N/A';

  return (
    <div className="space-y-6 pb-12">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-5">
        <div className="flex items-center gap-3">
          <Link
            href="/offers"
            className="p-2 bg-slate-900 border border-slate-800 rounded-xl text-slate-400 hover:text-white transition"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-white tracking-tight">
                {candidate.firstName} {candidate.lastName}
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-brand-500/10 text-brand-400 border border-brand-500/20 uppercase">
                JOB OFFER AUDIT RECORD
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Position: <span className="text-slate-200 font-semibold">{job.title}</span> ({job.client?.companyName})
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 self-start sm:self-auto">
          <OfferStatusDropdown offerId={offer.id} currentStatus={offer.status} />
          <Link
            href={`/offers/${offer.id}/edit`}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold transition"
          >
            <Edit className="h-3.5 w-3.5" />
            Edit Offer
          </Link>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: CTC & Date Details */}
        <div className="space-y-6 lg:col-span-1">
          {/* CTC Summary Card */}
          <div className="glass-panel p-5 rounded-2xl border border-slate-800/80 space-y-4">
            <h3 className="font-semibold text-xs text-white uppercase tracking-wider flex items-center gap-2 border-b border-slate-800/60 pb-3">
              <DollarSign className="h-4 w-4 text-emerald-400" />
              Offered Compensation Package
            </h3>
            <div className="space-y-3 text-xs text-slate-300">
              <div>
                <span className="text-slate-400 text-[11px] block">Total Annual CTC</span>
                <span className="font-extrabold text-emerald-400 text-xl">₹{totalCtc.toFixed(2)} LPA</span>
              </div>
              <div className="pt-2 border-t border-slate-800/60 grid grid-cols-2 gap-2">
                <div>
                  <span className="text-slate-400 text-[10px] block">Fixed Base CTC</span>
                  <span className="font-semibold text-white">₹{fixedCtc.toFixed(2)} LPA</span>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] block">Variable / Bonus</span>
                  <span className="font-semibold text-cyan-300">₹{variableCtc.toFixed(2)} LPA</span>
                </div>
              </div>
              {noticeBuyout > 0 && (
                <div className="pt-2 border-t border-slate-800/60">
                  <span className="text-slate-400 text-[10px] block">Notice Period Buyout</span>
                  <span className="font-semibold text-purple-300">₹{noticeBuyout.toFixed(2)}</span>
                </div>
              )}
            </div>
          </div>

          {/* Dates Card */}
          <div className="glass-panel p-5 rounded-2xl border border-slate-800/80 space-y-4">
            <h3 className="font-semibold text-xs text-white uppercase tracking-wider flex items-center gap-2 border-b border-slate-800/60 pb-3">
              <Calendar className="h-4 w-4 text-indigo-400" />
              Key Timeline Terms
            </h3>
            <div className="space-y-3 text-xs text-slate-300">
              <div>
                <span className="text-slate-400 text-[11px] block">Expected Joining Date</span>
                <span className="font-bold text-white text-sm">{joiningDateStr}</span>
              </div>
              <div>
                <span className="text-slate-400 text-[11px] block">Offer Expiry Date</span>
                <span className="font-medium text-amber-300">{expiryDateStr}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Candidate Profile & Notes */}
        <div className="lg:col-span-2 space-y-6">
          {/* Candidate Record Link */}
          <div className="glass-panel p-6 rounded-2xl border border-slate-800/80 space-y-4">
            <h3 className="font-semibold text-sm text-white flex items-center gap-2 border-b border-slate-800/60 pb-3">
              <User className="h-4 w-4 text-brand-400" />
              Candidate & Requisition Association
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-slate-300">
              <div>
                <span className="text-slate-400 text-[11px] block">Candidate Name</span>
                <Link href={`/candidates/${candidate.id}`} className="font-semibold text-white hover:underline">
                  {candidate.firstName} {candidate.lastName}
                </Link>
                <p className="text-slate-400 text-[11px] mt-0.5">{candidate.email}</p>
                <p className="text-slate-400 text-[11px]">{candidate.phone}</p>
              </div>
              <div>
                <span className="text-slate-400 text-[11px] block">Client Company & Job</span>
                <p className="font-semibold text-white">{job.title}</p>
                <p className="text-slate-400 text-[11px]">{job.client?.companyName}</p>
              </div>
            </div>
            <div className="pt-3 border-t border-slate-800/60 flex items-center justify-between">
              <span className="text-xs text-slate-400">
                Pipeline Stage: <span className="font-bold text-white">{offer.submission.stage}</span>
              </span>
              <Link
                href={`/submissions/${offer.submission.id}`}
                className="text-xs font-semibold text-brand-400 hover:underline flex items-center gap-1"
              >
                View Candidate Submission Record →
              </Link>
            </div>
          </div>

          {/* Offer Notes */}
          <div className="glass-panel p-6 rounded-2xl border border-slate-800/80 space-y-4">
            <h3 className="font-semibold text-sm text-white flex items-center gap-2 border-b border-slate-800/60 pb-3">
              <FileText className="h-4 w-4 text-slate-400" />
              Offer Terms & Recruiter Notes
            </h3>
            <div className="p-4 bg-slate-900/60 rounded-xl border border-slate-800/60 text-xs text-slate-300 whitespace-pre-wrap leading-relaxed">
              {offer.notes || 'No specific offer negotiation notes provided.'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
