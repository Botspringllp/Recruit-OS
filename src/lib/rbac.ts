import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { ROLE_DEFAULT_PERMISSIONS, AVAILABLE_PERMISSIONS } from './permissions';

export interface UserPermissionItem {
  id?: string;
  resource: string;
  action: string;
}

export interface UserWithRoleAndPermissions {
  id: string;
  agencyId: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  status: string;
  isActive: boolean;
  permissions?: UserPermissionItem[];
  userRoles?: { roleName: string }[];
}

/**
 * Gets all effective permission strings for a user (combining role template & explicit custom permissions).
 */
export function getCurrentUserPermissions(user: UserWithRoleAndPermissions | null | undefined): string[] {
  if (!user) return [];

  const roleStr = String(user.role || '').toUpperCase();

  // MASTER_OWNER and AGENCY_OWNER have global permissions inside system/agency
  if (roleStr === 'MASTER_OWNER' || roleStr === 'AGENCY_OWNER' || roleStr === 'AGENCY_FOUNDER') {
    return ['*'];
  }

  const effectiveSet = new Set<string>();

  // 1. Add default permissions for the user's role
  const defaultPerms = ROLE_DEFAULT_PERMISSIONS[roleStr] || [];
  defaultPerms.forEach(p => effectiveSet.add(p));

  // 2. Add explicit database permissions assigned to the user
  if (Array.isArray(user.permissions)) {
    user.permissions.forEach(p => {
      if (typeof p === 'string') {
        effectiveSet.add(p);
      } else if (p && p.resource) {
        if (p.action && p.action !== 'access' && p.action !== '*') {
          effectiveSet.add(`${p.resource}.${p.action}`);
        } else {
          effectiveSet.add(p.resource);
        }
      }
    });
  }

  return Array.from(effectiveSet);
}

/**
 * Checks if a given user has a specific permission.
 * MASTER_OWNER and AGENCY_OWNER bypass all permission checks.
 */
export function hasPermission(user: UserWithRoleAndPermissions | null | undefined, permission: string): boolean {
  if (!user) return false;

  // Suspended or inactive users have no access
  if (user.isActive === false || user.status === 'INACTIVE' || user.status === 'SUSPENDED') {
    return false;
  }

  const roleStr = String(user.role || '').toUpperCase();

  // MASTER_OWNER and AGENCY_OWNER bypass all checks
  if (roleStr === 'MASTER_OWNER' || roleStr === 'AGENCY_OWNER' || roleStr === 'AGENCY_FOUNDER') {
    return true;
  }

  const permissions = getCurrentUserPermissions(user);
  if (permissions.includes('*')) return true;

  const [resource, action] = permission.split('.');

  return permissions.some(p => {
    if (p === '*') return true;
    if (p === permission) return true;

    // Support wildcard matching e.g. "candidate.*" matches "candidate.view"
    if (p.endsWith('.*')) {
      const pResource = p.slice(0, -2);
      if (pResource === resource) return true;
    }

    const [pResource, pAction] = p.split('.');
    if (pResource === resource && (pAction === '*' || pAction === action)) {
      return true;
    }

    return false;
  });
}

/**
 * Checks if a user possesses a specific role (or is MASTER_OWNER).
 */
export function hasRole(user: UserWithRoleAndPermissions | null | undefined, roleName: string): boolean {
  if (!user) return false;

  const roleStr = String(user.role || '').toUpperCase();
  if (roleStr === 'MASTER_OWNER') return true;

  if (roleStr === roleName.toUpperCase()) return true;

  if (Array.isArray(user.userRoles)) {
    return user.userRoles.some(r => String(r.roleName).toUpperCase() === roleName.toUpperCase());
  }

  return false;
}

/**
 * Helper to fetch current active user from database with permissions.
 */
export async function getCurrentUser(): Promise<UserWithRoleAndPermissions | null> {
  try {
    // Demo/system default user for server action evaluation if no request session
    const user = await prisma.user.findFirst({
      where: {
        deletedAt: null,
        status: 'ACTIVE'
      },
      include: {
        permissions: { select: { resource: true, action: true } },
        userRoles: { select: { roleName: true } }
      },
      orderBy: { createdAt: 'asc' }
    });

    return user as any;
  } catch (e) {
    return null;
  }
}

/**
 * Enforces permission requirement. If user lacks permission, logs ACCESS_DENIED audit event and throws an error.
 */
export async function requirePermission(permission: string, userOverride?: UserWithRoleAndPermissions | null): Promise<UserWithRoleAndPermissions> {
  const user = userOverride !== undefined ? userOverride : await getCurrentUser();

  if (!user || !hasPermission(user, permission)) {
    const [resource, action] = permission.split('.');

    logger.warn({
      event: 'ACCESS_DENIED',
      userId: user?.id || 'ANONYMOUS',
      agencyId: user?.agencyId || 'GLOBAL',
      resource: resource || permission,
      action: action || 'access'
    }, `🚫 [ACCESS_DENIED] User ${user?.email || 'Anonymous'} (Role: ${user?.role || 'None'}) denied permission '${permission}'`);

    throw new Error(`Access Denied: You do not have permission '${permission}' to access this resource.`);
  }

  return user;
}
