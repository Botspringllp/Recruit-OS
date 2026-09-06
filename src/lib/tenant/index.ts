import { getSession } from '@/lib/auth/session';
import { prisma } from '@/lib/prisma';
import { TenantContextType } from '@/types/dashboard';

/**
 * Resolves tenant agency metadata for the current request context.
 */
export async function getCurrentAgency(subdomain?: string): Promise<TenantContextType | null> {
  try {
    const session = await getSession();
    if (!session || !session.agencyId) {
      return {
        agencyId: 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d',
        agencyName: 'RecruitOS Enterprise Workspace',
        subdomain: subdomain || 'demo',
        subscriptionTier: 'ENTERPRISE',
        primaryColor: '#4F46E5',
      };
    }

    const agency = await prisma.agency.findUnique({
      where: { id: session.agencyId }
    });

    return {
      agencyId: agency?.id || session.agencyId,
      agencyName: agency?.name || 'RecruitOS Enterprise Workspace',
      subdomain: agency?.subdomain || subdomain || 'demo',
      subscriptionTier: (agency?.subscriptionTier as any) || 'ENTERPRISE',
      primaryColor: '#4F46E5',
    };
  } catch (error) {
    console.error('Error resolving tenant agency:', error);
    return null;
  }
}
