import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { User, Mail, Phone, Building, Briefcase, MapPin, Award, Layers, ArrowLeft, Edit3, Clock, CheckCircle2 } from 'lucide-react';
import { prisma } from '@/lib/prisma';
import { DeleteCandidateButton } from '@/components/candidates/DeleteCandidateButton';

export const revalidate = 0;

interface CandidateDetailPageProps {
  params: {
    id: string;
  };
}

export default async function CandidateDetailPage({ params }: CandidateDetailPageProps) {
  const demoAgency = await prisma.agency.findFirst({
    where: { subdomain: 'demo' },
    select: { id: true }
  }).catch(() => null);
  const agencyId = demoAgency?.id;

  const candidate = await prisma.candidateRecord.findFirst({
    where: {
      id: params.id,
      agencyId,
      deletedAt: null
    },
    include: {
      submissions: {
        orderBy: { createdAt: 'desc' },
        include: {
          job: {
            select: { title: true, client: { select: { companyName: true } } }
          }
        }
      }
    }
  }).catch(() => null);

  if (!candidate) {
    notFound();
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-5">
        <div className="flex items-center gap-3">
          <Link
            href="/candidates"
            className="p-2 bg-slate-900 border border-slate-800 rounded-xl text-slate-400 hover:text-white transition"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">
              {candidate.firstName} {candidate.lastName}
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Candidate Profile ID: <span className="font-mono text-slate-300">{candidate.id}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <Link
            href={`/candidates/${candidate.id}/edit`}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold transition flex items-center gap-2"
          >
            <Edit3 className="h-4 w-4 text-brand-400" />
            Edit Profile
          </Link>

          <div className="p-1 bg-slate-900 border border-slate-800 rounded-xl">
            <DeleteCandidateButton
              candidateId={candidate.id}
              candidateName={`${candidate.firstName} ${candidate.lastName}`}
              redirectToList={true}
            />
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Card */}
        <div className="lg:col-span-1 glass-panel p-6 rounded-2xl border border-slate-800/80 space-y-6 self-start">
          <div className="flex items-center gap-4 border-b border-slate-800/60 pb-5">
            <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-brand-500/20 to-indigo-500/20 border border-brand-500/30 flex items-center justify-center text-brand-400 font-bold text-lg">
              {candidate.firstName[0]}{candidate.lastName[0]}
            </div>
            <div>
              <h2 className="font-bold text-base text-white">{candidate.firstName} {candidate.lastName}</h2>
              <p className="text-xs text-slate-400">{candidate.currentDesignation || 'Candidate'}</p>
              <span className="mt-1 inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold bg-brand-500/10 text-brand-400 border border-brand-500/20">
                {candidate.source}
              </span>
            </div>
          </div>

          <div className="space-y-4 text-xs">
            <div className="flex items-center gap-3 text-slate-300">
              <Mail className="h-4 w-4 text-cyan-400 shrink-0" />
              <span className="truncate">{candidate.email}</span>
            </div>

            <div className="flex items-center gap-3 text-slate-300">
              <Phone className="h-4 w-4 text-emerald-400 shrink-0" />
              <span>{candidate.phone}</span>
            </div>

            <div className="flex items-center gap-3 text-slate-300">
              <Building className="h-4 w-4 text-slate-400 shrink-0" />
              <span>{candidate.currentCompany || 'N/A'}</span>
            </div>

            <div className="flex items-center gap-3 text-slate-300">
              <Briefcase className="h-4 w-4 text-indigo-400 shrink-0" />
              <span>{candidate.currentDesignation || 'N/A'}</span>
            </div>

            <div className="flex items-center gap-3 text-slate-300">
              <Award className="h-4 w-4 text-amber-400 shrink-0" />
              <span>{candidate.totalExperienceYears ? `${Number(candidate.totalExperienceYears)} Years Experience` : 'N/A'}</span>
            </div>

            <div className="flex items-center gap-3 text-slate-300">
              <MapPin className="h-4 w-4 text-rose-400 shrink-0" />
              <span>{candidate.currentLocation || 'N/A'}</span>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-800/60 text-[11px] text-slate-500 space-y-1">
            <div>Added on: {new Date(candidate.createdAt).toLocaleDateString()}</div>
            <div>Last Activity: {new Date(candidate.lastActivityAt).toLocaleDateString()}</div>
          </div>
        </div>

        {/* Submissions History */}
        <div className="lg:col-span-2 glass-panel p-6 rounded-2xl border border-slate-800/80 space-y-4">
          <h3 className="font-semibold text-sm text-white flex items-center gap-2">
            <Layers className="h-4 w-4 text-brand-400" />
            Mandate Submissions Pipeline History ({candidate.submissions.length})
          </h3>

          <div className="space-y-3 pt-2">
            {candidate.submissions.length > 0 ? (
              candidate.submissions.map((sub) => (
                <div key={sub.id} className="p-4 bg-slate-900/60 rounded-xl border border-slate-800/60 flex items-center justify-between gap-4">
                  <div>
                    <h4 className="font-semibold text-xs text-white">{sub.job.title}</h4>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Client: <span className="text-slate-200">{sub.job.client?.companyName}</span>
                    </p>
                  </div>

                  <div className="flex items-center gap-3 text-xs">
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-brand-500/10 text-brand-400 border border-brand-500/20">
                      {sub.stage}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      {sub.slaStatus}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-8 text-center text-slate-400 text-xs">
                No active mandate submissions recorded for this candidate yet.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
