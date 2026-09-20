import nodemailer from 'nodemailer';
import { prisma } from '@/lib/prisma';

export interface SendAgencyEmailParams {
  agencyId?: string | null;
  to: string;
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
  senderName?: string;
  senderEmail?: string;
}

export interface SMTPVerificationResult {
  success: boolean;
  error?: string;
}

export interface SendEmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
  isSmtpSent: boolean;
}

/**
 * Creates a dynamic Nodemailer transport instance scoped specifically to an Agency's custom SMTP configuration.
 * RecruitOS does not rely on global environment credentials.
 */
export async function createAgencyTransport(agencyId: string) {
  const agency = await (prisma as any).agency.findUnique({
    where: { id: agencyId },
    select: {
      smtpEnabled: true,
      smtpHost: true,
      smtpPort: true,
      smtpSecure: true,
      smtpUsername: true,
      smtpPassword: true,
      senderName: true,
      senderEmail: true,
      replyToEmail: true
    }
  });

  if (!agency) {
    throw new Error(`Agency record not found for ID: ${agencyId}`);
  }

  if (!agency.smtpHost || !agency.smtpPort || !agency.smtpUsername || !agency.smtpPassword) {
    throw new Error('Agency SMTP configuration is incomplete. Host, Port, Username, and Password are required.');
  }

  const portNumber = Number(agency.smtpPort);
  // Auto-determine SSL/TLS: Port 465 uses implicit SSL (secure: true), Port 587 uses STARTTLS (secure: false)
  const isSecure = portNumber === 465;

  const transport = nodemailer.createTransport({
    host: agency.smtpHost.trim(),
    port: portNumber,
    secure: isSecure,
    auth: {
      user: agency.smtpUsername.trim(),
      pass: agency.smtpPassword
    },
    tls: {
      rejectUnauthorized: false // Helps avoid self-signed SSL handshake blocks on custom corporate servers
    }
  });

  return { transport, agency };
}

/**
 * Verifies live SMTP connectivity for an Agency and logs test execution metadata.
 */
export async function verifyAgencySMTP(agencyId: string): Promise<SMTPVerificationResult> {
  try {
    const { transport } = await createAgencyTransport(agencyId);
    await transport.verify();

    await (prisma as any).agency.update({
      where: { id: agencyId },
      data: {
        smtpLastTestedAt: new Date(),
        smtpLastTestStatus: 'SUCCESS'
      }
    });

    return { success: true };
  } catch (error: any) {
    const errorMsg = error.message || 'SMTP Connection Verification Failed';
    console.error(`[SMTP Service Error] Verification failed for agency ${agencyId}:`, errorMsg);

    await (prisma as any).agency.update({
      where: { id: agencyId },
      data: {
        smtpLastTestedAt: new Date(),
        smtpLastTestStatus: `FAILED: ${errorMsg.slice(0, 40)}`
      }
    }).catch(() => null);

    return { success: false, error: errorMsg };
  }
}

/**
 * Sends a real outbound email via the Agency's custom SMTP configuration.
 * Falls back safely if SMTP is disabled or unconfigured without breaking business flow.
 */
export async function sendAgencyEmail({
  agencyId,
  to,
  subject,
  html,
  text,
  replyTo,
  senderName,
  senderEmail
}: SendAgencyEmailParams): Promise<SendEmailResult> {
  if (!agencyId) {
    return {
      success: false,
      error: 'Agency ID not specified for email dispatch.',
      isSmtpSent: false
    };
  }

  try {
    const { transport, agency } = await createAgencyTransport(agencyId);

    if (!agency.smtpEnabled) {
      return {
        success: false,
        error: 'Agency SMTP delivery is currently disabled in Email Settings.',
        isSmtpSent: false
      };
    }

    const fromName = senderName || agency.senderName || agency.name || 'RecruitOS Agency';
    const fromAddress = senderEmail || agency.senderEmail || agency.smtpUsername;
    const replyToAddr = replyTo || agency.replyToEmail || fromAddress;

    const mailOptions = {
      from: `"${fromName}" <${fromAddress}>`,
      to: to.trim(),
      replyTo: replyToAddr,
      subject: subject.trim(),
      html: html,
      text: text || undefined
    };

    const info = await transport.sendMail(mailOptions);
    console.log(`[SMTP Service]: Email sent successfully to ${to} (MessageId: ${info.messageId})`);

    return {
      success: true,
      messageId: info.messageId,
      isSmtpSent: true
    };
  } catch (error: any) {
    const errorMsg = error.message || 'SMTP email delivery failed.';
    console.error(`[SMTP Service Error]: Failed sending email to ${to}:`, errorMsg);

    return {
      success: false,
      error: errorMsg,
      isSmtpSent: false
    };
  }
}
