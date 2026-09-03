'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { InterviewType, InterviewMode, PipelineStage, SlaStatus } from '@prisma/client';
import { requirePermission } from '@/lib/rbac';

async function getDemoAgencyId(): Promise<string> {
  const agency = await prisma.agency.findFirst({
    where: { subdomain: 'demo' },
    select: { id: true }
  });
  if (!agency) {
    throw new Error('Default agency contextual record not found');
  }
  return agency.id;
}

export type InterviewActionResult = {
  success: boolean;
  interviewId?: string;
  error?: string;
  errors?: Record<string, string>;
};

export async function createInterviewAction(prevState: any, formData: FormData, userOverride?: any): Promise<InterviewActionResult> {
  try {
    await requirePermission('interview.schedule', userOverride);
    const agencyId = await getDemoAgencyId();

    const submissionId = (formData.get('submissionId') as string || '').trim();
    const scheduledAtRaw = (formData.get('scheduledAt') as string || '').trim();
    const durationMinutesRaw = (formData.get('durationMinutes') as string || '45').trim();
    const roundTypeRaw = (formData.get('roundType') as string || '').trim();
    const modeRaw = (formData.get('mode') as string || '').trim();
    const meetingLink = (formData.get('meetingLink') as string || '').trim();
    const notes = (formData.get('notes') as string || '').trim();

    const errors: Record<string, string> = {};

    if (!submissionId) errors.submissionId = 'Candidate submission is required';
    if (!scheduledAtRaw) errors.scheduledAt = 'Interview date & time is required';
    if (!roundTypeRaw) errors.roundType = 'Interview type / round is required';
    if (!modeRaw) errors.mode = 'Interview mode is required';

    const durationMinutes = parseInt(durationMinutesRaw, 10);
    if (isNaN(durationMinutes) || durationMinutes <= 0) {
      errors.durationMinutes = 'Duration must be greater than 0 minutes';
    }

    let scheduledAt: Date | null = null;
    if (scheduledAtRaw) {
      scheduledAt = new Date(scheduledAtRaw);
      if (isNaN(scheduledAt.getTime())) {
        errors.scheduledAt = 'Invalid interview date & time format';
      } else if (scheduledAt.getTime() < Date.now() - 5 * 60 * 1000) {
        errors.scheduledAt = 'Interview schedule date cannot be in the past';
      }
    }

    if (meetingLink && modeRaw !== 'IN_PERSON' && modeRaw !== 'PHONE') {
      try {
        new URL(meetingLink);
      } catch {
        errors.meetingLink = 'Invalid meeting URL format';
      }
    }

    if (Object.keys(errors).length > 0) {
      return { success: false, errors };
    }

    const submission = await prisma.candidateSubmission.findFirst({
      where: { id: submissionId, agencyId },
      select: { id: true, candidateId: true, jobId: true, stage: true }
    });

    if (!submission) {
      return { success: false, error: 'Candidate submission record not found or access denied.' };
    }

    const roundType = roundTypeRaw as InterviewType;
    const mode = modeRaw as InterviewMode;

    const newInterview = await prisma.interviewSchedule.create({
      data: {
        agencyId,
        submissionId,
        confirmedStartTime: scheduledAt!,
        durationMinutes,
        roundType,
        mode,
        meetingLink: meetingLink || null,
        notes: notes || null,
        status: 'SCHEDULED'
      }
    });

    if (submission.stage !== PipelineStage.INTERVIEW_SCHEDULED) {
      await prisma.candidateSubmission.update({
        where: { id: submissionId },
        data: {
          stage: PipelineStage.INTERVIEW_SCHEDULED,
          updatedAt: new Date()
        }
      });

      await prisma.pipelineSlaLog.create({
        data: {
          agencyId,
          submissionId,
          previousStage: submission.stage,
          newStage: PipelineStage.INTERVIEW_SCHEDULED,
          timeInStageHours: 0,
          slaStatusAtTransition: SlaStatus.HEALTHY
        }
      }).catch((e) => console.error('Error writing SLA log on interview creation:', e));
    }

    revalidatePath('/interviews');
    revalidatePath('/submissions');
    revalidatePath(`/submissions/${submissionId}`);
    revalidatePath('/cockpit');

    return { success: true, interviewId: newInterview.id };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to schedule interview' };
  }
}

