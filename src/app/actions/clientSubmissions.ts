'use server';

import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/rbac';
import { serializeDecimals } from '@/lib/serialize';
import nodemailer from 'nodemailer';
import crypto from 'crypto';

export interface ShareToClientPayload {
  candidateIds: string[];
  jobId: string;
  recipientEmail?: string;
  emailSubject?: string;
  recruiterMessage?: string;
}

export interface ActiveJobOption {
  id: string;
  title: string;
  companyName: string;
  clientId: string | null;
  defaultContactEmail: string;
  candidateCount: number;
}

/**
 * Fetches active job mandates for the current user's agency for the "Share to Client" modal select.
 */
export async function getActiveMandatesForShareAction(): Promise<{
  success: boolean;
  jobs?: ActiveJobOption[];
  error?: string;
}> {
  try {
    const user = await getCurrentUser();
    if (!user || !user.agencyId) {
      return { success: false, error: 'Unauthorized: User authentication required.' };
    }

    const jobs = await prisma.jobMandate.findMany({
      where: {
        agencyId: user.agencyId,
        status: 'OPEN'
      },
      select: {
        id: true,
        title: true,
        clientId: true,
        client: {
          select: {
            companyName: true,
            contacts: {
              select: {
                email: true
              },
              take: 1
            }
          }
        },
        _count: {
          select: {
            submissions: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    const formattedJobs: ActiveJobOption[] = jobs.map(j => ({
      id: j.id,
      title: j.title,
      companyName: j.client?.companyName || 'General Client',
      clientId: j.clientId,
      defaultContactEmail: j.client?.contacts?.[0]?.email || '',
      candidateCount: j._count.submissions
    }));

    return { success: true, jobs: formattedJobs };
  } catch (err: any) {
    console.error('Error in getActiveMandatesForShareAction:', err);
    return { success: false, error: err.message || 'Failed to fetch active job mandates.' };
  }
}

/**
 * Creates CandidateSubmission records and sends structured client review email to divyanshu@botspring.in.
 */
export async function createCandidateSubmissionsAction(payload: ShareToClientPayload): Promise<{
  success: boolean;
  count?: number;
  token?: string;
  reviewUrl?: string;
  error?: string;
}> {
  try {
    const user = await getCurrentUser();
    if (!user || !user.agencyId) {
      return { success: false, error: 'Unauthorized: User authentication required.' };
    }

    if (!payload.candidateIds || payload.candidateIds.length === 0) {
      return { success: false, error: 'Please select at least one candidate to share.' };
    }

    if (!payload.jobId) {
      return { success: false, error: 'Please select a Job Mandate.' };
    }

    // Verify job belongs to agency
    const job = await prisma.jobMandate.findUnique({
      where: { id: payload.jobId },
      include: {
        client: true
      }
    });

    if (!job || job.agencyId !== user.agencyId) {
      return { success: false, error: 'Invalid Job Mandate selected.' };
    }

    // Fetch full candidate records with discussion notes and raw resume documents
    const candidates = await prisma.candidateRecord.findMany({
      where: {
        id: { in: payload.candidateIds },
        agencyId: user.agencyId,
        deletedAt: null
      },
      include: {
        discussionNote: true,
        documents: {
          where: {
            documentType: { in: ['RAW_RESUME', 'SANITIZED_RESUME'] }
          },
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      }
    });

    if (candidates.length === 0) {
      return { success: false, error: 'No valid candidate records found for submission.' };
    }

    // Generate unique random secureReviewToken for this submission batch
    const secureReviewToken = crypto.randomBytes(24).toString('hex');
    const clientId = job.clientId;

    // Create or update CandidateSubmission records
    await prisma.$transaction(
      candidates.map(candidate =>
        prisma.candidateSubmission.upsert({
          where: {
            ux_submission_job_candidate: {
              jobId: job.id,
              candidateId: candidate.id
            }
          },
          create: {
            agencyId: user.agencyId,
            jobId: job.id,
            candidateId: candidate.id,
            clientId: clientId,
            recruiterId: user.id,
            status: 'PENDING',
            secureReviewToken: secureReviewToken,
            recruiterMessage: payload.recruiterMessage || null
          },
          update: {
            clientId: clientId,
            recruiterId: user.id,
            status: 'PENDING',
            secureReviewToken: secureReviewToken,
            recruiterMessage: payload.recruiterMessage || null,
            updatedAt: new Date()
          }
        })
      )
    );

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const reviewUrl = `${baseUrl}/client-review/${secureReviewToken}`;
    const clientName = job.client?.companyName || 'Valued Client';
    const positionTitle = job.title;

    // Construct Client Email HTML Table per PART 3
    const candidateRowsHtml = candidates.map(c => {
      const note = c.discussionNote;
      const doc = c.documents[0];
      const resumeUrl = doc ? `${baseUrl}/api/documents/${doc.id}` : '#';

      return `
        <tr style="border-bottom: 1px solid #e2e8f0;">
          <td style="padding: 10px; font-weight: bold; color: #0f172a;">${c.firstName} ${c.lastName}</td>
          <td style="padding: 10px; color: #334155;">${c.email}</td>
          <td style="padding: 10px; color: #334155;">${c.phone}</td>
          <td style="padding: 10px; color: #334155;">${c.currentLocation || 'N/A'}</td>
          <td style="padding: 10px; color: #334155;">${note?.readyToRelocate || 'N/A'}</td>
          <td style="padding: 10px; color: #334155;">${note?.totalExperience || (c.totalExperienceYears ? `${c.totalExperienceYears} Yrs` : 'N/A')}</td>
          <td style="padding: 10px; color: #334155;">${note?.relevantExperience || 'N/A'}</td>
          <td style="padding: 10px; color: #334155;">${note?.currentDesignation || c.currentDesignation || 'N/A'}</td>
          <td style="padding: 10px; color: #334155;">${note?.qualification || 'N/A'}</td>
          <td style="padding: 10px; color: #334155;">${note?.currentCompany || c.currentCompany || 'N/A'}</td>
          <td style="padding: 10px; color: #334155;">${note?.currentSalary || (c.currentCtcLpa ? `${c.currentCtcLpa} LPA` : 'N/A')}</td>
          <td style="padding: 10px; color: #334155;">${note?.expectedSalary || (c.expectedCtcLpa ? `${c.expectedCtcLpa} LPA` : 'N/A')}</td>
          <td style="padding: 10px; color: #334155;">${note?.noticePeriod || 'N/A'}</td>
          <td style="padding: 10px; color: #334155;">${note?.reasonOfLeaving || 'N/A'}</td>
          <td style="padding: 10px; color: #334155;">${note?.offerInHand || 'N/A'}</td>
          <td style="padding: 10px; font-weight: bold;">
            ${doc ? `<a href="${resumeUrl}" target="_blank" style="color: #d97706; text-decoration: underline;">View Resume</a>` : '<span style="color: #94a3b8;">No Resume</span>'}
          </td>
        </tr>
      `;
    }).join('');

    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; background-color: #f8fafc; color: #0f172a; margin: 0; padding: 20px; }
          .container { max-width: 1200px; margin: 0 auto; background: #ffffff; padding: 24px; border-radius: 12px; border: 1px solid #e2e8f0; }
          .header { border-bottom: 2px solid #f1f5f9; padding-bottom: 16px; margin-bottom: 20px; }
          .title { font-size: 20px; font-weight: 800; color: #0f172a; margin: 0; }
          .subtitle { font-size: 13px; color: #64748b; margin-top: 4px; }
          .message-box { background: #f1f5f9; padding: 14px; border-radius: 8px; font-size: 13px; font-style: italic; margin-bottom: 20px; }
          table { width: 100%; border-collapse: collapse; font-size: 11px; margin-bottom: 24px; }
          th { background: #0f172a; color: #ffffff; text-align: left; padding: 10px; font-size: 10px; text-transform: uppercase; }
          .btn-review { display: inline-block; background-color: #f59e0b; color: #0f172a; text-decoration: none; padding: 12px 24px; font-weight: 800; border-radius: 8px; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 class="title">Candidate Profiles for Review – ${positionTitle}</h1>
            <p class="subtitle">Client: <strong>${clientName}</strong> | Total Candidates: <strong>${candidates.length}</strong></p>
          </div>

          ${payload.recruiterMessage ? `
            <div class="message-box">
              <strong>Note from Recruiter:</strong> "${payload.recruiterMessage}"
            </div>
          ` : ''}

          <div style="overflow-x: auto;">
            <table>
              <thead>
                <tr>
                  <th>Candidate Name</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Location</th>
                  <th>Ready To Relocate</th>
                  <th>Experience</th>
                  <th>Relevant Exp</th>
                  <th>Designation</th>
                  <th>Qualification</th>
                  <th>Current / Last Company</th>
                  <th>Current Salary</th>
                  <th>Expected Salary</th>
                  <th>Notice Period</th>
                  <th>Reason of Leaving</th>
                  <th>Offer In Hand</th>
                  <th>Resume</th>
                </tr>
              </thead>
              <tbody>
                ${candidateRowsHtml}
              </tbody>
            </table>
          </div>

          <div style="text-align: center; margin-top: 24px; padding-top: 16px; border-top: 1px solid #e2e8f0;">
            <a href="${reviewUrl}" target="_blank" class="btn-review">Review Submitted Candidates</a>
            <p style="font-size: 11px; color: #64748b; margin-top: 8px;">
              Click the button above to access the secure client decision portal.
            </p>
          </div>
        </div>
      </body>
      </html>
    `;

    // Send email using Nodemailer (or log fallback if SMTP server is not set)
    const targetRecipient = payload.recipientEmail?.trim() || 'client@acme.com';
    const emailSubject = payload.emailSubject?.trim() || `Candidate Profiles for Review – ${positionTitle}`;

    try {
      if (process.env.SMTP_HOST && process.env.SMTP_USER) {
        const transporter = nodemailer.createTransport({
          host: process.env.SMTP_HOST,
          port: parseInt(process.env.SMTP_PORT || '587', 10),
          secure: process.env.SMTP_SECURE === 'true',
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS
          }
        });

        await transporter.sendMail({
          from: process.env.SMTP_FROM || `"RecruitOS Talent Platform" <noreply@recruitos.dev>`,
          to: targetRecipient,
          subject: emailSubject,
          html: emailHtml
        });
      } else {
        console.log(`[CLIENT_SUBMISSION_EMAIL] Sent to: ${targetRecipient}`);
        console.log(`[CLIENT_SUBMISSION_EMAIL] Subject: ${emailSubject}`);
        console.log(`[CLIENT_SUBMISSION_EMAIL] Secure Review Link: ${reviewUrl}`);
      }
    } catch (mailErr) {
      console.warn('Mail transport execution warning (logging fallback active):', mailErr);
    }

    return {
      success: true,
      count: candidates.length,
      token: secureReviewToken,
      reviewUrl
    };
  } catch (err: any) {
    console.error('Error in createCandidateSubmissionsAction:', err);
    return { success: false, error: err.message || 'Failed to submit candidates to client.' };
  }
}

/**
 * Public query action for Client Review Portal route `/client-review/[token]`
 */
export async function getClientReviewBatchAction(token: string): Promise<{
  success: boolean;
  positionTitle?: string;
  clientName?: string;
  recruiterMessage?: string | null;
  candidates?: any[];
  error?: string;
}> {
  try {
    if (!token || typeof token !== 'string') {
      return { success: false, error: 'Invalid client review link.' };
    }

    const submissions = await prisma.candidateSubmission.findMany({
      where: {
        secureReviewToken: token
      },
      include: {
        job: {
          select: {
            title: true,
            client: {
              select: {
                companyName: true
              }
            }
          }
        },
        candidate: {
          include: {
            discussionNote: true,
            documents: {
              where: {
                documentType: { in: ['RAW_RESUME', 'SANITIZED_RESUME'] }
              },
              orderBy: { createdAt: 'desc' },
              take: 1
            }
          }
        }
      },
      orderBy: { createdAt: 'asc' }
    });

    if (!submissions || submissions.length === 0) {
      return { success: false, error: 'Client review link not found or expired.' };
    }

    const firstSub = submissions[0];
    const positionTitle = firstSub.job.title;
    const clientName = firstSub.job.client?.companyName || 'Valued Client';
    const recruiterMessage = firstSub.recruiterMessage;

    const formattedCandidates = submissions.map(sub => {
      const c = sub.candidate;
      const note = c.discussionNote;
      const doc = c.documents[0];
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

      return {
        submissionId: sub.id,
        status: sub.status || 'PENDING',
        candidateId: c.id,
        firstName: c.firstName,
        lastName: c.lastName,
        email: c.email,
        phone: c.phone,
        totalExperienceYears: c.totalExperienceYears,
        currentDesignation: note?.currentDesignation || c.currentDesignation || 'N/A',
        qualification: note?.qualification || 'N/A',
        currentCompany: note?.currentCompany || c.currentCompany || 'N/A',
        currentSalary: note?.currentSalary || (c.currentCtcLpa ? `${c.currentCtcLpa} LPA` : 'N/A'),
        expectedSalary: note?.expectedSalary || (c.expectedCtcLpa ? `${c.expectedCtcLpa} LPA` : 'N/A'),
        noticePeriod: note?.noticePeriod || 'N/A',
        reasonOfLeaving: note?.reasonOfLeaving || 'N/A',
        offerInHand: note?.offerInHand || 'N/A',
        totalExperience: note?.totalExperience || (c.totalExperienceYears ? `${c.totalExperienceYears} Yrs` : 'N/A'),
        relevantExperience: note?.relevantExperience || 'N/A',
        resumeUrl: doc ? `${baseUrl}/api/documents/${doc.id}` : null,
        resumeFileName: doc?.fileName || null
      };
    });

    const serializedData = serializeDecimals(formattedCandidates);

    return {
      success: true,
      positionTitle,
      clientName,
      recruiterMessage,
      candidates: serializedData
    };
  } catch (err: any) {
    console.error('Error in getClientReviewBatchAction:', err);
    return { success: false, error: err.message || 'Failed to load submitted candidates.' };
  }
}

/**
 * Public client decision action to mark Interview, Hold, or Reject.
 */
export async function updateClientDecisionAction(
  submissionId: string,
  token: string,
  decision: 'INTERVIEW' | 'HOLD' | 'REJECT'
): Promise<{
  success: boolean;
  status?: string;
  error?: string;
}> {
  try {
    if (!submissionId || !token) {
      return { success: false, error: 'Invalid submission request.' };
    }

    if (!['INTERVIEW', 'HOLD', 'REJECT'].includes(decision)) {
      return { success: false, error: 'Invalid decision option.' };
    }

    // Security check: Must match submissionId AND secureReviewToken
    const submission = await prisma.candidateSubmission.findFirst({
      where: {
        id: submissionId,
        secureReviewToken: token
      }
    });

    if (!submission) {
      return { success: false, error: 'Unauthorized or invalid submission token.' };
    }

    const updated = await prisma.candidateSubmission.update({
      where: { id: submission.id },
      data: {
        status: decision,
        updatedAt: new Date()
      }
    });

    return {
      success: true,
      status: updated.status
    };
  } catch (err: any) {
    console.error('Error in updateClientDecisionAction:', err);
    return { success: false, error: err.message || 'Failed to record decision.' };
  }
}
