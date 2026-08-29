'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { PipelineStage, SlaStatus, Prisma } from '@prisma/client';
import { autoGenerateInvoiceForOffer } from '@/app/actions/finance';
import { checkCandidateComplianceGateAction } from '@/app/actions/compliance';
import { logEvent } from '@/lib/logger';

async function getDemoAgencyId(): Promise<string> {
  const agency = await prisma.agency.findFirst({
    where: { subdomain: 'demo' },
    select: { id: true }
  });
  if (!agency) {
    logEvent.authFailure('Demo agency contextual record not found');
    throw new Error('Default agency contextual record not found');
  }
  return agency.id;
}

export type OfferActionResult = {
  success: boolean;
  offerId?: string;
  error?: string;
  errors?: Record<string, string>;
};

export async function createOfferAction(prevState: any, formData: FormData): Promise<OfferActionResult> {
  try {
    const agencyId = await getDemoAgencyId();

    const submissionId = (formData.get('submissionId') as string || '').trim();
    const offeredFixedCtcRaw = (formData.get('offeredFixedCtc') as string || '').trim();
    const offeredVariableCtcRaw = (formData.get('offeredVariableCtc') as string || '0').trim();
    const joiningDateRaw = (formData.get('joiningDate') as string || '').trim();
    const expiryDateRaw = (formData.get('expiryDate') as string || '').trim();
    const noticeBuyoutRaw = (formData.get('noticeBuyout') as string || '0').trim();
    const status = (formData.get('status') as string || 'DRAFT').trim();
    const notes = (formData.get('notes') as string || '').trim();

    const errors: Record<string, string> = {};

    if (!submissionId) errors.submissionId = 'Candidate submission is required';

    const offeredFixedCtc = parseFloat(offeredFixedCtcRaw);
    if (isNaN(offeredFixedCtc) || offeredFixedCtc <= 0) {
      errors.offeredFixedCtc = 'Offered CTC must be a positive number (in LPA or Annual currency)';
    }

    const offeredVariableCtc = parseFloat(offeredVariableCtcRaw) || 0;
    if (offeredVariableCtc < 0) {
      errors.offeredVariableCtc = 'Variable CTC cannot be negative';
    }

    const noticeBuyout = parseFloat(noticeBuyoutRaw) || 0;
    if (noticeBuyout < 0) {
      errors.noticeBuyout = 'Notice buyout cannot be negative';
    }

    let joiningDate: Date | null = null;
    if (!joiningDateRaw) {
      errors.joiningDate = 'Joining date is required';
    } else {
      joiningDate = new Date(joiningDateRaw);
      if (isNaN(joiningDate.getTime())) {
        errors.joiningDate = 'Invalid joining date format';
      } else if (joiningDate.getTime() <= Date.now() - 24 * 60 * 60 * 1000) {
        errors.joiningDate = 'Joining date must be a future date';
      }
    }

    let expiryDate: Date | null = null;
    if (expiryDateRaw) {
      expiryDate = new Date(expiryDateRaw);
      if (isNaN(expiryDate.getTime())) {
        errors.expiryDate = 'Invalid offer expiry date format';
      } else if (joiningDate && expiryDate.getTime() > joiningDate.getTime()) {
        errors.expiryDate = 'Offer expiry date cannot be after the joining date';
      }
    }

    if (Object.keys(errors).length > 0) {
      return { success: false, errors };
    }

    // Verify submission exists & belongs to agency tenant
    const submission = await prisma.candidateSubmission.findFirst({
      where: { id: submissionId, agencyId },
      select: { id: true, stage: true, candidateId: true, jobId: true }
    });

    if (!submission) {
      return { success: false, error: 'Candidate submission record not found or access denied.' };
    }

    const totalOfferedCtc = new Prisma.Decimal((offeredFixedCtc + offeredVariableCtc).toFixed(2));
    const fixedDecimal = new Prisma.Decimal(offeredFixedCtc.toFixed(2));
    const variableDecimal = new Prisma.Decimal(offeredVariableCtc.toFixed(2));
    const buyoutDecimal = new Prisma.Decimal(noticeBuyout.toFixed(2));

    // Check if an offer already exists for this submission
    const existingOffer = await prisma.jobOfferAudit.findFirst({
      where: { submissionId, agencyId }
    });

    let offer;
    if (existingOffer) {
      offer = await prisma.jobOfferAudit.update({
        where: { id: existingOffer.id },
        data: {
          offeredFixedCtc: fixedDecimal,
          offeredVariableCtc: variableDecimal,
          totalOfferedCtc,
          joiningDate,
          expiryDate,
          noticeBuyout: buyoutDecimal,
          status,
          notes: notes || null
        }
      });
    } else {
      offer = await prisma.jobOfferAudit.create({
        data: {
          agencyId,
          submissionId,
          offeredFixedCtc: fixedDecimal,
          offeredVariableCtc: variableDecimal,
          totalOfferedCtc,
          joiningDate,
          expiryDate,
          noticeBuyout: buyoutDecimal,
          status,
          notes: notes || null
        }
      });
    }

    // Pipeline integration: Ensure candidate submission stage is at least OFFER_EXTENDED
    if (submission.stage !== PipelineStage.OFFER_EXTENDED && submission.stage !== PipelineStage.JOINED) {
      await prisma.candidateSubmission.update({
        where: { id: submissionId },
        data: {
          stage: PipelineStage.OFFER_EXTENDED,
          updatedAt: new Date()
        }
      });

      await prisma.pipelineSlaLog.create({
        data: {
          agencyId,
          submissionId,
          previousStage: submission.stage,
          newStage: PipelineStage.OFFER_EXTENDED,
          timeInStageHours: 0,
          slaStatusAtTransition: SlaStatus.HEALTHY
        }
      }).catch((e) => console.error('Error writing SLA log on offer creation:', e));
    }

    revalidatePath('/offers');
    revalidatePath('/submissions');
    revalidatePath(`/submissions/${submissionId}`);
    revalidatePath('/cockpit');

    return { success: true, offerId: offer.id };
  } catch (err: any) {
    console.error('Error creating job offer:', err);
    return { success: false, error: err.message || 'Failed to create job offer' };
  }
}

