'use server';

import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/rbac';
import { revalidatePath } from 'next/cache';

export interface ActionResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface CreateRequirementPayload {
  positionTitle: string;
  companyName: string;
  contactPerson?: string;
  contactEmail?: string;
  contactNumber?: string;
  industryType?: string;
  employmentType?: string;
  experienceRequired?: string;
  location?: string;
  education?: string;
  skills?: string;
  jobDescription?: string;
  companyOverview?: string;
  source?: string; // Website, Email, WhatsApp, Manual, Referral
  priority?: string; // Low, Medium, High, Urgent
  assignedRecruiterId?: string;
  pdfName?: string;
  pdfBase64?: string;
}

/**
 * Gets all incoming requirements for the authenticated agency.
 */
export async function getIncomingRequirementsAction(filters?: {
  status?: string;
  source?: string;
  priority?: string;
  search?: string;
}): Promise<ActionResult<{ requirements: any[]; kpis: { totalPending: number; newToday: number; accepted: number; rejected: number } }>> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { success: false, error: 'Unauthorized session' };
    }

    const agencyId = user.agencyId || user.agency?.id;
    if (!agencyId && user.role !== 'SUPER_ADMIN') {
      return { success: false, error: 'No agency context found' };
    }

    const whereClause: any = {};
    if (agencyId) {
      whereClause.agencyId = agencyId;
    }

    if (filters?.status && filters.status !== 'ALL') {
      whereClause.status = filters.status;
    }

    if (filters?.source && filters.source !== 'ALL') {
      whereClause.source = filters.source;
    }

    if (filters?.priority && filters.priority !== 'ALL') {
      whereClause.priority = filters.priority;
    }

    if (filters?.search && filters.search.trim()) {
      const query = filters.search.trim();
      whereClause.OR = [
        { positionTitle: { contains: query, mode: 'insensitive' } },
        { companyName: { contains: query, mode: 'insensitive' } },
        { contactPerson: { contains: query, mode: 'insensitive' } }
      ];
    }

    const requirements = await (prisma as any).incomingRequirement.findMany({
      where: whereClause,
      include: {
        assignedRecruiter: {
          select: { id: true, firstName: true, lastName: true, email: true }
        },
        convertedMandate: {
          select: { id: true, title: true, status: true }
        },
        timelineEvents: {
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Calculate Live KPIs for this Agency
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const agencyBaseWhere = agencyId ? { agencyId } : {};

    const [totalPending, newToday, accepted, rejected] = await Promise.all([
      (prisma as any).incomingRequirement.count({
        where: {
          ...agencyBaseWhere,
          status: { in: ['Pending Review', 'Assigned'] }
        }
      }),
      (prisma as any).incomingRequirement.count({
        where: {
          ...agencyBaseWhere,
          createdAt: { gte: startOfToday }
        }
      }),
      (prisma as any).incomingRequirement.count({
        where: {
          ...agencyBaseWhere,
          status: { in: ['Accepted', 'Converted'] }
        }
      }),
      (prisma as any).incomingRequirement.count({
        where: {
          ...agencyBaseWhere,
          status: 'Rejected'
        }
      })
    ]);

    return {
      success: true,
      data: {
        requirements,
        kpis: {
          totalPending,
          newToday,
          accepted,
          rejected
        }
      }
    };
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to fetch incoming requirements' };
  }
}

/**
 * Gets a single incoming requirement by ID with full timeline history.
 */
export async function getIncomingRequirementByIdAction(id: string): Promise<ActionResult<{ requirement: any }>> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { success: false, error: 'Unauthorized session' };
    }

    const requirement = await (prisma as any).incomingRequirement.findUnique({
      where: { id },
      include: {
        assignedRecruiter: {
          select: { id: true, firstName: true, lastName: true, email: true }
        },
        convertedMandate: {
          select: { id: true, title: true, status: true }
        },
        timelineEvents: {
          orderBy: { createdAt: 'asc' }
        }
      }
    });

    if (!requirement) {
      return { success: false, error: 'Requirement not found' };
    }

    return { success: true, data: { requirement } };
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to fetch requirement details' };
  }
}

/**
 * Creates a new manual incoming requirement.
 */
