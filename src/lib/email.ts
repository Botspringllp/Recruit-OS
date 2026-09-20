import { prisma } from '@/lib/prisma';
import {
  BaseAgencyContext,
  generateRequirementReceivedTemplate,
  generateRequirementAssignedTemplate,
  generateRequirementAcceptedTemplate,
  generateRequirementRejectedTemplate,
  generateCandidateSubmissionTemplate,
  generateInterviewSelectedTemplate,
  generateCandidateHoldTemplate,
  generateCandidateRejectedTemplate,
  generateSubscriptionExpiryTemplate,
  CandidateTrackerRow
} from './emailTemplates';

export enum EmailEventType {
  REQUIREMENT_RECEIVED = 'REQUIREMENT_RECEIVED',
  REQUIREMENT_ASSIGNED = 'REQUIREMENT_ASSIGNED',
  REQUIREMENT_ACCEPTED = 'REQUIREMENT_ACCEPTED',
  REQUIREMENT_REJECTED = 'REQUIREMENT_REJECTED',
  CANDIDATE_SUBMITTED = 'CANDIDATE_SUBMITTED',
  CLIENT_INTERVIEW = 'CLIENT_INTERVIEW',
  CLIENT_HOLD = 'CLIENT_HOLD',
  CLIENT_REJECT = 'CLIENT_REJECT',
  SUBSCRIPTION_EXPIRY = 'SUBSCRIPTION_EXPIRY',
  SMTP_TEST = 'SMTP_TEST'
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
  htmlBody?: string | null;
  textBody?: string | null;
  metadata?: Record<string, any> | null;
  status?: EmailStatus;
  sentAt?: Date | null;
  errorMessage?: string | null;
  skipAutoSend?: boolean;
}

/**
 * Fetches multi-tenant Agency context for email templates.
 */
export async function fetchAgencyContext(agencyId?: string | null): Promise<BaseAgencyContext> {
  if (!agencyId) {
    return { agencyName: 'RecruitOS Agency' };
  }
  try {
    const agency = await (prisma as any).agency.findUnique({
      where: { id: agencyId },
      select: {
        name: true,
        senderName: true,
        replyToEmail: true,
        businessEmail: true,
        phone: true,
        websiteUrl: true
      }
    });
    if (!agency) return { agencyName: 'RecruitOS Agency' };
    return {
      agencyName: agency.name || 'RecruitOS Agency',
      senderName: agency.senderName || agency.name,
      replyToEmail: agency.replyToEmail || agency.businessEmail,
      contactEmail: agency.businessEmail || agency.replyToEmail,
      contactPhone: agency.phone,
      websiteUrl: agency.websiteUrl
    };
  } catch (err) {
    return { agencyName: 'RecruitOS Agency' };
  }
}

/**
 * Creates a pending email log entry with rendered HTML & Text bodies (Phase EM-01).
 * Ready for EM-02 SMTP engine dispatch.
 */
export async function createEmailLog({
  agencyId,
  eventType,
  recipientEmail,
  subject,
  htmlBody,
  textBody,
  metadata,
  status,
  sentAt,
  errorMessage,
  skipAutoSend = false
}: CreateEmailLogParams) {
  try {
    if (!recipientEmail || !recipientEmail.includes('@')) {
      console.warn(`[Email Service]: Invalid recipient email skipped: ${recipientEmail}`);
      return null;
    }

    const initialStatus = status || EmailStatus.PENDING;
    const initialSentAt = sentAt || (initialStatus === EmailStatus.SENT ? new Date() : null);

    const emailLog = await (prisma as any).emailLog.create({
      data: {
        agencyId: agencyId || null,
        eventType,
        recipientEmail: recipientEmail.trim(),
        subject: subject.trim(),
        htmlBody: htmlBody || null,
        textBody: textBody || null,
        status: initialStatus,
        sentAt: initialSentAt,
        errorMessage: errorMessage || null,
        metadata: metadata ? metadata : undefined
      }
    });

    console.log(`[Email Service]: EmailLog created (${emailLog.id}) - Event: ${eventType} [${initialStatus}] -> ${recipientEmail}`);

    // EM-02: Real SMTP Delivery Engine Dispatch (only if pending and not explicitly skipped)
    if (agencyId && htmlBody && initialStatus === EmailStatus.PENDING && !skipAutoSend) {
      try {
        const { sendAgencyEmail } = await import('@/lib/smtp');
        const sendResult = await sendAgencyEmail({
          agencyId,
          to: recipientEmail,
          subject: subject,
          html: htmlBody,
          text: textBody || undefined
        });

        if (sendResult.success && sendResult.isSmtpSent) {
          await (prisma as any).emailLog.update({
            where: { id: emailLog.id },
            data: {
              status: EmailStatus.SENT,
              sentAt: new Date(),
              errorMessage: null
            }
          });
          emailLog.status = EmailStatus.SENT;
          emailLog.sentAt = new Date();
        } else if (!sendResult.success && sendResult.error && !sendResult.error.includes('disabled')) {
          await (prisma as any).emailLog.update({
            where: { id: emailLog.id },
            data: {
              status: EmailStatus.FAILED,
              errorMessage: sendResult.error.slice(0, 1000)
            }
          });
          emailLog.status = EmailStatus.FAILED;
          emailLog.errorMessage = sendResult.error;
        }
      } catch (smtpErr: any) {
        console.error('[Email Service Error]: Real SMTP dispatch failed:', smtpErr);
        await (prisma as any).emailLog.update({
          where: { id: emailLog.id },
          data: {
            status: EmailStatus.FAILED,
            errorMessage: String(smtpErr?.message || smtpErr).slice(0, 1000)
          }
        });
        emailLog.status = EmailStatus.FAILED;
      }
    }

    return emailLog;
  } catch (error) {
    console.error('[Email Service Error]: Failed to create email log:', error);
    return null;
  }
}

