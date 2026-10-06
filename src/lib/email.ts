import { prisma } from '@/lib/prisma';
import {
  BaseAgencyContext,
  generateRequirementReceivedTemplate,
  generateRequirementAssignedTemplate,
  generateRequirementAcceptedTemplate,
  generateRequirementRejectedTemplate,
  generateCandidateSubmissionTemplate,
  generateInterviewSelectedTemplate,
  generateClientInterviewInvitationTemplate,
  generateInterviewSlotSelectedTemplate,
  generateInterviewOutcomeTemplate,
  generateInterviewPrepKitTemplate,
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
  CLIENT_INTERVIEW_INVITATION = 'CLIENT_INTERVIEW_INVITATION',
  INTERVIEW_SLOT_SELECTED = 'INTERVIEW_SLOT_SELECTED',
  CLIENT_HOLD = 'CLIENT_HOLD',
  CLIENT_REJECT = 'CLIENT_REJECT',
  SUBSCRIPTION_EXPIRY = 'SUBSCRIPTION_EXPIRY',
  SMTP_TEST = 'SMTP_TEST',
  INTERVIEW_SELECTED = 'INTERVIEW_SELECTED',
  INTERVIEW_HOLD = 'INTERVIEW_HOLD',
  INTERVIEW_REJECTED = 'INTERVIEW_REJECTED',
  INTERVIEW_FEEDBACK_PENDING = 'INTERVIEW_FEEDBACK_PENDING',
  INTERVIEW_CONFIRMED = 'INTERVIEW_CONFIRMED',
  INTERVIEW_PREP_SENT = 'INTERVIEW_PREP_SENT',
  INTERVIEW_PREP_REMINDER = 'INTERVIEW_PREP_REMINDER',
  INTERVIEW_PREP_FINAL_REMINDER = 'INTERVIEW_PREP_FINAL_REMINDER',
  OFFER_SENT = 'OFFER_SENT',
  OFFER_ACCEPTED = 'OFFER_ACCEPTED',
  OFFER_DECLINED = 'OFFER_DECLINED',
  OFFER_CLARIFICATION = 'OFFER_CLARIFICATION',
  JOINING_REMINDER = 'JOINING_REMINDER',
  JOINING_CONFIRMED = 'JOINING_CONFIRMED',
  PLACEMENT_CLOSED = 'PLACEMENT_CLOSED',
  APPLICATION_RECEIVED = 'APPLICATION_RECEIVED',
  APPLICATION_SHORTLISTED = 'APPLICATION_SHORTLISTED',
  APPLICATION_REJECTED = 'APPLICATION_REJECTED'
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

    // Fallback eventType if not supported by current in-memory Prisma Enum
    let safeEventType: any = eventType;
    if (safeEventType === 'CLIENT_INTERVIEW_INVITATION' || safeEventType === 'INTERVIEW_SLOT_SELECTED') {
      safeEventType = 'CLIENT_INTERVIEW';
    } else if (safeEventType === 'SMTP_TEST') {
      safeEventType = 'CANDIDATE_SUBMITTED';
    }

    let emailLog: any = null;
    try {
      emailLog = await (prisma as any).emailLog.create({
        data: {
          agencyId: agencyId || null,
          eventType: safeEventType,
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
    } catch (dbErr) {
      console.error('[Email Service]: Error saving EmailLog to DB, attempting direct SMTP dispatch...', dbErr);
    }

    // EM-02: Real SMTP Delivery Engine Dispatch (only if pending and not explicitly skipped)
    if (htmlBody && initialStatus === EmailStatus.PENDING && !skipAutoSend) {
      try {
        const { sendAgencyEmail } = await import('@/lib/smtp');
        const sendResult = await sendAgencyEmail({
          agencyId: agencyId || null,
          to: recipientEmail,
          subject: subject,
          html: htmlBody,
          text: textBody || undefined
        });

        if (emailLog && emailLog.id) {
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
        }
      } catch (smtpErr: any) {
        console.error('[Email Service Error]: Real SMTP dispatch failed:', smtpErr);
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

/**
 * Helper: Logs CLIENT_INTERVIEW_INVITATION email event (Section C)
 */
export async function logClientInterviewInvitationEmail(
  agencyId: string | null,
  recipientEmail: string,
  candidateName: string,
  positionTitle: string,
  companyName: string,
  interviewType: string,
  interviewNotes: string | null | undefined,
  slots: Array<{ id?: string; index: number; dateTimeStr: string; dayDateStr?: string; timeTzStr?: string }>,
  token: string,
  calendlyUrl?: string | null
) {
  const agency = await fetchAgencyContext(agencyId);
  const rendered = generateClientInterviewInvitationTemplate({
    agency,
    candidateName,
    positionTitle,
    companyName,
    interviewType,
    interviewNotes,
    slots,
    calendlyUrl,
    token
  });

  return createEmailLog({
    agencyId,
    eventType: EmailEventType.CLIENT_INTERVIEW_INVITATION,
    recipientEmail,
    subject: rendered.subject,
    htmlBody: rendered.html,
    textBody: rendered.text,
    metadata: {
      candidateName,
      positionTitle,
      companyName,
      interviewType,
      token,
      calendlyUrl,
      slotCount: slots ? slots.length : 0
    }
  });
}

/**
 * Helper: Logs INTERVIEW_SLOT_SELECTED email event (Section C & E)
 */
export async function logInterviewSlotSelectedEmail(
  agencyId: string | null,
  recipientEmail: string,
  candidateName: string,
  positionTitle: string,
  companyName: string,
  interviewType: string,
  selectedSlotStr: string,
  meetingUrl?: string | null,
  timezoneStr?: string,
  recipientType?: 'CANDIDATE' | 'RECRUITER' | 'CLIENT'
) {
  const agency = await fetchAgencyContext(agencyId);
  const rendered = generateInterviewSlotSelectedTemplate({
    agency,
    candidateName,
    positionTitle,
    companyName,
    interviewType,
    selectedSlotStr,
    meetingUrl,
    timezoneStr,
    recipientType
  });

  return createEmailLog({
    agencyId,
    eventType: EmailEventType.INTERVIEW_SLOT_SELECTED,
    recipientEmail,
    subject: rendered.subject,
    htmlBody: rendered.html,
    textBody: rendered.text,
    metadata: {
      candidateName,
      positionTitle,
      companyName,
      interviewType,
      selectedSlotStr,
      meetingUrl
    }
  });
}

/**
 * Helper: Logs INTERVIEW_SELECTED, INTERVIEW_HOLD, or INTERVIEW_REJECTED email event
 */
export async function logInterviewOutcomeEmail(
  agencyId: string | null,
  recipientEmail: string,
  candidateName: string,
  positionTitle: string,
  companyName: string,
  decision: 'SELECTED' | 'HOLD' | 'REJECTED',
  feedbackNotes?: string,
  recipientRole: 'CANDIDATE' | 'RECRUITER' | 'CLIENT' = 'CANDIDATE'
) {
  const agency = await fetchAgencyContext(agencyId);
  const rendered = generateInterviewOutcomeTemplate({
    agency,
    candidateName,
    positionTitle,
    companyName,
    decision,
    feedbackNotes,
    recipientRole
  });

  let eventType = EmailEventType.INTERVIEW_SELECTED;
  if (decision === 'HOLD') {
    eventType = EmailEventType.INTERVIEW_HOLD;
  } else if (decision === 'REJECTED') {
    eventType = EmailEventType.INTERVIEW_REJECTED;
  }

  return createEmailLog({
    agencyId,
    eventType,
    recipientEmail,
    subject: rendered.subject,
    htmlBody: rendered.html,
    textBody: rendered.text,
    metadata: {
      candidateName,
      positionTitle,
      companyName,
      decision,
      feedbackNotes
    }
  });
}

/**
 * Helper: Logs INTERVIEW_PREP_SENT, INTERVIEW_PREP_REMINDER, or INTERVIEW_PREP_FINAL_REMINDER email event
 */
export async function logInterviewPrepKitEmail(
  agencyId: string | null,
  recipientEmail: string,
  candidateName: string,
  positionTitle: string,
  companyName: string,
  roundType: string,
  interviewDateStr: string,
  secureToken: string,
  eventType: EmailEventType = EmailEventType.INTERVIEW_PREP_SENT
) {
  const agency = await fetchAgencyContext(agencyId);
  const isReminder = eventType === EmailEventType.INTERVIEW_PREP_REMINDER;
  const isFinalReminder = eventType === EmailEventType.INTERVIEW_PREP_FINAL_REMINDER;

  const rendered = generateInterviewPrepKitTemplate({
    agency,
    candidateName,
    positionTitle,
    companyName,
    roundType,
    interviewDateStr,
    secureToken,
    isReminder,
    isFinalReminder
  });

  return createEmailLog({
    agencyId,
    eventType,
    recipientEmail,
    subject: rendered.subject,
    htmlBody: rendered.html,
    textBody: rendered.text,
    metadata: {
      candidateName,
      positionTitle,
      companyName,
      roundType,
      interviewDateStr,
      secureToken
    }
  });
}

/**
 * Log OFFER_SENT Email
 */
export async function logOfferSentEmail(
  agencyId: string,
  recipientEmail: string,
  candidateName: string,
  companyName: string,
  positionTitle: string,
  offeredCtcStr: string,
  offerUrl: string
) {
  const agency = await fetchAgencyContext(agencyId);
  const { generateOfferSentTemplate } = await import('./emailTemplates');
  const rendered = generateOfferSentTemplate({
    agency,
    candidateName,
    companyName,
    positionTitle,
    offeredCtcStr,
    offerUrl
  });

  return createEmailLog({
    agencyId,
    eventType: EmailEventType.OFFER_SENT,
    recipientEmail,
    subject: rendered.subject,
    htmlBody: rendered.html,
    textBody: rendered.text,
    metadata: { candidateName, companyName, positionTitle, offeredCtcStr, offerUrl }
  });
}

/**
 * Log OFFER_ACCEPTED Email
 */
export async function logOfferAcceptedEmail(
  agencyId: string,
  recipientEmail: string,
  candidateName: string,
  companyName: string,
  positionTitle: string,
  joiningDateStr: string,
  offeredCtcStr: string
) {
  const agency = await fetchAgencyContext(agencyId);
  const { generateOfferAcceptedTemplate } = await import('./emailTemplates');
  const rendered = generateOfferAcceptedTemplate({
    agency,
    candidateName,
    companyName,
    positionTitle,
    joiningDateStr,
    offeredCtcStr
  });

  return createEmailLog({
    agencyId,
    eventType: EmailEventType.OFFER_ACCEPTED,
    recipientEmail,
    subject: rendered.subject,
    htmlBody: rendered.html,
    textBody: rendered.text,
    metadata: { candidateName, companyName, positionTitle, joiningDateStr, offeredCtcStr }
  });
}

/**
 * Log OFFER_DECLINED Email
 */
export async function logOfferDeclinedEmail(
  agencyId: string,
  recipientEmail: string,
  candidateName: string,
  companyName: string,
  positionTitle: string,
  declineReason?: string
) {
  const agency = await fetchAgencyContext(agencyId);
  const { generateOfferDeclinedTemplate } = await import('./emailTemplates');
  const rendered = generateOfferDeclinedTemplate({
    agency,
    candidateName,
    companyName,
    positionTitle,
    declineReason
  });

  return createEmailLog({
    agencyId,
    eventType: EmailEventType.OFFER_DECLINED,
    recipientEmail,
    subject: rendered.subject,
    htmlBody: rendered.html,
    textBody: rendered.text,
    metadata: { candidateName, companyName, positionTitle, declineReason }
  });
}

/**
 * Log OFFER_CLARIFICATION Email
 */
export async function logOfferClarificationEmail(
  agencyId: string,
  recipientEmail: string,
  candidateName: string,
  companyName: string,
  positionTitle: string,
  questionTitle: string,
  questionDetails: string
) {
  const agency = await fetchAgencyContext(agencyId);
  const { generateOfferClarificationTemplate } = await import('./emailTemplates');
  const rendered = generateOfferClarificationTemplate({
    agency,
    candidateName,
    companyName,
    positionTitle,
    questionTitle,
    questionDetails
  });

  return createEmailLog({
    agencyId,
    eventType: EmailEventType.OFFER_CLARIFICATION,
    recipientEmail,
    subject: rendered.subject,
    htmlBody: rendered.html,
    textBody: rendered.text,
    metadata: { candidateName, companyName, positionTitle, questionTitle, questionDetails }
  });
}

/**
 * Log JOINING_REMINDER Email
 */
export async function logJoiningReminderEmail(
  agencyId: string,
  recipientEmail: string,
  candidateName: string,
  companyName: string,
  positionTitle: string,
  joiningDateStr: string,
  daysLeft: number
) {
  const agency = await fetchAgencyContext(agencyId);
  const { generateJoiningReminderTemplate } = await import('./emailTemplates');
  const rendered = generateJoiningReminderTemplate({
    agency,
    candidateName,
    companyName,
    positionTitle,
    joiningDateStr,
    daysLeft
  });

  return createEmailLog({
    agencyId,
    eventType: EmailEventType.JOINING_REMINDER,
    recipientEmail,
    subject: rendered.subject,
    htmlBody: rendered.html,
    textBody: rendered.text,
    metadata: { candidateName, companyName, positionTitle, joiningDateStr, daysLeft }
  });
}

/**
 * Log JOINING_CONFIRMED Email
 */
export async function logJoiningConfirmedEmail(
  agencyId: string,
  recipientEmail: string,
  candidateName: string,
  companyName: string,
  positionTitle: string,
  joiningDateStr: string,
  finalSalaryStr: string
) {
  const agency = await fetchAgencyContext(agencyId);
  const { generateJoiningConfirmedTemplate } = await import('./emailTemplates');
  const rendered = generateJoiningConfirmedTemplate({
    agency,
    candidateName,
    companyName,
    positionTitle,
    joiningDateStr,
    finalSalaryStr
  });

  return createEmailLog({
    agencyId,
    eventType: EmailEventType.JOINING_CONFIRMED,
    recipientEmail,
    subject: rendered.subject,
    htmlBody: rendered.html,
    textBody: rendered.text,
    metadata: { candidateName, companyName, positionTitle, joiningDateStr, finalSalaryStr }
  });
}

/**
 * Log PLACEMENT_CLOSED Email
 */
export async function logPlacementClosedEmail(
  agencyId: string,
  recipientEmail: string,
  candidateName: string,
  companyName: string,
  revenueStr: string
) {
  const agency = await fetchAgencyContext(agencyId);
  const { generatePlacementClosedTemplate } = await import('./emailTemplates');
  const rendered = generatePlacementClosedTemplate({
    agency,
    candidateName,
    companyName,
    revenueStr
  });

  return createEmailLog({
    agencyId,
    eventType: EmailEventType.PLACEMENT_CLOSED,
    recipientEmail,
    subject: rendered.subject,
    htmlBody: rendered.html,
    textBody: rendered.text,
    metadata: { candidateName, companyName, revenueStr }
  });
}

export async function logApplicationReceivedEmail(
  agencyId: string,
  recipientEmail: string,
  candidateName: string,
  jobTitle: string,
  companyName: string
) {
  const agency = await fetchAgencyContext(agencyId);
  const { generateApplicationReceivedTemplate } = await import('./emailTemplates');
  const rendered = generateApplicationReceivedTemplate({ agency, candidateName, jobTitle, companyName });

  return createEmailLog({
    agencyId,
    eventType: EmailEventType.APPLICATION_RECEIVED,
    recipientEmail,
    subject: rendered.subject,
    htmlBody: rendered.html,
    textBody: rendered.text,
    metadata: { candidateName, jobTitle, companyName }
  });
}

export async function logApplicationShortlistedEmail(
  agencyId: string,
  recipientEmail: string,
  candidateName: string,
  jobTitle: string,
  companyName: string
) {
  const agency = await fetchAgencyContext(agencyId);
  const { generateApplicationShortlistedTemplate } = await import('./emailTemplates');
  const rendered = generateApplicationShortlistedTemplate({ agency, candidateName, jobTitle, companyName });

  return createEmailLog({
    agencyId,
    eventType: EmailEventType.APPLICATION_SHORTLISTED,
    recipientEmail,
    subject: rendered.subject,
    htmlBody: rendered.html,
    textBody: rendered.text,
    metadata: { candidateName, jobTitle, companyName }
  });
}

export async function logApplicationRejectedEmail(
  agencyId: string,
  recipientEmail: string,
  candidateName: string,
  jobTitle: string,
  companyName: string
) {
  const agency = await fetchAgencyContext(agencyId);
  const { generateApplicationRejectedTemplate } = await import('./emailTemplates');
  const rendered = generateApplicationRejectedTemplate({ agency, candidateName, jobTitle, companyName });

  return createEmailLog({
    agencyId,
    eventType: EmailEventType.APPLICATION_REJECTED,
    recipientEmail,
    subject: rendered.subject,
    htmlBody: rendered.html,
    textBody: rendered.text,
    metadata: { candidateName, jobTitle, companyName }
  });
}