export async function createIncomingRequirementAction(payload: CreateRequirementPayload): Promise<ActionResult<{ requirementId: string }>> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { success: false, error: 'Unauthorized session' };
    }

    const agencyId = user.agencyId || user.agency?.id;
    if (!agencyId) {
      return { success: false, error: 'No agency associated with user' };
    }

    const requirement = await (prisma as any).incomingRequirement.create({
      data: {
        agencyId,
        positionTitle: payload.positionTitle.trim().slice(0, 255),
        companyName: payload.companyName.trim().slice(0, 255),
        contactPerson: payload.contactPerson?.trim() ? payload.contactPerson.trim().slice(0, 255) : null,
        contactEmail: payload.contactEmail?.trim() ? payload.contactEmail.trim().slice(0, 255) : null,
        contactNumber: payload.contactNumber?.trim() ? payload.contactNumber.trim().slice(0, 32) : null,
        industryType: payload.industryType?.trim() ? payload.industryType.trim().slice(0, 128) : null,
        employmentType: payload.employmentType?.trim() ? payload.employmentType.trim().slice(0, 64) : 'Full-time',
        experienceRequired: payload.experienceRequired?.trim() ? payload.experienceRequired.trim().slice(0, 64) : null,
        location: payload.location?.trim() ? payload.location.trim().slice(0, 255) : null,
        education: payload.education?.trim() ? payload.education.trim().slice(0, 255) : null,
        skills: payload.skills?.trim() || null,
        jobDescription: payload.jobDescription?.trim() || null,
        companyOverview: payload.companyOverview?.trim() || null,
        pdfName: payload.pdfName ? payload.pdfName.slice(0, 255) : null,
        pdfUrl: payload.pdfBase64 || null,
        source: (payload.source || 'Manual').slice(0, 32),
        priority: (payload.priority || 'Medium').slice(0, 32),
        status: payload.assignedRecruiterId ? 'Assigned' : 'Pending Review',
        assignedRecruiterId: payload.assignedRecruiterId || null,
        createdBy: user.id
      }
    });

    // Auto-create initial timeline event
    await (prisma as any).requirementTimelineEvent.create({
      data: {
        requirementId: requirement.id,
        title: 'Requirement Received',
        description: `Logged via ${payload.source || 'Manual Intake'} by ${user.firstName} ${user.lastName}${payload.pdfName ? ` (${payload.pdfName})` : ''}`,
        actorId: user.id,
        actorName: `${user.firstName} ${user.lastName}`
      }
    });

    if (payload.assignedRecruiterId) {
      const recruiter = await prisma.user.findUnique({
        where: { id: payload.assignedRecruiterId },
        select: { firstName: true, lastName: true }
      });
      await (prisma as any).requirementTimelineEvent.create({
        data: {
          requirementId: requirement.id,
          title: 'Recruiter Assigned',
          description: `Assigned to ${recruiter ? `${recruiter.firstName} ${recruiter.lastName}` : 'Recruiter'}`,
          actorId: user.id,
          actorName: `${user.firstName} ${user.lastName}`
        }
      });
    }

    revalidatePath('/incoming-requirements');
    revalidatePath('/jobs');
    revalidatePath('/cockpit');

    return { success: true, data: { requirementId: requirement.id } };
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to create incoming requirement' };
  }
}

/**
 * Assigns or reassigns a recruiter to an incoming requirement.
 */
export async function assignRecruiterToRequirementAction(requirementId: string, recruiterId: string): Promise<ActionResult> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { success: false, error: 'Unauthorized session' };
    }

    const recruiter = await prisma.user.findUnique({
      where: { id: recruiterId },
      select: { firstName: true, lastName: true, email: true }
    });

    if (!recruiter) {
      return { success: false, error: 'Selected recruiter not found' };
    }

    const requirement = await (prisma as any).incomingRequirement.findUnique({ where: { id: requirementId } });
    if (!requirement) {
      return { success: false, error: 'Requirement not found' };
    }

    const updatedStatus = requirement.status === 'Pending Review' ? 'Assigned' : requirement.status;

    await (prisma as any).incomingRequirement.update({
      where: { id: requirementId },
      data: {
        assignedRecruiterId: recruiterId,
        status: updatedStatus,
        reviewedDate: new Date()
      }
    });

    await (prisma as any).requirementTimelineEvent.create({
      data: {
        requirementId,
        title: 'Recruiter Assigned',
        description: `Assigned to recruiter ${recruiter.firstName} ${recruiter.lastName}`,
        actorId: user.id,
        actorName: `${user.firstName} ${user.lastName}`
      }
    });

    // Trigger Notification Event B: Recruiter Assigned
    try {
      const { createNotification, NotificationType, NotificationCategory } = await import('@/lib/notifications');
      await createNotification({
        agencyId: requirement.agencyId,
        recipientUserId: recruiterId,
        title: 'Requirement Assigned',
        message: `You have been assigned a new requirement: ${requirement.positionTitle}`,
        type: NotificationType.INFO,
        category: NotificationCategory.REQUIREMENT,
        entityType: 'REQUIREMENT',
        entityId: requirementId
      });

      // Trigger Email Event: REQUIREMENT_ASSIGNED
      if (recruiter.email) {
        const { logRequirementAssignedEmail } = await import('@/lib/email');
        await logRequirementAssignedEmail(requirement.agencyId, recruiter.email, requirement.positionTitle, requirementId);
      }
    } catch (notifErr) {
      console.error('Failed sending recruiter assigned notification/email:', notifErr);
    }

    revalidatePath(`/incoming-requirements/${requirementId}`);
    revalidatePath('/incoming-requirements');

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to assign recruiter' };
  }
}

