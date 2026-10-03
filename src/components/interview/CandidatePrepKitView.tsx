'use client';

import React, { useState } from 'react';
import {
  CheckCircle,
  Briefcase,
  Building2,
  Calendar,
  Clock,
  Video,
  ExternalLink,
  BookOpen,
  Sparkles,
  ShieldCheck,
  CheckSquare,
  Square,
  FileText,
  User,
  Loader2,
  Lightbulb,
  PhoneCall,
  Check
} from 'lucide-react';
import { markPrepKitCompletedAction, ChecklistItem } from '@/app/actions/interviewPrep';

interface CandidatePrepKitViewProps {
  token: string;
  kit: any;
}

export function CandidatePrepKitView({ token, kit: initialKit }: CandidatePrepKitViewProps) {
  const [kit, setKit] = useState<any>(initialKit);
  const [isCompleted, setIsCompleted] = useState<boolean>(
    initialKit.status === 'COMPLETED' || !!initialKit.completedAt
  );

  const rawChecklist = Array.isArray(initialKit.checklistItems)
    ? (initialKit.checklistItems as ChecklistItem[])
    : [
        { id: 'c1', label: 'Review Resume & Past Project Experiences', completed: false },
        { id: 'c2', label: 'Research Company Overview & Industry Context', completed: false },
        { id: 'c3', label: 'Test Video, Audio & Meeting Software (Jitsi/Meet)', completed: false },
        { id: 'c4', label: 'Prepare Technical & Scenario-Based Questions', completed: false }
      ];

  const [checklist, setChecklist] = useState<ChecklistItem[]>(rawChecklist);
  const [candidateNotes, setCandidateNotes] = useState<string>(initialKit.candidateNotes || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const interview = kit.interview;
  const submission = interview?.submission;
  const job = submission?.job;
  const candidate = submission?.candidate;
  const client = job?.client;

  const candidateName = candidate ? `${candidate.firstName} ${candidate.lastName}`.trim() : 'Candidate';
  const positionTitle = job?.title || kit.title || 'Position';
  const companyName = client?.companyName || 'Company';
  const roundTypeStr = interview?.roundType ? String(interview.roundType) : 'Technical Round';

  const startTimeFormatted = interview?.confirmedStartTime
    ? new Date(interview.confirmedStartTime).toLocaleString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      })
    : 'Scheduled Date & Time';

  const meetingUrl = interview?.meetingUrl || interview?.meetingLink || 'https://meet.jit.si';

  function toggleChecklistItem(id: string) {
    setChecklist(prev =>
      prev.map(item => (item.id === id ? { ...item, completed: !item.completed } : item))
    );
  }

  async function handleCompleteKit() {
    setIsSubmitting(true);
    setError(null);

    const res = await markPrepKitCompletedAction(token, candidateNotes, checklist);

    setIsSubmitting(false);

    if (res.success) {
      setIsCompleted(true);
      setKit((prev: any) => ({
        ...prev,
        status: 'COMPLETED',
        completedAt: new Date().toISOString()
      }));
    } else {
      setError(res.error || 'Failed to record completion status.');
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-8 font-sans antialiased selection:bg-amber-500 selection:text-slate-950">
      
      {/* Dynamic Background Blurs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 -right-40 w-96 h-96 bg-sky-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-20 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto space-y-8">
        
        {/* Guest Portal Header */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs font-extrabold text-amber-400 uppercase tracking-widest">
              <Sparkles className="h-4 w-4" />
              Interview Preparation Kit
            </div>
            
            <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
              {positionTitle}
            </h1>

            <p className="text-sm text-slate-300">
              Prepared for <strong className="text-white">{candidateName}</strong> • Interviewing at <strong className="text-white">{companyName}</strong>
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            {isCompleted ? (
              <div className="flex items-center gap-2 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-4 py-2 rounded-2xl text-xs font-black">
                <CheckCircle className="h-4 w-4" />
                <span>Reviewed & Completed</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 bg-amber-500/20 text-amber-300 border border-amber-500/30 px-4 py-2 rounded-2xl text-xs font-black">
                <BookOpen className="h-4 w-4" />
                <span>Preparation In Progress</span>
              </div>
            )}

            <div className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-full">
              <ShieldCheck className="h-3.5 w-3.5" />
              <span>Verified Guest Portal</span>
            </div>
          </div>
        </div>

        {/* Schedule & Quick Access Bar */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-2xl flex items-center gap-3">
            <Calendar className="h-5 w-5 text-amber-400 shrink-0" />
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Scheduled Date</span>
              <span className="text-xs font-extrabold text-white">{startTimeFormatted}</span>
            </div>
          </div>

          <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-2xl flex items-center gap-3">
            <Clock className="h-5 w-5 text-amber-400 shrink-0" />
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Round Type</span>
              <span className="text-xs font-extrabold text-amber-400">{roundTypeStr}</span>
            </div>
          </div>

          <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-2xl flex items-center gap-3">
            <Building2 className="h-5 w-5 text-amber-400 shrink-0" />
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Target Organization</span>
              <span className="text-xs font-extrabold text-white truncate block">{companyName}</span>
            </div>
          </div>

          <a
            href={meetingUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="p-4 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 rounded-2xl flex items-center justify-between text-white font-extrabold text-xs shadow-lg shadow-emerald-500/20 transition group"
          >
            <div className="flex items-center gap-2">
              <Video className="h-5 w-5" />
              <span>Join Meeting Link</span>
            </div>
            <ExternalLink className="h-4 w-4 opacity-80 group-hover:translate-x-0.5 transition" />
          </a>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column (2 Cols) - Detailed Preparation Guide */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Company Overview */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-3">
              <h2 className="text-lg font-extrabold text-white flex items-center gap-2">
                <Building2 className="h-5 w-5 text-amber-400" />
                Company Overview
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                {kit.companyOverview || `${companyName} is an industry-leading business operating in modern tech and enterprise solutions.`}
              </p>
            </div>

            {/* Job Summary */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-3">
              <h2 className="text-lg font-extrabold text-white flex items-center gap-2">
                <Briefcase className="h-5 w-5 text-amber-400" />
                Job Summary & Mandate Highlights
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                {kit.jobSummary || `Position: ${positionTitle}. Candidates are evaluated on technical execution, domain expertise, and cultural alignment.`}
              </p>
            </div>

            {/* Important Skills To Revise */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-4">
              <h2 className="text-lg font-extrabold text-white flex items-center gap-2">
                <Lightbulb className="h-5 w-5 text-amber-400" />
                Important Topics & Skills To Revise
              </h2>
              <div className="flex flex-wrap gap-2.5">
                {(kit.skillsToRevise && kit.skillsToRevise.length > 0 ? kit.skillsToRevise : [
                  'Domain Fundamentals & Architecture',
                  'Problem Solving & Data Structures',
                  'System Design Tradeoffs',
                  'Project Experience Highlights',
                  'Behavioral Scenarios'
                ]).map((skill: string, idx: number) => (
                  <span
                    key={idx}
                    className="px-3.5 py-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs font-bold"
                  >
                    ⚡ {skill}
                  </span>
                ))}
              </div>
            </div>

            {/* Interview Best Practices */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-4">
              <h2 className="text-lg font-extrabold text-white flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-amber-400" />
                Interview Best Practices
              </h2>
              <div className="space-y-3">
                {(kit.bestPractices && kit.bestPractices.length > 0 ? kit.bestPractices : [
                  'Join the meeting 5 minutes early to test audio, microphone, and video settings.',
                  'Ensure a clean, well-lit, and quiet environment with stable internet connection.',
                  'Use the STAR method (Situation, Task, Action, Result) when answering scenario questions.',
                  'Be prepared to explain technical design decisions and trade-offs from your recent experience.',
                  'Have 2-3 insightful questions ready regarding company tech stack and team structure.'
                ]).map((bp: string, idx: number) => (
                  <div key={idx} className="flex items-start gap-3 p-3 bg-slate-950/60 rounded-2xl border border-slate-800/80 text-xs text-slate-300">
                    <div className="h-6 w-6 rounded-lg bg-slate-800 text-amber-400 font-extrabold flex items-center justify-center shrink-0">
                      {idx + 1}
                    </div>
                    <span className="leading-relaxed">{bp}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Meeting Instructions & Support */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-3">
              <h2 className="text-lg font-extrabold text-white flex items-center gap-2">
                <PhoneCall className="h-5 w-5 text-amber-400" />
                Meeting Guidelines & Recruiter Support
              </h2>
              <p className="text-xs text-slate-300 leading-relaxed">
                {kit.meetingInstructions || `Join meeting link: ${meetingUrl}. Please ensure your audio and video are clear.`}
              </p>
              <div className="pt-2 text-xs text-slate-400 border-t border-slate-800/80">
                <strong>Contact Support:</strong> {kit.contactInfo || 'Recruitment Team (support@recruitos.com)'}
              </div>
            </div>

          </div>

          {/* Right Column (1 Col) - Checklist, Candidate Notes & Confirmation */}
          <div className="space-y-6">
            
            {/* Interactive Candidate Checklist */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
              <h3 className="text-base font-extrabold text-white flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <CheckSquare className="h-5 w-5 text-amber-400" />
                  Readiness Checklist
                </span>
                <span className="text-xs font-bold text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-full">
                  {checklist.filter(i => i.completed).length} / {checklist.length}
                </span>
              </h3>

              <div className="space-y-2.5">
                {checklist.map(item => (
                  <div
                    key={item.id}
                    onClick={() => toggleChecklistItem(item.id)}
                    className={`p-3.5 rounded-2xl border transition cursor-pointer flex items-center gap-3 ${
                      item.completed
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-200'
                        : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    <div className={`h-5 w-5 rounded-md border flex items-center justify-center shrink-0 ${
                      item.completed ? 'bg-emerald-500 border-emerald-500 text-slate-950' : 'border-slate-700'
                    }`}>
                      {item.completed && <Check className="h-3.5 w-3.5 stroke-[3]" />}
                    </div>
                    <span className="text-xs font-semibold leading-tight">{item.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Candidate Personal Notes Textarea */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 space-y-3 shadow-xl">
              <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                <FileText className="h-5 w-5 text-amber-400" />
                Personal Notes & Questions
              </h3>
              <p className="text-[11px] text-slate-400">
                Jot down questions for the interviewer or personal revision points.
              </p>
              <textarea
                rows={4}
                value={candidateNotes}
                onChange={e => setCandidateNotes(e.target.value)}
                placeholder="e.g. Ask about team size, tech stack deployment pipeline..."
                className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-3.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 transition"
              />
            </div>

            {/* Completion Button & Status */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-2xl">
              {error && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-xs text-rose-300 font-bold">
                  {error}
                </div>
              )}

              {isCompleted ? (
                <div className="text-center space-y-3 p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl">
                  <CheckCircle className="h-10 w-10 text-emerald-400 mx-auto" />
                  <div>
                    <h4 className="text-sm font-black text-emerald-300">Kit Review Completed!</h4>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Your recruiter has been notified of your interview readiness. Good luck!
                    </p>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={handleCompleteKit}
                  className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-500 via-emerald-600 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-black text-sm shadow-xl shadow-emerald-600/25 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <CheckCircle className="h-5 w-5 stroke-[2.5]" />
                  )}
                  <span>I Have Reviewed This Preparation Kit</span>
                </button>
              )}
            </div>

          </div>

        </div>

        {/* Footer */}
        <div className="pt-6 border-t border-slate-800 text-center text-xs text-slate-500">
          <p>© 2026 RecruitOS Interview Readiness System</p>
        </div>

      </div>

    </div>
  );
}
