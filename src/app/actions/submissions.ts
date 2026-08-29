'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { PipelineStage, SlaStatus } from '@prisma/client';
import { calculateSlaStatus } from '@/lib/sla';

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

export type SubmissionActionResult = {
  success: boolean;
  submissionId?: string;
  error?: string;
  errors?: Record<string, string>;
};

export async function createSubmissionAction(prevState: any, formData: FormData): Promise<SubmissionActionResult> {
  try {
    const agencyId = await getDemoAgencyId();

    const candidateId = (formData.get('candidateId') as string || '').trim();
    const jobId = (formData.get('jobId') as string || '').trim();

    const errors: Record<string, string> = {};

    if (!candidateId) errors.candidateId = 'Candidate selection is required';
    if (!jobId) errors.jobId = 'Job mandate selection is required';

    if (Object.keys(errors).length > 0) {
      return { success: false, errors };
    }

    // Check duplicate submission for same candidate and mandate
    const existing = await prisma.candidateSubmission.findFirst({
      where: { agencyId, jobId, candidateId }
    });

    if (existing) {
      return {
        success: false,
        error: 'This candidate has already been submitted to this job mandate.'
      };
    }

    const newSubmission = await prisma.candidateSubmission.create({
      data: {
        agencyId,
        jobId,
        candidateId,
        stage: PipelineStage.SCREENED,
        slaStatus: SlaStatus.HEALTHY
      }
    });

    // Create initial SLA log activity entry
    await prisma.pipelineSlaLog.create({
      data: {
        agencyId,
        submissionId: newSubmission.id,
        newStage: PipelineStage.SCREENED,
        timeInStageHours: 0,
        slaStatusAtTransition: SlaStatus.HEALTHY
      }
    }).catch((err) => console.error('Error writing SLA log entry:', err));

    revalidatePath('/submissions');
    revalidatePath(`/candidates/${candidateId}`);
    revalidatePath(`/jobs/${jobId}`);
    return { success: true, submissionId: newSubmission.id };
  } catch (err: any) {
    console.error('Error creating submission:', err);
    return { success: false, error: err.message || 'Failed to submit candidate to mandate' };
  }
}

export async function updateSubmissionStageAction(
  submissionId: string,
  newStage: PipelineStage
): Promise<SubmissionActionResult> {
  try {
    const agencyId = await getDemoAgencyId();

    const existing = await prisma.candidateSubmission.findFirst({
      where: { id: submissionId, agencyId }
    });

    if (!existing) {
      return { success: false, error: 'Candidate submission record not found or access denied.' };
    }

    const hoursElapsed = Math.max(0, (new Date().getTime() - new Date(existing.updatedAt).getTime()) / (1000 * 60 * 60));
    const calculatedSla = calculateSlaStatus(existing.createdAt, new Date());

    await prisma.candidateSubmission.update({
      where: { id: submissionId },
      data: {
        stage: newStage,
        slaStatus: calculatedSla,
        updatedAt: new Date()
      }
    });

    // Log stage change activity in PipelineSlaLog
    await prisma.pipelineSlaLog.create({
      data: {
        agencyId,
        submissionId,
        previousStage: existing.stage,
        newStage: newStage,
        timeInStageHours: Math.round(hoursElapsed),
        slaStatusAtTransition: calculatedSla
      }
    }).catch((err) => console.error('Error writing SLA log entry:', err));

    revalidatePath('/submissions');
    revalidatePath(`/submissions/${submissionId}`);
    return { success: true, submissionId };
  } catch (err: any) {
    console.error('Error updating submission stage:', err);
    return { success: false, error: err.message || 'Failed to update pipeline stage' };
  }
}
