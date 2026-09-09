'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { getCurrentUser, hasPermission } from '@/lib/rbac';
import { serializeDecimals } from '@/lib/serialize';

export interface CandidateDiscussionNoteInput {
  readyToRelocate?: string;
  totalExperience?: string;
  relevantExperience?: string;
  currentDesignation?: string;
  qualification?: string;
  currentCompany?: string;
  currentSalary?: string;
  expectedSalary?: string;
  noticePeriod?: string;
  reasonOfLeaving?: string;
  offerInHand?: string;
  offerDetails?: string;
  recruiterNotes?: string;
}

export interface CandidateDiscussionActionResult {
  success: boolean;
  note?: any;
  error?: string;
}

export async function getCandidateDiscussionNoteAction(candidateId: string): Promise<CandidateDiscussionActionResult> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { success: false, error: 'Unauthorized session' };
    }

    const note = await (prisma as any).candidateDiscussionNote.findUnique({
      where: { candidateId }
    });

    return {
      success: true,
      note: note ? serializeDecimals(note) : null
    };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to fetch candidate discussion notes' };
  }
}

export async function upsertCandidateDiscussionNoteAction(
  candidateId: string,
  inputData: CandidateDiscussionNoteInput
): Promise<CandidateDiscussionActionResult> {
  try {
    const user = await getCurrentUser();
    if (!user || !hasPermission(user, 'candidate.edit')) {
      return { success: false, error: 'Access denied: insufficient permissions to update discussion notes' };
    }

    const agencyId = user.agencyId;
    if (!agencyId) {
      return { success: false, error: 'Agency context missing' };
    }

    // Verify candidate exists
    const candidate = await prisma.candidateRecord.findFirst({
      where: { id: candidateId, agencyId, deletedAt: null }
    });

    if (!candidate) {
      return { success: false, error: 'Candidate record not found or access denied.' };
    }

    const payload = {
      readyToRelocate: inputData.readyToRelocate?.trim() || 'Yes',
      totalExperience: inputData.totalExperience?.trim() || null,
      relevantExperience: inputData.relevantExperience?.trim() || null,
      currentDesignation: inputData.currentDesignation?.trim() || null,
      qualification: inputData.qualification?.trim() || null,
      currentCompany: inputData.currentCompany?.trim() || null,
      currentSalary: inputData.currentSalary?.trim() || null,
      expectedSalary: inputData.expectedSalary?.trim() || null,
      noticePeriod: inputData.noticePeriod?.trim() || null,
      reasonOfLeaving: inputData.reasonOfLeaving?.trim() || null,
      offerInHand: inputData.offerInHand?.trim() || 'No',
      offerDetails: inputData.offerDetails?.trim() || null,
      recruiterNotes: inputData.recruiterNotes?.trim() || null,
    };

    const savedNote = await (prisma as any).candidateDiscussionNote.upsert({
      where: { candidateId },
      create: {
        agencyId,
        candidateId,
        ...payload
      },
      update: {
        ...payload,
        updatedAt: new Date()
      }
    });

    revalidatePath(`/candidates/${candidateId}`);
    return {
      success: true,
      note: serializeDecimals(savedNote)
    };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to save candidate discussion notes' };
  }
}
