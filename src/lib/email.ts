import { prisma } from '@/lib/prisma';

export enum EmailEventType {
  REQUIREMENT_RECEIVED = 'REQUIREMENT_RECEIVED',
  REQUIREMENT_ASSIGNED = 'REQUIREMENT_ASSIGNED',
  REQUIREMENT_ACCEPTED = 'REQUIREMENT_ACCEPTED',
  REQUIREMENT_REJECTED = 'REQUIREMENT_REJECTED',
  CANDIDATE_SUBMITTED = 'CANDIDATE_SUBMITTED',
  CLIENT_INTERVIEW = 'CLIENT_INTERVIEW',
  CLIENT_HOLD = 'CLIENT_HOLD',
  CLIENT_REJECT = 'CLIENT_REJECT',
  SUBSCRIPTION_EXPIRY = 'SUBSCRIPTION_EXPIRY'
}

export enum EmailStatus {
  PENDING = 'PENDING',
  SENT = 'SENT',
  FAILED = 'FAILED'
}

export interface CreateEmailLogParams {
  agencyId?: string | null;
  eventType: EmailEventType | string;
  recipientEmail: string;
  subject: string;
  metadata?: Record<string, any> | null;
}

/**
 * Creates a pending email log entry in the database (Phase EM-00 Email Infrastructure).
 * Designed for future SMTP delivery queue integration.
 */
export async function createEmailLog({
  agencyId,
  eventType,
  recipientEmail,
  subject,
  metadata
}: CreateEmailLogParams) {
  try {
    if (!recipientEmail || !recipientEmail.includes('@')) {
      console.warn(`[Email Service]: Invalid recipient email skipped: ${recipientEmail}`);
      return null;
    }

    const emailLog = await (prisma as any).emailLog.create({
      data: {
        agencyId: agencyId || null,
        eventType,
        recipientEmail: recipientEmail.trim(),
        subject: subject.trim(),
        status: EmailStatus.PENDING,
        metadata: metadata ? metadata : undefined
      }
    });

    console.log(`[Email Service]: EmailLog created (${emailLog.id}) - Event: ${eventType} -> ${recipientEmail}`);
    return emailLog;
  } catch (error) {
    console.error('[Email Service Error]: Failed to create email log:', error);
    return null;
  }
}

/**
 * Marks an email log entry as successfully SENT.
 */
export async function markEmailSent(id: string) {
  try {
    return await (prisma as any).emailLog.update({
      where: { id },
      data: {
        status: EmailStatus.SENT,
        sentAt: new Date()
      }
    });
  } catch (error) {
    console.error(`[Email Service Error]: Failed to mark email ${id} as SENT:`, error);
    return null;
  }
}

/**
 * Marks an email log entry as FAILED with error details.
 */
export async function markEmailFailed(id: string, errorMessage: string) {
  try {
    return await (prisma as any).emailLog.update({
      where: { id },
      data: {
        status: EmailStatus.FAILED,
        errorMessage: errorMessage.slice(0, 1000)
      }
    });
  } catch (error) {
    console.error(`[Email Service Error]: Failed to mark email ${id} as FAILED:`, error);
    return null;
  }
}

/**
 * Helper: Logs REQUIREMENT_RECEIVED email event
 */
export async function logRequirementReceivedEmail(
  agencyId: string | null,
  recipientEmail: string,
  companyName: string,
  positionTitle: string,
  requirementId: string
) {
  return createEmailLog({
    agencyId,
    eventType: EmailEventType.REQUIREMENT_RECEIVED,
    recipientEmail,
    subject: `New Requirement Received: ${positionTitle} (${companyName})`,
    metadata: {
      requirementId,
      companyName,
      positionTitle
    }
  });
}

/**
 * Helper: Logs REQUIREMENT_ASSIGNED email event
 */
export async function logRequirementAssignedEmail(
  agencyId: string | null,
  recipientEmail: string,
  positionTitle: string,
  requirementId: string
) {
  return createEmailLog({
    agencyId,
    eventType: EmailEventType.REQUIREMENT_ASSIGNED,
    recipientEmail,
    subject: `Requirement Assigned: ${positionTitle}`,
    metadata: {
      requirementId,
      positionTitle
    }
  });
}

/**
 * Helper: Logs REQUIREMENT_ACCEPTED email event
 */
export async function logRequirementAcceptedEmail(
  agencyId: string | null,
  recipientEmail: string,
  positionTitle: string,
  mandateId: string
) {
  return createEmailLog({
    agencyId,
    eventType: EmailEventType.REQUIREMENT_ACCEPTED,
    recipientEmail,
    subject: `Requirement Accepted & Mandate Created: ${positionTitle}`,
    metadata: {
      mandateId,
      positionTitle
    }
  });
}

/**
 * Helper: Logs REQUIREMENT_REJECTED email event
 */
export async function logRequirementRejectedEmail(
  agencyId: string | null,
  recipientEmail: string,
  positionTitle: string,
  reason?: string
) {
  return createEmailLog({
    agencyId,
    eventType: EmailEventType.REQUIREMENT_REJECTED,
    recipientEmail,
    subject: `Requirement Rejected: ${positionTitle}`,
    metadata: {
      positionTitle,
      reason: reason || 'N/A'
    }
  });
}

/**
 * Helper: Logs CANDIDATE_SUBMITTED email event
 */
export async function logCandidateSubmittedEmail(
  agencyId: string | null,
  recipientEmail: string,
  candidateName: string,
  jobTitle: string,
  submissionId: string
) {
  return createEmailLog({
    agencyId,
    eventType: EmailEventType.CANDIDATE_SUBMITTED,
    recipientEmail,
    subject: `Candidate Profile Submitted: ${candidateName} for ${jobTitle}`,
    metadata: {
      submissionId,
      candidateName,
      jobTitle
    }
  });
}

/**
 * Helper: Logs SUBSCRIPTION_EXPIRY email event
 */
export async function logSubscriptionExpiryEmail(
  agencyId: string | null,
  recipientEmail: string,
  agencyName: string,
  daysRemaining: number
) {
  return createEmailLog({
    agencyId,
    eventType: EmailEventType.SUBSCRIPTION_EXPIRY,
    recipientEmail,
    subject: `Subscription Renewal Warning: ${daysRemaining} Days Remaining (${agencyName})`,
    metadata: {
      agencyName,
      daysRemaining
    }
  });
}
