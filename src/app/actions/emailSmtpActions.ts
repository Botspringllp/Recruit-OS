'use server';

import { getCurrentUser, hasPermission } from '@/lib/rbac';
import { prisma } from '@/lib/prisma';
import { verifyAgencySMTP, sendAgencyEmail } from '@/lib/smtp';

export interface SaveSMTPSettingsInput {
  smtpEnabled: boolean;
  smtpHost?: string;
  smtpPort?: number;
  smtpSecure?: boolean;
  smtpUsername?: string;
  smtpPassword?: string;
  senderName?: string;
  senderEmail?: string;
  replyToEmail?: string;
}

/**
 * Gets agency SMTP settings securely.
 * SECURITY: Password is NEVER sent to the client. Returns hasPassword flag instead.
 */
export async function getAgencySMTPSettingsAction() {
  try {
    const user = await getCurrentUser();
    if (!user || !user.agencyId) {
      return { success: false, error: 'Unauthorized user context.' };
    }

    const agency = await (prisma as any).agency.findUnique({
      where: { id: user.agencyId },
      select: {
        id: true,
        name: true,
        smtpEnabled: true,
        smtpHost: true,
        smtpPort: true,
        smtpSecure: true,
        smtpUsername: true,
        smtpPassword: true,
        senderName: true,
        senderEmail: true,
        replyToEmail: true,
        smtpLastTestedAt: true,
        smtpLastTestStatus: true
      }
    });

    if (!agency) {
      return { success: false, error: 'Agency record not found.' };
    }

    return {
      success: true,
      data: {
        smtpEnabled: agency.smtpEnabled ?? false,
        smtpHost: agency.smtpHost || '',
        smtpPort: agency.smtpPort || 587,
        smtpSecure: agency.smtpSecure ?? false,
        smtpUsername: agency.smtpUsername || '',
        hasPassword: Boolean(agency.smtpPassword && agency.smtpPassword.length > 0),
        senderName: agency.senderName || agency.name || '',
        senderEmail: agency.senderEmail || '',
        replyToEmail: agency.replyToEmail || '',
        smtpLastTestedAt: agency.smtpLastTestedAt ? agency.smtpLastTestedAt.toISOString() : null,
        smtpLastTestStatus: agency.smtpLastTestStatus || null
      }
    };
  } catch (error: any) {
    console.error('Error in getAgencySMTPSettingsAction:', error);
    return { success: false, error: error.message || 'Failed to load SMTP settings.' };
  }
}

/**
 * Saves Agency SMTP Configuration & Email Identity.
 * SECURITY: Preserves existing password if smtpPassword is left blank.
 */
export async function saveAgencySMTPSettingsAction(input: SaveSMTPSettingsInput) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.agencyId) {
      return { success: false, error: 'Unauthorized user context.' };
    }

    if (!hasPermission(user, 'user.manage')) {
      return { success: false, error: 'Insufficient permission to edit agency email settings.' };
    }

    const agencyId = user.agencyId;
    const existingAgency = await (prisma as any).agency.findUnique({
      where: { id: agencyId },
      select: { smtpPassword: true }
    });

    if (!existingAgency) {
      return { success: false, error: 'Agency record not found.' };
    }

    const updateData: any = {
      smtpEnabled: input.smtpEnabled,
      smtpHost: input.smtpHost ? input.smtpHost.trim() : null,
      smtpPort: input.smtpPort ? Number(input.smtpPort) : 587,
      smtpSecure: Boolean(input.smtpSecure),
      smtpUsername: input.smtpUsername ? input.smtpUsername.trim() : null,
      senderName: input.senderName ? input.senderName.trim() : null,
      senderEmail: input.senderEmail ? input.senderEmail.trim() : null,
      replyToEmail: input.replyToEmail ? input.replyToEmail.trim() : null,
      updatedAt: new Date()
    };

    // Only overwrite password if non-empty string provided
    if (input.smtpPassword && input.smtpPassword.trim().length > 0) {
      updateData.smtpPassword = input.smtpPassword;
    }

    await (prisma as any).agency.update({
      where: { id: agencyId },
      data: updateData
    });

    return {
      success: true,
      message: 'SMTP Configuration and Email Identity updated successfully.'
    };
  } catch (error: any) {
    console.error('Error in saveAgencySMTPSettingsAction:', error);
    return { success: false, error: error.message || 'Failed to save SMTP settings.' };
  }
}

/**
 * Executes a real connection test and sends a real test email to recipient.
 */
