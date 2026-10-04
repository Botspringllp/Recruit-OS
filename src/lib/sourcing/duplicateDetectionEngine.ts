import { prisma } from '@/lib/prisma';

export interface DuplicateDetectionResult {
  isDuplicate: boolean;
  matchType?: 'EMAIL' | 'PHONE';
  matchedValue?: string;
  matchedCandidate?: any;
  auditId?: string;
}

/**
 * Duplicate Detection Engine (PART G)
 */
export async function detectDuplicateCandidate(
  agencyId: string,
  email: string,
  phone: string
): Promise<DuplicateDetectionResult> {
  const cleanEmail = (email || '').trim().toLowerCase();
  const cleanPhone = (phone || '').replace(/\s+/g, '');

  if (!cleanEmail && !cleanPhone) {
    return { isDuplicate: false };
  }

  // Check Email Match
  if (cleanEmail) {
    const matchedByEmail = await (prisma as any).candidateRecord.findFirst({
      where: {
        agencyId,
        email: { equals: cleanEmail, mode: 'insensitive' }
      }
    });

    if (matchedByEmail) {
      return {
        isDuplicate: true,
        matchType: 'EMAIL',
        matchedValue: cleanEmail,
        matchedCandidate: matchedByEmail
      };
    }
  }

  // Check Phone Match
  if (cleanPhone) {
    const matchedByPhone = await (prisma as any).candidateRecord.findFirst({
      where: {
        agencyId,
        phone: { contains: cleanPhone }
      }
    });

    if (matchedByPhone) {
      return {
        isDuplicate: true,
        matchType: 'PHONE',
        matchedValue: cleanPhone,
        matchedCandidate: matchedByPhone
      };
    }
  }

  return { isDuplicate: false };
}
