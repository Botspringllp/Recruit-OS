import { prisma } from '@/lib/prisma';
import { NextRequest } from 'next/server';

/**
 * Safely resolves a valid database Agency ID for API routes and Server Actions.
 * Prevents foreign key failures by querying existing agencies or creating a default.
 */
export async function getResolvedAgencyId(request?: NextRequest, user?: any): Promise<string> {
  // 1. Check custom header if valid UUID/string and not dummy fallback
  if (request) {
    const headerId = request.headers.get('x-agency-id');
    if (headerId && headerId !== 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d') {
      const exists = await prisma.agency.findUnique({
        where: { id: headerId },
        select: { id: true }
      }).catch(() => null);
      if (exists) return exists.id;
    }
  }

  // 2. Check User Metadata
  if (user?.user_metadata?.agency_id) {
    const exists = await prisma.agency.findUnique({
      where: { id: user.user_metadata.agency_id },
      select: { id: true }
    }).catch(() => null);
    if (exists) return exists.id;
  }

  // 3. Query existing agency in DB (demo, apex, or first agency)
  const existingAgency = await prisma.agency.findFirst({
    where: {
      OR: [
        { subdomain: 'demo' },
        { subdomain: 'apex' }
      ]
    },
    select: { id: true }
  }).catch(() => null);

  if (existingAgency) {
    return existingAgency.id;
  }

  const anyAgency = await prisma.agency.findFirst({
    select: { id: true }
  }).catch(() => null);

  if (anyAgency) {
    return anyAgency.id;
  }

  // 4. Create default Agency if DB is empty
  const newAgency = await prisma.agency.create({
    data: {
      name: 'Apex Executive Search',
      subdomain: 'demo',
      subscriptionTier: 'ENTERPRISE'
    }
  });

  return newAgency.id;
}
