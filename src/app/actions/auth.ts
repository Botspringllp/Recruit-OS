'use server';

import { prisma } from '@/lib/prisma';
import { comparePassword } from '@/lib/auth/password';
import { setSessionCookie, clearSession } from '@/lib/auth/session';

export interface LoginResult {
  success: boolean;
  error?: string;
  redirectTo?: string;
}

/**
 * Authenticates user against PostgreSQL database using bcrypt password verification,
 * checks ACTIVE status, and sets HTTP-only session cookie upon success.
 */
export async function loginAction(formData: FormData): Promise<LoginResult> {
  const email = String(formData.get('email') || '').trim().toLowerCase();
  const password = String(formData.get('password') || '');

  if (!email || !password) {
    return { success: false, error: 'Email and password are required.' };
  }

  const user = await prisma.user.findFirst({
    where: {
      email,
      deletedAt: null
    },
    include: { agency: true }
  });

  if (!user) {
    return { success: false, error: 'Invalid email or password.' };
  }

  if (user.status !== 'ACTIVE' || !user.isActive) {
    return { success: false, error: 'Account is suspended or inactive. Please contact support.' };
  }

  const isValidPassword = await comparePassword(password, user.passwordHash);

  if (!isValidPassword) {
    return { success: false, error: 'Invalid email or password.' };
  }

  // Update last login timestamp
  await prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() }
  }).catch(() => null);

  // Set HTTP-only secure session cookie
  await setSessionCookie({
    userId: user.id,
    email: user.email,
    role: user.role,
    agencyId: user.agencyId || ''
  });

  // Calculate redirect route
  const roleStr = String(user.role || '').toUpperCase();
  let redirectTo = '/cockpit';

  if (roleStr === 'SUPER_ADMIN' || roleStr === 'MASTER_OWNER') {
    redirectTo = '/super-admin';
  } else if (roleStr === 'FINANCE_MANAGER' || roleStr === 'FINANCE_ADMIN') {
    redirectTo = '/finance';
  } else if (roleStr === 'COMPLIANCE_OFFICER') {
    redirectTo = '/compliance';
  } else if (roleStr === 'INTERVIEW_COORDINATOR') {
    redirectTo = '/interviews';
  }

  return {
    success: true,
    redirectTo
  };
}

/**
 * Destroys user session cookie and logs out.
 */
export async function logoutAction(): Promise<void> {
  await clearSession();
}

/**
 * Calculates target redirect path for an authenticated user based on role.
 */
export async function getPostLoginRedirectPathAction(email: string): Promise<string> {
  try {
    const user = await prisma.user.findFirst({
      where: {
        email: email.toLowerCase(),
        deletedAt: null,
        status: 'ACTIVE'
      },
      select: { role: true }
    });

    if (!user) {
      return '/cockpit';
    }

    const roleStr = String(user.role || '').toUpperCase();

    if (roleStr === 'SUPER_ADMIN' || roleStr === 'MASTER_OWNER') {
      return '/super-admin';
    }
    if (roleStr === 'FINANCE_MANAGER' || roleStr === 'FINANCE_ADMIN') {
      return '/finance';
    }
    if (roleStr === 'COMPLIANCE_OFFICER') {
      return '/compliance';
    }
    if (roleStr === 'INTERVIEW_COORDINATOR') {
      return '/interviews';
    }

    return '/cockpit';
  } catch (error) {
    return '/cockpit';
  }
}
