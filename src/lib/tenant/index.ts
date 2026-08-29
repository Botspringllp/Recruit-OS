import { createClient } from '@/lib/supabase/server';
import { TenantContextType } from '@/types/dashboard';

/**
 * Resolves tenant agency metadata for the current request context.
 */
export async function getCurrentAgency(subdomain?: string): Promise<TenantContextType | null> {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const agencyId = user?.user_metadata?.agency_id || 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d';
    const agencySubdomain = subdomain || user?.user_metadata?.agency_subdomain || 'apex';

    // Return resolved tenant context
    return {
      agencyId,
      agencyName: 'Apex Executive Search',
      subdomain: agencySubdomain,
      subscriptionTier: 'ENTERPRISE',
      primaryColor: '#4F46E5',
    };
  } catch (error) {
    console.error('Error resolving tenant agency:', error);
    return null;
  }
}
