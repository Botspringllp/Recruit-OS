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
  // Always land on 'JOBS' view first on link click
  const [activeView, setActiveView] = useState<'JOBS' | 'CANDIDATES' | 'PROFILE'>('JOBS');

  const [selectedJobId, setSelectedJobId] = useState<string | null>(() => {
    return jobsMap.length > 0 ? jobsMap[0].jobId : null;
  });

  const [selectedCandidateId, setSelectedCandidateId] = useState<string | null>(null);
  const [selectedSubmissions, setSelectedSubmissions] = useState<string[]>([]);

  // Currently selected Job Object
  const currentJob = jobsMap.find(j => j.jobId === selectedJobId) || jobsMap[0];

  // Candidates for the currently selected job
  const jobCandidates = currentJob ? currentJob.candidates : candidates;

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

  async function handleBulkDecision(decision: 'INTERVIEW' | 'HOLD' | 'REJECT') {
    if (selectedSubmissions.length === 0) return;

    for (const submissionId of selectedSubmissions) {
      await handleDecision(submissionId, decision);
    }
    setSelectedSubmissions([]);
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
            {/* Elegant RecruitOS Logo Tile */}
            <div className="h-9 w-9 rounded-xl bg-slate-900 text-amber-400 font-black text-sm flex items-center justify-center shadow-xs shrink-0">
              R
            </div>
            
            <div className="flex items-center gap-2.5 flex-wrap">
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-slate-900 text-base tracking-tight">RecruitOS</span>
                <span className="text-slate-300 font-normal">·</span>
                <span className="text-xs font-semibold text-slate-500">Candidate Review Portal</span>
              </div>

              {/* Client Context Badge */}
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-100 border border-slate-200/80 text-slate-700 text-xs font-semibold">
                <Building2 className="h-3 w-3 text-slate-500" />
                <span>Client:</span>
                <span className="text-slate-900 font-extrabold">{currentJob ? currentJob.clientName : defaultClientName}</span>
              </div>
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

        {/* BREADCRUMB NAVIGATION BAR (Only shown when inside Candidate List or Profile views) */}
        {activeView !== 'JOBS' && (
          <nav className="flex items-center justify-between bg-white border border-slate-200/80 rounded-2xl px-5 py-3 shadow-xs">
            <div className="flex items-center gap-2 text-xs font-extrabold text-slate-500 overflow-x-auto">
              
              {/* Level 1 Link: All Jobs */}
              <button
                onClick={() => {
                  setActiveView('JOBS');
                  setSelectedCandidateId(null);
                }}
                className="flex items-center gap-1.5 hover:text-slate-900 text-slate-600 font-bold transition-colors cursor-pointer"
              >
                <Briefcase className="h-4 w-4 text-amber-600" />
                <span>Job Mandates</span>
              </button>

              {/* Breadcrumb Separator & Level 2 */}
              {currentJob && (
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
            {activeView === 'CANDIDATES' && (
              <button
                onClick={() => setActiveView('JOBS')}
                className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-extrabold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                <span>Back to Job Mandates</span>
              </button>
            )}

            {activeView === 'PROFILE' && (
              <button
                onClick={() => setActiveView('CANDIDATES')}
                className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-extrabold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                <span>Back to Candidate List</span>
              </button>
            )}
          </nav>
        )}


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
              
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 relative z-10">
                <div className="space-y-2">
                  <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-full text-xs font-black uppercase tracking-wider">
                    <UserCheck className="h-3.5 w-3.5" />
                    Submitted Candidate List
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                    Candidates for {currentJob.jobTitle}
                  </h2>
                  <p className="text-xs font-medium text-slate-300 flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-slate-400" />
                    Submitted for <strong>{currentJob.clientName}</strong> ({jobCandidates.length} Candidates)
                  </p>
                </div>
              </div>
            </div>

            {/* CONDITIONAL ACTION DECISION BAR (Only visible when candidate(s) are selected) */}
            {selectedSubmissions.length > 0 && (
              <div className="bg-slate-900 text-white p-4 sm:p-5 rounded-2xl shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4 border border-slate-800 sticky top-20 z-20 transition-all animate-in fade-in slide-in-from-top-2">
                <div className="flex items-center gap-3">
                  <span className="h-7 w-7 rounded-xl bg-amber-500 text-slate-950 font-black text-xs flex items-center justify-center">
                    {selectedSubmissions.length}
                  </span>
                  <span className="text-xs font-bold text-slate-200">
                    {selectedSubmissions.length === 1 ? '1 Candidate Selected' : `${selectedSubmissions.length} Candidates Selected`}
                  </span>
                </div>

                <div className="flex items-center gap-2.5 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={() => handleBulkDecision('INTERVIEW')}
                    className="flex-1 sm:flex-none px-4 py-2 rounded-xl text-xs font-black bg-emerald-600 hover:bg-emerald-500 text-white transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <CheckCircle className="h-4 w-4" />
                    <span>Interview</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleBulkDecision('HOLD')}
                    className="flex-1 sm:flex-none px-4 py-2 rounded-xl text-xs font-black bg-amber-500 hover:bg-amber-400 text-slate-950 transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <PauseCircle className="h-4 w-4" />
                    <span>Hold</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleBulkDecision('REJECT')}
                    className="flex-1 sm:flex-none px-4 py-2 rounded-xl text-xs font-black bg-rose-600 hover:bg-rose-500 text-white transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <XCircle className="h-4 w-4" />
                    <span>Reject</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedSubmissions([])}
                    className="px-3 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white transition cursor-pointer"
                  >
                    Deselect All
                  </button>
                </div>
              </div>
            )}

            {/* Candidates Roster List */}
            <div className="space-y-3">
              {jobCandidates.map((c, index) => {
                const isSelected = selectedSubmissions.includes(c.submissionId);

                return (
                  <div
                    key={c.submissionId}
                    className={`bg-white border rounded-2xl p-5 shadow-xs hover:shadow-md transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                      isSelected ? 'border-amber-400 bg-amber-50/20' : 'border-slate-200/90'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      {/* Checkbox for selection */}
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedSubmissions(prev => [...prev, c.submissionId]);
                          } else {
                            setSelectedSubmissions(prev => prev.filter(id => id !== c.submissionId));
                          }
                        }}
                        className="h-5 w-5 rounded-lg border-slate-300 text-amber-500 focus:ring-amber-400 cursor-pointer shrink-0"
                      />

                      {/* Candidate Initials Avatar (Clickable to open profile) */}
                      <div
                        onClick={() => {
                          setSelectedCandidateId(c.candidateId);
                          setActiveView('PROFILE');
                        }}
                        className="h-11 w-11 rounded-2xl bg-amber-500/10 text-amber-700 font-black text-sm flex items-center justify-center border border-amber-200 shrink-0 cursor-pointer hover:scale-105 transition-transform"
                      >
                        {c.firstName.charAt(0)}{c.lastName.charAt(0)}
                      </div>

                      {/* Candidate Name & Info (Clickable to open profile) */}
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-3">
                          <h3
                            onClick={() => {
                              setSelectedCandidateId(c.candidateId);
                              setActiveView('PROFILE');
                            }}
                            className="text-base font-black text-slate-900 tracking-tight hover:text-amber-600 cursor-pointer transition-colors"
                          >
                            {c.firstName} {c.lastName}
                          </h3>

                          {/* Status Badge */}
                          {c.status === 'INTERVIEW' && (
                            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                              <CheckCircle className="h-3 w-3 text-emerald-600" /> SHORTLISTED
                            </span>
                          )}
                          {c.status === 'HOLD' && (
                            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-1">
                              <PauseCircle className="h-3 w-3 text-amber-600" /> ON HOLD
                            </span>
                          )}
                          {c.status === 'REJECT' && (
                            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black bg-rose-50 text-rose-700 border border-rose-200 flex items-center gap-1">
                              <XCircle className="h-3 w-3 text-rose-600" /> REJECTED
                            </span>
                          )}
                          {c.status === 'PENDING' && (
                            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black bg-blue-50 text-blue-700 border border-blue-200 flex items-center gap-1">
                              <Clock className="h-3 w-3 text-blue-600" /> PENDING
                            </span>
                          )}
                        </div>

                        <p className="text-xs font-semibold text-slate-500">
                          {c.currentDesignation} at <strong className="text-slate-800">{c.currentCompany}</strong> ({c.totalExperience} Exp)
                        </p>
                      </div>
                    </div>

                    {/* Simple Right Arrow CTA Link to Profile */}
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedCandidateId(c.candidateId);
                        setActiveView('PROFILE');
                      }}
                      className="text-xs font-bold text-amber-600 hover:text-amber-700 flex items-center gap-1 cursor-pointer self-end sm:self-center"
                    >
                      <span>View Profile</span>
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                );
              })}
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
              {selectedCandidate.resumeUrl ? (
                <div className="space-y-3 pt-6 border-t border-slate-100">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-2">
                      <FileText className="h-4 w-4 text-amber-600" />
                      Candidate Resume Preview
                    </h3>
                    <a
                      href={selectedCandidate.resumeUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      <span>Open PDF in New Tab</span>
                      <ExternalLink className="h-3.5 w-3.5 text-amber-600" />
                    </a>
                  </div>

                  <div className="bg-slate-100 rounded-2xl border border-slate-200 overflow-hidden h-[600px] relative shadow-inner">
                    <object
                      data={selectedCandidate.resumeUrl}
                      type="application/pdf"
                      className="w-full h-full"
                    >
                      <iframe
                        src={selectedCandidate.resumeUrl}
                        title="Candidate Resume Preview"
                        className="w-full h-full border-0"
                      >
                        <div className="flex flex-col items-center justify-center h-full p-8 text-center space-y-4">
                          <FileText className="h-12 w-12 text-slate-400" />
                          <p className="text-sm font-bold text-slate-700">Unable to preview PDF directly in browser.</p>
                          <a
                            href={selectedCandidate.resumeUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-black"
                          >
                            Click to View / Download Candidate Resume
                          </a>
                        </div>
                      </iframe>
                    </object>
                  </div>
                </div>
              ) : (
                <div className="pt-6 border-t border-slate-100 text-center py-8 bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-slate-400 space-y-2">
                  <FileText className="h-8 w-8 mx-auto opacity-40" />
                  <p className="text-xs font-bold text-slate-600">No Resume File Attached</p>
                  <p className="text-[11px]">There is no PDF resume document linked to this candidate submission.</p>
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
