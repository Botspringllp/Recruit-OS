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
  status?: AgencyStatus;
  websiteBuilderEnabled?: boolean;
  widgetEnabled?: boolean;
  websiteUrl?: string;
  businessEmail?: string;
  supportEmail?: string;
  phone?: string;
  alternatePhone?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  companyDescription?: string;
  gstNumber?: string;
  cinNumber?: string;
  panNumber?: string;
  subscriptionStartDate?: string | Date;
  subscriptionExpiryDate?: string | Date;
};

export type UpdateAgencyPayload = {
  name?: string;
  status?: AgencyStatus;
  plan?: SubscriptionTier;
  websiteBuilderEnabled?: boolean;
  widgetEnabled?: boolean;
  websiteUrl?: string;
  businessEmail?: string;
  supportEmail?: string;
  phone?: string;
  alternatePhone?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  companyDescription?: string;
  gstNumber?: string;
  cinNumber?: string;
  panNumber?: string;
  subscriptionStartDate?: string | Date | null;
  subscriptionExpiryDate?: string | Date | null;
  ownerName?: string;
  ownerEmail?: string;
};

export type ActionResult<T = any> = {
  success: boolean;
  data?: T;
  error?: string;
  errors?: Record<string, string>;
};

async function requireSuperAdmin(userOverride?: any) {
  const currentUser = userOverride || await getCurrentUser();
  const roleStr = String(currentUser?.role || '').toUpperCase();

  if (!currentUser || (roleStr !== 'SUPER_ADMIN' && roleStr !== 'MASTER_OWNER' && roleStr !== 'AGENCY_OWNER' && roleStr !== 'AGENCY_FOUNDER')) {
    logger.warn({
      event: 'UNAUTHORIZED_SUPER_ADMIN_ACCESS',
      userId: currentUser?.id || currentUser?.userId,
      email: currentUser?.email,
      role: currentUser?.role
    }, `🔒 [ACCESS DENIED] Privileges required for user ${currentUser?.email}`);
    throw new Error('Access denied. Admin privileges required.');
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
        websiteUrl: true,
        websiteBuilderEnabled: true,
        widgetEnabled: true,
        subscriptionExpiryDate: true,
        ownerId: true,
        createdAt: true,
        updatedAt: true,
        users: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    const formattedAgencies = agencies.map((a: any) => {
      let owner = a.ownerId ? a.users?.find((u: any) => u.id === a.ownerId) : null;
      if (!owner) {
        owner = a.users?.find((u: any) =>
          u.role === UserRole.AGENCY_OWNER ||
          u.role === UserRole.AGENCY_FOUNDER ||
          u.role === UserRole.MASTER_OWNER
        ) || a.users?.[0] || null;
      }

      return {
        id: a.id,
        name: a.name,
        subdomain: a.subdomain,
        status: a.status,
        plan: a.subscriptionTier,
        websiteUrl: a.websiteUrl || null,
        websiteBuilderEnabled: a.websiteBuilderEnabled || false,
        widgetEnabled: a.widgetEnabled || false,
        subscriptionExpiryDate: a.subscriptionExpiryDate || null,
        createdAt: a.createdAt,
        ownerName: owner ? `${owner.firstName} ${owner.lastName}`.trim() : 'Unassigned Owner',
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

    // 1. Check if Agency Name or Subdomain already exists in DB
    const existingAgency = await prisma.agency.findFirst({
      where: {
        OR: [
          { name: { equals: name, mode: 'insensitive' } },
          { subdomain: subdomain }
        ]
      }
    });

    if (existingAgency) {
      return {
        success: false,
        error: `This agency ("${name}") is already registered in the system. If you want to re-register it, please permanently delete the existing agency from Deleted Agencies first.`
      };
    }

    // 2. Check if Owner Email already exists in DB
    const existingUser = await prisma.user.findFirst({
      where: { email: ownerEmail }
    });

    if (existingUser) {
      return {
        success: false,
        error: `This owner email address ("${ownerEmail}") is already registered to an existing company in the system. Re-registration with the same email is not allowed.`
      };
    }

    const nameParts = ownerName.split(' ');
    const firstName = nameParts[0] || ownerName;
    const lastName = nameParts.slice(1).join(' ') || 'Owner';

    const status = payload.status || AgencyStatus.ACTIVE;
    const websiteBuilderEnabled = Boolean(payload.websiteBuilderEnabled);
    const widgetEnabled = Boolean(payload.widgetEnabled);

    // 1. Create Agency
    const agency = await prisma.agency.create({
      data: {
        name,
        subdomain,
        status,
        subscriptionTier: plan,
        websiteBuilderEnabled,
        widgetEnabled,
        websiteUrl: payload.websiteUrl?.trim() || null,
        businessEmail: payload.businessEmail?.trim()?.toLowerCase() || null,
        supportEmail: payload.supportEmail?.trim()?.toLowerCase() || null,
        phone: payload.phone?.trim() || null,
        alternatePhone: payload.alternatePhone?.trim() || null,
        address: payload.address?.trim() || null,
        city: payload.city?.trim() || null,
        state: payload.state?.trim() || null,
        country: payload.country?.trim() || null,
        companyDescription: payload.companyDescription?.trim() || null,
        gstNumber: payload.gstNumber?.trim() || null,
        cinNumber: payload.cinNumber?.trim() || null,
        panNumber: payload.panNumber?.trim() || null,
        subscriptionStartDate: payload.subscriptionStartDate ? new Date(payload.subscriptionStartDate) : null,
        subscriptionExpiryDate: payload.subscriptionExpiryDate ? new Date(payload.subscriptionExpiryDate) : null
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
    if (error.code === 'P2002') {
      const targetStr = Array.isArray(error.meta?.target) ? error.meta.target.join(', ') : String(error.meta?.target || '');
      if (targetStr.includes('subdomain')) {
        return { success: false, error: 'An agency with this subdomain or name already exists in the system. Please choose a slightly different Agency Name.' };
      }
      if (targetStr.includes('email')) {
        return { success: false, error: 'A user with this owner email address already exists in the system.' };
      }
      return { success: false, error: `A unique constraint failed on field: ${targetStr || 'database record'}` };
    }
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

    // 1. Unlink owner_id and manager_id to remove circular foreign keys
    await prisma.$executeRawUnsafe(`UPDATE agencies SET owner_id = NULL WHERE agency_id = $1::uuid`, agencyId).catch(() => null);
    await prisma.$executeRawUnsafe(`UPDATE agencies SET "ownerId" = NULL WHERE id = $1`, agencyId).catch(() => null);
    await prisma.$executeRawUnsafe(`UPDATE users SET manager_id = NULL WHERE agency_id = $1::uuid`, agencyId).catch(() => null);
    await prisma.$executeRawUnsafe(`UPDATE users SET "managerId" = NULL WHERE "agencyId" = $1`, agencyId).catch(() => null);

    // 2. Clear candidate sub-records by candidate IDs
    const candIds = (await prisma.candidateRecord.findMany({ where: { agencyId }, select: { id: true } })).map(c => c.id);
    if (candIds.length > 0) {
      await (prisma as any).candidateSubmission?.deleteMany({ where: { candidateId: { in: candIds } } }).catch(() => null);
      await (prisma as any).clientSubmissionCandidate?.deleteMany({ where: { candidateId: { in: candIds } } }).catch(() => null);
      await (prisma as any).candidateOwnershipLog?.deleteMany({ where: { candidateId: { in: candIds } } }).catch(() => null);
      await (prisma as any).candidateRelationship?.deleteMany({ where: { candidateId: { in: candIds } } }).catch(() => null);
      await (prisma as any).candidateComplianceDoc?.deleteMany({ where: { candidateId: { in: candIds } } }).catch(() => null);
      await (prisma as any).candidateDiscussionNote?.deleteMany({ where: { candidateId: { in: candIds } } }).catch(() => null);
      await (prisma as any).candidateStageHistory?.deleteMany({ where: { candidateId: { in: candIds } } }).catch(() => null);
      await (prisma as any).candidateMatchScore?.deleteMany({ where: { candidateId: { in: candIds } } }).catch(() => null);
      await (prisma as any).candidateDocument?.deleteMany({ where: { candidateId: { in: candIds } } }).catch(() => null);
    }

    // Clear user dependent tables by user_id
    await prisma.$executeRawUnsafe(`DELETE FROM user_permissions WHERE user_id IN (SELECT user_id FROM users WHERE agency_id = $1::uuid)`, agencyId).catch(() => null);
    await prisma.$executeRawUnsafe(`DELETE FROM user_permissions WHERE "userId" IN (SELECT id FROM users WHERE "agencyId" = $1)`, agencyId).catch(() => null);
    await prisma.$executeRawUnsafe(`DELETE FROM auth_sessions WHERE user_id IN (SELECT user_id FROM users WHERE agency_id = $1::uuid)`, agencyId).catch(() => null);
    await prisma.$executeRawUnsafe(`DELETE FROM auth_sessions WHERE "userId" IN (SELECT id FROM users WHERE "agencyId" = $1)`, agencyId).catch(() => null);

    // 3. Clear candidate dependent child tables by candidate_id
    await prisma.$executeRawUnsafe(`DELETE FROM candidate_discussion_notes WHERE candidate_id IN (SELECT candidate_id FROM candidate_records WHERE agency_id = $1::uuid)`, agencyId).catch(() => null);
    await prisma.$executeRawUnsafe(`DELETE FROM candidate_discussion_notes WHERE "candidateId" IN (SELECT id FROM candidate_records WHERE "agencyId" = $1)`, agencyId).catch(() => null);
    await prisma.$executeRawUnsafe(`DELETE FROM candidate_stage_histories WHERE candidate_id IN (SELECT candidate_id FROM candidate_records WHERE agency_id = $1::uuid)`, agencyId).catch(() => null);
    await prisma.$executeRawUnsafe(`DELETE FROM candidate_stage_histories WHERE "candidateId" IN (SELECT id FROM candidate_records WHERE "agencyId" = $1)`, agencyId).catch(() => null);
    await prisma.$executeRawUnsafe(`DELETE FROM candidate_match_scores WHERE candidate_id IN (SELECT candidate_id FROM candidate_records WHERE agency_id = $1::uuid)`, agencyId).catch(() => null);
    await prisma.$executeRawUnsafe(`DELETE FROM candidate_documents WHERE candidate_id IN (SELECT candidate_id FROM candidate_records WHERE agency_id = $1::uuid)`, agencyId).catch(() => null);
    await prisma.$executeRawUnsafe(`DELETE FROM candidate_relationships WHERE candidate_id IN (SELECT candidate_id FROM candidate_records WHERE agency_id = $1::uuid)`, agencyId).catch(() => null);
    await prisma.$executeRawUnsafe(`DELETE FROM candidate_ownership_logs WHERE candidate_id IN (SELECT candidate_id FROM candidate_records WHERE agency_id = $1::uuid)`, agencyId).catch(() => null);
    await prisma.$executeRawUnsafe(`DELETE FROM candidate_compliance_docs WHERE candidate_id IN (SELECT candidate_id FROM candidate_records WHERE agency_id = $1::uuid)`, agencyId).catch(() => null);
    await prisma.$executeRawUnsafe(`DELETE FROM candidate_prep_logs WHERE candidate_id IN (SELECT candidate_id FROM candidate_records WHERE agency_id = $1::uuid)`, agencyId).catch(() => null);
    await prisma.$executeRawUnsafe(`DELETE FROM candidate_interview_feedbacks WHERE candidate_id IN (SELECT candidate_id FROM candidate_records WHERE agency_id = $1::uuid)`, agencyId).catch(() => null);
    await prisma.$executeRawUnsafe(`DELETE FROM client_submission_candidates WHERE candidate_id IN (SELECT candidate_id FROM candidate_records WHERE agency_id = $1::uuid)`, agencyId).catch(() => null);

    // 4. Clear client dependent child tables by client_id
    await prisma.$executeRawUnsafe(`DELETE FROM client_contacts WHERE client_id IN (SELECT client_id FROM clients WHERE agency_id = $1::uuid)`, agencyId).catch(() => null);
    await prisma.$executeRawUnsafe(`DELETE FROM client_portal_tokens WHERE client_id IN (SELECT client_id FROM clients WHERE agency_id = $1::uuid)`, agencyId).catch(() => null);
    await prisma.$executeRawUnsafe(`DELETE FROM client_submissions WHERE client_id IN (SELECT client_id FROM clients WHERE agency_id = $1::uuid)`, agencyId).catch(() => null);

    // 5. Clear mandate dependent child tables by mandate_id
    await prisma.$executeRawUnsafe(`DELETE FROM job_prep_kits WHERE mandate_id IN (SELECT mandate_id FROM job_mandates WHERE agency_id = $1::uuid)`, agencyId).catch(() => null);
    await prisma.$executeRawUnsafe(`DELETE FROM proposed_interview_slots WHERE mandate_id IN (SELECT mandate_id FROM job_mandates WHERE agency_id = $1::uuid)`, agencyId).catch(() => null);
    await prisma.$executeRawUnsafe(`DELETE FROM interview_schedules WHERE mandate_id IN (SELECT mandate_id FROM job_mandates WHERE agency_id = $1::uuid)`, agencyId).catch(() => null);
    await prisma.$executeRawUnsafe(`DELETE FROM notice_period_trackers WHERE mandate_id IN (SELECT mandate_id FROM job_mandates WHERE agency_id = $1::uuid)`, agencyId).catch(() => null);
    await prisma.$executeRawUnsafe(`DELETE FROM notice_period_pulse_responses WHERE mandate_id IN (SELECT mandate_id FROM job_mandates WHERE agency_id = $1::uuid)`, agencyId).catch(() => null);

    // 6. Direct agency_id table sweeps
    const tables = [
      'client_submission_candidates', 'client_submissions', 'candidate_discussion_notes',
      'candidate_stage_histories', 'candidate_match_scores', 'candidate_documents',
      'candidate_relationships', 'candidate_ownership_logs', 'pipeline_sla_logs',
      'communication_templates', 'communication_logs', 'client_portal_tokens',
      'proposed_interview_slots', 'interview_schedules', 'candidate_prep_logs',
      'candidate_interview_feedbacks', 'notice_period_trackers', 'notice_period_pulse_responses',
      'candidate_compliance_docs', 'compliance_audit_logs', 'job_offer_audits',
      'client_hr_handoffs', 'probation_guarantee_trackers', 'partner_mandate_shares',
      'partner_candidate_submissions', 'candidate_ownership_arbitrations', 'partner_split_ledgers',
      'invoice_records', 'financial_vouchers', 'financial_audit_logs',
      'agency_storefront_profiles', 'inbound_client_mandates', 'storefront_talent_showcases',
      'storefront_candidate_applications', 'system_activity_logs', 'notification_queue',
      'file_storage_records', 'user_role_assignments', 'agency_branding',
      'agency_job_board_credentials', 'client_contacts', 'job_prep_kits',
      'candidate_records', 'job_mandates', 'clients', 'users'
    ];

    for (const t of tables) {
      await prisma.$executeRawUnsafe(`DELETE FROM "${t}" WHERE agency_id = $1::uuid`, agencyId).catch(() => null);
      await prisma.$executeRawUnsafe(`DELETE FROM "${t}" WHERE "agencyId" = $1::uuid`, agencyId).catch(() => null);
      await prisma.$executeRawUnsafe(`DELETE FROM "${t}" WHERE "agencyId" = $1`, agencyId).catch(() => null);
    }

    // Junction table partner_agencies
    await prisma.$executeRawUnsafe(`DELETE FROM partner_agencies WHERE agency_id = $1::uuid OR partner_agency_id = $1::uuid`, agencyId).catch(() => null);

    // 7. Finally delete the agency row itself!
    await prisma.$executeRawUnsafe(`DELETE FROM agencies WHERE agency_id = $1::uuid`, agencyId).catch(() => null);
    await prisma.$executeRawUnsafe(`DELETE FROM agencies WHERE id = $1`, agencyId).catch(() => null);
    await prisma.agency.delete({ where: { id: agencyId } }).catch(() => null);

    logger.info({
      event: 'AGENCY_PERMANENTLY_DELETED',
      agencyId,
      deletedBy: adminUser.id,
      timestamp: new Date().toISOString()
    }, `🔥 [AGENCY PERMANENTLY DELETED] (${agencyId})`);

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

    const agencies = await (prisma.agency as any).findMany({
      where: { deletedAt: { not: null } },
      select: {
        id: true,
        name: true,
        subdomain: true,
        status: true,
        subscriptionTier: true,
        websiteUrl: true,
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
          }
        }
      },
      orderBy: { deletedAt: 'desc' }
    });

    const formattedAgencies = agencies.map((a: any) => {
      let owner = a.ownerId ? a.users?.find((u: any) => u.id === a.ownerId) : null;
      if (!owner) {
        owner = a.users?.find((u: any) =>
          u.role === UserRole.AGENCY_OWNER ||
          u.role === UserRole.AGENCY_FOUNDER ||
          u.role === UserRole.MASTER_OWNER
        ) || a.users?.[0] || null;
      }

      return {
        id: a.id,
        name: a.name,
        subdomain: a.subdomain,
        status: a.status,
        plan: a.subscriptionTier,
        websiteUrl: a.websiteUrl || null,
        createdAt: a.createdAt,
        deletedAt: a.deletedAt,
        ownerName: owner ? `${owner.firstName} ${owner.lastName}`.trim() : 'Unassigned Owner',
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

export async function getAgencyProfileByIdAction(agencyId: string, userOverride?: any): Promise<ActionResult<any>> {
  try {
    const adminUser = await requireSuperAdmin(userOverride);

    const agency = await prisma.agency.findUnique({
      where: { id: agencyId },
      include: {
        users: {
          where: {
            OR: [
              { role: UserRole.AGENCY_OWNER },
              { role: UserRole.AGENCY_FOUNDER },
              { role: UserRole.MASTER_OWNER }
            ],
            deletedAt: null
          },
          take: 1
        }
      }
    });

    if (!agency) {
      return { success: false, error: 'Agency not found' };
    }

    const owner = agency.users?.[0] || null;

    // Fetch live statistics directly from DB (No mock values!)
    const [recruitersCount, clientsCount, candidatesCount, activeJobMandatesCount] = await Promise.all([
      prisma.user.count({
        where: {
          agencyId,
          role: UserRole.RECRUITER,
          deletedAt: null
        }
      }),
      prisma.client.count({
        where: {
          agencyId,
          deletedAt: null
        }
      }),
      prisma.candidateRecord.count({
        where: {
          agencyId,
          deletedAt: null
        }
      }),
      prisma.jobMandate.count({
        where: {
          agencyId,
          status: 'OPEN'
        }
      })
    ]);

    return {
      success: true,
      data: {
        agency: {
          ...agency,
          ownerName: owner ? `${owner.firstName} ${owner.lastName}` : 'Unassigned Owner',
          ownerEmail: owner ? owner.email : 'N/A'
        },
        stats: {
          recruitersCount,
          clientsCount,
          candidatesCount,
          activeJobMandatesCount
        }
      }
    };
  } catch (error: any) {
    logger.error({ event: 'GET_AGENCY_PROFILE_FAILED', agencyId, error: error.message }, 'Failed to fetch agency profile');
    return { success: false, error: error.message || 'Failed to fetch agency profile' };
  }
}

export async function updateAgencyAction(agencyId: string, payload: UpdateAgencyPayload, userOverride?: any): Promise<ActionResult> {
  try {
    const adminUser = await requireSuperAdmin(userOverride);

    const existingAgency = await prisma.agency.findUnique({
      where: { id: agencyId }
    });

    if (!existingAgency) {
      return { success: false, error: 'Agency not found' };
    }

    const dataToUpdate: any = {};

    if (payload.name !== undefined) dataToUpdate.name = payload.name.trim();
    if (payload.status !== undefined) dataToUpdate.status = payload.status;
    if (payload.plan !== undefined) dataToUpdate.subscriptionTier = payload.plan;
    if (payload.websiteBuilderEnabled !== undefined) dataToUpdate.websiteBuilderEnabled = payload.websiteBuilderEnabled;
    if (payload.widgetEnabled !== undefined) dataToUpdate.widgetEnabled = payload.widgetEnabled;

    if (payload.websiteUrl !== undefined) dataToUpdate.websiteUrl = payload.websiteUrl?.trim() || null;
    if (payload.businessEmail !== undefined) dataToUpdate.businessEmail = payload.businessEmail?.trim()?.toLowerCase() || null;
    if (payload.supportEmail !== undefined) dataToUpdate.supportEmail = payload.supportEmail?.trim()?.toLowerCase() || null;
    if (payload.phone !== undefined) dataToUpdate.phone = payload.phone?.trim() || null;
    if (payload.alternatePhone !== undefined) dataToUpdate.alternatePhone = payload.alternatePhone?.trim() || null;
    if (payload.address !== undefined) dataToUpdate.address = payload.address?.trim() || null;
    if (payload.city !== undefined) dataToUpdate.city = payload.city?.trim() || null;
    if (payload.state !== undefined) dataToUpdate.state = payload.state?.trim() || null;
    if (payload.country !== undefined) dataToUpdate.country = payload.country?.trim() || null;
    if (payload.companyDescription !== undefined) dataToUpdate.companyDescription = payload.companyDescription?.trim() || null;

    if (payload.gstNumber !== undefined) dataToUpdate.gstNumber = payload.gstNumber?.trim() || null;
    if (payload.cinNumber !== undefined) dataToUpdate.cinNumber = payload.cinNumber?.trim() || null;
    if (payload.panNumber !== undefined) dataToUpdate.panNumber = payload.panNumber?.trim() || null;

    if (payload.subscriptionStartDate !== undefined) {
      dataToUpdate.subscriptionStartDate = payload.subscriptionStartDate ? new Date(payload.subscriptionStartDate) : null;
    }
    if (payload.subscriptionExpiryDate !== undefined) {
      dataToUpdate.subscriptionExpiryDate = payload.subscriptionExpiryDate ? new Date(payload.subscriptionExpiryDate) : null;
    }

    await prisma.agency.update({
      where: { id: agencyId },
      data: dataToUpdate
    });

    if (payload.ownerName || payload.ownerEmail) {
      const ownerUser = await prisma.user.findFirst({
        where: {
          agencyId,
          OR: [
            { role: UserRole.AGENCY_OWNER },
            { role: UserRole.AGENCY_FOUNDER },
            { role: UserRole.MASTER_OWNER }
          ],
          deletedAt: null
        }
      });

      if (ownerUser) {
        const userData: any = {};
        if (payload.ownerName) {
          const nameParts = payload.ownerName.trim().split(' ');
          userData.firstName = nameParts[0] || payload.ownerName;
          userData.lastName = nameParts.slice(1).join(' ') || 'Owner';
        }
        if (payload.ownerEmail) {
          userData.email = payload.ownerEmail.trim().toLowerCase();
        }

        await prisma.user.update({
          where: { id: ownerUser.id },
          data: userData
        });
      }
    }

    logger.info({
      event: 'AGENCY_UPDATED',
      agencyId,
      updatedBy: adminUser.id,
      timestamp: new Date().toISOString()
    }, `✏️ [AGENCY UPDATED] Updated ${existingAgency.name}`);

    revalidatePath('/super-admin');
    revalidatePath(`/super-admin/agencies/${agencyId}`);
    return { success: true };
  } catch (error: any) {
    logger.error({ event: 'UPDATE_AGENCY_FAILED', agencyId, error: error.message }, 'Failed to update agency');
    return { success: false, error: error.message || 'Failed to update agency' };
  }
}

export async function checkSubscriptionExpirationsAction(userOverride?: any): Promise<ActionResult<{ notificationsCreated: number }>> {
  try {
    const adminUser = await requireSuperAdmin(userOverride);

    const agencies = await (prisma.agency as any).findMany({
      where: {
        deletedAt: null,
        subscriptionExpiryDate: { not: null }
      },
      include: {
        users: {
          where: {
            OR: [
              { role: UserRole.AGENCY_OWNER },
              { role: UserRole.AGENCY_FOUNDER }
            ],
            deletedAt: null
          },
          take: 1
        }
      }
    });

    const now = new Date();
    const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    let notificationsCreated = 0;

    for (const agency of agencies) {
      if (!agency.subscriptionExpiryDate) continue;
      const expiry = new Date(agency.subscriptionExpiryDate);
      const owner = agency.users?.[0] || null;

      let isExpired = expiry < now;
      let isExpiringSoon = !isExpired && expiry <= sevenDaysFromNow;

      if (isExpired && agency.status !== AgencyStatus.SUSPENDED) {
        await prisma.agency.update({
          where: { id: agency.id },
          data: { status: AgencyStatus.SUSPENDED }
        }).catch(() => null);
      }

      if (isExpiringSoon || isExpired) {
        const typeStr = isExpired ? 'SUBSCRIPTION_EXPIRED' : 'SUBSCRIPTION_EXPIRING_SOON';
        const titleStr = isExpired
          ? `Subscription Expired for ${agency.name}`
          : `Subscription Expiring Soon for ${agency.name}`;
        const messageStr = isExpired
          ? `The subscription for agency ${agency.name} expired on ${expiry.toLocaleDateString()}.`
          : `The subscription for agency ${agency.name} will expire on ${expiry.toLocaleDateString()}.`;

        // 1. Notify Super Admin
        await prisma.notificationQueue.create({
          data: {
            agencyId: agency.id,
            channel: 'IN_APP',
            recipientIdentifier: adminUser.email,
            payloadJson: {
              type: typeStr,
              title: titleStr,
              message: messageStr,
              agencyId: agency.id,
              expiryDate: expiry.toISOString()
            },
            dispatchStatus: 'DISPATCHED',
            dispatchedAt: new Date()
          }
        });
        notificationsCreated++;

        // 2. Notify Agency Owner (if exists)
        if (owner && owner.email) {
          await prisma.notificationQueue.create({
            data: {
              agencyId: agency.id,
              channel: 'IN_APP',
              recipientIdentifier: owner.email,
              payloadJson: {
                type: typeStr,
                title: titleStr,
                message: messageStr,
                agencyId: agency.id,
                expiryDate: expiry.toISOString()
              },
              dispatchStatus: 'DISPATCHED',
              dispatchedAt: new Date()
            }
          });
          notificationsCreated++;
        }
      }
    }

    return { success: true, data: { notificationsCreated } };
  } catch (error: any) {
    logger.error({ event: 'CHECK_SUBSCRIPTIONS_FAILED', error: error.message }, 'Failed to check subscription expirations');
    return { success: false, error: error.message || 'Failed to check subscriptions' };
  }
}
