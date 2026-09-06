import { getSession } from '@/lib/auth/session';
import { prisma } from '@/lib/prisma';
import { UserContextType } from '@/types/dashboard';

/**
 * Retrieves the currently authenticated user session from PostgreSQL database.
 * Returns null if unauthenticated.
 */
export async function getCurrentUser(): Promise<UserContextType | null> {
  try {
    const session = await getSession();
    if (!session || (!session.userId && !session.email)) {
      return null;
    }

    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { id: session.userId },
          { email: session.email.toLowerCase() }
        ],
        deletedAt: null,
        status: 'ACTIVE'
      }
    });

    if (!user) return null;

    return {
      userId: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role as any
    };
  } catch (error) {
    console.error('Error fetching current user:', error);
    return null;
  }
}
