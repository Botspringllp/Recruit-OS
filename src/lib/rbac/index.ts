import { UserRoleType } from '@/types/dashboard';

export type PermissionDomain =
  | 'agencies'
  | 'users'
  | 'branding'
  | 'candidates'
  | 'jobs'
  | 'interviews'
  | 'compliance'
  | 'partners'
  | 'finance'
  | 'settings';

export type PermissionAction = 'CREATE' | 'READ' | 'UPDATE' | 'DELETE' | 'AUDIT';

/**
 * Validates whether a given user role possesses permission to perform an action on a domain entity.
 */
export function hasPermission(
  role: UserRoleType,
  domain: PermissionDomain,
  action: PermissionAction
): boolean {
  // AGENCY_FOUNDER has super-admin permissions across all domains
  if (role === 'AGENCY_FOUNDER') {
    return true;
  }

  switch (domain) {
    case 'finance':
      // Only AGENCY_FOUNDER and FINANCE_ADMIN can modify or audit finance
      return role === 'FINANCE_ADMIN';

    case 'settings':
    case 'branding':
      // Restricted strictly to AGENCY_FOUNDER
      return false;

    case 'candidates':
    case 'jobs':
    case 'interviews':
    case 'compliance':
      // Operational recruiters have full CRUD on candidates and job mandates
      if (role === 'RECRUITER') {
        return action !== 'DELETE'; // Recruiter cannot delete candidate master records
      }
      return false;

    case 'partners':
      return role === 'RECRUITER' || role === 'PARTNER_RECRUITER';

    default:
      return action === 'READ';
  }
}

/**
 * Enforces role access requirements. Throws an Error if role requirement is not satisfied.
 */
export function requireRole(userRole: UserRoleType, allowedRoles: UserRoleType[]): void {
  if (!allowedRoles.includes(userRole)) {
    throw new Error(`Forbidden: Role '${userRole}' is not authorized for this resource.`);
  }
}
