'use client';

import React, { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { createInterviewAction, updateInterviewAction, InterviewActionResult } from '@/app/actions/interviews';
import { Calendar, Clock, Video, FileText, User, Briefcase, Link as LinkIcon, AlertCircle } from 'lucide-react';

interface SubmissionOption {
  id: string;
  candidateName: string;
  jobTitle: string;
  clientName: string;
}

interface InterviewFormProps {
  submissions?: SubmissionOption[];
  initialData?: {
    id?: string;
    submissionId?: string;
    scheduledAt?: string;
    durationMinutes?: number;
    roundType?: string;
    mode?: string;
    meetingLink?: string;
    notes?: string;
  };
  isEdit?: boolean;
}

export function InterviewForm({ submissions = [], initialData = {}, isEdit = false }: InterviewFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const [submissionId, setSubmissionId] = useState(initialData.submissionId || (submissions[0]?.id || ''));
  const [scheduledAt, setScheduledAt] = useState(initialData.scheduledAt || '');
  const [durationMinutes, setDurationMinutes] = useState(initialData.durationMinutes || 45);
  const [roundType, setRoundType] = useState(initialData.roundType || 'TECHNICAL_ASSESSMENT');
  const [mode, setMode] = useState(initialData.mode || 'GOOGLE_MEET');
  const [meetingLink, setMeetingLink] = useState(initialData.meetingLink || '');
  const [notes, setNotes] = useState(initialData.notes || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setFieldErrors({});

    const formData = new FormData();
    formData.append('submissionId', submissionId);
    formData.append('scheduledAt', scheduledAt);
    formData.append('durationMinutes', durationMinutes.toString());
    formData.append('roundType', roundType);
    formData.append('mode', mode);
    formData.append('meetingLink', meetingLink);
    formData.append('notes', notes);

    startTransition(async () => {
      let res: InterviewActionResult;
      if (isEdit && initialData.id) {
        res = await updateInterviewAction(initialData.id, formData);
      } else {
        res = await createInterviewAction(null, formData);
      }

      if (res.success) {
        router.push(isEdit && initialData.id ? `/interviews/${initialData.id}` : '/interviews');
      } else {
        if (res.error) setError(res.error);
        if (res.errors) setFieldErrors(res.errors);
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-3xl">
      {error && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-2xl flex items-center gap-3 text-xs text-rose-300">
          <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
          <span>{error}</span>
        </div>
      )}

      {/* Select Submission / Candidate Pair */}
      {!isEdit && (
        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-300 flex items-center gap-2">
            <User className="h-4 w-4 text-brand-400" />
            Candidate Submission Record *
          </label>
          <select
            value={submissionId}
            onChange={(e) => setSubmissionId(e.target.value)}
            disabled={isPending}
            className="w-full px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-brand-500 transition"
          >
            <option value="">Select Candidate & Job Requisition</option>
            {submissions.map((sub) => (
              <option key={sub.id} value={sub.id}>
                {sub.candidateName} — {sub.jobTitle} ({sub.clientName})
              </option>
            ))}
          </select>
          {fieldErrors.submissionId && <p className="text-[11px] text-rose-400">{fieldErrors.submissionId}</p>}
        </div>
      )}

      {/* Grid: Round Type & Mode */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-300 flex items-center gap-2">
            <Briefcase className="h-4 w-4 text-indigo-400" />
            Interview Round Type *
          </label>
          <select
            value={roundType}
            onChange={(e) => setRoundType(e.target.value)}
            disabled={isPending}
            className="w-full px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-brand-500 transition"
          >
            <option value="HR_ROUND">HR Round</option>
            <option value="TECHNICAL_ASSESSMENT">Technical Assessment</option>
            <option value="CLIENT_ROUND_1">Client Round 1</option>
            <option value="CLIENT_ROUND_2">Client Round 2</option>
            <option value="FINAL_MANAGERIAL">Final Managerial</option>
            <option value="INTERNAL_SCREENING">Internal Screening</option>
          </select>
          {fieldErrors.roundType && <p className="text-[11px] text-rose-400">{fieldErrors.roundType}</p>}
        </div>

        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-300 flex items-center gap-2">
            <Video className="h-4 w-4 text-purple-400" />
            Interview Mode *
          </label>
          <select
            value={mode}
            onChange={(e) => setMode(e.target.value)}
            disabled={isPending}
            className="w-full px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-brand-500 transition"
          >
            <option value="GOOGLE_MEET">Google Meet</option>
            <option value="ZOOM">Zoom</option>
            <option value="MS_TEAMS">Microsoft Teams</option>
            <option value="PHONE">Phone Call</option>
            <option value="IN_PERSON">In Person</option>
          </select>
          {fieldErrors.mode && <p className="text-[11px] text-rose-400">{fieldErrors.mode}</p>}
        </div>
      </div>

      {/* Grid: Schedule Date & Time, Duration */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-300 flex items-center gap-2">
            <Calendar className="h-4 w-4 text-emerald-400" />
            Schedule Date & Time *
          </label>
          <input
            type="datetime-local"
            value={scheduledAt}
            onChange={(e) => setScheduledAt(e.target.value)}
            disabled={isPending}
            className="w-full px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-brand-500 transition"
          />
          {fieldErrors.scheduledAt && <p className="text-[11px] text-rose-400">{fieldErrors.scheduledAt}</p>}
        </div>

        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-300 flex items-center gap-2">
            <Clock className="h-4 w-4 text-amber-400" />
            Duration (Minutes) *
          </label>
          <input
            type="number"
            min="15"
            max="480"
            step="15"
            value={durationMinutes}
            onChange={(e) => setDurationMinutes(parseInt(e.target.value, 10) || 45)}
            disabled={isPending}
            className="w-full px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-brand-500 transition"
          />
          {fieldErrors.durationMinutes && <p className="text-[11px] text-rose-400">{fieldErrors.durationMinutes}</p>}
        </div>
      </div>

      {/* Meeting Link */}
      <div className="space-y-2">
        <label className="text-xs font-semibold text-slate-300 flex items-center gap-2">
          <LinkIcon className="h-4 w-4 text-cyan-400" />
          Meeting Link (Google Meet / Zoom / Teams URL)
        </label>
        <input
          type="url"
          value={meetingLink}
          onChange={(e) => setMeetingLink(e.target.value)}
          placeholder="https://meet.google.com/abc-defg-hij"
          disabled={isPending}
          className="w-full px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-600 focus:outline-none focus:border-brand-500 transition"
        />
        {fieldErrors.meetingLink && <p className="text-[11px] text-rose-400">{fieldErrors.meetingLink}</p>}
      </div>

      {/* Recruiter Notes */}
      <div className="space-y-2">
        <label className="text-xs font-semibold text-slate-300 flex items-center gap-2">
          <FileText className="h-4 w-4 text-slate-400" />
          Recruiter Preparation & Interview Notes
        </label>
        <textarea
          rows={4}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Add agenda, technical focus areas, interviewer details, or special instructions..."
          disabled={isPending}
          className="w-full px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-600 focus:outline-none focus:border-brand-500 transition"
        />
      </div>

      {/* Submit Buttons */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800/80">
        <button
          type="button"
          onClick={() => router.back()}
          disabled={isPending}
          className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 rounded-xl text-xs font-semibold transition"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isPending}
          className="px-6 py-2.5 bg-brand-500 hover:bg-brand-600 text-white rounded-xl text-xs font-bold shadow-lg shadow-brand-500/20 transition flex items-center gap-2"
        >
          {isPending ? 'Saving Schedule...' : isEdit ? 'Update Interview Schedule' : 'Schedule Interview'}
        </button>
      </div>
    </form>
  );
}
