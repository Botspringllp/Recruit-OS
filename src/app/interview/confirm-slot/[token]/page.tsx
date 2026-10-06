import React from 'react';
import { confirmCandidateSlotSelectionAction } from '@/app/actions/interviews';
import { CheckCircle2, Video, Calendar, ShieldAlert, Clock, Building2, Briefcase } from 'lucide-react';

interface PageProps {
  params: {
    token: string;
  };
  searchParams?: {
    slotId?: string;
  };
}

export default async function ConfirmSlotPage({ params, searchParams }: PageProps) {
  const { token } = params;
  const slotId = searchParams?.slotId;

  // Execute atomic slot confirmation action
  const res = await confirmCandidateSlotSelectionAction(token, slotId);

  if (!res.success) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4 font-sans antialiased">
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-8 max-w-md w-full text-center space-y-4 shadow-2xl backdrop-blur-xl">
          <div className="h-16 w-16 rounded-2xl bg-rose-500/10 text-rose-400 border border-rose-500/30 flex items-center justify-center mx-auto">
            <ShieldAlert className="h-8 w-8" />
          </div>
          <h1 className="text-xl font-extrabold text-white">Interview Confirmation Link Expired</h1>
          <p className="text-xs text-slate-400 leading-relaxed">
            {res.error || 'This interview scheduling link could not be found or has expired. Please contact your recruiter for assistance.'}
          </p>
        </div>
      </div>
    );
  }

  const { alreadyConfirmed, candidateName, positionTitle, companyName, roundType, confirmedStartTime, timezoneStr, meetingUrl } = res;

  const formattedDateStr = confirmedStartTime
    ? new Date(confirmedStartTime).toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      })
    : 'Scheduled';

  const formattedTimeStr = confirmedStartTime
    ? new Date(confirmedStartTime).toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      })
    : 'Confirmed';

  const meetingLink = meetingUrl || '#';

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4 sm:p-6 font-sans antialiased selection:bg-emerald-500 selection:text-slate-950">
      
      {/* Background Subtle Gradient Glow */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl" />
      </div>

      {/* Standalone Minimal Confirmation Card */}
      <div className="relative z-10 w-full max-w-lg bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-10 shadow-2xl backdrop-blur-xl space-y-6 text-center">
        
        {/* Success Icon */}
        <div className="h-20 w-20 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center justify-center mx-auto shadow-inner">
          <CheckCircle2 className="h-10 w-10 stroke-[2.5]" />
        </div>

        {/* Dynamic Title & Subtitle */}
        <div className="space-y-2">
          <span className="px-3 py-1 rounded-full text-[11px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 uppercase tracking-widest inline-block">
            {alreadyConfirmed ? 'Already Confirmed' : 'Interview Confirmed'}
          </span>

          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            {alreadyConfirmed
              ? 'This interview slot has already been confirmed.'
              : `Interview Confirmed, ${candidateName || 'Candidate'}!`}
          </h1>

          <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto leading-relaxed">
            {alreadyConfirmed
              ? 'Your interview details remain locked into the calendar as scheduled below.'
              : 'Your confirmation email has been sent.'}
          </p>
        </div>

        {/* Minimal Schedule Details Grid */}
        <div className="bg-slate-950/80 border border-slate-800/80 rounded-2xl p-5 text-left space-y-3">
          {positionTitle && (
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5">
              <span className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
                <Briefcase className="h-3.5 w-3.5 text-amber-400" /> Position
              </span>
              <span className="text-xs font-extrabold text-white">{positionTitle}</span>
            </div>
          )}

          {companyName && (
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5">
              <span className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
                <Building2 className="h-3.5 w-3.5 text-amber-400" /> Company
              </span>
              <span className="text-xs font-extrabold text-white">{companyName}</span>
            </div>
          )}

          <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5">
            <span className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5 text-emerald-400" /> Date
            </span>
            <span className="text-xs font-black text-emerald-400">{formattedDateStr}</span>
          </div>

          <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5">
            <span className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 text-emerald-400" /> Time
            </span>
            <span className="text-xs font-black text-emerald-400">{formattedTimeStr}</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Timezone</span>
            <span className="text-xs font-bold text-slate-300">{timezoneStr || 'IST (UTC+5:30)'}</span>
          </div>
        </div>

        {/* Single CTA: Join Interview */}
        <div className="pt-2">
          <a
            href={meetingLink}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-500 via-emerald-600 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-black text-sm shadow-xl shadow-emerald-600/25 transition flex items-center justify-center gap-2"
          >
            <Video className="h-5 w-5" />
            <span>Join Interview</span>
          </a>
        </div>

        {/* Clean Footer */}
        <p className="text-[11px] text-slate-500">
          RecruitOS • Instant Interview Confirmation Service
        </p>

      </div>
    </div>
  );
}
