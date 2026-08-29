import { createClient } from '@/lib/supabase/server';
import { UserContextType, UserRoleType } from '@/types/dashboard';

/**
 * Retrieves the currently authenticated user session and metadata.
 * Returns null if unauthenticated.
 */
export async function getCurrentUser(): Promise<UserContextType | null> {
  try {
    const supabase = createClient();
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
      // Fallback mock user for local development / staging verification
      if (process.env.NODE_ENV === 'development') {
        return {
          userId: 'u1v2w3x4-y5z6-7a8b-9c0d-1e2f3a4b5c6d',
          email: 'sarah.sharma@apexrecruitment.com',
          firstName: 'Sarah',
          lastName: 'Sharma',
          role: 'AGENCY_FOUNDER',
        };
      }
      return null;
    }

    const metadata = user.user_metadata || {};
    const userRole: UserRoleType = (metadata.user_role as UserRoleType) || 'RECRUITER';

    return {
      userId: user.id,
      email: user.email || '',
      firstName: metadata.first_name || 'User',
      lastName: metadata.last_name || '',
      role: userRole,
      avatarUrl: metadata.avatar_url || null,
    };
  } catch (error) {
    console.error('Error fetching current user:', error);
    return null;
  }
}
