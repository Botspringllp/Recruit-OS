'use server';

import { prisma } from '@/lib/prisma';
import { hashPassword, comparePassword } from '@/lib/auth/password';
import { setSessionCookie, clearSession } from '@/lib/auth/session';

export interface LoginResult {
  success: boolean;
  error?: string;
  redirectTo?: string;
}

// Known master system emails for fail-safe Vercel login recovery
const MASTER_ADMIN_EMAILS = [
  'superadmin@recruitos.in',
  'ankurbakshi@botspring.in',
  'divyanshu@botspring.in'
];

/**
 * Authenticates user against PostgreSQL database using bcrypt password verification.
 * Includes resilient auto-seeding & fail-safe login for Vercel production deployments.
 */
export async function loginAction(formData: FormData): Promise<LoginResult> {
  const email = String(formData.get('email') || '').trim().toLowerCase();
  const password = String(formData.get('password') || '');

  if (!email || !password) {
    return { success: false, error: 'Email and password are required.' };
  }

  // 1. Fetch user directly from PostgreSQL database
  const user = await prisma.user.findFirst({
    where: {
      email: { equals: email, mode: 'insensitive' },
      deletedAt: null
    },
    include: { agency: true }
  }).catch(() => null);

  if (!user) {
    return { success: false, error: 'Invalid email or password.' };
  }

  // 2. Strict bcrypt password verification
  const isValid = await comparePassword(password, user.passwordHash);
  if (!isValid) {
    return { success: false, error: 'Invalid email or password.' };
  }

  // 3. Check Agency Suspension / Deletion / Expiry for non-Super-Admin users
  const userRoleStr = String(user.role || '').toUpperCase();
  if (userRoleStr !== 'SUPER_ADMIN' && userRoleStr !== 'MASTER_OWNER') {
    let agencyStatus = user.agency?.status;
    let agencyDeletedAt = user.agency?.deletedAt;
    let subscriptionExpiry = (user.agency as any)?.subscriptionExpiryDate;

    if (!user.agency && user.agencyId) {
      const dbAgency = await (prisma.agency as any).findUnique({
        where: { id: user.agencyId },
        select: { status: true, deletedAt: true, subscriptionExpiryDate: true }
      }).catch(() => null);
      if (dbAgency) {
        agencyStatus = dbAgency.status;
        agencyDeletedAt = dbAgency.deletedAt;
        subscriptionExpiry = dbAgency.subscriptionExpiryDate;
      }
    }

    const isExpired = subscriptionExpiry ? new Date(subscriptionExpiry) < new Date() : false;

    if (agencyStatus === 'SUSPENDED' || agencyDeletedAt !== null || isExpired) {
      return {
        success: false,
        error: 'Your agency account is currently inactive or suspended. Please contact your administrator.'
      };
    }
  }

  // 4. Update last login timestamp
  await prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() }
  }).catch(() => null);

  // 5. Set HTTP-only secure session cookie
  await setSessionCookie({
    userId: user.id,
    email: user.email,
    role: user.role,
    agencyId: user.agencyId || ''
  });

  // 6. Calculate target redirect route based on role
  let redirectTo = '/cockpit';

  if (userRoleStr === 'SUPER_ADMIN' || userRoleStr === 'MASTER_OWNER') {
    redirectTo = '/super-admin';
  } else if (userRoleStr === 'FINANCE_MANAGER' || userRoleStr === 'FINANCE_ADMIN') {
    redirectTo = '/finance';
  } else if (userRoleStr === 'COMPLIANCE_OFFICER') {
    redirectTo = '/compliance';
  } else if (userRoleStr === 'INTERVIEW_COORDINATOR') {
    redirectTo = '/interviews';
  }

  return { success: true, redirectTo };
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
