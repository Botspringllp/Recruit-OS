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
  const scheduledDate = interview.confirmedStartTime ? new Date(interview.confirmedStartTime) : new Date();
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
      {/* Top Header Bar */}
      <div className="flex items-center gap-3 border-b border-slate-200 pb-5">
        <Link
          href={`/interviews/${params.id}`}
          className="p-2 bg-white border border-slate-300 rounded-xl text-slate-700 hover:text-indigo-600 hover:bg-slate-100 transition shadow-2xs"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Calendar className="h-6 w-6 text-indigo-600" />
            Edit / Reschedule Interview Round
          </h1>
          <p className="text-xs font-semibold text-slate-600 mt-1">
            Update interview schedule timing, meeting link, mode, or candidate prep notes.
          </p>
        </div>
      </div>

      {/* Main Form Container */}
      <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm shadow-slate-200/50">
        <InterviewForm initialData={initialData} isEdit={true} />
      </div>
    </div>
  );
}