/**
 * Accepts requirement and converts it into an active Job Mandate.
 */
export async function acceptAndConvertRequirementAction(requirementId: string, recruiterId?: string): Promise<ActionResult<{ mandateId: string }>> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { success: false, error: 'Unauthorized session' };
    }

    const requirement = await (prisma as any).incomingRequirement.findUnique({
      where: { id: requirementId }
    });

    if (!requirement) {
      return { success: false, error: 'Requirement not found' };
    }

    if (requirement.status === 'Converted') {
      return { success: false, error: 'Requirement has already been converted to a Job Mandate.' };
    }

    const targetRecruiterId = recruiterId || requirement.assignedRecruiterId;

    // Find or create Client matching company name
    let client = await prisma.client.findFirst({
      where: {
        agencyId: requirement.agencyId,
        companyName: { equals: requirement.companyName, mode: 'insensitive' },
        deletedAt: null
      }
    });

    if (!client) {
      client = await prisma.client.create({
        data: {
          agencyId: requirement.agencyId,
          companyName: requirement.companyName,
          status: 'ACTIVE'
        }
      });
    }

    // 1. Create Job Mandate automatically
    const mandate = await prisma.jobMandate.create({
      data: {
        agencyId: requirement.agencyId,
        clientId: client.id,
        title: requirement.positionTitle,
        headcount: 1,
        status: 'OPEN'
      }
    });

    // 2. Mark requirement converted
    await (prisma as any).incomingRequirement.update({
      where: { id: requirementId },
      data: {
        status: 'Converted',
        acceptedDate: new Date(),
        assignedRecruiterId: targetRecruiterId || requirement.assignedRecruiterId,
        convertedMandateId: mandate.id
      }
    });

    // 3. Log Timeline events
    await (prisma as any).requirementTimelineEvent.create({
      data: {
        requirementId,
        title: 'Requirement Accepted',
        description: `Accepted by ${user.firstName} ${user.lastName}`,
        actorId: user.id,
        actorName: `${user.firstName} ${user.lastName}`
      }
    });

    await (prisma as any).requirementTimelineEvent.create({
      data: {
        requirementId,
        title: 'Converted To Job Mandate',
        description: `Job Mandate created: "${mandate.title}" (ID: ${mandate.id})`,
        actorId: user.id,
        actorName: `${user.firstName} ${user.lastName}`
      }
    });

    // Trigger Notification Event C: Requirement Accepted (Notify Assigned Recruiter)
    if (targetRecruiterId) {
      try {
        const { createNotification, NotificationType, NotificationCategory } = await import('@/lib/notifications');
        await createNotification({
          agencyId: requirement.agencyId,
          recipientUserId: targetRecruiterId,
          title: 'Requirement Accepted',
          message: `Requirement for "${requirement.positionTitle}" accepted and converted to active mandate.`,
          type: NotificationType.SUCCESS,
          category: NotificationCategory.JOB_MANDATE,
          entityType: 'JOB_MANDATE',
          entityId: mandate.id
        });

        // Trigger Email Event: REQUIREMENT_ACCEPTED
        const recruiterUser = await (prisma as any).user.findUnique({
          where: { id: targetRecruiterId },
          select: { email: true }
        });
        if (recruiterUser?.email) {
          const { logRequirementAcceptedEmail } = await import('@/lib/email');
          await logRequirementAcceptedEmail(requirement.agencyId, recruiterUser.email, requirement.positionTitle, mandate.id);
        }
      } catch (notifErr) {
        console.error('Failed sending requirement accepted notification/email:', notifErr);
      }
    }

    revalidatePath(`/incoming-requirements/${requirementId}`);
    revalidatePath('/incoming-requirements');
    revalidatePath('/jobs');
    revalidatePath('/cockpit');

    return { success: true, data: { mandateId: mandate.id } };
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to accept and convert requirement' };
  }
}

