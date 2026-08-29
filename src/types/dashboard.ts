export type UserRoleType = 
  | 'AGENCY_FOUNDER'
  | 'RECRUITER'
  | 'CLIENT_HR'
  | 'PARTNER_RECRUITER'
  | 'FINANCE_ADMIN';

export interface TenantContextType {
  agencyId: string;
  agencyName: string;
  subdomain: string;
  subscriptionTier: 'STARTER' | 'GROWTH' | 'ENTERPRISE';
  logoUrl?: string | null;
  primaryColor?: string;
}

export interface UserContextType {
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRoleType;
  avatarUrl?: string | null;
}

export interface NavigationItem {
  id: string;
  label: string;
  href: string;
  icon: string;
  badgeCount?: number;
  badgeVariant?: 'brand' | 'amber' | 'emerald' | 'rose';
  rolesAllowed: UserRoleType[];
}
