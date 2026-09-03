'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { MandateStatus } from '@prisma/client';
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

export type JobActionResult = {
  success: boolean;
  jobId?: string;
  error?: string;
  errors?: Record<string, string>;
};

export async function createJobMandateAction(prevState: any, formData: FormData, userOverride?: any): Promise<JobActionResult> {
  try {
    await requirePermission('job.create', userOverride);
    const agencyId = await getDemoAgencyId();

    const title = (formData.get('title') as string || '').trim();
    const clientId = (formData.get('clientId') as string || '').trim() || null;
    const headcountStr = formData.get('headcount') as string;
    const minCtcStr = formData.get('minCtcLpa') as string;
    const maxCtcStr = formData.get('maxCtcLpa') as string;
    const feeStr = formData.get('feePercentage') as string;
    const statusStr = (formData.get('status') as string || 'OPEN').trim();

    const errors: Record<string, string> = {};

    if (!title) errors.title = 'Position title is required';

    let headcount = 1;
    if (headcountStr && headcountStr.trim() !== '') {
      const parsed = parseInt(headcountStr, 10);
      if (isNaN(parsed) || parsed < 1) {
        errors.headcount = 'Open positions headcount must be at least 1';
      } else {
        headcount = parsed;
      }
    }

    let minCtcLpa: number | null = null;
    if (minCtcStr && minCtcStr.trim() !== '') {
      const parsed = parseFloat(minCtcStr);
      if (isNaN(parsed) || parsed < 0) {
        errors.minCtcLpa = 'Min salary must be a positive number';
      } else {
        minCtcLpa = parsed;
      }
    }

    let maxCtcLpa: number | null = null;
    if (maxCtcStr && maxCtcStr.trim() !== '') {
      const parsed = parseFloat(maxCtcStr);
      if (isNaN(parsed) || parsed < 0) {
        errors.maxCtcLpa = 'Max salary must be a positive number';
      } else {
        maxCtcLpa = parsed;
      }
    }

    if (minCtcLpa !== null && maxCtcLpa !== null && minCtcLpa > maxCtcLpa) {
      errors.maxCtcLpa = 'Max salary cannot be less than Min salary';
    }

    let feePercentage = 8.33;
    if (feeStr && feeStr.trim() !== '') {
      const parsed = parseFloat(feeStr);
      if (!isNaN(parsed) && parsed >= 0) {
        feePercentage = parsed;
      }
    }

    if (Object.keys(errors).length > 0) {
      return { success: false, errors };
    }

    const validStatus = Object.values(MandateStatus).includes(statusStr as MandateStatus)
      ? (statusStr as MandateStatus)
      : MandateStatus.OPEN;

    const newJob = await prisma.jobMandate.create({
      data: {
        agencyId,
        clientId,
        title,
        headcount,
        minCtcLpa: minCtcLpa !== null ? minCtcLpa : undefined,
        maxCtcLpa: maxCtcLpa !== null ? maxCtcLpa : undefined,
        feePercentage,
        status: validStatus
      }
    });

    revalidatePath('/jobs');
    return { success: true, jobId: newJob.id };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to create job mandate' };
  }
}

export async function updateJobMandateAction(jobId: string, prevState: any, formData: FormData, userOverride?: any): Promise<JobActionResult> {
  try {
    await requirePermission('job.edit', userOverride);
    const agencyId = await getDemoAgencyId();

    const title = (formData.get('title') as string || '').trim();
    const clientId = (formData.get('clientId') as string || '').trim() || null;
    const headcountStr = formData.get('headcount') as string;
    const minCtcStr = formData.get('minCtcLpa') as string;
    const maxCtcStr = formData.get('maxCtcLpa') as string;
    const feeStr = formData.get('feePercentage') as string;
    const statusStr = (formData.get('status') as string || 'OPEN').trim();

    const errors: Record<string, string> = {};

    if (!title) errors.title = 'Position title is required';

    let headcount = 1;
    if (headcountStr && headcountStr.trim() !== '') {
      const parsed = parseInt(headcountStr, 10);
      if (isNaN(parsed) || parsed < 1) {
        errors.headcount = 'Open positions headcount must be at least 1';
      } else {
        headcount = parsed;
      }
    }

    let minCtcLpa: number | null = null;
    if (minCtcStr && minCtcStr.trim() !== '') {
      const parsed = parseFloat(minCtcStr);
      if (isNaN(parsed) || parsed < 0) {
        errors.minCtcLpa = 'Min salary must be a positive number';
      } else {
        minCtcLpa = parsed;
      }
    }

    let maxCtcLpa: number | null = null;
    if (maxCtcStr && maxCtcStr.trim() !== '') {
      const parsed = parseFloat(maxCtcStr);
      if (isNaN(parsed) || parsed < 0) {
        errors.maxCtcLpa = 'Max salary must be a positive number';
      } else {
        maxCtcLpa = parsed;
      }
    }

    if (minCtcLpa !== null && maxCtcLpa !== null && minCtcLpa > maxCtcLpa) {
      errors.maxCtcLpa = 'Max salary cannot be less than Min salary';
    }

    let feePercentage = 8.33;
    if (feeStr && feeStr.trim() !== '') {
      const parsed = parseFloat(feeStr);
      if (!isNaN(parsed) && parsed >= 0) {
        feePercentage = parsed;
      }
    }

    if (Object.keys(errors).length > 0) {
      return { success: false, errors };
    }

    const existing = await prisma.jobMandate.findFirst({
      where: { id: jobId, agencyId }
    });

    if (!existing) {
      return { success: false, error: 'Job mandate record not found or access denied.' };
    }

    const validStatus = Object.values(MandateStatus).includes(statusStr as MandateStatus)
      ? (statusStr as MandateStatus)
      : MandateStatus.OPEN;

    await prisma.jobMandate.update({
      where: { id: jobId },
      data: {
        clientId,
        title,
        headcount,
        minCtcLpa: minCtcLpa !== null ? minCtcLpa : undefined,
        maxCtcLpa: maxCtcLpa !== null ? maxCtcLpa : undefined,
        feePercentage,
        status: validStatus,
        updatedAt: new Date()
      }
    });

    revalidatePath('/jobs');
    revalidatePath(`/jobs/${jobId}`);
    return { success: true, jobId };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to update job mandate' };
  }
}

export async function updateJobStatusAction(jobId: string, newStatus: MandateStatus, userOverride?: any): Promise<JobActionResult> {
  try {
    await requirePermission('job.edit', userOverride);
    const agencyId = await getDemoAgencyId();

    const existing = await prisma.jobMandate.findFirst({
      where: { id: jobId, agencyId }
    });

    if (!existing) {
      return { success: false, error: 'Job mandate record not found or access denied.' };
    }

    await prisma.jobMandate.update({
      where: { id: jobId },
      data: {
        status: newStatus,
        updatedAt: new Date()
      }
    });

    revalidatePath('/jobs');
    revalidatePath(`/jobs/${jobId}`);
    return { success: true, jobId };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to update status transition' };
  }
}