/**
 * Rejects an incoming requirement with timeline event.
 */
export async function rejectRequirementAction(requirementId: string, reason?: string): Promise<ActionResult> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { success: false, error: 'Unauthorized session' };
    }

    const requirement = await (prisma as any).incomingRequirement.findUnique({
      where: { id: requirementId }
    });

    await (prisma as any).incomingRequirement.update({
      where: { id: requirementId },
      data: {
        status: 'Rejected',
        reviewedDate: new Date()
      }
    });

    await (prisma as any).requirementTimelineEvent.create({
      data: {
        requirementId,
        title: 'Requirement Rejected',
        description: reason ? `Rejected with reason: ${reason}` : `Rejected by ${user.firstName} ${user.lastName}`,
        actorId: user.id,
        actorName: `${user.firstName} ${user.lastName}`
      }
    });

    // Trigger Notification Event D: Requirement Rejected (Notify Assigned Recruiter)
    if (requirement?.assignedRecruiterId) {
      try {
        const { createNotification, NotificationType, NotificationCategory } = await import('@/lib/notifications');
        await createNotification({
          agencyId: requirement.agencyId,
          recipientUserId: requirement.assignedRecruiterId,
          title: 'Requirement Rejected',
          message: `Requirement for "${requirement.positionTitle}" was rejected.${reason ? ` Reason: ${reason}` : ''}`,
          type: NotificationType.WARNING,
          category: NotificationCategory.REQUIREMENT,
          entityType: 'REQUIREMENT',
          entityId: requirementId
        });

        // Trigger Email Event: REQUIREMENT_REJECTED
        const recruiterUser = await (prisma as any).user.findUnique({
          where: { id: requirement.assignedRecruiterId },
          select: { email: true }
        });
        if (recruiterUser?.email) {
          const { logRequirementRejectedEmail } = await import('@/lib/email');
          await logRequirementRejectedEmail(requirement.agencyId, recruiterUser.email, requirement.positionTitle, reason);
        }
      } catch (notifErr) {
        console.error('Failed sending requirement rejected notification/email:', notifErr);
      }
    }

    revalidatePath(`/incoming-requirements/${requirementId}`);
    revalidatePath('/incoming-requirements');
    revalidatePath('/cockpit');

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to reject requirement' };
  }
}

/**
 * Restores a rejected incoming requirement back to Pending Review status.
 */
export async function restoreRequirementAction(requirementId: string): Promise<ActionResult> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { success: false, error: 'Unauthorized session' };
    }

    await (prisma as any).incomingRequirement.update({
      where: { id: requirementId },
      data: {
        status: 'Pending Review',
        reviewedDate: new Date()
      }
    });

    await (prisma as any).requirementTimelineEvent.create({
      data: {
        requirementId,
        title: 'Requirement Restored',
        description: `Restored back to active intake queue by ${user.firstName} ${user.lastName}`,
        actorId: user.id,
        actorName: `${user.firstName} ${user.lastName}`
      }
    });

    revalidatePath(`/incoming-requirements/${requirementId}`);
    revalidatePath('/incoming-requirements');
    revalidatePath('/cockpit');

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to restore requirement' };
  }
}

/**
 * Permanently deletes an incoming requirement from database.
 */
export async function permanentlyDeleteRequirementAction(requirementId: string): Promise<ActionResult> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { success: false, error: 'Unauthorized session' };
    }

    await (prisma as any).incomingRequirement.delete({
      where: { id: requirementId }
    });

    revalidatePath('/incoming-requirements');
    revalidatePath('/cockpit');

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to permanently delete requirement' };
  }
}

/**
 * Fetches all recruiters belonging to the current agency for the assignment dropdown.
 */
export async function getAgencyRecruitersAction(): Promise<ActionResult<{ recruiters: any[] }>> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { success: false, error: 'Unauthorized session' };
    }

    const agencyId = user.agencyId || user.agency?.id;
    if (!agencyId) {
      return { success: true, data: { recruiters: [] } };
    }

    const recruiters = await prisma.user.findMany({
      where: {
        agencyId,
        deletedAt: null,
        status: 'ACTIVE'
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true
      },
      orderBy: { firstName: 'asc' }
    });

    return { success: true, data: { recruiters } };
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to fetch recruiters' };
  }
}
