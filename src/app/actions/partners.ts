'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import crypto from 'crypto';
import { requirePermission } from '@/lib/rbac';

async function getDemoAgencyId(): Promise<string> {
  const agency = await prisma.agency.findFirst({
    where: { subdomain: 'demo' },
    select: { id: true }
  });
  return agency?.id || 'adaa404d-0ce3-4b72-9981-882a8f31a2af';
}

export async function createPartnerAction(formData: FormData, userOverride?: any) {
  try {
    await requirePermission('partner.manage', userOverride);
    const agencyId = await getDemoAgencyId();
    const name = formData.get('name') as string;
    const contactPerson = formData.get('contactPerson') as string || null;
    const email = formData.get('email') as string || null;
    const phone = formData.get('phone') as string || null;
    const defaultSplitPercentage = parseFloat(formData.get('defaultSplitPercentage') as string || '50');
    const notes = formData.get('notes') as string || null;

    if (!name || name.trim() === '') {
      return { success: false, error: 'Partner agency name is required' };
    }

    const partner = await (prisma as any).partnerAgency.create({
      data: {
        agencyId,
        name: name.trim(),
        contactPerson: contactPerson ? contactPerson.trim() : null,
        email: email ? email.trim() : null,
        phone: phone ? phone.trim() : null,
        defaultSplitPercentage: isNaN(defaultSplitPercentage) ? 50.0 : defaultSplitPercentage,
        isActive: true,
        notes: notes ? notes.trim() : null
      }
    });

    revalidatePath('/partners');
    return { success: true, partner };
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to create partner agency' };
  }
}

export async function updatePartnerAction(id: string, formData: FormData, userOverride?: any) {
  try {
    await requirePermission('partner.manage', userOverride);
    const agencyId = await getDemoAgencyId();
    const name = formData.get('name') as string;
    const contactPerson = formData.get('contactPerson') as string || null;
    const email = formData.get('email') as string || null;
    const phone = formData.get('phone') as string || null;
    const defaultSplitPercentage = parseFloat(formData.get('defaultSplitPercentage') as string || '50');
    const isActive = formData.get('isActive') === 'true' || formData.get('isActive') === 'on';
    const notes = formData.get('notes') as string || null;

    if (!name || name.trim() === '') {
      return { success: false, error: 'Partner agency name is required' };
    }

    const partner = await (prisma as any).partnerAgency.updateMany({
      where: { id, agencyId },
      data: {
        name: name.trim(),
        contactPerson: contactPerson ? contactPerson.trim() : null,
        email: email ? email.trim() : null,
        phone: phone ? phone.trim() : null,
        defaultSplitPercentage: isNaN(defaultSplitPercentage) ? 50.0 : defaultSplitPercentage,
        isActive,
        notes: notes ? notes.trim() : null,
        updatedAt: new Date()
      }
    });

    revalidatePath('/partners');
    revalidatePath(`/partners/${id}`);
    return { success: true, count: partner.count };
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to update partner agency' };
  }
}

export async function shareMandateAction(formData: FormData, userOverride?: any) {
  try {
    await requirePermission('partner.manage', userOverride);
    const agencyId = await getDemoAgencyId();
    const jobId = formData.get('jobId') as string;
    const partnerAgencyId = formData.get('partnerAgencyId') as string || null;
    let partnerAgencyName = formData.get('partnerAgencyName') as string || null;
    const splitPercentage = parseFloat(formData.get('splitPercentage') as string || '50');
    const notes = formData.get('notes') as string || null;
    const expiresDays = parseInt(formData.get('expiresDays') as string || '30', 10);

    if (!jobId) {
      return { success: false, error: 'Job mandate selection is required' };
    }

    if (partnerAgencyId) {
      const partner = await (prisma as any).partnerAgency.findFirst({
        where: { id: partnerAgencyId, agencyId }
      });
      if (partner) {
        partnerAgencyName = partner.name;
      }
    }

    if (!partnerAgencyName) {
      return { success: false, error: 'Partner agency selection or name is required' };
    }

    const token = 'pkn_' + crypto.randomBytes(16).toString('hex');
    const expiresAt = new Date(Date.now() + expiresDays * 24 * 60 * 60 * 1000);

    const share = await (prisma as any).partnerMandateShare.create({
      data: {
        agencyId,
        jobId,
        partnerAgencyId,
        partnerAgencyName,
        partnerAccessToken: token,
        splitPercentage: isNaN(splitPercentage) ? 50.0 : splitPercentage,
        notes,
        status: 'ACTIVE',
        expiresAt
      }
    });

    revalidatePath('/partners');
    revalidatePath(`/jobs/${jobId}`);
    return { success: true, share };
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to share mandate' };
  }
}

