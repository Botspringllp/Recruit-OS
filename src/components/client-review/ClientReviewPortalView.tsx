'use client';

import React, { useState } from 'react';
import {
  Briefcase,
  Building2,
  FileText,
  UserCheck,
  Clock,
  CheckCircle,
  XCircle,
  PauseCircle,
  ChevronRight,
  ArrowLeft,
  ExternalLink,
  Loader2,
  Sparkles,
  MapPin,
  GraduationCap,
  DollarSign,
  User,
  Phone,
  Mail,
  Award,
  Calendar,
  Layers,
  Filter,
  Eye
} from 'lucide-react';
import { updateClientDecisionAction } from '@/app/actions/clientSubmissions';

export interface SubmittedCandidateViewItem {
  submissionId: string;
  status: 'PENDING' | 'INTERVIEW' | 'HOLD' | 'REJECT' | string;
  candidateId: string;
  jobId?: string;
  jobTitle?: string;
  positionTitle?: string;
  clientName?: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  totalExperience: string;
  relevantExperience: string;
  currentDesignation: string;
  qualification: string;
  currentCompany: string;
  currentSalary: string;
  expectedSalary: string;
  noticePeriod: string;
  reasonOfLeaving: string;
  offerInHand: string;
  resumeUrl: string | null;
  resumeFileName: string | null;
}

interface ClientReviewPortalViewProps {
  token: string;
  positionTitle: string;
  clientName: string;
  recruiterMessage?: string | null;
  candidates: SubmittedCandidateViewItem[];
}

