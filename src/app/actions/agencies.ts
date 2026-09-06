'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/rbac';
import { logger } from '@/lib/logger';
import { AgencyStatus, SubscriptionTier, UserRole, UserStatus } from '@prisma/client';
import { hashPassword } from '@/lib/auth/password';

export type CreateAgencyPayload = {
  name: string;
  subdomain?: string;
  ownerName: string;
  ownerEmail: string;
  temporaryPassword?: string;
  plan: SubscriptionTier;
};

export type ActionResult<T = any> = {
  success: boolean;
  data?: T;
  error?: string;
  errors?: Record<string, string>;
};

async function requireSuperAdmin(userOverride?: any) {
  const currentUser = userOverride || await getCurrentUser();
  const roleStr = String(currentUser?.role || '');

  if (!currentUser || (roleStr !== 'SUPER_ADMIN' && roleStr !== 'MASTER_OWNER')) {
    logger.warn({
      event: 'UNAUTHORIZED_SUPER_ADMIN_ACCESS',
      userId: currentUser?.id,
      email: currentUser?.email,
      role: currentUser?.role
    }, `🔒 [ACCESS DENIED] Super Admin privileges required for user ${currentUser?.email}`);
    throw new Error('Access denied. Platform Super Admin privileges required.');
  }

  return currentUser;
}

