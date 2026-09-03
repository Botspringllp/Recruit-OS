'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { CandidateSource } from '@prisma/client';
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

export type CandidateFormData = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  currentCompany?: string;
  currentDesignation?: string;
  totalExperienceYears?: number;
  currentLocation?: string;
  source?: CandidateSource;
  noticePeriodDays?: number;
  currentCtcLpa?: number;
  expectedCtcLpa?: number;
};

export type ActionResult = {
  success: boolean;
  candidateId?: string;
  error?: string;
  errors?: Record<string, string>;
};

export async function createCandidateAction(prevState: any, formData: FormData, userOverride?: any): Promise<ActionResult> {
  try {
    await requirePermission('candidate.create', userOverride);
    const agencyId = await getDemoAgencyId();

    const firstName = (formData.get('firstName') as string || '').trim();
    const lastName = (formData.get('lastName') as string || '').trim();
    const email = (formData.get('email') as string || '').trim().toLowerCase();
    const phone = (formData.get('phone') as string || '').trim();
    const currentCompany = (formData.get('currentCompany') as string || '').trim() || null;
    const currentDesignation = (formData.get('currentDesignation') as string || '').trim() || null;
    const expStr = formData.get('totalExperienceYears') as string;
    const currentLocation = (formData.get('currentLocation') as string || '').trim() || null;
    const sourceStr = (formData.get('source') as string || 'DIRECT_INTAKE').trim();

    const errors: Record<string, string> = {};

    if (!firstName) errors.firstName = 'First name is required';
    if (!lastName) errors.lastName = 'Last name is required';

    if (!email) {
      errors.email = 'Email address is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email = 'Invalid email address format';
    }

    if (!phone) {
      errors.phone = 'Phone number is required';
    } else if (phone.length < 8) {
      errors.phone = 'Phone number must be at least 8 digits';
    }

    let totalExperienceYears: number | null = null;
    if (expStr && expStr.trim() !== '') {
      const parsed = parseFloat(expStr);
      if (isNaN(parsed) || parsed < 0) {
        errors.totalExperienceYears = 'Total experience must be a non-negative number';
      } else {
        totalExperienceYears = parsed;
      }
    }

    if (Object.keys(errors).length > 0) {
      return { success: false, errors };
    }

    // Check duplicate email or phone within tenant
    const existingCandidate = await prisma.candidateRecord.findFirst({
      where: {
        agencyId,
        deletedAt: null,
        OR: [{ email }, { phone }]
      }
    });

    if (existingCandidate) {
      if (existingCandidate.email === email) {
        return { success: false, error: 'A candidate with this email address already exists.' };
      }
      if (existingCandidate.phone === phone) {
        return { success: false, error: 'A candidate with this phone number already exists.' };
      }
    }

    const validSource = Object.values(CandidateSource).includes(sourceStr as CandidateSource)
      ? (sourceStr as CandidateSource)
      : CandidateSource.DIRECT_INTAKE;

    const newCandidate = await prisma.candidateRecord.create({
      data: {
        agencyId,
        firstName,
        lastName,
        email,
        phone,
        currentCompany,
        currentDesignation,
        totalExperienceYears: totalExperienceYears !== null ? totalExperienceYears : undefined,
        currentLocation,
        source: validSource
      }
    });

    revalidatePath('/candidates');
    return { success: true, candidateId: newCandidate.id };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to create candidate record' };
  }
}

export async function updateCandidateAction(candidateId: string, prevState: any, formData: FormData, userOverride?: any): Promise<ActionResult> {
  try {
    await requirePermission('candidate.edit', userOverride);
    const agencyId = await getDemoAgencyId();

    const firstName = (formData.get('firstName') as string || '').trim();
    const lastName = (formData.get('lastName') as string || '').trim();
    const email = (formData.get('email') as string || '').trim().toLowerCase();
    const phone = (formData.get('phone') as string || '').trim();
    const currentCompany = (formData.get('currentCompany') as string || '').trim() || null;
    const currentDesignation = (formData.get('currentDesignation') as string || '').trim() || null;
    const expStr = formData.get('totalExperienceYears') as string;
    const currentLocation = (formData.get('currentLocation') as string || '').trim() || null;
    const sourceStr = (formData.get('source') as string || 'DIRECT_INTAKE').trim();

    const errors: Record<string, string> = {};

    if (!firstName) errors.firstName = 'First name is required';
    if (!lastName) errors.lastName = 'Last name is required';

    if (!email) {
      errors.email = 'Email address is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email = 'Invalid email address format';
    }

    if (!phone) {
      errors.phone = 'Phone number is required';
    } else if (phone.length < 8) {
      errors.phone = 'Phone number must be at least 8 digits';
    }

    let totalExperienceYears: number | null = null;
    if (expStr && expStr.trim() !== '') {
      const parsed = parseFloat(expStr);
      if (isNaN(parsed) || parsed < 0) {
        errors.totalExperienceYears = 'Total experience must be a non-negative number';
      } else {
        totalExperienceYears = parsed;
      }
    }

    if (Object.keys(errors).length > 0) {
      return { success: false, errors };
    }

    const existing = await prisma.candidateRecord.findFirst({
      where: { id: candidateId, agencyId, deletedAt: null }
    });

    if (!existing) {
      return { success: false, error: 'Candidate record not found or access denied.' };
    }

    const validSource = Object.values(CandidateSource).includes(sourceStr as CandidateSource)
      ? (sourceStr as CandidateSource)
      : CandidateSource.DIRECT_INTAKE;

    await prisma.candidateRecord.update({
      where: { id: candidateId },
      data: {
        firstName,
        lastName,
        email,
        phone,
        currentCompany,
        currentDesignation,
        totalExperienceYears: totalExperienceYears !== null ? totalExperienceYears : undefined,
        currentLocation,
        source: validSource,
        updatedAt: new Date()
      }
    });

    revalidatePath('/candidates');
    revalidatePath(`/candidates/${candidateId}`);
    return { success: true, candidateId };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to update candidate record' };
  }
}

export async function deleteCandidateAction(candidateId: string, userOverride?: any): Promise<ActionResult> {
  try {
    await requirePermission('candidate.delete', userOverride);
    const agencyId = await getDemoAgencyId();

    const existing = await prisma.candidateRecord.findFirst({
      where: { id: candidateId, agencyId, deletedAt: null }
    });

    if (!existing) {
      return { success: false, error: 'Candidate record not found or already deleted.' };
    }

    await prisma.candidateRecord.update({
      where: { id: candidateId },
      data: {
        deletedAt: new Date()
      }
    });

    revalidatePath('/candidates');
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to soft delete candidate' };
  }
}
