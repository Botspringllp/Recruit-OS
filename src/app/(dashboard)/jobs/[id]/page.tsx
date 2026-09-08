import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  Briefcase,
  Building2,
  Users,
  DollarSign,
  ArrowLeft,
  Edit3,
  CheckCircle2,
  Video,
  MapPin,
  GraduationCap,
  Globe,
  Sparkles,
  FileText,
  Clock,
  Layers
} from 'lucide-react';
import { prisma } from '@/lib/prisma';
import { JobStatusActions } from '@/components/jobs/JobStatusActions';
import { JobCandidatePipeline } from '@/components/jobs/JobCandidatePipeline';
import { getCurrentUser, hasPermission } from '@/lib/rbac';
import { redirect } from 'next/navigation';

export const revalidate = 0;

interface JobDetailPageProps {
  params: {
    id: string;
  };
}

function parsePrepKitDetails(processText?: string) {
  if (!processText) return {};
  const map: Record<string, string> = {};
  const lines = processText.split(/\n+/);
  for (const line of lines) {
    const match = line.match(/^([^:]+):\s*(.*)$/);
    if (match) {
      const key = match[1].trim().toLowerCase();
      map[key] = match[2].trim();
    }
  }
  return {
    industry: map['industry'] || '',
    employmentType: map['employment type'] || 'Full-Time',
    experience: map['experience'] || '',
    education: map['education'] || '',
    skills: map['key skills'] || '',
    description: map['job description'] || '',
    location: map['location'] || ''
  };
}

