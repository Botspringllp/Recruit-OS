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
        websiteUrl: true,
        websiteBuilderEnabled: true,
        widgetEnabled: true,
        subscriptionExpiryDate: true,
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
        websiteUrl: a.websiteUrl || null,
        websiteBuilderEnabled: a.websiteBuilderEnabled || false,
        widgetEnabled: a.widgetEnabled || false,
        subscriptionExpiryDate: a.subscriptionExpiryDate || null,
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
          role: { not: UserRole.SUPER_ADMIN },
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

    const agencies = await prisma.agency.findMany({
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