/**
 * Queue Processor: Finds PENDING email logs and dispatches them via SMTP (EM-02 Section 4).
 */
export async function processPendingEmails(targetAgencyId?: string | null) {
  try {
    const whereClause: any = { status: EmailStatus.PENDING };
    if (targetAgencyId) {
      whereClause.agencyId = targetAgencyId;
    }

    const pendingLogs = await (prisma as any).emailLog.findMany({
      where: whereClause,
      take: 50,
      orderBy: { createdAt: 'asc' }
    });

    if (pendingLogs.length === 0) {
      return { processed: 0, sent: 0, failed: 0 };
    }

    const { sendAgencyEmail } = await import('@/lib/smtp');
    let sentCount = 0;
    let failedCount = 0;

    for (const log of pendingLogs) {
      if (!log.agencyId || !log.htmlBody) continue;

      const sendResult = await sendAgencyEmail({
        agencyId: log.agencyId,
        to: log.recipientEmail,
        subject: log.subject,
        html: log.htmlBody,
        text: log.textBody || undefined
      });

      if (sendResult.success && sendResult.isSmtpSent) {
        await (prisma as any).emailLog.update({
          where: { id: log.id },
          data: {
            status: EmailStatus.SENT,
            sentAt: new Date(),
            errorMessage: null
          }
        });
        sentCount++;
      } else if (!sendResult.success && sendResult.error && !sendResult.error.includes('disabled')) {
        await (prisma as any).emailLog.update({
          where: { id: log.id },
          data: {
            status: EmailStatus.FAILED,
            errorMessage: sendResult.error.slice(0, 1000)
          }
        });
        failedCount++;
      }
    }

    return { processed: pendingLogs.length, sent: sentCount, failed: failedCount };
  } catch (err) {
    console.error('[Email Queue Error]: Failed to process pending emails:', err);
    return { processed: 0, sent: 0, failed: 0 };
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
  requirementId: string,
  contactPerson?: string,
  source?: string
) {
  const agency = await fetchAgencyContext(agencyId);
  const rendered = generateRequirementReceivedTemplate({
    agency,
    requirementId,
    positionTitle,
    companyName,
    contactPerson,
    source,
    receivedDate: new Date().toLocaleDateString('en-US')
  });

  return createEmailLog({
    agencyId,
    eventType: EmailEventType.REQUIREMENT_RECEIVED,
    recipientEmail,
    subject: rendered.subject,
    htmlBody: rendered.html,
    textBody: rendered.text,
    metadata: {
      requirementId,
      companyName,
      positionTitle,
      contactPerson,
      source
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
  requirementId: string,
  companyName: string = 'Client Company',
  assignedBy?: string
) {
  const agency = await fetchAgencyContext(agencyId);
  const rendered = generateRequirementAssignedTemplate({
    agency,
    requirementId,
    positionTitle,
    companyName,
    priority: 'HIGH',
    assignedBy,
    assignedDate: new Date().toLocaleDateString('en-US')
  });

  return createEmailLog({
    agencyId,
    eventType: EmailEventType.REQUIREMENT_ASSIGNED,
    recipientEmail,
    subject: rendered.subject,
    htmlBody: rendered.html,
    textBody: rendered.text,
    metadata: {
      requirementId,
      positionTitle,
      companyName
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
  mandateId: string,
  clientName: string = 'Valued Client',
  companyName: string = 'Client Company',
  recruiterName?: string,
  recruiterEmail?: string,
  recruiterPhone?: string
) {
  const agency = await fetchAgencyContext(agencyId);
  const rendered = generateRequirementAcceptedTemplate({
    agency,
    clientName,
    positionTitle,
    companyName,
    recruiterName,
    recruiterEmail,
    recruiterPhone,
    mandateId
  });

  return createEmailLog({
    agencyId,
    eventType: EmailEventType.REQUIREMENT_ACCEPTED,
    recipientEmail,
    subject: rendered.subject,
    htmlBody: rendered.html,
    textBody: rendered.text,
    metadata: {
      mandateId,
      positionTitle,
      companyName,
      clientName
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
  reason?: string,
  clientName: string = 'Valued Client',
  companyName: string = 'Client Company'
) {
  const agency = await fetchAgencyContext(agencyId);
  const rendered = generateRequirementRejectedTemplate({
    agency,
    clientName,
    positionTitle,
    companyName,
    reason
  });

  return createEmailLog({
    agencyId,
    eventType: EmailEventType.REQUIREMENT_REJECTED,
    recipientEmail,
    subject: rendered.subject,
    htmlBody: rendered.html,
    textBody: rendered.text,
    metadata: {
      positionTitle,
      companyName,
      clientName,
      reason: reason || 'N/A'
    }
  });
}

/**
 * Helper: Logs CANDIDATE_SUBMITTED email event (with 19-column candidate tracker table)
 */
export async function logCandidateSubmittedEmail(
  agencyId: string | null,
  recipientEmail: string,
  clientName: string,
  positionTitle: string,
  token: string,
  candidates: CandidateTrackerRow[],
  recruiterCoverNote?: string
) {
  const agency = await fetchAgencyContext(agencyId);
  const rendered = generateCandidateSubmissionTemplate({
    agency,
    clientName,
    positionTitle,
    recruiterCoverNote,
    token,
    candidates
  });

  return createEmailLog({
    agencyId,
    eventType: EmailEventType.CANDIDATE_SUBMITTED,
    recipientEmail,
    subject: rendered.subject,
    htmlBody: rendered.html,
    textBody: rendered.text,
    metadata: {
      clientName,
      positionTitle,
      token,
      candidateCount: candidates.length,
      recruiterCoverNote
    }
  });
}

/**
 * Helper: Logs CLIENT_INTERVIEW email event
 */
export async function logClientInterviewEmail(
  agencyId: string | null,
  recipientEmail: string,
  candidateName: string,
  positionTitle: string,
  clientName: string,
  submissionId?: string
) {
  const agency = await fetchAgencyContext(agencyId);
  const rendered = generateInterviewSelectedTemplate({
    agency,
    candidateName,
    positionTitle,
    clientName,
    submissionId
  });

  return createEmailLog({
    agencyId,
    eventType: EmailEventType.CLIENT_INTERVIEW,
    recipientEmail,
    subject: rendered.subject,
    htmlBody: rendered.html,
    textBody: rendered.text,
    metadata: {
      submissionId,
      candidateName,
      positionTitle,
      clientName
    }
  });
}

/**
 * Helper: Logs CLIENT_HOLD email event
 */
export async function logClientHoldEmail(
  agencyId: string | null,
  recipientEmail: string,
  candidateName: string,
  positionTitle: string,
  clientName: string,
  notes?: string
) {
  const agency = await fetchAgencyContext(agencyId);
  const rendered = generateCandidateHoldTemplate({
    agency,
    candidateName,
    positionTitle,
    clientName,
    notes
  });

  return createEmailLog({
    agencyId,
    eventType: EmailEventType.CLIENT_HOLD,
    recipientEmail,
    subject: rendered.subject,
    htmlBody: rendered.html,
    textBody: rendered.text,
    metadata: {
      candidateName,
      positionTitle,
      clientName,
      notes
    }
  });
}

/**
 * Helper: Logs CLIENT_REJECT email event
 */
export async function logClientRejectEmail(
  agencyId: string | null,
  recipientEmail: string,
  candidateName: string,
  positionTitle: string,
  clientName: string,
  notes?: string
) {
  const agency = await fetchAgencyContext(agencyId);
  const rendered = generateCandidateRejectedTemplate({
    agency,
    candidateName,
    positionTitle,
    clientName,
    notes
  });

  return createEmailLog({
    agencyId,
    eventType: EmailEventType.CLIENT_REJECT,
    recipientEmail,
    subject: rendered.subject,
    htmlBody: rendered.html,
    textBody: rendered.text,
    metadata: {
      candidateName,
      positionTitle,
      clientName,
      notes
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
  daysRemaining: number,
  planName?: string,
  expiryDate?: string
) {
  const agency = await fetchAgencyContext(agencyId);
  const rendered = generateSubscriptionExpiryTemplate({
    agency,
    agencyName,
    planName,
    expiryDate,
    daysRemaining
  });

  return createEmailLog({
    agencyId,
    eventType: EmailEventType.SUBSCRIPTION_EXPIRY,
    recipientEmail,
    subject: rendered.subject,
    htmlBody: rendered.html,
    textBody: rendered.text,
    metadata: {
      agencyName,
      daysRemaining,
      planName,
      expiryDate
    }
  });
}
