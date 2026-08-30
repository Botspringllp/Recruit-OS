import { prisma } from '@/lib/prisma';
import { NextRequest } from 'next/server';

let cachedAgencyId: string | null = null;

/**
 * Safely resolves a valid database Agency ID for API routes and Server Actions.
 * - Uses session/JWT/header agencyId directly without redundant DB checks.
 * - Caches the fallback agency ID in memory to eliminate repeated DB round-trips.
 */
export async function getResolvedAgencyId(request?: NextRequest, user?: any): Promise<string> {
  // 1. Direct use from JWT / User Metadata if present
  if (user?.user_metadata?.agency_id) {
    return user.user_metadata.agency_id;
  }

  if (user?.agencyId) {
    return user.agencyId;
  }

  // 2. Direct use from request header if present and valid
  if (request) {
    const headerId = request.headers.get('x-agency-id');
    if (headerId && headerId !== 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d') {
      return headerId;
    }
  }

  // 3. Return memory-cached fallback ID immediately (0 DB queries)
  if (cachedAgencyId) {
    return cachedAgencyId;
  }

  // 4. Combined single DB round-trip for fallback resolution
  const existingAgency = await prisma.agency.findFirst({
    select: { id: true }
  }).catch(() => null);

  if (existingAgency) {
    cachedAgencyId = existingAgency.id;
    return existingAgency.id;
  }

  // 5. Create default agency if DB has no agencies yet
  const newAgency = await prisma.agency.create({
    data: {
      name: 'Apex Executive Search',
      subdomain: 'demo',
      subscriptionTier: 'ENTERPRISE'
    }
  });

  cachedAgencyId = newAgency.id;
  return newAgency.id;
}

