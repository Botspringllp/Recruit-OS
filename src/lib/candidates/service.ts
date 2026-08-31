import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { uploadToStorage, STORAGE_BUCKETS } from '@/lib/storage';
import { ParsedCandidate } from '@/lib/parser/types';
import { DocCategory } from '@prisma/client';

export interface ImportCandidateInput {
  agencyId: string;
  userId?: string;
  candidateData: ParsedCandidate;
  fileBuffer?: Buffer;
  fileName?: string;
  mimeType?: string;
}

export interface ImportedCandidateResult {
  candidateId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  documentId?: string;
  storagePath?: string;
  storageUrl?: string;
}

/**
 * Creates candidate record in database, uploads resume file to Supabase Storage,
 * creates candidate document record, and logs audit events.
 */
export async function importParsedCandidate(
  input: ImportCandidateInput
): Promise<ImportedCandidateResult> {
  const { agencyId, userId, candidateData, fileBuffer, fileName, mimeType } = input;

  if (!agencyId) {
    throw new Error('agencyId is required for tenant isolation.');
  }

  // Resolve a valid assigned recruiter ID in Prisma User table to prevent FK constraint violations
  let validAssignedRecruiterId: string | null = null;
  if (userId) {
    const isUuid = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(userId);
    const matchedUser = await prisma.user.findFirst({
      where: {
        agencyId,
        ...(isUuid
          ? { OR: [{ id: userId }, { email: userId }] }
          : { email: userId })
      },
      select: { id: true }
    });
    if (matchedUser) {
      validAssignedRecruiterId = matchedUser.id;
    }
  }

  if (!validAssignedRecruiterId) {
    const fallbackUser = await prisma.user.findFirst({
      where: { agencyId, isActive: true },
      select: { id: true }
    });
    if (fallbackUser) {
      validAssignedRecruiterId = fallbackUser.id;
    }
  }

  // 1. Create Candidate Record in Prisma
  const candidate = await prisma.candidateRecord.create({
    data: {
      agencyId,
      firstName: candidateData.firstName,
      lastName: candidateData.lastName,
      email: candidateData.email,
      phone: candidateData.phone,
      currentCompany: candidateData.currentCompany || null,
      currentDesignation: candidateData.currentDesignation || null,
      totalExperienceYears: candidateData.totalExperienceYears,
      noticePeriodDays: candidateData.noticePeriodDays || 60,
      currentCtcLpa: candidateData.currentCtcLpa || null,
      expectedCtcLpa: candidateData.expectedCtcLpa || null,
      currentLocation: candidateData.currentLocation || null,
      preferredLocations: candidateData.preferredLocations || [],
      primarySkills: candidateData.skills || [],
      sanitizedSummary: candidateData.summary || null,
      assignedRecruiterId: validAssignedRecruiterId
    }
  });

  let documentId: string | undefined;
  let storagePath: string | undefined;
  let storageUrl: string | undefined;

  // 2. Upload file to Supabase Storage if fileBuffer is provided
  if (fileBuffer && fileName) {
    try {
      const uploadResult = await uploadToStorage({
        bucket: STORAGE_BUCKETS.RESUMES,
        agencyId,
        entityId: candidate.id,
        fileName,
        fileBuffer,
        contentType: mimeType || 'application/pdf'
      });

      storagePath = uploadResult.filePath;
      storageUrl = uploadResult.fileUrl;

      // 3. Create Candidate Document Link in Database
      const doc = await prisma.candidateDocument.create({
        data: {
          agencyId,
          candidateId: candidate.id,
          documentType: DocCategory.RAW_RESUME,
          filePath: uploadResult.filePath,
          fileName: uploadResult.fileName,
          fileSizeBytes: uploadResult.fileSize,
          mimeType: mimeType || 'application/pdf',
          parsedJson: JSON.parse(JSON.stringify(candidateData))
        }
      });

      documentId = doc.id;
    } catch (err: any) {
      logger.error({
        event: 'RESUME_STORAGE_ERROR',
        agencyId,
        candidateId: candidate.id,
        error: err.message
      });
    }
  }

  // 4. Audit Log
  logger.info({
    event: 'CANDIDATE_IMPORTED',
    agencyId,
    candidateId: candidate.id,
    userId,
    email: candidate.email,
    phone: candidate.phone,
    documentId
  });

  return {
    candidateId: candidate.id,
    firstName: candidate.firstName,
    lastName: candidate.lastName,
    email: candidate.email,
    phone: candidate.phone,
    documentId,
    storagePath,
    storageUrl
  };
}
