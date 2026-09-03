'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { uploadToStorage, deleteFromStorage, STORAGE_BUCKETS, StorageBucket } from '@/lib/storage';
import { logEvent } from '@/lib/logger';
import { requirePermission } from '@/lib/rbac';
import {
  MANDATORY_COMPLIANCE_CATEGORIES,
  COMPLIANCE_STATUSES,
  ComplianceCategory,
  ComplianceStatus
} from '@/lib/constants/compliance';

async function getDemoAgencyId(): Promise<string> {
  const agency = await prisma.agency.findFirst({
    where: { subdomain: 'demo' },
    select: { id: true }
  });
  if (!agency) {
    logEvent.authFailure('Demo agency record not found');
    throw new Error('Demo agency record not found');
  }
  return agency.id;
}

export async function uploadCandidateDocumentAction(formData: FormData, userOverride?: any) {
  try {
    await requirePermission('compliance.approve', userOverride);
    const agencyId = await getDemoAgencyId();

    const candidateId = formData.get('candidateId')?.toString() || '';
    const submissionId = formData.get('submissionId')?.toString() || null;
    const documentCategory = formData.get('documentCategory')?.toString() || 'RESUME';
    const fileNameInput = formData.get('fileName')?.toString() || 'document.pdf';
    const expiryDateStr = formData.get('expiryDate')?.toString();
    const notes = formData.get('notes')?.toString() || '';
    const file = formData.get('file') as File | null;

    if (!candidateId) {
      return { success: false, error: 'Candidate selection is required' };
    }

    const candidate = await prisma.candidateRecord.findFirst({
      where: { id: candidateId, agencyId }
    });

    if (!candidate) {
      return { success: false, error: 'Selected candidate record not found' };
    }

    let bucket: StorageBucket = STORAGE_BUCKETS.COMPLIANCE_DOCS;
    if (documentCategory === 'RESUME') {
      bucket = STORAGE_BUCKETS.RESUMES;
    } else if (documentCategory === 'OFFER_LETTER') {
      bucket = STORAGE_BUCKETS.OFFER_DOCUMENTS;
    }

    let fileBuffer: Buffer;
    let fileName = fileNameInput;
    let contentType = 'application/pdf';

    if (file && typeof file.arrayBuffer === 'function') {
      fileName = file.name || fileNameInput;
      contentType = file.type || 'application/octet-stream';
      const arrayBuffer = await file.arrayBuffer();
      fileBuffer = Buffer.from(arrayBuffer);
    } else {
      const documentPayload = `RecruitOS Compliance Document Verification\nAgency ID: ${agencyId}\nCandidate ID: ${candidateId}\nCategory: ${documentCategory}\nTimestamp: ${new Date().toISOString()}`;
      fileBuffer = Buffer.from(documentPayload, 'utf-8');
      if (!fileName.includes('.')) fileName = `${fileName}.txt`;
      contentType = 'text/plain';
    }

    const storageResult = await uploadToStorage({
      bucket,
      agencyId,
      entityId: candidateId,
      fileName,
      fileBuffer,
      contentType
    });

    const doc = await prisma.candidateComplianceDoc.create({
      data: {
        agencyId,
        candidateId,
        submissionId: submissionId || null,
        documentCategory,
        documentType: documentCategory,
        fileName: storageResult.fileName,
        fileUrl: storageResult.fileUrl,
        filePath: storageResult.filePath,
        fileSize: storageResult.fileSize,
        status: 'SUBMITTED',
        isVerified: false,
        expiryDate: expiryDateStr ? new Date(expiryDateStr) : null,
        notes
      }
    });

    await prisma.complianceAuditLog.create({
      data: {
        agencyId,
        complianceDocId: doc.id,
        candidateId,
        previousStatus: 'PENDING',
        newStatus: 'SUBMITTED',
        actionBy: 'Recruiter',
        remarks: `Document "${storageResult.fileName}" uploaded to Supabase Storage bucket '${bucket}'`
      }
    });

    revalidatePath('/compliance');
    revalidatePath(`/compliance/${doc.id}`);
    revalidatePath(`/compliance/candidate/${candidateId}`);
    revalidatePath('/candidates');
    revalidatePath(`/candidates/${candidateId}`);

    logEvent.serverAction('uploadCandidateDocumentAction', agencyId, {
      candidateId,
      docId: doc.id,
      category: documentCategory,
      filePath: storageResult.filePath
    });

    return {
      success: true,
      docId: doc.id,
      fileUrl: storageResult.fileUrl,
      filePath: storageResult.filePath
    };
  } catch (error: any) {
    logEvent.dbFailure('uploadCandidateDocumentAction', error);
    return { success: false, error: error.message || 'Failed to upload candidate document' };
  }
}