export async function getAgenciesAction(userOverride?: any): Promise<ActionResult<{ agencies: any[]; kpis: any }>> {
  try {
    const adminUser = await requireSuperAdmin(userOverride);

    logger.info({
      event: 'GET_AGENCIES_REQUESTED',
      superAdminId: adminUser.id,
      timestamp: new Date().toISOString()
    }, `🔍 [SUPER ADMIN] Fetching all agencies for ${adminUser.email}`);

    const agencies = await prisma.agency.findMany({
      where: { deletedAt: null },
      select: {
        id: true,
        name: true,
        subdomain: true,
        status: true,
        subscriptionTier: true,
        ownerId: true,
        createdAt: true,
        updatedAt: true,
        users: {
          where: {
            OR: [
              { role: UserRole.AGENCY_OWNER },
              { role: UserRole.AGENCY_FOUNDER },
              { role: UserRole.MASTER_OWNER }
            ],
            deletedAt: null
          },
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true
          },
          take: 1
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    const formattedAgencies = agencies.map((a: any) => {
      const owner = a.users?.[0] || null;
      return {
        id: a.id,
        name: a.name,
        subdomain: a.subdomain,
        status: a.status,
        plan: a.subscriptionTier,
        createdAt: a.createdAt,
        ownerName: owner ? `${owner.firstName} ${owner.lastName}` : 'Unassigned Owner',
        ownerEmail: owner ? owner.email : 'N/A',
        ownerId: owner ? owner.id : a.ownerId
      };
    });

    const kpis = {
      totalAgencies: formattedAgencies.length,
      activeAgencies: formattedAgencies.filter((a: any) => a.status === AgencyStatus.ACTIVE).length,
      trialAgencies: formattedAgencies.filter((a: any) => a.status === AgencyStatus.TRIAL).length,
      suspendedAgencies: formattedAgencies.filter((a: any) => a.status === AgencyStatus.SUSPENDED).length
    };

    return {
      success: true,
      data: {
        agencies: formattedAgencies,
        kpis
      }
    };
  } catch (error: any) {
    logger.error({ event: 'GET_AGENCIES_FAILED', error: error.message }, 'Failed to fetch platform agencies');
    return { success: false, error: error.message || 'Access denied' };
  }
}

export async function createAgencyAction(payload: CreateAgencyPayload, userOverride?: any): Promise<ActionResult<{ agencyId: string }>> {
  try {
    const adminUser = await requireSuperAdmin(userOverride);

    const name = (payload.name || '').trim();
    let subdomain = (payload.subdomain || '').trim().toLowerCase().replace(/[^a-z0-9-]/g, '');
    if (!subdomain && name) {
      const baseSlug = name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
      subdomain = baseSlug || `agency-${Date.now().toString(36)}`;
    }

    const ownerName = (payload.ownerName || '').trim();
    const ownerEmail = (payload.ownerEmail || '').trim().toLowerCase();
    const temporaryPassword = payload.temporaryPassword ? payload.temporaryPassword.trim() : '';
    const plan = payload.plan || SubscriptionTier.ENTERPRISE;

    const errors: Record<string, string> = {};
    if (!name) errors.name = 'Agency name is required';
    if (!subdomain) errors.subdomain = 'Valid agency name is required to generate subdomain';
    if (!ownerName) errors.ownerName = 'Agency owner name is required';
    if (!ownerEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(ownerEmail)) {
      errors.ownerEmail = 'Valid owner email is required';
    }
    if (!temporaryPassword || temporaryPassword.length < 6) {
      errors.temporaryPassword = 'Password is required and must be at least 6 characters long';
    }

    if (Object.keys(errors).length > 0) {
      return { success: false, errors };
    }

    const existingAgency = await prisma.agency.findFirst({
      where: { subdomain, deletedAt: null }
    });
    if (existingAgency) {
      subdomain = `${subdomain}-${Date.now().toString(36).slice(-4)}`;
    }

    const nameParts = ownerName.split(' ');
    const firstName = nameParts[0] || ownerName;
    const lastName = nameParts.slice(1).join(' ') || 'Owner';

    // 1. Create Agency
    const agency = await prisma.agency.create({
      data: {
        name,
        subdomain,
        status: AgencyStatus.ACTIVE,
        subscriptionTier: plan
      }
    });

    const passwordHash = await hashPassword(temporaryPassword);

    // 2. Create Agency Owner User
    const ownerUser = await prisma.user.create({
      data: {
        agencyId: agency.id,
        email: ownerEmail,
        passwordHash,
        firstName,
        lastName,
        role: UserRole.AGENCY_OWNER,
        status: UserStatus.ACTIVE,
        isActive: true
      }
    });

    // 3. Link Owner to Agency & UserRoleAssignment
    await (prisma.agency as any).update({
      where: { id: agency.id },
      data: { ownerId: ownerUser.id }
    });

    await prisma.userRoleAssignment.create({
      data: {
        agencyId: agency.id,
        userId: ownerUser.id,
        roleName: UserRole.AGENCY_OWNER
      }
    }).catch(() => null);

    logger.info({
      event: 'AGENCY_CREATED',
      agencyId: agency.id,
      name: agency.name,
      subdomain: agency.subdomain,
      plan: agency.subscriptionTier,
      createdBy: adminUser.id,
      timestamp: new Date().toISOString()
    }, `🏢 [AGENCY CREATED] ${agency.name} (${agency.subdomain})`);

    revalidatePath('/super-admin');
    return { success: true, data: { agencyId: agency.id } };
  } catch (error: any) {
    logger.error({ event: 'CREATE_AGENCY_FAILED', error: error.message }, 'Failed to create agency');
    return { success: false, error: error.message || 'Failed to create agency' };
  }
}

export async function suspendAgencyAction(agencyId: string, userOverride?: any): Promise<ActionResult> {
  try {
    const adminUser = await requireSuperAdmin(userOverride);

    const agency = await prisma.agency.findUnique({
      where: { id: agencyId }
    });

    if (!agency) {
      return { success: false, error: 'Agency not found' };
    }

    await prisma.agency.update({
      where: { id: agencyId },
      data: { status: AgencyStatus.SUSPENDED }
    });

    logger.info({
      event: 'AGENCY_SUSPENDED',
      agencyId,
      name: agency.name,
      suspendedBy: adminUser.id,
      timestamp: new Date().toISOString()
    }, `⚠️ [AGENCY SUSPENDED] ${agency.name} (${agency.id})`);

    revalidatePath('/super-admin');
    return { success: true };
  } catch (error: any) {
    logger.error({ event: 'SUSPEND_AGENCY_FAILED', agencyId, error: error.message }, 'Failed to suspend agency');
    return { success: false, error: error.message || 'Failed to suspend agency' };
  }
}

export async function activateAgencyAction(agencyId: string, userOverride?: any): Promise<ActionResult> {
  try {
    const adminUser = await requireSuperAdmin(userOverride);

    const agency = await prisma.agency.findUnique({
      where: { id: agencyId }
    });

    if (!agency) {
      return { success: false, error: 'Agency not found' };
    }

    await prisma.agency.update({
      where: { id: agencyId },
      data: { status: AgencyStatus.ACTIVE }
    });

    logger.info({
      event: 'AGENCY_ACTIVATED',
      agencyId,
      name: agency.name,
      activatedBy: adminUser.id,
      timestamp: new Date().toISOString()
    }, `✅ [AGENCY ACTIVATED] ${agency.name} (${agency.id})`);

    revalidatePath('/super-admin');
    return { success: true };
  } catch (error: any) {
    logger.error({ event: 'ACTIVATE_AGENCY_FAILED', agencyId, error: error.message }, 'Failed to activate agency');
    return { success: false, error: error.message || 'Failed to activate agency' };
  }
}

export async function deleteAgencyAction(agencyId: string, userOverride?: any): Promise<ActionResult> {
  try {
    const adminUser = await requireSuperAdmin(userOverride);

    const agency = await prisma.agency.findUnique({
      where: { id: agencyId }
    });

    if (!agency) {
      return { success: false, error: 'Agency not found' };
    }

    await prisma.agency.update({
      where: { id: agencyId },
      data: { deletedAt: new Date(), status: AgencyStatus.SUSPENDED }
    });

    logger.info({
      event: 'AGENCY_DELETED',
      agencyId,
      name: agency.name,
      deletedBy: adminUser.id,
      timestamp: new Date().toISOString()
    }, `🗑️ [AGENCY DELETED] ${agency.name} (${agency.id})`);

    revalidatePath('/super-admin');
    return { success: true };
  } catch (error: any) {
    logger.error({ event: 'DELETE_AGENCY_FAILED', agencyId, error: error.message }, 'Failed to delete agency');
    return { success: false, error: error.message || 'Failed to delete agency' };
  }
}

export async function restoreAgencyAction(agencyId: string, userOverride?: any): Promise<ActionResult> {
  try {
    const adminUser = await requireSuperAdmin(userOverride);

    const agency = await prisma.agency.findUnique({
      where: { id: agencyId }
    });

    if (!agency) {
      return { success: false, error: 'Agency not found' };
    }

    await prisma.agency.update({
      where: { id: agencyId },
      data: { deletedAt: null, status: AgencyStatus.ACTIVE }
    });

    logger.info({
      event: 'AGENCY_RESTORED',
      agencyId,
      name: agency.name,
      restoredBy: adminUser.id,
      timestamp: new Date().toISOString()
    }, `♻️ [AGENCY RESTORED] ${agency.name} (${agency.id})`);

    revalidatePath('/super-admin');
    return { success: true };
  } catch (error: any) {
    logger.error({ event: 'RESTORE_AGENCY_FAILED', agencyId, error: error.message }, 'Failed to restore agency');
    return { success: false, error: error.message || 'Failed to restore agency' };
  }
}

export async function permanentlyDeleteAgencyAction(agencyId: string, userOverride?: any): Promise<ActionResult> {
  try {
    const adminUser = await requireSuperAdmin(userOverride);

    const agency = await prisma.agency.findUnique({
      where: { id: agencyId }
    });

    if (!agency) {
      return { success: false, error: 'Agency not found' };
    }

    // Unlink ownerId to avoid circular foreign key restraint
    await prisma.agency.update({
      where: { id: agencyId },
      data: { ownerId: null }
    }).catch(() => null);

    // Delete user roles, users, and agency
    await prisma.userRoleAssignment.deleteMany({ where: { agencyId } }).catch(() => null);
    await prisma.user.deleteMany({ where: { agencyId } }).catch(() => null);
    await prisma.agency.delete({ where: { id: agencyId } });

    logger.info({
      event: 'AGENCY_PERMANENTLY_DELETED',
      agencyId,
      name: agency.name,
      deletedBy: adminUser.id,
      timestamp: new Date().toISOString()
    }, `🔥 [AGENCY PERMANENTLY DELETED] ${agency.name} (${agency.id})`);

    revalidatePath('/super-admin');
    return { success: true };
  } catch (error: any) {
    logger.error({ event: 'PERMANENT_DELETE_AGENCY_FAILED', agencyId, error: error.message }, 'Failed to permanently delete agency');
    return { success: false, error: error.message || 'Failed to permanently delete agency' };
  }
}

export async function getDeletedAgenciesAction(userOverride?: any): Promise<ActionResult<{ agencies: any[] }>> {
  try {
    const adminUser = await requireSuperAdmin(userOverride);

    const agencies = await prisma.agency.findMany({
      where: { deletedAt: { not: null } },
      select: {
        id: true,
        name: true,
        subdomain: true,
        status: true,
        subscriptionTier: true,
        ownerId: true,
        createdAt: true,
        deletedAt: true,
        users: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true
          },
          take: 1
        }
      },
      orderBy: { deletedAt: 'desc' }
    });

    const formattedAgencies = agencies.map((a: any) => {
      const owner = a.users?.[0] || null;
      return {
        id: a.id,
        name: a.name,
        subdomain: a.subdomain,
        status: a.status,
        plan: a.subscriptionTier,
        createdAt: a.createdAt,
        deletedAt: a.deletedAt,
        ownerName: owner ? `${owner.firstName} ${owner.lastName}` : 'Unassigned Owner',
        ownerEmail: owner ? owner.email : 'N/A',
        ownerId: owner ? owner.id : a.ownerId
      };
    });

    return {
      success: true,
      data: { agencies: formattedAgencies }
    };
  } catch (error: any) {
    logger.error({ event: 'GET_DELETED_AGENCIES_FAILED', error: error.message }, 'Failed to fetch deleted agencies');
    return { success: false, error: error.message || 'Failed to fetch deleted agencies' };
  }
}