export async function updateInterviewAction(
  interviewId: string,
  formData: FormData,
  userOverride?: any
): Promise<InterviewActionResult> {
  try {
    await requirePermission('interview.edit', userOverride);
    const agencyId = await getDemoAgencyId();

    const scheduledAtRaw = (formData.get('scheduledAt') as string || '').trim();
    const durationMinutesRaw = (formData.get('durationMinutes') as string || '45').trim();
    const roundTypeRaw = (formData.get('roundType') as string || '').trim();
    const modeRaw = (formData.get('mode') as string || '').trim();
    const meetingLink = (formData.get('meetingLink') as string || '').trim();
    const notes = (formData.get('notes') as string || '').trim();

    const errors: Record<string, string> = {};

    if (!scheduledAtRaw) errors.scheduledAt = 'Interview date & time is required';
    if (!roundTypeRaw) errors.roundType = 'Interview type / round is required';
    if (!modeRaw) errors.mode = 'Interview mode is required';

    const durationMinutes = parseInt(durationMinutesRaw, 10);
    if (isNaN(durationMinutes) || durationMinutes <= 0) {
      errors.durationMinutes = 'Duration must be greater than 0 minutes';
    }

    let scheduledAt: Date | null = null;
    if (scheduledAtRaw) {
      scheduledAt = new Date(scheduledAtRaw);
      if (isNaN(scheduledAt.getTime())) {
        errors.scheduledAt = 'Invalid date & time format';
      }
    }

    if (meetingLink && modeRaw !== 'IN_PERSON' && modeRaw !== 'PHONE') {
      try {
        new URL(meetingLink);
      } catch {
        errors.meetingLink = 'Invalid meeting URL format';
      }
    }

    if (Object.keys(errors).length > 0) {
      return { success: false, errors };
    }

    const existing = await prisma.interviewSchedule.findFirst({
      where: { id: interviewId, agencyId }
    });

    if (!existing) {
      return { success: false, error: 'Interview record not found or access denied.' };
    }

    await prisma.interviewSchedule.update({
      where: { id: interviewId },
      data: {
        confirmedStartTime: scheduledAt!,
        durationMinutes,
        roundType: roundTypeRaw as InterviewType,
        mode: modeRaw as InterviewMode,
        meetingLink: meetingLink || null,
        notes: notes || null
      }
    });

    revalidatePath('/interviews');
    revalidatePath(`/interviews/${interviewId}`);
    revalidatePath('/cockpit');

    return { success: true, interviewId };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to update interview' };
  }
}

export async function rescheduleInterviewAction(
  interviewId: string,
  newScheduledAtIso: string,
  rescheduleReason?: string,
  userOverride?: any
): Promise<InterviewActionResult> {
  try {
    await requirePermission('interview.edit', userOverride);
    const agencyId = await getDemoAgencyId();

    const existing = await prisma.interviewSchedule.findFirst({
      where: { id: interviewId, agencyId }
    });

    if (!existing) {
      return { success: false, error: 'Interview record not found or access denied.' };
    }

    const newDate = new Date(newScheduledAtIso);
    if (isNaN(newDate.getTime())) {
      return { success: false, error: 'Invalid reschedule date/time provided' };
    }

    const updatedNotes = rescheduleReason
      ? `${existing.notes || ''}\n[Rescheduled on ${new Date().toLocaleDateString()}]: ${rescheduleReason}`.trim()
      : existing.notes;

    await prisma.interviewSchedule.update({
      where: { id: interviewId },
      data: {
        confirmedStartTime: newDate,
        status: 'RESCHEDULED',
        notes: updatedNotes
      }
    });

    revalidatePath('/interviews');
    revalidatePath(`/interviews/${interviewId}`);
    revalidatePath('/cockpit');

    return { success: true, interviewId };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to reschedule interview' };
  }
}

export async function updateInterviewStatusAction(
  interviewId: string,
  newStatus: string,
  outcome?: 'PASS' | 'FAIL' | 'HOLD',
  userOverride?: any
): Promise<InterviewActionResult> {
  try {
    await requirePermission('interview.edit', userOverride);
    const agencyId = await getDemoAgencyId();

    const existing = await prisma.interviewSchedule.findFirst({
      where: { id: interviewId, agencyId },
      include: { submission: true }
    });

    if (!existing) {
      return { success: false, error: 'Interview record not found or access denied.' };
    }

    await prisma.interviewSchedule.update({
      where: { id: interviewId },
      data: {
        status: newStatus,
        outcome: outcome || existing.outcome
      }
    });

    if (newStatus === 'COMPLETED' && outcome) {
      const submissionId = existing.submissionId;
      const currentStage = existing.submission.stage;

      let targetStage: PipelineStage | null = null;
      if (outcome === 'PASS') {
        targetStage = PipelineStage.OFFER_EXTENDED;
      } else if (outcome === 'FAIL') {
        targetStage = PipelineStage.REJECTED;
      }

      if (targetStage && targetStage !== currentStage) {
        await prisma.candidateSubmission.update({
          where: { id: submissionId },
          data: {
            stage: targetStage,
            updatedAt: new Date()
          }
        });

        await prisma.pipelineSlaLog.create({
          data: {
            agencyId,
            submissionId,
            previousStage: currentStage,
            newStage: targetStage,
            timeInStageHours: 0,
            slaStatusAtTransition: SlaStatus.HEALTHY
          }
        }).catch((e) => console.error('Error writing SLA log on interview completion:', e));
      }
    }

    revalidatePath('/interviews');
    revalidatePath(`/interviews/${interviewId}`);
    revalidatePath('/submissions');
    revalidatePath(`/submissions/${existing.submissionId}`);
    revalidatePath('/cockpit');

    return { success: true, interviewId };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to update interview status' };
  }
}