export async function updateDocumentStatusAction(
  docId: string,
  newStatus: string,
  reviewerNotes?: string,
  rejectionReason?: string,
  userOverride?: any
) {
  try {
    await requirePermission('compliance.approve', userOverride);
    const agencyId = await getDemoAgencyId();

    const existing = await prisma.candidateComplianceDoc.findFirst({
      where: { id: docId, agencyId }
    });

    if (!existing) {
      return { success: false, error: 'Compliance document record not found' };
    }

    const isVerified = newStatus === 'VERIFIED';
    const verifiedAt = isVerified ? new Date() : existing.verifiedAt;

    const updated = await prisma.candidateComplianceDoc.update({
      where: { id: docId },
      data: {
        status: newStatus,
        isVerified,
        verifiedAt,
        notes: reviewerNotes !== undefined ? reviewerNotes : existing.notes,
        rejectionReason: rejectionReason !== undefined ? rejectionReason : existing.rejectionReason,
        updatedAt: new Date()
      }
    });

    await prisma.complianceAuditLog.create({
      data: {
        agencyId,
        complianceDocId: docId,
        candidateId: existing.candidateId || '',
        previousStatus: existing.status,
        newStatus,
        actionBy: 'Compliance Manager',
        remarks: rejectionReason
          ? `Status changed to ${newStatus}. Reason: ${rejectionReason}`
          : reviewerNotes || `Status updated to ${newStatus}`
      }
    });

    revalidatePath('/compliance');
    revalidatePath(`/compliance/${docId}`);
    if (existing.candidateId) {
      revalidatePath(`/compliance/candidate/${existing.candidateId}`);
      revalidatePath(`/candidates/${existing.candidateId}`);
    }

    return { success: true, doc: updated };
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to update document status' };
  }
}

export async function updateCandidateDocumentAction(docId: string, formData: FormData, userOverride?: any) {
  try {
    await requirePermission('compliance.approve', userOverride);
    const agencyId = await getDemoAgencyId();

    const existing = await prisma.candidateComplianceDoc.findFirst({
      where: { id: docId, agencyId }
    });

    if (!existing) {
      return { success: false, error: 'Document record not found' };
    }

    const documentCategory = formData.get('documentCategory')?.toString() || existing.documentCategory;
    const fileName = formData.get('fileName')?.toString() || existing.fileName;
    const expiryDateStr = formData.get('expiryDate')?.toString();
    const notes = formData.get('notes')?.toString() || existing.notes;
    const file = formData.get('file') as File | null;

    let filePath = existing.filePath;
    let fileUrl = existing.fileUrl;
    let fileSize = existing.fileSize;

    if (file && typeof file.arrayBuffer === 'function') {
      let bucket: StorageBucket = STORAGE_BUCKETS.COMPLIANCE_DOCS;
      if (documentCategory === 'RESUME') bucket = STORAGE_BUCKETS.RESUMES;
      if (documentCategory === 'OFFER_LETTER') bucket = STORAGE_BUCKETS.OFFER_DOCUMENTS;

      const arrayBuffer = await file.arrayBuffer();
      const storageResult = await uploadToStorage({
        bucket,
        agencyId,
        entityId: existing.candidateId || 'general',
        fileName: file.name || fileName || 'document.pdf',
        fileBuffer: Buffer.from(arrayBuffer),
        contentType: file.type || 'application/octet-stream'
      });

      filePath = storageResult.filePath;
      fileUrl = storageResult.fileUrl;
      fileSize = storageResult.fileSize;
    }

    let newStatus = existing.status;
    if (existing.status === 'REJECTED' || existing.status === 'EXPIRED') {
      newStatus = 'SUBMITTED';
    }

    const updated = await prisma.candidateComplianceDoc.update({
      where: { id: docId },
      data: {
        documentCategory,
        documentType: documentCategory,
        fileName,
        fileUrl,
        filePath,
        fileSize,
        expiryDate: expiryDateStr ? new Date(expiryDateStr) : existing.expiryDate,
        notes,
        status: newStatus,
        isVerified: newStatus === 'VERIFIED',
        rejectionReason: newStatus === 'SUBMITTED' ? null : existing.rejectionReason,
        updatedAt: new Date()
      }
    });

    await prisma.complianceAuditLog.create({
      data: {
        agencyId,
        complianceDocId: docId,
        candidateId: existing.candidateId || '',
        previousStatus: existing.status,
        newStatus,
        actionBy: 'Recruiter',
        remarks: `Updated document details & category (${documentCategory})`
      }
    });

    revalidatePath('/compliance');
    revalidatePath(`/compliance/${docId}`);
    if (existing.candidateId) {
      revalidatePath(`/compliance/candidate/${existing.candidateId}`);
    }

    return { success: true, docId: docId };
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to update candidate document' };
  }
}