export async function createPartnerSubmissionAction(formData: FormData, userOverride?: any) {
  try {
    await requirePermission('partner.view', userOverride);
    const agencyId = await getDemoAgencyId();
    const shareId = formData.get('shareId') as string;
    const fullName = formData.get('fullName') as string;
    const email = formData.get('email') as string;
    const phone = formData.get('phone') as string;
    const experienceYears = parseFloat(formData.get('experienceYears') as string || '0');
    const currentCtc = parseFloat(formData.get('currentCtc') as string || '0');
    const expectedCtc = parseFloat(formData.get('expectedCtc') as string || '0');
    const noticePeriodDays = parseInt(formData.get('noticePeriodDays') as string || '30', 10);

    if (!shareId || !fullName || !email) {
      return { success: false, error: 'Mandate share ID, candidate name, and email are required' };
    }

    const share = await (prisma as any).partnerMandateShare.findFirst({
      where: { id: shareId, agencyId },
      include: { job: true }
    });

    if (!share) {
      return { success: false, error: 'Shared mandate not found or inactive' };
    }

    let candidate = await (prisma as any).candidateRecord.findFirst({
      where: { agencyId, email: email.trim().toLowerCase() }
    });

    if (!candidate) {
      const nameParts = fullName.trim().split(' ');
      const firstName = nameParts[0] || 'Partner';
      const lastName = nameParts.slice(1).join(' ') || 'Candidate';

      candidate = await (prisma as any).candidateRecord.create({
        data: {
          agencyId,
          firstName,
          lastName,
          email: email.trim().toLowerCase(),
          phone: phone ? phone.trim() : '+910000000000',
          totalExperienceYears: isNaN(experienceYears) ? 0 : experienceYears,
          currentCtcLpa: isNaN(currentCtc) ? 0 : currentCtc,
          expectedCtcLpa: isNaN(expectedCtc) ? 0 : expectedCtc,
          noticePeriodDays: isNaN(noticePeriodDays) ? 30 : noticePeriodDays,
          source: 'AGENCY' as any
        }
      });
    }

    const existingSubmission = await (prisma as any).candidateSubmission.findFirst({
      where: { agencyId, jobId: share.jobId, candidateId: candidate.id }
    });

    if (existingSubmission) {
      return { success: false, error: 'Candidate has already been submitted for this mandate' };
    }

    const submission = await (prisma as any).candidateSubmission.create({
      data: {
        agencyId,
        jobId: share.jobId,
        candidateId: candidate.id,
        stage: 'SCREENED'
      }
    });

    const partnerSubmission = await (prisma as any).partnerCandidateSubmission.create({
      data: {
        agencyId,
        shareId: share.id,
        candidateId: candidate.id
      }
    });

    revalidatePath('/partners');
    revalidatePath(`/jobs/${share.jobId}`);
    return { success: true, submission, partnerSubmission };
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to submit candidate via partner' };
  }
}

export async function updatePartnerPayoutStatusAction(ledgerId: string, payoutStatus: string, userOverride?: any) {
  try {
    await requirePermission('partner.manage', userOverride);
    const agencyId = await getDemoAgencyId();

    const validStatuses = ['PENDING', 'APPROVED', 'PAID'];
    if (!validStatuses.includes(payoutStatus)) {
      return { success: false, error: 'Invalid payout status' };
    }

    const updated = await (prisma as any).partnerSplitLedger.updateMany({
      where: { id: ledgerId, agencyId },
      data: {
        payoutStatus,
        settledAt: payoutStatus === 'PAID' ? new Date() : null
      }
    });

    revalidatePath('/partners');
    return { success: true, count: updated.count };
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to update partner payout status' };
  }
}