export default async function JobDetailPage({ params }: JobDetailPageProps) {
  const dbUser = await getCurrentUser();
  if (!dbUser || !hasPermission(dbUser, 'job.view')) {
    redirect('/403');
  }

  const agencyId = dbUser?.agencyId;

  const [job, allCandidates] = await Promise.all([
    prisma.jobMandate.findFirst({
      where: {
        id: params.id,
        agencyId
      },
      include: {
        client: true,
        prepKits: true,
        submissions: {
          orderBy: { createdAt: 'desc' },
          include: {
            candidate: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                phone: true,
                currentCompany: true,
                currentDesignation: true,
                totalExperienceYears: true,
                currentLocation: true,
                primarySkills: true
              }
            },
            interviewSchedules: { select: { id: true, confirmedStartTime: true, status: true } }
          }
        }
      }
    }).catch(() => null),

    prisma.candidateRecord.findMany({
      where: { agencyId, deletedAt: null },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        currentCompany: true,
        currentDesignation: true,
        totalExperienceYears: true,
        currentLocation: true,
        primarySkills: true
      },
      orderBy: { createdAt: 'desc' },
      take: 50
    }).catch(() => [])
  ]);

  if (!job) {
    notFound();
  }

  const prepKit = job.prepKits?.[0];
  const processDetails = prepKit?.interviewProcess ? parsePrepKitDetails(prepKit.interviewProcess) : {};

  // Resolved Display Values
  const displayIndustry = job.client?.industry || processDetails.industry || 'IT Services & Technology';
  const displayEmpType = processDetails.employmentType || 'Full-Time';
  const displayExperience = processDetails.experience || 'Not Specified';
  const displayEducation = processDetails.education || 'Not Specified';
  const displayLocation = processDetails.location || 'Bangalore / Remote';
  const rawSkills = prepKit?.behavioralTips || processDetails.skills || '';
  const skillsList = rawSkills ? rawSkills.split(/[,;]/).map(s => s.trim()).filter(Boolean) : [];
  const displayJd = prepKit?.technicalFaqs || processDetails.description || '';
  const displayCompanyOverview = prepKit?.companyOverview || `${job.client?.companyName || 'Client'} is a leading enterprise hiring for ${job.title}.`;

  // Calculate metrics
  const totalSubmissions = job.submissions.length;
  const placementsCount = job.submissions.filter(s => s.stage === 'JOINED').length;
  const interviewsCount = job.submissions.reduce((acc, s) => acc + s.interviewSchedules.length, 0);

  return (
    <div className="space-y-6 pb-12 font-sans text-slate-900">
      {/* Top Bar Navigation & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div className="flex items-center gap-3">
          <Link
            href="/jobs"
            className="p-2.5 bg-white border border-slate-300 rounded-2xl text-slate-700 hover:text-slate-950 hover:bg-slate-50 transition shadow-sm"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">{job.title}</h1>
              <span className={`px-3 py-0.5 rounded-full text-[11px] font-extrabold border ${
                job.status === 'ACTIVE' || job.status === 'OPEN'
                  ? 'bg-emerald-100 text-emerald-950 border-emerald-300'
                  : job.status === 'PAUSED' || job.status === 'ON_HOLD'
                  ? 'bg-amber-100 text-amber-950 border-amber-300'
                  : 'bg-slate-100 text-slate-700 border-slate-300'
              }`}>
                {job.status}
              </span>
            </div>
            <div className="flex items-center gap-4 text-xs font-bold text-slate-600 mt-1">
              <span className="flex items-center gap-1 text-slate-900">
                <Building2 className="h-3.5 w-3.5 text-amber-600" />
                {job.client?.companyName || 'Unassigned Client'}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1 text-slate-700">
                <MapPin className="h-3.5 w-3.5 text-amber-600" />
                {displayLocation}
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 self-start sm:self-auto">
          {/* Bold Status Action Buttons */}
          <JobStatusActions jobId={job.id} currentStatus={job.status} />

          <Link
            href={`/jobs/${job.id}/edit`}
            className="px-4 py-2.5 bg-gradient-to-r from-amber-500 via-amber-600 to-yellow-600 hover:from-amber-600 hover:to-yellow-700 text-slate-950 rounded-xl text-xs font-black transition flex items-center gap-2 shadow-md shadow-amber-500/20"
          >
            <Edit3 className="h-4 w-4" />
            Edit Mandate
          </Link>
        </div>
      </div>

      {/* Metrics Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between hover:shadow-sm transition">
          <div className="space-y-1">
            <span className="text-[10px] uppercase font-black tracking-wider text-slate-400 block">Total Submissions</span>
            <div className="text-2xl font-black text-slate-900 tracking-tight">
              {totalSubmissions}
            </div>
            <span className="text-[10px] font-extrabold text-amber-600 block">Active Candidates</span>
          </div>
          <div className="h-11 w-11 rounded-2xl bg-amber-50 border border-amber-100/80 flex items-center justify-center text-amber-600 shrink-0">
            <Users className="h-5 w-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between hover:shadow-sm transition">
          <div className="space-y-1">
            <span className="text-[10px] uppercase font-black tracking-wider text-slate-400 block">Interviews Conducted</span>
            <div className="text-2xl font-black text-slate-900 tracking-tight">
              {interviewsCount}
            </div>
            <span className="text-[10px] font-extrabold text-cyan-600 block">Scheduled Rounds</span>
          </div>
          <div className="h-11 w-11 rounded-2xl bg-cyan-50 border border-cyan-100/80 flex items-center justify-center text-cyan-600 shrink-0">
            <Video className="h-5 w-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between hover:shadow-sm transition">
          <div className="space-y-1">
            <span className="text-[10px] uppercase font-black tracking-wider text-slate-400 block">Placements Joined</span>
            <div className="text-2xl font-black text-slate-900 tracking-tight flex items-baseline gap-1">
              {placementsCount} <span className="text-xs font-extrabold text-slate-400">/ {job.headcount}</span>
            </div>
            <span className="text-[10px] font-extrabold text-emerald-600 block">Target Headcount</span>
          </div>
          <div className="h-11 w-11 rounded-2xl bg-emerald-50 border border-emerald-100/80 flex items-center justify-center text-emerald-600 shrink-0">
            <CheckCircle2 className="h-5 w-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between hover:shadow-sm transition">
          <div className="space-y-1">
            <span className="text-[10px] uppercase font-black tracking-wider text-slate-400 block">Compensation CTC Range</span>
            <div className="text-lg font-black text-slate-900 tracking-tight">
              {job.minCtcLpa ? `${Number(job.minCtcLpa)} - ${Number(job.maxCtcLpa || 0)} LPA` : 'Competitive'}
            </div>
            <span className="text-[10px] font-extrabold text-emerald-600 block">Annual CTC Package</span>
          </div>
          <div className="h-11 w-11 rounded-2xl bg-emerald-50 border border-emerald-100/80 flex items-center justify-center text-emerald-600 shrink-0">
            <DollarSign className="h-5 w-5" />
          </div>
        </div>
      </div>

      {/* Main Grid Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Comprehensive Mandate Specification Card */}
        <div className="lg:col-span-1 space-y-6 self-start">
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-5">
            <h3 className="font-black text-sm text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3 uppercase tracking-wider">
              <Briefcase className="h-4 w-4 text-amber-600" />
              Mandate Specification
            </h3>

            <div className="space-y-4 text-xs">
              <div>
                <span className="text-slate-500 block text-[10px] font-extrabold uppercase tracking-wider">Company Name</span>
                <span className="font-extrabold text-slate-900 text-sm flex items-center gap-1.5 mt-0.5">
                  <Building2 className="h-4 w-4 text-amber-600" />
                  {job.client?.companyName || 'Unassigned'}
                </span>
              </div>

              <div>
                <span className="text-slate-500 block text-[10px] font-extrabold uppercase tracking-wider">Industry Type</span>
                <span className="font-bold text-slate-800 flex items-center gap-1.5 mt-0.5">
                  <Globe className="h-4 w-4 text-slate-500" />
                  {displayIndustry}
                </span>
              </div>

              <div>
                <span className="text-slate-500 block text-[10px] font-extrabold uppercase tracking-wider">Employment Type</span>
                <span className="font-bold text-slate-800 flex items-center gap-1.5 mt-0.5">
                  <Layers className="h-4 w-4 text-slate-500" />
                  {displayEmpType}
                </span>
              </div>

              <div>
                <span className="text-slate-500 block text-[10px] font-extrabold uppercase tracking-wider">Job Location</span>
                <span className="font-bold text-slate-800 flex items-center gap-1.5 mt-0.5">
                  <MapPin className="h-4 w-4 text-amber-600" />
                  {displayLocation}
                </span>
              </div>

              <div>
                <span className="text-slate-500 block text-[10px] font-extrabold uppercase tracking-wider">Experience Required</span>
                <span className="font-bold text-slate-800 flex items-center gap-1.5 mt-0.5">
                  <Clock className="h-4 w-4 text-slate-500" />
                  {displayExperience}
                </span>
              </div>

              <div>
                <span className="text-slate-500 block text-[10px] font-extrabold uppercase tracking-wider">Education Requirements</span>
                <span className="font-bold text-slate-800 flex items-center gap-1.5 mt-0.5">
                  <GraduationCap className="h-4 w-4 text-slate-500" />
                  {displayEducation}
                </span>
              </div>

              <div className="pt-2 border-t border-slate-100 grid grid-cols-2 gap-3">
                <div>
                  <span className="text-slate-500 block text-[10px] font-extrabold uppercase tracking-wider">Open Headcount</span>
                  <span className="font-extrabold text-slate-900">{job.headcount} Positions</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] font-extrabold uppercase tracking-wider">Placement Fee</span>
                  <span className="font-extrabold text-amber-700">{Number(job.feePercentage)}%</span>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 text-[11px]">
                <span className="text-slate-400 block font-medium">Created: {new Date(job.createdAt).toLocaleString()}</span>
                <span className="text-slate-400 block font-medium">Updated: {new Date(job.updatedAt).toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Key Skills Badge Grid */}
          {skillsList.length > 0 && (
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-3">
              <h3 className="font-black text-xs text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-amber-600" />
                Key Skills Required
              </h3>
              <div className="flex flex-wrap gap-2 pt-1">
                {skillsList.map((skill, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1 bg-amber-50 border border-amber-200 text-amber-950 font-bold rounded-xl text-xs shadow-xs"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Job Description, Company Overview & AI Candidate Pipeline */}
        <div className="lg:col-span-2 space-y-6">

          {/* Job Description Card */}
          {displayJd && (
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-3">
              <h3 className="font-black text-sm text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3 uppercase tracking-wider">
                <FileText className="h-4.5 w-4.5 text-amber-600" />
                Job Description & Responsibilities
              </h3>
              <div className="text-xs font-semibold text-slate-800 leading-relaxed whitespace-pre-wrap pt-1 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                {displayJd}
              </div>
            </div>
          )}

          {/* Company Overview Card */}
          {displayCompanyOverview && (
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-3">
              <h3 className="font-black text-sm text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3 uppercase tracking-wider">
                <Building2 className="h-4.5 w-4.5 text-amber-600" />
                Company Overview / About Company
              </h3>
              <div className="text-xs font-semibold text-slate-700 leading-relaxed whitespace-pre-wrap pt-1">
                {displayCompanyOverview}
              </div>
            </div>
          )}

          {/* Interactive AI Candidate Pipeline & Matching */}
          <JobCandidatePipeline
            jobId={job.id}
            jobSkills={skillsList}
            jobExperience={displayExperience}
            jobLocation={displayLocation}
            submissions={job.submissions}
            allCandidates={allCandidates}
          />

        </div>

      </div>
    </div>
  );
}
