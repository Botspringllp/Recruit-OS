'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/rbac';
import { logger } from '@/lib/logger';
import { AgencyStatus, SubscriptionTier, UserRole, UserStatus } from '@prisma/client';
import { createClient as createSupabaseAdminClient } from '@supabase/supabase-js';
import crypto from 'crypto';

export type CreateAgencyPayload = {
  name: string;
  subdomain: string;
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

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://hadrlwfcsoouttnzeoye.supabase.co';
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) return null;
  return createSupabaseAdminClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  });
}

async function requireSuperAdmin(userOverride?: any) {
  const currentUser = userOverride || await getCurrentUser();
  const roleStr = String(currentUser?.role || '');
  if (!currentUser || (roleStr !== 'SUPER_ADMIN' && roleStr !== 'MASTER_OWNER')) {
    throw new Error('Access denied: Platform Super Admin authorization required');
  }
  return currentUser;
}

export async function getAgenciesAction(userOverride?: any): Promise<ActionResult<{
  agencies: any[];
  kpis: {
    totalAgencies: number;
    activeAgencies: number;
    trialAgencies: number;
    suspendedAgencies: number;
  };
}>> {
  try {
    await requireSuperAdmin(userOverride);

    const agencies = await (prisma.agency as any).findMany({
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
    const subdomain = (payload.subdomain || '').trim().toLowerCase().replace(/[^a-z0-9-]/g, '');
    const ownerName = (payload.ownerName || '').trim();
    const ownerEmail = (payload.ownerEmail || '').trim().toLowerCase();
    const temporaryPassword = payload.temporaryPassword ? payload.temporaryPassword.trim() : 'TempPass123!';
    const plan = payload.plan || SubscriptionTier.ENTERPRISE;

    const errors: Record<string, string> = {};
    if (!name) errors.name = 'Agency name is required';
    if (!subdomain) errors.subdomain = 'Valid subdomain slug is required';
    if (!ownerName) errors.ownerName = 'Agency owner name is required';
    if (!ownerEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(ownerEmail)) {
      errors.ownerEmail = 'Valid owner email is required';
    }
    if (temporaryPassword && temporaryPassword.length < 6) {
      errors.temporaryPassword = 'Password must be at least 6 characters long';
    }

    if (Object.keys(errors).length > 0) {
      return { success: false, errors };
    }

    const existingAgency = await prisma.agency.findFirst({
      where: { subdomain }
    });
    if (existingAgency) {
      return { success: false, error: `Subdomain '${subdomain}' is already registered.` };
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

    // 2. Provision Supabase Auth User if available
    let supabaseUserId: string | null = null;
    const supabaseAdmin = getSupabaseAdmin();
    if (supabaseAdmin) {
      const { data: sbData, error: sbError } = await supabaseAdmin.auth.admin.createUser({
        email: ownerEmail,
        password: temporaryPassword,
        email_confirm: true,
        user_metadata: {
          agency_id: agency.id,
          role: UserRole.AGENCY_OWNER,
          first_name: firstName,
          last_name: lastName
        }
      });
      if (!sbError && sbData?.user) {
        supabaseUserId = sbData.user.id;
      }
    }

    const passwordHash = `$sha256$${crypto.createHash('sha256').update(temporaryPassword).digest('hex')}`;
    const createUserData: any = {
      agencyId: agency.id,
      email: ownerEmail,
      passwordHash,
      firstName,
      lastName,
      role: UserRole.AGENCY_OWNER,
      status: UserStatus.ACTIVE,
      isActive: true
    };
    if (supabaseUserId) {
      createUserData.id = supabaseUserId;
    }

    // 3. Create Agency Owner User
    const ownerUser = await prisma.user.create({
      data: createUserData
    });

    // 4. Link Owner to Agency & UserRoleAssignment
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

    // 5. Structured Audit Logging
    logger.info({
      event: 'AGENCY_CREATED',
      agencyId: agency.id,
      name: agency.name,
      subdomain: agency.subdomain,
      plan: agency.subscriptionTier,
      createdBy: adminUser.id,
      timestamp: new Date().toISOString()
    }, `🏢 [AGENCY CREATED] ${agency.name} (${agency.subdomain})`);

    logger.info({
      event: 'OWNER_CREATED',
      agencyId: agency.id,
      userId: ownerUser.id,
      email: ownerUser.email,
      role: ownerUser.role,
      timestamp: new Date().toISOString()
    }, `👤 [OWNER CREATED] ${ownerUser.firstName} ${ownerUser.lastName} (${ownerUser.email})`);

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
