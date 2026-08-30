import { prisma } from '@/lib/prisma';
import { DuplicateCandidateMatch, ParsedCandidate } from './types';

/**
 * Searches existing candidates under the same agencyId to detect potential duplicates
 * based on Email, Phone, or LinkedIn URL matches.
 */
export async function checkForDuplicateCandidate(
  agencyId: string,
  parsedCandidate: ParsedCandidate
): Promise<DuplicateCandidateMatch | null> {
  // Build multi-tenant OR query for Email or Phone match
  const OR_CONDITIONS: any[] = [];

  if (parsedCandidate.email) {
    OR_CONDITIONS.push({ email: { equals: parsedCandidate.email, mode: 'insensitive' } });
  }

  if (parsedCandidate.phone) {
    const cleanPhone = parsedCandidate.phone.replace(/\D/g, '');
    if (cleanPhone.length >= 8) {
      OR_CONDITIONS.push({ phone: { contains: cleanPhone.slice(-10) } });
    }
  }

  if (OR_CONDITIONS.length === 0) {
    return null;
  }

  const existingCandidate = await prisma.candidateRecord.findFirst({
    where: {
      agencyId,
      deletedAt: null,
      OR: OR_CONDITIONS
    },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      phone: true,
      ownershipStatus: true,
      createdAt: true
    }
  });

  if (!existingCandidate) {
    return null;
  }

  let matchedOn: 'EMAIL' | 'PHONE' | 'email' | 'phone' = 'EMAIL';
  if (
    parsedCandidate.email &&
    existingCandidate.email.toLowerCase() === parsedCandidate.email.toLowerCase()
  ) {
    matchedOn = 'EMAIL';
  } else if (
    parsedCandidate.phone &&
    existingCandidate.phone.includes(parsedCandidate.phone.replace(/\D/g, '').slice(-8))
  ) {
    matchedOn = 'PHONE';
  }

  return {
    id: existingCandidate.id,
    firstName: existingCandidate.firstName,
    lastName: existingCandidate.lastName,
    email: existingCandidate.email,
    phone: existingCandidate.phone,
    ownershipStatus: existingCandidate.ownershipStatus,
    createdAt: existingCandidate.createdAt.toISOString(),
    matchedOn
  };
}
