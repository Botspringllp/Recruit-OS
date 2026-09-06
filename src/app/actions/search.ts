'use server';

import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/rbac';

export interface GlobalSearchResult {
  clients: Array<{ id: string; name: string; industry: string | null; website: string | null }>;
  jobs: Array<{ id: string; title: string; companyName: string; status: string }>;
  candidates: Array<{ id: string; name: string; email: string; company: string | null; designation: string | null }>;
}

export async function globalSearchAction(query: string): Promise<GlobalSearchResult> {
  if (!query || query.trim().length < 1) {
    return { clients: [], jobs: [], candidates: [] };
  }

  const user = await getCurrentUser();
  if (!user) return { clients: [], jobs: [], candidates: [] };

  const agencyId = user.agencyId;
  const q = query.trim();

  try {
    // 1. Search Clients / Companies
    const clients = await prisma.client.findMany({
      where: {
        ...(agencyId ? { agencyId } : {}),
        companyName: { contains: q, mode: 'insensitive' },
        deletedAt: null
      },
      take: 5,
      select: {
        id: true,
        companyName: true,
        industry: true,
        website: true
      }
    }).catch(() => []);

    // 2. Search Job Mandates (by Title or Client Company Name)
    const jobs = await prisma.jobMandate.findMany({
      where: {
        ...(agencyId ? { agencyId } : {}),
        OR: [
          { title: { contains: q, mode: 'insensitive' } },
          { client: { companyName: { contains: q, mode: 'insensitive' } } }
        ]
      },
      take: 5,
      include: {
        client: { select: { companyName: true } }
      }
    }).catch(() => []);

    // 3. Search Candidates (by Name, Email, Current Company)
    const candidates = await prisma.candidateRecord.findMany({
      where: {
        ...(agencyId ? { agencyId } : {}),
        deletedAt: null,
        OR: [
          { firstName: { contains: q, mode: 'insensitive' } },
          { lastName: { contains: q, mode: 'insensitive' } },
          { email: { contains: q, mode: 'insensitive' } },
          { currentCompany: { contains: q, mode: 'insensitive' } }
        ]
      },
      take: 5
    }).catch(() => []);

    return {
      clients: clients.map(c => ({
        id: c.id,
        name: c.companyName,
        industry: c.industry,
        website: c.website
      })),
      jobs: jobs.map(j => ({
        id: j.id,
        title: j.title,
        companyName: j.client?.companyName || 'Unassigned Client',
        status: j.status
      })),
      candidates: candidates.map(c => ({
        id: c.id,
        name: `${c.firstName} ${c.lastName}`,
        email: c.email,
        company: c.currentCompany,
        designation: c.currentDesignation
      }))
    };
  } catch (error) {
    console.error('Error executing global search action:', error);
    return { clients: [], jobs: [], candidates: [] };
  }
}
