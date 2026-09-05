'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { UserRole, UserStatus } from '@prisma/client';
import { getResolvedAgencyId } from '@/lib/agency/resolver';
import { logger, logEvent } from '@/lib/logger';
import { requirePermission } from '@/lib/rbac';
import { AVAILABLE_PERMISSIONS } from '@/lib/permissions';

import { createClient as createSupabaseAdminClient } from '@supabase/supabase-js';
import crypto from 'crypto';

export type UserFormData = {
  firstName: string;
  lastName: string;
  email: string;
  password?: string;
  role: UserRole;
  status: UserStatus;
  managerId?: string | null;
  permissions?: string[];
};

export type ActionResult<T = any> = {
  success: boolean;
  data?: T;
  error?: string;
  errors?: Record<string, string>;
};

export async function getAvailablePermissionsAction() {
  return AVAILABLE_PERMISSIONS;
}

function parsePermission(permStr: string) {
  const parts = permStr.split('.');
  if (parts.length >= 2) {
    return { resource: parts[0], action: parts.slice(1).join('.') };
  }
  return { resource: permStr, action: 'access' };
}

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://hadrlwfcsoouttnzeoye.supabase.co';
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) return null;
  return createSupabaseAdminClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  });
}

export async function getUsersAction(agencyIdInput?: string, userOverride?: any): Promise<ActionResult<{
  users: any[];
  kpis: {
    totalUsers: number;
    activeUsers: number;
    invitedUsers: number;
    disabledUsers: number;
  };
}>> {
  try {
    await requirePermission('user.manage', userOverride);
    const agencyId = agencyIdInput || await getResolvedAgencyId();

    const users = await prisma.user.findMany({
      where: {
        agencyId,
        deletedAt: null
      },
      include: {
        manager: {
          select: { id: true, firstName: true, lastName: true, email: true }
        },
        permissions: {
          select: { resource: true, action: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    const kpis = {
      totalUsers: users.length,
      activeUsers: users.filter(u => u.status === 'ACTIVE' && u.isActive).length,
      invitedUsers: users.filter(u => u.status === 'INVITED').length,
      disabledUsers: users.filter(u => u.status === 'INACTIVE' || u.status === 'SUSPENDED' || !u.isActive).length
    };

    return {
      success: true,
      data: {
        users,
        kpis
      }
    };
  } catch (error: any) {
    logger.error({ event: 'GET_USERS_FAILED', error: error.message }, 'Failed to fetch users');
    return { success: false, error: error.message || 'Failed to fetch users' };
  }
}

export async function getUserByIdAction(userId: string, agencyIdInput?: string, userOverride?: any): Promise<ActionResult<any>> {
  try {
    await requirePermission('user.manage', userOverride);
    const agencyId = agencyIdInput || await getResolvedAgencyId();

    const user = await prisma.user.findFirst({
      where: {
        id: userId,
        agencyId,
        deletedAt: null
      },
      include: {
        manager: {
          select: { id: true, firstName: true, lastName: true, email: true }
        },
        directReports: {
          where: { deletedAt: null },
          select: { id: true, firstName: true, lastName: true, email: true, role: true, status: true }
        },
        permissions: {
          select: { id: true, resource: true, action: true }
        }
      }
    });

    if (!user) {
      return { success: false, error: 'User not found or access denied.' };
    }

    return { success: true, data: user };
  } catch (error: any) {
    logger.error({ event: 'GET_USER_BY_ID_FAILED', userId, error: error.message }, 'Failed to fetch user');
    return { success: false, error: error.message || 'Failed to fetch user' };
  }
}

export async function createUserAction(payload: UserFormData, agencyIdInput?: string, userOverride?: any): Promise<ActionResult<{ userId: string }>> {
  try {
    await requirePermission('user.manage', userOverride);
    const agencyId = agencyIdInput || await getResolvedAgencyId();

    const firstName = (payload.firstName || '').trim();
    const lastName = (payload.lastName || '').trim();
    const email = (payload.email || '').trim().toLowerCase();
    const password = payload.password ? payload.password.trim() : '';
    const role = payload.role || UserRole.RECRUITER;
    const status = payload.status || UserStatus.ACTIVE;
    const managerId = payload.managerId || null;
    const permissions = payload.permissions || [];

    const errors: Record<string, string> = {};
    if (!firstName) errors.firstName = 'First name is required';
    if (!lastName) errors.lastName = 'Last name is required';
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email = 'Valid email is required';
    }
    if (password && password.length < 6) {
      errors.password = 'Password must be at least 6 characters long';
    }

    if (role === UserRole.MASTER_OWNER) {
      errors.role = 'Only platform super-administrators can assign MASTER_OWNER role';
    }

    if (Object.keys(errors).length > 0) {
      return { success: false, errors };
    }

    const existingUser = await prisma.user.findFirst({
      where: { email, agencyId }
    });

    if (existingUser) {
      return { success: false, error: 'A user with this email already exists in this agency.' };
    }

    if (managerId) {
      const validManager = await prisma.user.findFirst({
        where: { id: managerId, agencyId, deletedAt: null }
      });
      if (!validManager) {
        return { success: false, error: 'Assigned manager not found in this agency.' };
      }
    }

    // Provision user in Supabase Auth if password is provided
    let supabaseAuthUserId: string | null = null;
    if (password) {
      const supabaseAdmin = getSupabaseAdmin();
      if (supabaseAdmin) {
        const { data: sbData, error: sbError } = await supabaseAdmin.auth.admin.createUser({
          email,
          password,
          email_confirm: true,
          user_metadata: {
            agency_id: agencyId,
            role,
            first_name: firstName,
            last_name: lastName
          }
        });

        if (!sbError && sbData?.user) {
          supabaseAuthUserId = sbData.user.id;
        } else if (sbError && sbError.message.includes('already registered')) {
          // If auth user already exists, update password and metadata
          const { data: listData } = await supabaseAdmin.auth.admin.listUsers();
          const existingSbUser = listData?.users?.find(u => u.email?.toLowerCase() === email);
          if (existingSbUser) {
            supabaseAuthUserId = existingSbUser.id;
            await supabaseAdmin.auth.admin.updateUserById(existingSbUser.id, {
              password,
              user_metadata: {
                agency_id: agencyId,
                role,
                first_name: firstName,
                last_name: lastName
              }
            }).catch(() => null);
          }
        }
      }
    }

    const passwordHash = password
      ? `$sha256$${crypto.createHash('sha256').update(password).digest('hex')}`
      : '$2b$10$UnassignedDummyHashForAgencyUser';

    const createUserData: any = {
      agencyId,
      firstName,
      lastName,
      email,
      passwordHash,
      role,
      status,
      isActive: status === UserStatus.ACTIVE || status === UserStatus.INVITED,
      managerId: managerId || null
    };

    if (supabaseAuthUserId) {
      createUserData.id = supabaseAuthUserId;
    }

    const newUser = await prisma.user.create({
      data: createUserData
    });

    await prisma.userRoleAssignment.create({
      data: {
        agencyId,
        userId: newUser.id,
        roleName: role
      }
    }).catch(() => null);

    if (permissions.length > 0) {
      const permissionRows = permissions.map(p => {
        const { resource, action } = parsePermission(p);
        return {
          userId: newUser.id,
          resource,
          action
        };
      });

      await prisma.userPermission.createMany({
        data: permissionRows,
        skipDuplicates: true
      });

      logger.info({
        event: 'PERMISSION_UPDATED',
        agencyId,
        userId: newUser.id,
        permissions,
        timestamp: new Date().toISOString()
      }, `🔐 [PERMISSION UPDATED] Assigned ${permissions.length} permissions to user ${newUser.email}`);
    }

    logger.info({
      event: 'USER_CREATED',
      userId: newUser.id,
      agencyId,
      email: newUser.email,
      role: newUser.role,
      status: newUser.status,
      timestamp: new Date().toISOString()
    }, `👤 [USER CREATED] Created user ${newUser.email} (${newUser.role})`);

    revalidatePath('/settings/users');
    return { success: true, data: { userId: newUser.id } };
  } catch (error: any) {
    logger.error({ event: 'CREATE_USER_FAILED', error: error.message }, 'Failed to create user');
    return { success: false, error: error.message || 'Failed to create user' };
  }
}

export async function updateUserAction(userId: string, payload: UserFormData, agencyIdInput?: string, userOverride?: any): Promise<ActionResult<{ userId: string }>> {
  try {
    await requirePermission('user.manage', userOverride);
    const agencyId = agencyIdInput || await getResolvedAgencyId();

    const existingUser = await prisma.user.findFirst({
      where: { id: userId, agencyId, deletedAt: null }
    });

    if (!existingUser) {
      return { success: false, error: 'User not found or access denied.' };
    }

    if (existingUser.role === UserRole.MASTER_OWNER) {
      return { success: false, error: 'Master Owner records cannot be modified via Agency Settings.' };
    }

    const firstName = (payload.firstName || existingUser.firstName).trim();
    const lastName = (payload.lastName || existingUser.lastName).trim();
    const email = (payload.email || existingUser.email).trim().toLowerCase();
    const role = payload.role || existingUser.role;
    const status = payload.status || existingUser.status;
    const managerId = payload.managerId !== undefined ? payload.managerId : existingUser.managerId;
    const permissions = payload.permissions;

    if (role === UserRole.MASTER_OWNER) {
      return { success: false, error: 'Cannot elevate agency user to MASTER_OWNER.' };
    }

    if (managerId && managerId === userId) {
      return { success: false, error: 'User cannot be assigned as their own manager.' };
    }

    await prisma.user.update({
      where: { id: userId },
      data: {
        firstName,
        lastName,
        email,
        role,
        status,
        isActive: status === UserStatus.ACTIVE || status === UserStatus.INVITED,
        managerId: managerId || null,
        updatedAt: new Date()
      }
    });

    await prisma.userRoleAssignment.upsert({
      where: {
        ux_user_roles_user_role: { userId, roleName: role }
      },
      update: { roleName: role },
      create: { agencyId, userId, roleName: role }
    }).catch(() => null);

    if (permissions !== undefined) {
      await prisma.userPermission.deleteMany({
        where: { userId }
      });

      if (permissions.length > 0) {
        const permissionRows = permissions.map(p => {
          const { resource, action } = parsePermission(p);
          return { userId, resource, action };
        });

        await prisma.userPermission.createMany({
          data: permissionRows,
          skipDuplicates: true
        });
      }
    }

    logger.info({
      event: 'USER_UPDATED',
      userId,
      agencyId,
      email,
      role,
      status
    }, `👤 [User Updated] ${firstName} ${lastName} (${email}) - Role: ${role}`);

    revalidatePath('/settings/users');
    revalidatePath(`/settings/users/${userId}`);
    return { success: true, data: { userId } };
  } catch (error: any) {
    logger.error({ event: 'UPDATE_USER_FAILED', userId, error: error.message }, 'Failed to update user');
    return { success: false, error: error.message || 'Failed to update user' };
  }
}

export async function disableUserAction(userId: string, agencyIdInput?: string, userOverride?: any): Promise<ActionResult<{ userId: string }>> {
  try {
    await requirePermission('user.manage', userOverride);
    const agencyId = agencyIdInput || await getResolvedAgencyId();

    const existingUser = await prisma.user.findFirst({
      where: { id: userId, agencyId, deletedAt: null }
    });

    if (!existingUser) {
      return { success: false, error: 'User not found or access denied.' };
    }

    if (existingUser.role === UserRole.MASTER_OWNER) {
      return { success: false, error: 'Cannot disable MASTER_OWNER user account.' };
    }

    await prisma.user.update({
      where: { id: userId },
      data: {
        status: UserStatus.INACTIVE,
        isActive: false,
        updatedAt: new Date()
      }
    });

    logger.info({
      event: 'USER_DISABLED',
      userId,
      agencyId,
      email: existingUser.email
    }, `👤 [User Disabled] ${existingUser.firstName} ${existingUser.lastName} (${existingUser.email})`);

    revalidatePath('/settings/users');
    revalidatePath(`/settings/users/${userId}`);
    return { success: true, data: { userId } };
  } catch (error: any) {
    logger.error({ event: 'DISABLE_USER_FAILED', userId, error: error.message }, 'Failed to disable user');
    return { success: false, error: error.message || 'Failed to disable user' };
  }
}
