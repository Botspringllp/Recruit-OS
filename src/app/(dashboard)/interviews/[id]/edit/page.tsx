import React from 'react';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { getCurrentUser, hasPermission } from '@/lib/rbac';
import { InterviewForm } from '@/components/interviews/InterviewForm';
import { Calendar, ArrowLeft } from 'lucide-react';

export const revalidate = 0;

interface EditInterviewPageProps {
  params: {
    id: string;
  };
}

export default async function EditInterviewPage({ params }: EditInterviewPageProps) {
  const dbUser = await getCurrentUser();
  if (!dbUser || !hasPermission(dbUser, 'interview.edit')) {
    redirect('/403');
  }

  const agencyId = dbUser.agencyId;

  const interview = await prisma.interviewSchedule.findFirst({
    where: { id: params.id, agencyId }
  }).catch(() => null);

  if (!interview) {
    notFound();
  }

  // Format scheduledAt to datetime-local ISO format: YYYY-MM-DDTHH:mm
  const scheduledDate = new Date(interview.confirmedStartTime);
  const scheduledAtFormatted = scheduledDate.toISOString().slice(0, 16);

  const initialData = {
    id: interview.id,
    submissionId: interview.submissionId,
    scheduledAt: scheduledAtFormatted,
    durationMinutes: interview.durationMinutes,
    roundType: interview.roundType || 'TECHNICAL_ASSESSMENT',
    mode: interview.mode || 'GOOGLE_MEET',
    meetingLink: interview.meetingLink || '',
    notes: interview.notes || ''
  };

  return (
    <div className="space-y-6 pb-12">
      <div className="flex items-center gap-3 border-b border-slate-800/80 pb-5">
        <Link
          href={`/interviews/${params.id}`}
          className="p-2 bg-slate-900 border border-slate-800 rounded-xl text-slate-400 hover:text-white transition"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <Calendar className="h-6 w-6 text-brand-400" />
            Edit / Reschedule Interview Round
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Update interview schedule timing, meeting link, mode, or candidate prep notes.
          </p>
        </div>
      </div>

      <div className="glass-panel p-6 sm:p-8 rounded-2xl border border-slate-800/80">
        <InterviewForm initialData={initialData} isEdit={true} />
      </div>
    </div>
  );
}