export async function updateOfferAction(
  offerId: string,
  formData: FormData
): Promise<OfferActionResult> {
  try {
    const agencyId = await getDemoAgencyId();

    const offeredFixedCtcRaw = (formData.get('offeredFixedCtc') as string || '').trim();
    const offeredVariableCtcRaw = (formData.get('offeredVariableCtc') as string || '0').trim();
    const joiningDateRaw = (formData.get('joiningDate') as string || '').trim();
    const expiryDateRaw = (formData.get('expiryDate') as string || '').trim();
    const noticeBuyoutRaw = (formData.get('noticeBuyout') as string || '0').trim();
    const status = (formData.get('status') as string || 'DRAFT').trim();
    const notes = (formData.get('notes') as string || '').trim();

    const errors: Record<string, string> = {};

    const offeredFixedCtc = parseFloat(offeredFixedCtcRaw);
    if (isNaN(offeredFixedCtc) || offeredFixedCtc <= 0) {
      errors.offeredFixedCtc = 'Offered CTC must be a positive number';
    }

    const offeredVariableCtc = parseFloat(offeredVariableCtcRaw) || 0;
    const noticeBuyout = parseFloat(noticeBuyoutRaw) || 0;

    let joiningDate: Date | null = null;
    if (!joiningDateRaw) {
      errors.joiningDate = 'Joining date is required';
    } else {
      joiningDate = new Date(joiningDateRaw);
      if (isNaN(joiningDate.getTime())) {
        errors.joiningDate = 'Invalid joining date format';
      }
    }

    let expiryDate: Date | null = null;
    if (expiryDateRaw) {
      expiryDate = new Date(expiryDateRaw);
      if (isNaN(expiryDate.getTime())) {
        errors.expiryDate = 'Invalid offer expiry date format';
      }
    }

    if (Object.keys(errors).length > 0) {
      return { success: false, errors };
    }

    const existing = await prisma.jobOfferAudit.findFirst({
      where: { id: offerId, agencyId }
    });

    if (!existing) {
      return { success: false, error: 'Offer record not found or access denied.' };
    }

    const totalOfferedCtc = new Prisma.Decimal((offeredFixedCtc + offeredVariableCtc).toFixed(2));
    const fixedDecimal = new Prisma.Decimal(offeredFixedCtc.toFixed(2));
    const variableDecimal = new Prisma.Decimal(offeredVariableCtc.toFixed(2));
    const buyoutDecimal = new Prisma.Decimal(noticeBuyout.toFixed(2));

    await prisma.jobOfferAudit.update({
      where: { id: offerId },
      data: {
        offeredFixedCtc: fixedDecimal,
        offeredVariableCtc: variableDecimal,
        totalOfferedCtc,
        joiningDate,
        expiryDate,
        noticeBuyout: buyoutDecimal,
        status,
        notes: notes || null
      }
    });

    // If updated status is JOINED, update candidate submission stage to JOINED and auto-generate placement invoice
    if (status === 'JOINED') {
      const submission = await prisma.candidateSubmission.findUnique({
        where: { id: existing.submissionId }
      });

      if (submission && submission.stage !== PipelineStage.JOINED) {
        await prisma.candidateSubmission.update({
          where: { id: existing.submissionId },
          data: {
            stage: PipelineStage.JOINED,
            updatedAt: new Date()
          }
        });

        await prisma.pipelineSlaLog.create({
          data: {
            agencyId,
            submissionId: existing.submissionId,
            previousStage: submission.stage,
            newStage: PipelineStage.JOINED,
            timeInStageHours: 0,
            slaStatusAtTransition: SlaStatus.HEALTHY
          }
        }).catch((e) => console.error('Error writing SLA log on offer join:', e));
      }

      await autoGenerateInvoiceForOffer(offerId).catch((e) =>
        console.error('Error auto generating placement invoice:', e)
      );
    }

    revalidatePath('/offers');
    revalidatePath(`/offers/${offerId}`);
    revalidatePath('/submissions');
    revalidatePath('/cockpit');

    return { success: true, offerId };
  } catch (err: any) {
    console.error('Error updating offer:', err);
    return { success: false, error: err.message || 'Failed to update offer' };
  }
}

