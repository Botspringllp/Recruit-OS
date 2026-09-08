'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { MandateStatus } from '@prisma/client';
import { requirePermission, getCurrentUser } from '@/lib/rbac';
import { getResolvedAgencyId } from '@/lib/agency/resolver';

export type JobActionResult = {
  success: boolean;
  jobId?: string;
  error?: string;
  errors?: Record<string, string>;
};

async function resolveOrCreateClient(agencyId: string, companyName: string, industry?: string): Promise<string | null> {
  const trimmed = companyName.trim();
  if (!trimmed) return null;

  // Search case-insensitively for an existing client under this agency
  const existing = await prisma.client.findFirst({
    where: {
      agencyId,
      companyName: { equals: trimmed, mode: 'insensitive' }
    },
    select: { id: true }
  });

  if (existing) {
    return existing.id;
  }

  // Create new client record automatically
  const newClient = await prisma.client.create({
    data: {
      agencyId,
      companyName: trimmed,
      industry: industry || null,
      status: 'ACTIVE'
    }
  });

  return newClient.id;
}

export async function createJobMandateAction(prevState: any, formData: FormData, userOverride?: any): Promise<JobActionResult> {
  try {
    await requirePermission('job.create', userOverride);
    const agencyId = await getResolvedAgencyId();

    const rawTitle = (formData.get('title') as string || '').trim();
    const title = rawTitle || 'Untitled Job Mandate';
    const companyName = (formData.get('companyName') as string || '').trim();
    const headcountStr = formData.get('headcount') as string;
    const minCtcStr = formData.get('minCtcLpa') as string;
    const maxCtcStr = formData.get('maxCtcLpa') as string;
    const feeStr = formData.get('feePercentage') as string;
    const statusStr = (formData.get('status') as string || 'OPEN').trim();

    // Recruiter Intake Fields (Mandatory)
    const industry = (formData.get('industry') as string || '').trim();
    const employmentType = (formData.get('employmentType') as string || '').trim();
    const experience = (formData.get('experience') as string || '').trim();
    const education = (formData.get('education') as string || '').trim();
    const skills = (formData.get('skills') as string || '').trim();
    const description = (formData.get('description') as string || '').trim();
    const companyOverview = (formData.get('companyOverview') as string || '').trim();
    const location = (formData.get('location') as string || '').trim();

    // Mandatory Field Validations
    if (!rawTitle) return { success: false, error: 'Position Title is mandatory' };
    if (!companyName) return { success: false, error: 'Company Name is mandatory' };
    if (!industry) return { success: false, error: 'Industry Type is mandatory' };
    if (!employmentType) return { success: false, error: 'Employment Type is mandatory' };
    if (!experience) return { success: false, error: 'Experience Required is mandatory' };
    if (!education) return { success: false, error: 'Education Requirements is mandatory' };
    if (!skills) return { success: false, error: 'Key Skills Required is mandatory' };
    if (!description) return { success: false, error: 'Job Description is mandatory' };
    if (!companyOverview) return { success: false, error: 'Company Overview is mandatory' };
    if (!location) return { success: false, error: 'Job Location is mandatory' };

    // Resolve or create Client record automatically
    const clientId = await resolveOrCreateClient(agencyId, companyName, industry);

    let headcount = 1;
    if (headcountStr && headcountStr.trim() !== '') {
      const parsed = parseInt(headcountStr, 10);
      if (!isNaN(parsed) && parsed >= 1) headcount = parsed;
    }

    let minCtcLpa: number | null = null;
    if (minCtcStr && minCtcStr.trim() !== '') {
      const parsed = parseFloat(minCtcStr);
      if (!isNaN(parsed) && parsed >= 0) minCtcLpa = parsed;
    }

    let maxCtcLpa: number | null = null;
    if (maxCtcStr && maxCtcStr.trim() !== '') {
      const parsed = parseFloat(maxCtcStr);
      if (!isNaN(parsed) && parsed >= 0) maxCtcLpa = parsed;
    }

    let feePercentage = 8.33;
    if (feeStr && feeStr.trim() !== '') {
      const parsed = parseFloat(feeStr);
      if (!isNaN(parsed) && parsed >= 0) feePercentage = parsed;
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

    // Save recruiter requirement details into JobPrepKit
    const prepKitOverview = companyOverview || `Company: ${companyName || 'Internal Mandate'}`;
    const prepKitProcess = [
      industry ? `Industry: ${industry}` : '',
      employmentType ? `Employment Type: ${employmentType}` : '',
      experience ? `Experience: ${experience}` : '',
      education ? `Education: ${education}` : '',
      skills ? `Key Skills: ${skills}` : '',
      description ? `Job Description: ${description}` : ''
    ].filter(Boolean).join('\n\n');

    await prisma.jobPrepKit.create({
      data: {
        agencyId,
        jobId: newJob.id,
        companyOverview: prepKitOverview,
        interviewProcess: prepKitProcess || 'Standard Hiring Process',
        behavioralTips: skills || null,
        technicalFaqs: description || null
      }
    }).catch(() => null);

    revalidatePath('/jobs');
    return { success: true, jobId: newJob.id };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to create job mandate' };
  }
}

export async function updateJobMandateAction(jobId: string, prevState: any, formData: FormData, userOverride?: any): Promise<JobActionResult> {
  try {
    await requirePermission('job.edit', userOverride);
    const agencyId = await getResolvedAgencyId();

    const rawTitle = (formData.get('title') as string || '').trim();
    const title = rawTitle || 'Untitled Job Mandate';
    const companyName = (formData.get('companyName') as string || '').trim();
    const headcountStr = formData.get('headcount') as string;
    const minCtcStr = formData.get('minCtcLpa') as string;
    const maxCtcStr = formData.get('maxCtcLpa') as string;
    const feeStr = formData.get('feePercentage') as string;
    const statusStr = (formData.get('status') as string || 'OPEN').trim();

    // Recruiter Intake Fields (Mandatory)
    const industry = (formData.get('industry') as string || '').trim();
    const employmentType = (formData.get('employmentType') as string || '').trim();
    const experience = (formData.get('experience') as string || '').trim();
    const education = (formData.get('education') as string || '').trim();
    const skills = (formData.get('skills') as string || '').trim();
    const description = (formData.get('description') as string || '').trim();
    const companyOverview = (formData.get('companyOverview') as string || '').trim();
    const location = (formData.get('location') as string || '').trim();

    // Mandatory Field Validations
    if (!rawTitle) return { success: false, error: 'Position Title is mandatory' };
    if (!companyName) return { success: false, error: 'Company Name is mandatory' };
    if (!industry) return { success: false, error: 'Industry Type is mandatory' };
    if (!employmentType) return { success: false, error: 'Employment Type is mandatory' };
    if (!experience) return { success: false, error: 'Experience Required is mandatory' };
    if (!education) return { success: false, error: 'Education Requirements is mandatory' };
    if (!skills) return { success: false, error: 'Key Skills Required is mandatory' };
    if (!description) return { success: false, error: 'Job Description is mandatory' };
    if (!companyOverview) return { success: false, error: 'Company Overview is mandatory' };
    if (!location) return { success: false, error: 'Job Location is mandatory' };

    const existing = await prisma.jobMandate.findFirst({
      where: { id: jobId, agencyId }
    });

    if (!existing) {
      return { success: false, error: 'Job mandate record not found or access denied.' };
    }

    // Resolve or create Client record automatically
    const clientId = await resolveOrCreateClient(agencyId, companyName, industry);

    let headcount = existing.headcount;
    if (headcountStr && headcountStr.trim() !== '') {
      const parsed = parseInt(headcountStr, 10);
      if (!isNaN(parsed) && parsed >= 1) headcount = parsed;
    }

    let minCtcLpa: number | null = existing.minCtcLpa ? Number(existing.minCtcLpa) : null;
    if (minCtcStr && minCtcStr.trim() !== '') {
      const parsed = parseFloat(minCtcStr);
      if (!isNaN(parsed) && parsed >= 0) minCtcLpa = parsed;
    }

    let maxCtcLpa: number | null = existing.maxCtcLpa ? Number(existing.maxCtcLpa) : null;
    if (maxCtcStr && maxCtcStr.trim() !== '') {
      const parsed = parseFloat(maxCtcStr);
      if (!isNaN(parsed) && parsed >= 0) maxCtcLpa = parsed;
    }

    let feePercentage = existing.feePercentage ? Number(existing.feePercentage) : 8.33;
    if (feeStr && feeStr.trim() !== '') {
      const parsed = parseFloat(feeStr);
      if (!isNaN(parsed) && parsed >= 0) feePercentage = parsed;
    }

    const validStatus = Object.values(MandateStatus).includes(statusStr as MandateStatus)
      ? (statusStr as MandateStatus)
      : existing.status;

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

    // Update linked JobPrepKit
    const prepKitOverview = companyOverview || `Company: ${companyName || 'Internal Mandate'}`;
    const prepKitProcess = [
      industry ? `Industry: ${industry}` : '',
      employmentType ? `Employment Type: ${employmentType}` : '',
      experience ? `Experience: ${experience}` : '',
      education ? `Education: ${education}` : '',
      skills ? `Key Skills: ${skills}` : '',
      description ? `Job Description: ${description}` : ''
    ].filter(Boolean).join('\n\n');

    const existingKit = await prisma.jobPrepKit.findFirst({ where: { jobId } });
    if (existingKit) {
      await prisma.jobPrepKit.update({
        where: { id: existingKit.id },
        data: {
          companyOverview: prepKitOverview,
          interviewProcess: prepKitProcess,
          behavioralTips: skills || null,
          technicalFaqs: description || null
        }
      });
    } else {
      await prisma.jobPrepKit.create({
        data: {
          agencyId,
          jobId,
          companyOverview: prepKitOverview,
          interviewProcess: prepKitProcess,
          behavioralTips: skills || null,
          technicalFaqs: description || null
        }
      }).catch(() => null);
    }

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
    const agencyId = await getResolvedAgencyId();

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

export async function submitCandidateToMandateAction(jobId: string, candidateId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const user = await getCurrentUser();
    if (!user || !user.agencyId) {
      return { success: false, error: 'Unauthorized user session.' };
    }
    await requirePermission('job.edit', user);
    const agencyId = user.agencyId;

    const existing = await prisma.candidateSubmission.findFirst({
      where: { agencyId, jobId, candidateId }
    });

    if (existing) {
      return { success: false, error: 'Candidate is already submitted to this job mandate.' };
    }

    await prisma.candidateSubmission.create({
      data: {
        agencyId,
        jobId,
        candidateId,
        stage: 'SCREENED',
        slaStatus: 'HEALTHY'
      }
    });

    revalidatePath(`/jobs/${jobId}`);
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to submit candidate to mandate' };
  }
}
