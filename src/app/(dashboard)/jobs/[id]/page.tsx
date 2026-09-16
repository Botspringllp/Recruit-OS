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
  Layers,
  Eye,
  Download,
  Compass,
  Info
} from 'lucide-react';
import { prisma } from '@/lib/prisma';
import { JobStatusActions } from '@/components/jobs/JobStatusActions';
import { JobCandidatePipeline } from '@/components/jobs/JobCandidatePipeline';
import { getCurrentUser, hasPermission } from '@/lib/rbac';
import { serializeDecimals } from '@/lib/serialize';
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
        incomingRequirements: {
          include: {
            assignedRecruiter: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true
              }
            },
            timelineEvents: {
              orderBy: { createdAt: 'desc' }
            }
          }
        },
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

  // Requirement Origin Data
  const originReq = job.incomingRequirements?.[0];

  let acceptedUser: { firstName: string; lastName: string; email: string } | null = null;
  if (originReq) {
    const acceptEvent = (originReq.timelineEvents as any[])?.find(
      (e: any) => e.title === 'Requirement Accepted' || e.title === 'Converted To Job Mandate'
    );

    if (acceptEvent?.actorId) {
      acceptedUser = await prisma.user.findUnique({
        where: { id: acceptEvent.actorId },
        select: { firstName: true, lastName: true, email: true }
      }).catch(() => null);
    }

    if (!acceptedUser && acceptEvent?.actorName) {
      const names = acceptEvent.actorName.split(' ');
      acceptedUser = {
        firstName: names[0] || acceptEvent.actorName,
        lastName: names.slice(1).join(' ') || '',
        email: dbUser?.email || 'N/A'
      };
    }
  }

  const renderSourceBadge = (source: string) => {
    switch (source) {
      case 'Website':
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-purple-100 text-purple-800 border border-purple-300">Website</span>;
      case 'Email':
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-blue-100 text-blue-800 border border-blue-300">Email</span>;
      case 'WhatsApp':
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-300">WhatsApp</span>;
      case 'Referral':
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-amber-100 text-amber-800 border border-amber-300">Referral</span>;
      default:
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-slate-100 text-slate-800 border border-slate-300">{source || 'Manual'}</span>;
    }
  };

  const renderPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'Urgent':
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase bg-rose-100 text-rose-800 border border-rose-300">Urgent</span>;
      case 'High':
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase bg-amber-100 text-amber-800 border border-amber-300">High</span>;
      case 'Medium':
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase bg-blue-100 text-blue-800 border border-blue-300">Medium</span>;
      default:
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase bg-slate-100 text-slate-700 border border-slate-300">{priority || 'Low'}</span>;
    }
  };

  const renderReqStatusBadge = (status: string) => {
    switch (status) {
      case 'Pending Review':
      case 'Pending':
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-amber-100 text-amber-800 border border-amber-300">Pending</span>;
      case 'Assigned':
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-blue-100 text-blue-800 border border-blue-300">Assigned</span>;
      case 'Accepted':
      case 'Converted':
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-300">{status}</span>;
      case 'Rejected':
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-rose-100 text-rose-800 border border-rose-300">Rejected</span>;
      default:
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-slate-100 text-slate-800 border border-slate-300">{status}</span>;
    }
  };

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

          {/* REQUIREMENT ORIGIN INFORMATION Card */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="font-black text-xs text-slate-900 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-3">
              <Compass className="h-4 w-4 text-amber-600" />
              REQUIREMENT ORIGIN INFORMATION
            </h3>

            {originReq ? (
              <div className="space-y-3.5 text-xs">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <span className="text-slate-500 font-extrabold text-[10px] uppercase tracking-wider">Requirement ID</span>
                  <span className="font-mono font-black text-slate-900 bg-slate-100 px-2 py-0.5 rounded-md text-[11px]">
                    {`REQ-${originReq.id.slice(0, 8).toUpperCase()}`}
                  </span>
                </div>

                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <span className="text-slate-500 font-extrabold text-[10px] uppercase tracking-wider">Requirement Source</span>
                  <div>{renderSourceBadge(originReq.source)}</div>
                </div>

                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <span className="text-slate-500 font-extrabold text-[10px] uppercase tracking-wider">Current Requirement Status</span>
                  <div>{renderReqStatusBadge(originReq.status)}</div>
                </div>

                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <span className="text-slate-500 font-extrabold text-[10px] uppercase tracking-wider">Requirement Priority</span>
                  <div>{renderPriorityBadge(originReq.priority)}</div>
                </div>

                <div>
                  <span className="text-slate-500 block text-[10px] font-extrabold uppercase tracking-wider">Client Company Name</span>
                  <span className="font-extrabold text-slate-900 text-xs mt-0.5 block">{originReq.companyName}</span>
                </div>

                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <div>
                    <span className="text-slate-500 block text-[10px] font-extrabold uppercase tracking-wider">Contact Person</span>
                    <span className="font-bold text-slate-800 text-xs mt-0.5 block">{originReq.contactPerson || 'Not Provided'}</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div>
                      <span className="text-slate-500 block text-[10px] font-extrabold uppercase tracking-wider">Contact Email</span>
                      <span className="font-bold text-slate-800 text-[11px] truncate mt-0.5 block">{originReq.contactEmail || 'Not Provided'}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px] font-extrabold uppercase tracking-wider">Contact Phone</span>
                      <span className="font-bold text-slate-800 text-[11px] mt-0.5 block">{originReq.contactNumber || 'Not Provided'}</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 text-[11px]">
                  <div>
                    <span className="text-slate-400 block font-semibold text-[10px] uppercase">Received Date</span>
                    <span className="font-bold text-slate-700 mt-0.5 block">
                      {new Date(originReq.receivedDate || originReq.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-semibold text-[10px] uppercase">Accepted Date</span>
                    <span className="font-bold text-emerald-700 mt-0.5 block">
                      {originReq.acceptedDate ? new Date(originReq.acceptedDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Not Accepted'}
                    </span>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 space-y-2.5">
                  <div>
                    <span className="text-slate-500 block text-[10px] font-extrabold uppercase tracking-wider">Assigned Recruiter</span>
                    {originReq.assignedRecruiter ? (
                      <div className="mt-0.5">
                        <span className="font-extrabold text-slate-900 text-xs block">
                          {originReq.assignedRecruiter.firstName} {originReq.assignedRecruiter.lastName}
                        </span>
                        <span className="text-[11px] text-slate-500 font-medium block">
                          {originReq.assignedRecruiter.email}
                        </span>
                      </div>
                    ) : (
                      <span className="font-bold text-slate-400 text-xs mt-0.5 block italic">Unassigned</span>
                    )}
                  </div>

                  <div>
                    <span className="text-slate-500 block text-[10px] font-extrabold uppercase tracking-wider">Accepted By</span>
                    {acceptedUser ? (
                      <div className="mt-0.5">
                        <span className="font-extrabold text-slate-900 text-xs block">
                          {acceptedUser.firstName} {acceptedUser.lastName}
                        </span>
                        <span className="text-[11px] text-slate-500 font-medium block">
                          {acceptedUser.email}
                        </span>
                      </div>
                    ) : (
                      <span className="font-bold text-slate-400 text-xs mt-0.5 block italic">Not Recorded</span>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-2">
                <p className="text-xs font-bold text-slate-500 italic">No requirement origin record available.</p>
              </div>
            )}
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

          {/* Original Requirement Document Card if converted from Incoming Requirement */}
          {job.incomingRequirements?.[0] && (job.incomingRequirements[0].pdfUrl || job.incomingRequirements[0].pdfName) && (
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="font-black text-sm text-slate-900 flex items-center gap-2 uppercase tracking-wider">
                  <FileText className="h-4.5 w-4.5 text-amber-600" />
                  Original Requirement Document
                </h3>
                <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-black border border-emerald-300">
                  Client JD Attached
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3.5 min-w-0 flex-1">
                  <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-600 border border-amber-500/20 shrink-0">
                    <FileText className="h-6 w-6" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="font-extrabold text-xs text-slate-900 truncate">
                      {job.incomingRequirements[0].pdfName || 'Requirement Document.pdf'}
                    </h4>
                    <span className="text-[11px] text-slate-500 font-bold block mt-0.5">
                      Source: {job.incomingRequirements[0].source} • Received: {new Date(job.incomingRequirements[0].createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <a
                    href={`/api/requirements/${job.incomingRequirements[0].id}/pdf`}
                    target="_blank"
                    rel="noreferrer"
                    className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs transition-all flex items-center gap-1.5 shadow-sm"
                  >
                    <Eye className="h-4 w-4" />
                    <span>View PDF</span>
                  </a>

                  <a
                    href={`/api/requirements/${job.incomingRequirements[0].id}/pdf?download=true`}
                    className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-colors flex items-center gap-1.5"
                  >
                    <Download className="h-4 w-4" />
                    <span>Download PDF</span>
                  </a>
                </div>
              </div>
            </div>
          )}

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
            submissions={serializeDecimals(job.submissions)}
            allCandidates={serializeDecimals(allCandidates)}
          />

        </div>

      </div>
    </div>
  );
}