export async function updateOfferStatusAction(
  offerId: string,
  newStatus: string
): Promise<OfferActionResult> {
  try {
    const agencyId = await getDemoAgencyId();

    const existing = await prisma.jobOfferAudit.findFirst({
      where: { id: offerId, agencyId },
      include: { submission: true }
    });

    if (!existing) {
      return { success: false, error: 'Offer record not found or access denied.' };
    }

    // Enforcement: Check Candidate Compliance Gate before transitioning to JOINED
    if (newStatus === 'JOINED' && existing.submission) {
      const complianceGate = await checkCandidateComplianceGateAction(existing.submission.candidateId);
      if (!complianceGate.isCompliant && complianceGate.missingDocs && complianceGate.missingDocs.length > 0) {
        return {
          success: false,
          error: `Compliance Joining Gate Block: Candidate compliance incomplete. Missing mandatory docs: ${complianceGate.missingDocs.join(', ')}`
        };
      }
    }

    await prisma.jobOfferAudit.update({
      where: { id: offerId },
      data: { status: newStatus }
    });

    const submissionId = existing.submissionId;
    const currentStage = existing.submission.stage;

    // Automatic Pipeline Integration on Offer Status Change
    if (newStatus === 'JOINED') {
      if (currentStage !== PipelineStage.JOINED) {
        await prisma.candidateSubmission.update({
          where: { id: submissionId },
          data: {
            stage: PipelineStage.JOINED,
            updatedAt: new Date()
          }
        });

        await prisma.pipelineSlaLog.create({
          data: {
            agencyId,
            submissionId,
            previousStage: currentStage,
            newStage: PipelineStage.JOINED,
            timeInStageHours: 0,
            slaStatusAtTransition: SlaStatus.HEALTHY
          }
        }).catch((e) => console.error('Error writing SLA log on offer joined:', e));
      }
    } else if (newStatus === 'DECLINED' || newStatus === 'WITHDRAWN') {
      if (currentStage !== PipelineStage.REJECTED) {
        await prisma.candidateSubmission.update({
          where: { id: submissionId },
          data: {
            stage: PipelineStage.REJECTED,
            updatedAt: new Date()
          }
        });

        await prisma.pipelineSlaLog.create({
          data: {
            agencyId,
            submissionId,
            previousStage: currentStage,
            newStage: PipelineStage.REJECTED,
            timeInStageHours: 0,
            slaStatusAtTransition: SlaStatus.HEALTHY
          }
        }).catch((e) => console.error('Error writing SLA log on offer decline/withdrawal:', e));
      }
    }

    revalidatePath('/offers');
    revalidatePath(`/offers/${offerId}`);
    revalidatePath('/submissions');
    revalidatePath(`/submissions/${submissionId}`);
    revalidatePath('/cockpit');

    return { success: true, offerId };
  } catch (err: any) {
    console.error('Error updating offer status:', err);
    return { success: false, error: err.message || 'Failed to update offer status' };
  }
}