export async function testAgencySMTPConnectionAction(testRecipientEmail: string) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.agencyId) {
      return { success: false, error: 'Unauthorized user context.' };
    }

    if (!testRecipientEmail || !testRecipientEmail.includes('@')) {
      return { success: false, error: 'Please enter a valid recipient email address for testing.' };
    }

    const agencyId = user.agencyId;

    // Step 1: Verify SMTP Transport
    const verifyRes = await verifyAgencySMTP(agencyId);
    if (!verifyRes.success) {
      return {
        success: false,
        error: `SMTP Handshake Failed: ${verifyRes.error}`
      };
    }

    // Step 2: Send Real Test Email
    const testHtml = `
      <div style="font-family: Arial, sans-serif; padding: 20px; color: #1e293b; background-color: #f8fafc; border-radius: 12px; border: 1px solid #e2e8f0;">
        <div style="background-color: #0d3859; padding: 16px 24px; border-radius: 8px; color: #ffffff; text-align: center;">
          <h2 style="margin: 0; font-size: 20px;">RecruitOS SMTP Test Successful</h2>
        </div>
        <div style="padding: 20px 10px;">
          <p style="font-size: 14px; line-height: 1.6;">Hello,</p>
          <p style="font-size: 14px; line-height: 1.6;">This is a live test email sent from your <strong>RecruitOS Agency SMTP Integration Engine</strong>.</p>
          <div style="background: #e0f2fe; border-left: 4px solid #0284c7; padding: 12px 16px; margin: 16px 0; border-radius: 4px;">
            <strong>Test Details:</strong><br/>
            • Date/Time: ${new Date().toLocaleString()}<br/>
            • Dispatch Mode: Direct Custom Agency Transport<br/>
            • Target Recipient: ${testRecipientEmail}
          </div>
          <p style="font-size: 13px; color: #64748b;">Your agency SMTP configuration is now fully verified and operational for automated system workflow delivery.</p>
        </div>
        <div style="border-t: 1px solid #e2e8f0; pt: 12px; text-align: center; font-size: 11px; color: #94a3b8;">
          Powered by RecruitOS Email Engine (Phase EM-02)
        </div>
      </div>
    `;

    const sendRes = await sendAgencyEmail({
      agencyId,
      to: testRecipientEmail,
      subject: 'RecruitOS SMTP Integration Test',
      html: testHtml,
      text: 'RecruitOS SMTP Integration Test - Your SMTP connection is operational.'
    });

    if (sendRes.success && sendRes.isSmtpSent) {
      // Create EmailLog record for the test email with SENT status & skipAutoSend
      const { createEmailLog, EmailEventType, EmailStatus } = await import('@/lib/email');
      await createEmailLog({
        agencyId,
        eventType: EmailEventType.SMTP_TEST,
        recipientEmail: testRecipientEmail,
        subject: 'RecruitOS SMTP Integration Test',
        htmlBody: testHtml,
        textBody: 'RecruitOS SMTP Integration Test - Successful',
        status: EmailStatus.SENT,
        sentAt: new Date(),
        skipAutoSend: true,
        metadata: { type: 'SMTP_TEST_EMAIL', messageId: sendRes.messageId }
      });

      return {
        success: true,
        message: `SMTP Connection Verified! Test email delivered to ${testRecipientEmail}.`
      };
    } else {
      const { createEmailLog, EmailEventType, EmailStatus } = await import('@/lib/email');
      await createEmailLog({
        agencyId,
        eventType: EmailEventType.SMTP_TEST,
        recipientEmail: testRecipientEmail,
        subject: 'RecruitOS SMTP Integration Test',
        htmlBody: testHtml,
        textBody: 'RecruitOS SMTP Integration Test - Delivery Failed',
        status: EmailStatus.FAILED,
        errorMessage: sendRes.error || 'SMTP test dispatch failed.',
        skipAutoSend: true,
        metadata: { type: 'SMTP_TEST_EMAIL', error: sendRes.error }
      });

      return {
        success: false,
        error: sendRes.error || 'Failed to send test email.'
      };
    }
  } catch (error: any) {
    console.error('Error in testAgencySMTPConnectionAction:', error);
    return { success: false, error: error.message || 'SMTP connection test failed.' };
  }
}

/**
 * Retries sending a failed or pending email log entry.
 */
export async function retryEmailLogAction(emailLogId: string) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.agencyId) {
      return { success: false, error: 'Unauthorized user context.' };
    }

    const emailLog = await (prisma as any).emailLog.findUnique({
      where: { id: emailLogId }
    });

    if (!emailLog) {
      return { success: false, error: 'Email log record not found.' };
    }

    // Multi-tenant check
    const roleStr = String(user.role || '').toUpperCase();
    if (roleStr !== 'SUPER_ADMIN' && emailLog.agencyId !== user.agencyId) {
      return { success: false, error: 'Unauthorized access to agency email log.' };
    }

    if (!emailLog.htmlBody) {
      return { success: false, error: 'Email log has no HTML body to retry.' };
    }

    const sendRes = await sendAgencyEmail({
      agencyId: emailLog.agencyId || user.agencyId,
      to: emailLog.recipientEmail,
      subject: emailLog.subject,
      html: emailLog.htmlBody,
      text: emailLog.textBody || undefined
    });

    if (sendRes.success && sendRes.isSmtpSent) {
      await (prisma as any).emailLog.update({
        where: { id: emailLogId },
        data: {
          status: 'SENT',
          sentAt: new Date(),
          errorMessage: null
        }
      });

      return {
        success: true,
        status: 'SENT',
        message: `Email retry successful! Sent to ${emailLog.recipientEmail}.`
      };
    } else {
      const errorMsg = sendRes.error || 'SMTP retry delivery failed.';
      await (prisma as any).emailLog.update({
        where: { id: emailLogId },
        data: {
          status: 'FAILED',
          errorMessage: errorMsg.slice(0, 1000)
        }
      });

      return {
        success: false,
        status: 'FAILED',
        error: errorMsg
      };
    }
  } catch (error: any) {
    console.error('Error in retryEmailLogAction:', error);
    return { success: false, error: error.message || 'Retry execution failed.' };
  }
}
