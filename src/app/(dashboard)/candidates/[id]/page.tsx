import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { User, Mail, Phone, Building, Briefcase, MapPin, Award, Layers, ArrowLeft, Edit3, Clock, CheckCircle2, FileText, Download, Eye, Paperclip } from 'lucide-react';
import { prisma } from '@/lib/prisma';
import { DeleteCandidateButton } from '@/components/candidates/DeleteCandidateButton';

import { getCurrentUser } from '@/lib/rbac';

export const revalidate = 0;

interface CandidateDetailPageProps {
  params: {
    id: string;
  };
}

function formatFileSize(bytes: number): string {
  if (!bytes || bytes === 0) return '0 KB';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

export default async function CandidateDetailPage({ params }: CandidateDetailPageProps) {
  const dbUser = await getCurrentUser();
  const agencyId = dbUser?.agencyId;

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
      },
      documents: {
        orderBy: { createdAt: 'desc' }
      }
    }
  }).catch(() => null);

  if (!candidate) {
    notFound();
  }

  return (
    <div className="space-y-6 pb-12 font-sans">
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div className="flex items-center gap-3">
          <Link
            href="/candidates"
            className="p-2.5 bg-white border border-slate-300 rounded-xl text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-all shadow-xs"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              {candidate.firstName} {candidate.lastName}
            </h1>
            <p className="text-xs font-semibold text-slate-500 mt-0.5">
              Candidate Profile ID: <span className="font-mono text-slate-700 font-bold">{candidate.id}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <Link
            href={`/candidates/${candidate.id}/edit`}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-extrabold transition flex items-center gap-2 shadow-sm"
          >
            <Edit3 className="h-4 w-4 text-amber-400" />
            Edit Profile
          </Link>

          <div className="p-1 bg-white border border-slate-200 rounded-xl">
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
        <div className="lg:col-span-1 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-6 self-start">
          <div className="flex items-center gap-4 border-b border-slate-100 pb-5">
            <div className="h-14 w-14 rounded-2xl bg-amber-100 border border-amber-300 flex items-center justify-center text-amber-950 font-black text-lg shadow-xs">
              {candidate.firstName[0]}{candidate.lastName[0]}
            </div>
            <div>
              <h2 className="font-black text-lg text-slate-900">{candidate.firstName} {candidate.lastName}</h2>
              <p className="text-xs font-bold text-slate-600">{candidate.currentDesignation || 'Candidate'}</p>
              <span className="mt-1.5 inline-block px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-100 text-amber-950 border border-amber-300">
                {candidate.source}
              </span>
            </div>
          </div>

          <div className="space-y-4 text-xs">
            <div className="flex items-center gap-3 text-slate-800 font-bold">
              <Mail className="h-4 w-4 text-amber-600 shrink-0" />
              <span className="truncate">{candidate.email}</span>
            </div>

            <div className="flex items-center gap-3 text-slate-800 font-bold">
              <Phone className="h-4 w-4 text-amber-600 shrink-0" />
              <span>{candidate.phone}</span>
            </div>

            <div className="flex items-center gap-3 text-slate-800 font-bold">
              <Building className="h-4 w-4 text-amber-600 shrink-0" />
              <span>{candidate.currentCompany || 'N/A'}</span>
            </div>

            <div className="flex items-center gap-3 text-slate-800 font-bold">
              <Briefcase className="h-4 w-4 text-amber-600 shrink-0" />
              <span>{candidate.currentDesignation || 'N/A'}</span>
            </div>

            <div className="flex items-center gap-3 text-slate-800 font-bold">
              <Award className="h-4 w-4 text-amber-600 shrink-0" />
              <span>{candidate.totalExperienceYears ? `${Number(candidate.totalExperienceYears)} Years Experience` : 'N/A'}</span>
            </div>

            <div className="flex items-center gap-3 text-slate-800 font-bold">
              <MapPin className="h-4 w-4 text-amber-600 shrink-0" />
              <span>{candidate.currentLocation || 'N/A'}</span>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 text-[11px] text-slate-500 font-semibold space-y-1">
            <div>Added on: <span className="font-bold text-slate-700">{new Date(candidate.createdAt).toLocaleDateString()}</span></div>
            <div>Last Activity: <span className="font-bold text-slate-700">{new Date(candidate.lastActivityAt).toLocaleDateString()}</span></div>
          </div>
        </div>

        {/* Right Section: Attached Resume/CV & Submissions History */}
        <div className="lg:col-span-2 space-y-6">
          {/* Attached Resume / CV Documents */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-black text-base text-slate-900 flex items-center gap-2">
                <FileText className="h-5 w-5 text-amber-500" />
                Attached Resume / CV Documents ({candidate.documents.length})
              </h3>
              <span className="text-[11px] font-extrabold text-amber-800 bg-amber-100 px-2.5 py-0.5 rounded-full border border-amber-300">
                Verified Storage
              </span>
            </div>

            <div className="space-y-3 pt-1">
              {candidate.documents.length > 0 ? (
                candidate.documents.map((doc) => (
                  <div key={doc.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-slate-300 transition-all">
                    <div className="flex items-center gap-3.5">
                      <div className="p-3 bg-amber-500/10 border border-amber-300/50 text-amber-600 rounded-xl shrink-0">
                        <FileText className="h-6 w-6 stroke-[2]" />
                      </div>
                      <div>
                        <h4 className="font-black text-xs text-slate-900 tracking-tight flex items-center gap-2">
                          {doc.fileName}
                          <span className="px-2 py-0.5 text-[9px] font-extrabold bg-slate-200 text-slate-700 rounded-md uppercase">
                            {doc.documentType}
                          </span>
                        </h4>
                        <p className="text-[11px] text-slate-500 font-semibold mt-1 flex items-center gap-3">
                          <span>Size: <strong className="text-slate-800">{formatFileSize(doc.fileSizeBytes)}</strong></span>
                          <span>•</span>
                          <span>Uploaded: <strong className="text-slate-800">{new Date(doc.createdAt).toLocaleDateString()}</strong></span>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <a
                        href={`/api/documents/${doc.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3.5 py-2 bg-gradient-to-r from-amber-500 via-amber-600 to-yellow-600 hover:from-amber-600 hover:to-yellow-700 text-slate-950 rounded-xl text-xs font-black shadow-xs flex items-center gap-1.5 transition-all"
                      >
                        <Eye className="h-3.5 w-3.5 stroke-[2.5]" />
                        View CV
                      </a>

                      <a
                        href={`/api/documents/${doc.id}`}
                        download={doc.fileName}
                        className="px-3 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-800 rounded-xl text-xs font-extrabold shadow-xs flex items-center gap-1.5 transition-all"
                      >
                        <Download className="h-3.5 w-3.5 stroke-[2.5]" />
                        Download
                      </a>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-8 text-center text-slate-500 font-bold text-xs bg-slate-50/50 rounded-2xl border border-dashed border-slate-200 space-y-1">
                  <Paperclip className="h-6 w-6 text-slate-400 mx-auto mb-1" />
                  <p>No attached resume or CV document found for this candidate.</p>
                  <p className="text-[11px] text-slate-400 font-normal">Resumes uploaded via quick intake or manual import are automatically stored here.</p>
                </div>
              )}
            </div>
          </div>

          {/* Mandate Submissions History */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="font-black text-base text-slate-900 flex items-center gap-2">
              <Layers className="h-5 w-5 text-amber-500" />
              Mandate Submissions Pipeline History ({candidate.submissions.length})
            </h3>

            <div className="space-y-3 pt-2">
              {candidate.submissions.length > 0 ? (
                candidate.submissions.map((sub) => (
                  <div key={sub.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between gap-4">
                    <div>
                      <h4 className="font-extrabold text-xs text-slate-900">{sub.job.title}</h4>
                      <p className="text-[11px] text-slate-500 font-semibold mt-0.5">
                        Client: <span className="text-slate-800 font-bold">{sub.job.client?.companyName}</span>
                      </p>
                    </div>

                    <div className="flex items-center gap-3 text-xs">
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-amber-100 text-amber-950 border border-amber-300">
                        {sub.stage}
                      </span>
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-900 border border-emerald-300">
                        {sub.slaStatus}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-12 text-center text-slate-500 font-bold text-xs bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
                  No active mandate submissions recorded for this candidate yet.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