export async function deleteCandidateDocumentAction(docId: string, userOverride?: any) {
  try {
    await requirePermission('compliance.approve', userOverride);
    const agencyId = await getDemoAgencyId();

    const existing = await prisma.candidateComplianceDoc.findFirst({
      where: { id: docId, agencyId }
    });

    if (!existing) {
      return { success: false, error: 'Document record not found' };
    }

    let bucket: StorageBucket = STORAGE_BUCKETS.COMPLIANCE_DOCS;
    if (existing.documentCategory === 'RESUME') bucket = STORAGE_BUCKETS.RESUMES;
    if (existing.documentCategory === 'OFFER_LETTER') bucket = STORAGE_BUCKETS.OFFER_DOCUMENTS;

    if (existing.filePath) {
      await deleteFromStorage(bucket, agencyId, existing.filePath);
    }

    await prisma.candidateComplianceDoc.update({
      where: { id: docId },
      data: { deletedAt: new Date() }
    });

    revalidatePath('/compliance');
    if (existing.candidateId) {
      revalidatePath(`/compliance/candidate/${existing.candidateId}`);
    }

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to delete document' };
  }
}

export async function checkCandidateComplianceGateAction(candidateId: string, userOverride?: any) {
  try {
    await requirePermission('compliance.view', userOverride);
    const agencyId = await getDemoAgencyId();

    const docs = await prisma.candidateComplianceDoc.findMany({
      where: { candidateId, agencyId, deletedAt: null },
      orderBy: { createdAt: 'desc' }
    });

    const essentialCategories = ['RESUME', 'AADHAAR', 'PAN', 'BGV_REPORT', 'OFFER_LETTER'];

    const missingDocs: string[] = [];
    const unverifiedDocs: string[] = [];

    for (const cat of essentialCategories) {
      const catDocs = docs.filter((d) => d.documentCategory === cat);
      if (catDocs.length === 0) {
        missingDocs.push(cat);
      } else {
        const latestDoc = catDocs[0];
        if (latestDoc.status !== 'VERIFIED' || !latestDoc.isVerified) {
          unverifiedDocs.push(`${cat} (${latestDoc.status})`);
        }
      }
    }

    const isCompliant = missingDocs.length === 0 && unverifiedDocs.length === 0;
    const totalVerified = essentialCategories.filter((cat) => {
      const catDocs = docs.filter((d) => d.documentCategory === cat);
      return catDocs.length > 0 && catDocs[0].status === 'VERIFIED' && catDocs[0].isVerified;
    }).length;

    return {
      success: true,
      isCompliant,
      missingDocs,
      unverifiedDocs,
      totalVerified,
      totalDocsCount: docs.length,
      message: isCompliant
        ? 'All mandatory compliance documents are verified.'
        : `Compliance Verification Incomplete. Missing: [${missingDocs.join(', ')}], Unverified: [${unverifiedDocs.join(', ')}].`
    };
  } catch (error: any) {
    return {
      success: false,
      isCompliant: false,
      missingDocs: [],
      unverifiedDocs: [],
      error: error.message || 'Failed to verify compliance gate'
    };
  }
}