export function ClientReviewPortalView({
  token,
  positionTitle: defaultPositionTitle,
  clientName: defaultClientName,
  recruiterMessage,
  candidates: initialCandidates
}: ClientReviewPortalViewProps) {
  const [candidates, setCandidates] = useState<SubmittedCandidateViewItem[]>(initialCandidates);
  const [loadingMap, setLoadingMap] = useState<Record<string, boolean>>({});

  // Group candidates by Job Mandate (jobId or jobTitle)
  const jobsMap = React.useMemo(() => {
    const map = new Map<string, {
      jobId: string;
      jobTitle: string;
      clientName: string;
      candidates: SubmittedCandidateViewItem[];
    }>();

    candidates.forEach(c => {
      const jobId = c.jobId || c.jobTitle || defaultPositionTitle;
      const jobTitle = c.jobTitle || c.positionTitle || defaultPositionTitle;
      const clientName = c.clientName || defaultClientName;

      if (!map.has(jobId)) {
        map.set(jobId, {
          jobId,
          jobTitle,
          clientName,
          candidates: []
        });
      }
      map.get(jobId)!.candidates.push(c);
    });

    return Array.from(map.values());
  }, [candidates, defaultPositionTitle, defaultClientName]);

  // View state: 'JOBS' (Level 1) | 'CANDIDATES' (Level 2) | 'PROFILE' (Level 3)
  const [activeView, setActiveView] = useState<'JOBS' | 'CANDIDATES' | 'PROFILE'>(() => {
    // If there's only 1 job mandate, land directly on candidate list view for convenience
    return jobsMap.length > 1 ? 'JOBS' : 'CANDIDATES';
  });

  const [selectedJobId, setSelectedJobId] = useState<string | null>(() => {
    return jobsMap.length > 0 ? jobsMap[0].jobId : null;
  });

  const [selectedCandidateId, setSelectedCandidateId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Currently selected Job Object
  const currentJob = jobsMap.find(j => j.jobId === selectedJobId) || jobsMap[0];

  // Candidates for the currently selected job
  const jobCandidates = currentJob ? currentJob.candidates : candidates;

  // Filtered candidates by status
  const filteredCandidates = React.useMemo(() => {
    if (statusFilter === 'ALL') return jobCandidates;
    return jobCandidates.filter(c => c.status === statusFilter);
  }, [jobCandidates, statusFilter]);

  // Currently selected Candidate Object (for Level 3 Profile View)
  const selectedCandidate = candidates.find(c => c.candidateId === selectedCandidateId) || jobCandidates[0];

  async function handleDecision(submissionId: string, decision: 'INTERVIEW' | 'HOLD' | 'REJECT') {
    setLoadingMap(prev => ({ ...prev, [submissionId]: true }));

    const res = await updateClientDecisionAction(submissionId, token, decision);
    setLoadingMap(prev => ({ ...prev, [submissionId]: false }));

    if (res.success && res.status) {
      setCandidates(prev =>
        prev.map(c => (c.submissionId === submissionId ? { ...c, status: res.status! } : c))
      );
    } else {
      alert(res.error || 'Failed to update candidate decision.');
    }
  }

  // Calculate overall metrics
  const totalSubmissions = candidates.length;
  const totalInterview = candidates.filter(c => c.status === 'INTERVIEW').length;
  const totalHold = candidates.filter(c => c.status === 'HOLD').length;
  const totalReject = candidates.filter(c => c.status === 'REJECT').length;
  const totalPending = candidates.filter(c => c.status === 'PENDING').length;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans antialiased selection:bg-amber-500 selection:text-slate-950">
      
      {/* Top Professional Header Bar */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between gap-4">
          
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-600 text-slate-950 font-black text-lg flex items-center justify-center shadow-md shadow-amber-500/20">
              R
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black uppercase tracking-wider text-amber-600 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md">
                  RecruitOS
                </span>
                <span className="text-xs font-bold text-slate-400">|</span>
                <span className="text-xs font-extrabold text-slate-600">Client Candidate Review Portal</span>
              </div>
              <h1 className="text-base font-black text-slate-900 tracking-tight">
                {currentJob ? currentJob.clientName : defaultClientName}
              </h1>
            </div>
          </div>

          {/* Top Quick Metrics */}
          <div className="hidden sm:flex items-center gap-2 text-xs font-bold">
            <div className="px-3 py-1.5 bg-slate-100 border border-slate-200 rounded-xl text-slate-700">
              Total Candidates: <span className="font-black text-slate-900">{totalSubmissions}</span>
            </div>
            <div className="px-3 py-1.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 flex items-center gap-1.5">
              <CheckCircle className="h-3.5 w-3.5 text-emerald-600" />
              <span>Shortlisted: {totalInterview}</span>
            </div>
            <div className="px-3 py-1.5 bg-blue-50 border border-blue-200 rounded-xl text-blue-800 flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 text-blue-600" />
              <span>Pending: {totalPending}</span>
            </div>
          </div>

        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">

        {/* Recruiter Message Banner */}
        {recruiterMessage && (
          <div className="bg-amber-50/80 border border-amber-200/80 rounded-2xl p-4 sm:p-5 flex items-start gap-3 shadow-xs">
            <Sparkles className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="space-y-1 text-xs text-amber-950">
              <span className="font-extrabold uppercase tracking-wider block text-[10px] text-amber-800">
                Note from Recruiter Team
              </span>
              <p className="font-semibold italic leading-relaxed text-amber-900">
                "{recruiterMessage}"
              </p>
            </div>
          </div>
        )}

        {/* BREADCRUMB NAVIGATION BAR */}
        <nav className="flex items-center justify-between bg-white border border-slate-200/80 rounded-2xl px-5 py-3 shadow-xs">
          <div className="flex items-center gap-2 text-xs font-extrabold text-slate-500 overflow-x-auto">
            
            {/* Level 1 Link: All Jobs */}
            <button
              onClick={() => {
                setActiveView('JOBS');
                setSelectedCandidateId(null);
              }}
              className={`flex items-center gap-1.5 hover:text-slate-900 transition-colors ${
                activeView === 'JOBS' ? 'text-amber-600 font-black' : ''
              }`}
            >
              <Briefcase className="h-4 w-4" />
              <span>Job Mandates ({jobsMap.length})</span>
            </button>

            {/* Breadcrumb Separator & Level 2 */}
            {(activeView === 'CANDIDATES' || activeView === 'PROFILE') && currentJob && (
              <>
                <ChevronRight className="h-3.5 w-3.5 text-slate-300 shrink-0" />
                <button
                  onClick={() => {
                    setActiveView('CANDIDATES');
                    setSelectedCandidateId(null);
                  }}
                  className={`flex items-center gap-1.5 hover:text-slate-900 transition-colors ${
                    activeView === 'CANDIDATES' ? 'text-amber-600 font-black' : ''
                  }`}
                >
                  <Layers className="h-4 w-4" />
                  <span className="truncate max-w-[200px]">{currentJob.jobTitle}</span>
                  <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full text-[10px] font-black">
                    {currentJob.candidates.length}
                  </span>
                </button>
              </>
            )}

            {/* Breadcrumb Separator & Level 3 */}
            {activeView === 'PROFILE' && selectedCandidate && (
              <>
                <ChevronRight className="h-3.5 w-3.5 text-slate-300 shrink-0" />
                <span className="text-amber-600 font-black flex items-center gap-1.5 truncate max-w-[180px]">
                  <User className="h-4 w-4" />
                  {selectedCandidate.firstName} {selectedCandidate.lastName}
                </span>
              </>
            )}
          </div>

          {/* Back Action Button */}
          {activeView === 'CANDIDATES' && jobsMap.length > 1 && (
            <button
              onClick={() => setActiveView('JOBS')}
              className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-extrabold flex items-center gap-1.5 transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Change Job</span>
            </button>
          )}

          {activeView === 'PROFILE' && (
            <button
              onClick={() => setActiveView('CANDIDATES')}
              className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-extrabold flex items-center gap-1.5 transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Back to Candidate List</span>
            </button>
          )}
        </nav>


        {/* ===================================================================== */}
        {/* LEVEL 1: JOB OPENINGS SELECTION VIEW                                 */}
        {/* ===================================================================== */}
        {activeView === 'JOBS' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                  Submitted Job Mandates ({jobsMap.length})
                </h2>
                <p className="text-xs font-medium text-slate-500 mt-1">
                  Click on any job mandate below to view and review candidate profiles submitted for that position.
                </p>
              </div>
            </div>

            {/* Job Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {jobsMap.map(job => {
                const jobTotal = job.candidates.length;
                const jobInterview = job.candidates.filter(c => c.status === 'INTERVIEW').length;
                const jobHold = job.candidates.filter(c => c.status === 'HOLD').length;
                const jobReject = job.candidates.filter(c => c.status === 'REJECT').length;
                const jobPending = job.candidates.filter(c => c.status === 'PENDING').length;

                return (
                  <div
                    key={job.jobId}
                    onClick={() => {
                      setSelectedJobId(job.jobId);
                      setActiveView('CANDIDATES');
                    }}
                    className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-xs hover:shadow-xl hover:border-amber-400/80 transition-all cursor-pointer group flex flex-col justify-between space-y-6 relative overflow-hidden"
                  >
                    <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full blur-2xl pointer-events-none" />

                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-50 text-indigo-700 border border-indigo-200/80 rounded-full text-[11px] font-black uppercase tracking-wider">
                          <Building2 className="h-3.5 w-3.5" />
                          {job.clientName}
                        </span>
                        <span className="px-2.5 py-1 bg-slate-100 text-slate-700 rounded-xl text-xs font-black">
                          {jobTotal} {jobTotal === 1 ? 'Candidate' : 'Candidates'}
                        </span>
                      </div>

                      <h3 className="text-xl font-black text-slate-900 tracking-tight group-hover:text-amber-600 transition-colors">
                        {job.jobTitle}
                      </h3>
                    </div>

                    {/* Job Status Counters */}
                    <div className="space-y-4 border-t border-slate-100 pt-4">
                      <div className="grid grid-cols-3 gap-2 text-center text-xs font-extrabold">
                        <div className="p-2.5 rounded-2xl bg-emerald-50 text-emerald-800 border border-emerald-100">
                          <span className="text-[10px] uppercase block text-emerald-600">Interview</span>
                          <span className="text-base font-black">{jobInterview}</span>
                        </div>
                        <div className="p-2.5 rounded-2xl bg-amber-50 text-amber-800 border border-amber-100">
                          <span className="text-[10px] uppercase block text-amber-600">Hold</span>
                          <span className="text-base font-black">{jobHold}</span>
                        </div>
                        <div className="p-2.5 rounded-2xl bg-blue-50 text-blue-800 border border-blue-100">
                          <span className="text-[10px] uppercase block text-blue-600">Pending</span>
                          <span className="text-base font-black">{jobPending}</span>
                        </div>
                      </div>

                      <button
                        type="button"
                        className="w-full py-3 rounded-2xl bg-slate-900 group-hover:bg-amber-500 group-hover:text-slate-950 text-white font-black text-xs transition-all flex items-center justify-center gap-2 shadow-sm"
                      >
                        <span>View Submitted Candidates</span>
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}


        {/* ===================================================================== */}
        {/* LEVEL 2: CANDIDATES LIST VIEW FOR SELECTED JOB                       */}
        {/* ===================================================================== */}
        {activeView === 'CANDIDATES' && currentJob && (
          <div className="space-y-6">

            {/* Selected Job Banner Card */}
            <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white rounded-3xl p-6 sm:p-8 shadow-lg relative overflow-hidden">
              <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
              
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
                <div className="space-y-2">
                  <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-full text-xs font-black uppercase tracking-wider">
                    <Briefcase className="h-3.5 w-3.5" />
                    Active Job Mandate
                  </div>
                  <h2 className="text-3xl font-black text-white tracking-tight">
                    {currentJob.jobTitle}
                  </h2>
                  <p className="text-xs font-medium text-slate-300 flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-slate-400" />
                    Submitted for <strong>{currentJob.clientName}</strong>
                  </p>
                </div>

                {/* Status Tabs Bar */}
                <div className="flex flex-wrap items-center gap-2 bg-slate-950/60 p-1.5 rounded-2xl border border-slate-800 text-xs font-bold">
                  <button
                    onClick={() => setStatusFilter('ALL')}
                    className={`px-3 py-1.5 rounded-xl transition-all ${
                      statusFilter === 'ALL' ? 'bg-amber-500 text-slate-950 font-black' : 'text-slate-300 hover:text-white'
                    }`}
                  >
                    All ({jobCandidates.length})
                  </button>
                  <button
                    onClick={() => setStatusFilter('PENDING')}
                    className={`px-3 py-1.5 rounded-xl transition-all ${
                      statusFilter === 'PENDING' ? 'bg-amber-500 text-slate-950 font-black' : 'text-slate-300 hover:text-white'
                    }`}
                  >
                    Pending ({jobCandidates.filter(c => c.status === 'PENDING').length})
                  </button>
                  <button
                    onClick={() => setStatusFilter('INTERVIEW')}
                    className={`px-3 py-1.5 rounded-xl transition-all ${
                      statusFilter === 'INTERVIEW' ? 'bg-emerald-500 text-white font-black' : 'text-slate-300 hover:text-white'
                    }`}
                  >
                    Shortlisted ({jobCandidates.filter(c => c.status === 'INTERVIEW').length})
                  </button>
                  <button
                    onClick={() => setStatusFilter('HOLD')}
                    className={`px-3 py-1.5 rounded-xl transition-all ${
                      statusFilter === 'HOLD' ? 'bg-amber-600 text-white font-black' : 'text-slate-300 hover:text-white'
                    }`}
                  >
                    Hold ({jobCandidates.filter(c => c.status === 'HOLD').length})
                  </button>
                  <button
                    onClick={() => setStatusFilter('REJECT')}
                    className={`px-3 py-1.5 rounded-xl transition-all ${
                      statusFilter === 'REJECT' ? 'bg-rose-600 text-white font-black' : 'text-slate-300 hover:text-white'
                    }`}
                  >
                    Reject ({jobCandidates.filter(c => c.status === 'REJECT').length})
                  </button>
                </div>
              </div>
            </div>

            {/* Candidates Grid / List */}
            <div className="space-y-4">
              {filteredCandidates.length === 0 ? (
                <div className="bg-white border border-slate-200/80 rounded-3xl p-12 text-center text-slate-500 space-y-3 shadow-xs">
                  <UserCheck className="h-10 w-10 mx-auto opacity-30 text-slate-400" />
                  <p className="font-extrabold text-slate-800 text-base">No Candidates Found</p>
                  <p className="text-xs text-slate-400">There are no candidates matching the selected status filter.</p>
                </div>
              ) : (
                filteredCandidates.map((c, index) => {
                  const isUpdating = Boolean(loadingMap[c.submissionId]);

                  return (
                    <div
                      key={c.submissionId}
                      className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-xs hover:shadow-md transition-all space-y-5"
                    >
                      {/* Candidate Row Top Bar */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                        <div className="flex items-center gap-4">
                          <div className="h-12 w-12 rounded-2xl bg-amber-500/10 text-amber-700 font-black text-lg flex items-center justify-center border border-amber-200 shrink-0">
                            #{index + 1}
                          </div>
                          <div>
                            <div className="flex items-center gap-3">
                              <h3
                                onClick={() => {
                                  setSelectedCandidateId(c.candidateId);
                                  setActiveView('PROFILE');
                                }}
                                className="text-lg font-black text-slate-900 tracking-tight hover:text-amber-600 cursor-pointer transition-colors"
                              >
                                {c.firstName} {c.lastName}
                              </h3>

                              {/* Status Badge */}
                              {c.status === 'INTERVIEW' && (
                                <span className="px-3 py-1 rounded-full text-xs font-black bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                                  <CheckCircle className="h-3.5 w-3.5 text-emerald-600" /> SHORTLISTED / INTERVIEW
                                </span>
                              )}
                              {c.status === 'HOLD' && (
                                <span className="px-3 py-1 rounded-full text-xs font-black bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-1">
                                  <PauseCircle className="h-3.5 w-3.5 text-amber-600" /> ON HOLD
                                </span>
                              )}
                              {c.status === 'REJECT' && (
                                <span className="px-3 py-1 rounded-full text-xs font-black bg-rose-50 text-rose-700 border border-rose-200 flex items-center gap-1">
                                  <XCircle className="h-3.5 w-3.5 text-rose-600" /> REJECTED
                                </span>
                              )}
                              {c.status === 'PENDING' && (
                                <span className="px-3 py-1 rounded-full text-xs font-black bg-blue-50 text-blue-700 border border-blue-200 flex items-center gap-1">
                                  <Clock className="h-3.5 w-3.5 text-blue-600" /> PENDING REVIEW
                                </span>
                              )}
                            </div>
                            <p className="text-xs font-bold text-slate-500 mt-1">
                              {c.currentDesignation} at <strong className="text-slate-800">{c.currentCompany}</strong> ({c.totalExperience} Exp)
                            </p>
                          </div>
                        </div>

                        {/* Resume CTA */}
                        {c.resumeUrl && (
                          <a
                            href={c.resumeUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-extrabold border border-slate-200 transition-colors flex items-center gap-2 self-start sm:self-auto"
                          >
                            <FileText className="h-4 w-4 text-amber-600" />
                            <span>View Resume PDF</span>
                          </a>
                        )}
                      </div>

                      {/* Candidate Key Information Grid */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                        <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
                          <span className="text-[10px] font-extrabold uppercase text-slate-400 block mb-0.5">Total Exp / Rel Exp</span>
                          <span className="font-black text-slate-900">{c.totalExperience}</span>
                          <span className="text-amber-600 font-bold ml-1">({c.relevantExperience} Rel)</span>
                        </div>

                        <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
                          <span className="text-[10px] font-extrabold uppercase text-slate-400 block mb-0.5">Current Salary</span>
                          <span className="font-black text-emerald-700">{c.currentSalary}</span>
                        </div>

                        <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
                          <span className="text-[10px] font-extrabold uppercase text-slate-400 block mb-0.5">Expected Salary</span>
                          <span className="font-black text-amber-700">{c.expectedSalary}</span>
                        </div>

                        <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
                          <span className="text-[10px] font-extrabold uppercase text-slate-400 block mb-0.5">Notice Period</span>
                          <span className="font-black text-slate-900">{c.noticePeriod}</span>
                        </div>
                      </div>

                      {/* Decision Action Buttons & Full Profile Link */}
                      <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedCandidateId(c.candidateId);
                            setActiveView('PROFILE');
                          }}
                          className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black transition-all flex items-center gap-2 shadow-xs"
                        >
                          <Eye className="h-4 w-4" />
                          <span>Review Full Profile & Decision →</span>
                        </button>

                        {/* Quick 3 Action Buttons */}
                        <div className="flex items-center gap-2.5 w-full sm:w-auto">
                          <button
                            type="button"
                            disabled={isUpdating}
                            onClick={() => handleDecision(c.submissionId, 'INTERVIEW')}
                            className={`px-4 py-2 rounded-xl text-xs font-black transition flex items-center gap-1.5 ${
                              c.status === 'INTERVIEW'
                                ? 'bg-emerald-600 text-white shadow-xs'
                                : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200'
                            }`}
                          >
                            {isUpdating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle className="h-3.5 w-3.5" />}
                            <span>Interview</span>
                          </button>

                          <button
                            type="button"
                            disabled={isUpdating}
                            onClick={() => handleDecision(c.submissionId, 'HOLD')}
                            className={`px-4 py-2 rounded-xl text-xs font-black transition flex items-center gap-1.5 ${
                              c.status === 'HOLD'
                                ? 'bg-amber-500 text-slate-950 shadow-xs'
                                : 'bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200'
                            }`}
                          >
                            {isUpdating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <PauseCircle className="h-3.5 w-3.5" />}
                            <span>Hold</span>
                          </button>

                          <button
                            type="button"
                            disabled={isUpdating}
                            onClick={() => handleDecision(c.submissionId, 'REJECT')}
                            className={`px-4 py-2 rounded-xl text-xs font-black transition flex items-center gap-1.5 ${
                              c.status === 'REJECT'
                                ? 'bg-rose-600 text-white shadow-xs'
                                : 'bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200'
                            }`}
                          >
                            {isUpdating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <XCircle className="h-3.5 w-3.5" />}
                            <span>Reject</span>
                          </button>
                        </div>
                      </div>

                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}


        {/* ===================================================================== */}
        {/* LEVEL 3: CANDIDATE FULL PROFILE & DECISION VIEW                       */}
        {/* ===================================================================== */}
        {activeView === 'PROFILE' && selectedCandidate && (
          <div className="space-y-6">

            {/* Profile Header Box */}
            <div className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
              
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 border-b border-slate-100 pb-6">
                <div className="flex items-center gap-5">
                  <div className="h-16 w-16 rounded-3xl bg-amber-500/10 text-amber-600 font-black text-2xl flex items-center justify-center border border-amber-200 shrink-0">
                    {selectedCandidate.firstName.charAt(0)}{selectedCandidate.lastName.charAt(0)}
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-3">
                      <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                        {selectedCandidate.firstName} {selectedCandidate.lastName}
                      </h2>

                      {/* Status Badge */}
                      {selectedCandidate.status === 'INTERVIEW' && (
                        <span className="px-3 py-1 rounded-full text-xs font-black bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                          <CheckCircle className="h-3.5 w-3.5 text-emerald-600" /> SHORTLISTED / INTERVIEW
                        </span>
                      )}
                      {selectedCandidate.status === 'HOLD' && (
                        <span className="px-3 py-1 rounded-full text-xs font-black bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-1">
                          <PauseCircle className="h-3.5 w-3.5 text-amber-600" /> ON HOLD
                        </span>
                      )}
                      {selectedCandidate.status === 'REJECT' && (
                        <span className="px-3 py-1 rounded-full text-xs font-black bg-rose-50 text-rose-700 border border-rose-200 flex items-center gap-1">
                          <XCircle className="h-3.5 w-3.5 text-rose-600" /> REJECTED
                        </span>
                      )}
                      {selectedCandidate.status === 'PENDING' && (
                        <span className="px-3 py-1 rounded-full text-xs font-black bg-blue-50 text-blue-700 border border-blue-200 flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5 text-blue-600" /> PENDING DECISION
                        </span>
                      )}
                    </div>
                    <p className="text-xs font-bold text-slate-500">
                      {selectedCandidate.currentDesignation} at <strong className="text-slate-800">{selectedCandidate.currentCompany}</strong>
                    </p>
                  </div>
                </div>

                {/* View Resume Button */}
                {selectedCandidate.resumeUrl && (
                  <a
                    href={selectedCandidate.resumeUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="px-5 py-2.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs transition-all flex items-center justify-center gap-2 shadow-sm shrink-0"
                  >
                    <FileText className="h-4 w-4" />
                    <span>Download / View Resume PDF</span>
                  </a>
                )}
              </div>

              {/* 10 METRIC CARDS DATA GRID */}
              <div>
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-4 flex items-center gap-2">
                  <Award className="h-4 w-4 text-amber-600" />
                  Candidate Key Profile Metrics
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-1">
                    <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Total Experience</span>
                    <span className="font-black text-slate-900 text-sm">{selectedCandidate.totalExperience}</span>
                  </div>

                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-1">
                    <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Relevant Experience</span>
                    <span className="font-black text-amber-700 text-sm">{selectedCandidate.relevantExperience}</span>
                  </div>

                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-1">
                    <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Current Designation</span>
                    <span className="font-bold text-slate-800 text-xs truncate block">{selectedCandidate.currentDesignation}</span>
                  </div>

                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-1">
                    <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Qualification</span>
                    <span className="font-bold text-slate-800 text-xs truncate block">{selectedCandidate.qualification}</span>
                  </div>

                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-1">
                    <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Current Company</span>
                    <span className="font-bold text-slate-800 text-xs truncate block">{selectedCandidate.currentCompany}</span>
                  </div>

                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-1">
                    <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Current Salary (CTC)</span>
                    <span className="font-black text-emerald-700 text-sm">{selectedCandidate.currentSalary}</span>
                  </div>

                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-1">
                    <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Expected Salary (CTC)</span>
                    <span className="font-black text-amber-700 text-sm">{selectedCandidate.expectedSalary}</span>
                  </div>

                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-1">
                    <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Notice Period</span>
                    <span className="font-bold text-slate-900 text-xs">{selectedCandidate.noticePeriod}</span>
                  </div>

                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 col-span-1 sm:col-span-2 space-y-1">
                    <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Reason Of Leaving</span>
                    <span className="font-semibold text-slate-800 text-xs">{selectedCandidate.reasonOfLeaving}</span>
                  </div>

                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 col-span-1 sm:col-span-2 space-y-1">
                    <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Offer In Hand</span>
                    <span className="font-semibold text-slate-800 text-xs">{selectedCandidate.offerInHand}</span>
                  </div>
                </div>
              </div>

              {/* EMBEDDED RESUME PREVIEW BOX */}
              {selectedCandidate.resumeUrl && (
                <div className="space-y-3 pt-4 border-t border-slate-100">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-2">
                      <FileText className="h-4 w-4 text-amber-600" />
                      Candidate Resume Preview
                    </h3>
                    <a
                      href={selectedCandidate.resumeUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs font-bold text-amber-600 hover:text-amber-700 flex items-center gap-1"
                    >
                      Open in New Tab <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  </div>

                  <div className="bg-slate-100 rounded-2xl border border-slate-200 overflow-hidden h-[500px]">
                    <iframe
                      src={selectedCandidate.resumeUrl}
                      title="Candidate Resume Preview"
                      className="w-full h-full border-0"
                    />
                  </div>
                </div>
              )}

              {/* BOTTOM DECISION BAR WITH 3 PROMINENT ACTION BUTTONS */}
              <div className="p-6 bg-slate-900 text-white rounded-2xl shadow-xl flex flex-col sm:flex-row items-center justify-between gap-6 border border-slate-800">
                <div>
                  <h4 className="text-sm font-black text-white">Record Your Review Decision</h4>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Select your feedback decision for <strong>{selectedCandidate.firstName} {selectedCandidate.lastName}</strong>.
                  </p>
                </div>

                {/* Exactly 3 Action Buttons */}
                <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
                  {/* Interview Button */}
                  <button
                    type="button"
                    disabled={Boolean(loadingMap[selectedCandidate.submissionId])}
                    onClick={() => handleDecision(selectedCandidate.submissionId, 'INTERVIEW')}
                    className={`flex-1 sm:flex-none px-6 py-3 rounded-2xl text-xs font-black transition flex items-center justify-center gap-2 cursor-pointer shadow-md ${
                      selectedCandidate.status === 'INTERVIEW'
                        ? 'bg-emerald-500 text-slate-950 ring-4 ring-emerald-400/30 font-black'
                        : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                    }`}
                  >
                    {loadingMap[selectedCandidate.submissionId] ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <CheckCircle className="h-4 w-4" />
                    )}
                    <span>Schedule Interview</span>
                  </button>

                  {/* Hold Button */}
                  <button
                    type="button"
                    disabled={Boolean(loadingMap[selectedCandidate.submissionId])}
                    onClick={() => handleDecision(selectedCandidate.submissionId, 'HOLD')}
                    className={`flex-1 sm:flex-none px-6 py-3 rounded-2xl text-xs font-black transition flex items-center justify-center gap-2 cursor-pointer shadow-md ${
                      selectedCandidate.status === 'HOLD'
                        ? 'bg-amber-500 text-slate-950 ring-4 ring-amber-400/30 font-black'
                        : 'bg-amber-600 hover:bg-amber-500 text-white'
                    }`}
                  >
                    {loadingMap[selectedCandidate.submissionId] ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <PauseCircle className="h-4 w-4" />
                    )}
                    <span>Put On Hold</span>
                  </button>

                  {/* Reject Button */}
                  <button
                    type="button"
                    disabled={Boolean(loadingMap[selectedCandidate.submissionId])}
                    onClick={() => handleDecision(selectedCandidate.submissionId, 'REJECT')}
                    className={`flex-1 sm:flex-none px-6 py-3 rounded-2xl text-xs font-black transition flex items-center justify-center gap-2 cursor-pointer shadow-md ${
                      selectedCandidate.status === 'REJECT'
                        ? 'bg-rose-600 text-white ring-4 ring-rose-400/30 font-black'
                        : 'bg-rose-700 hover:bg-rose-600 text-white'
                    }`}
                  >
                    {loadingMap[selectedCandidate.submissionId] ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <XCircle className="h-4 w-4" />
                    )}
                    <span>Reject Candidate</span>
                  </button>
                </div>
              </div>

            </div>

          </div>
        )}

      </main>
    </div>
  );
}
