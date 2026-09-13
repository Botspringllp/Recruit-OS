'use server';

import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/rbac';
import { serializeDecimals } from '@/lib/serialize';
import nodemailer from 'nodemailer';
import crypto from 'crypto';

export interface ShareToClientPayload {
  candidateIds: string[];
  jobId: string;
  clientEmail?: string;
  recruiterMessage?: string;
}

export interface ActiveJobOption {
  id: string;
  title: string;
  companyName: string;
  clientId: string | null;
  clientEmail?: string;
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
      clientEmail: j.client?.contacts[0]?.email || '',
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
  clientEmail?: string;
  emailSubject?: string;
  emailBodyText?: string;
  emailHtml?: string;
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

    function formatShortDate(d?: Date | null): string {
      const dateObj = d ? new Date(d) : new Date();
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      return `${dateObj.getDate()}-${months[dateObj.getMonth()]}-${String(dateObj.getFullYear()).slice(-2)}`;
    }

    // Construct 19-Column HTML Table matching client screenshot
    const candidateTableRowsHtml = candidates.map((c: any) => {
      const note = c.discussionNote;
      const dateStr = formatShortDate(c.createdAt);
      const sourceStr = c.source === 'DIRECT_INTAKE' ? 'Naukri' : (c.source || 'Naukri');
      const fullName = `${c.firstName} ${c.lastName}`.trim();
      const emailStr = c.email || 'N/A';
      const phoneStr = c.phone || 'N/A';
      const locationStr = c.currentLocation || 'N/A';
      const relocateStr = note?.readyToRelocate || 'N/A';
      const expStr = note?.totalExperience || (c.totalExperienceYears ? `${c.totalExperienceYears}yr` : 'N/A');
      const relExpStr = note?.relevantExperience || 'N/A';
      const desigStr = note?.currentDesignation || c.currentDesignation || 'N/A';
      const qualStr = note?.qualification || 'N/A';
      const companyStr = note?.currentCompany || c.currentCompany || 'N/A';
      const currSalStr = note?.currentSalary || (c.currentCtcLpa ? `${c.currentCtcLpa}LPA` : 'N/A');
      const expSalStr = note?.expectedSalary || (c.expectedCtcLpa ? `${c.expectedCtcLpa}LPA` : 'N/A');
      const noticeStr = note?.noticePeriod || 'N/A';
      const reasonStr = note?.reasonOfLeaving || 'N/A';
      const offerStr = note?.offerInHand || 'N/A';

      return `
        <tr style="background-color: #ffffff;">
          <td style="border: 1px solid #7f9db9; padding: 6px 5px; text-align: center; white-space: nowrap;">${dateStr}</td>
          <td style="border: 1px solid #7f9db9; padding: 6px 5px; text-align: center;">${sourceStr}</td>
          <td style="border: 1px solid #7f9db9; padding: 6px 5px; text-align: center;">${clientName}</td>
          <td style="border: 1px solid #7f9db9; padding: 6px 5px; text-align: center;">${positionTitle}</td>
          <td style="border: 1px solid #7f9db9; padding: 6px 5px; text-align: center; font-weight: bold; color: #000000;">${fullName}</td>
          <td style="border: 1px solid #7f9db9; padding: 6px 5px; text-align: center; color: #0000ee; text-decoration: underline;">${emailStr}</td>
          <td style="border: 1px solid #7f9db9; padding: 6px 5px; text-align: center;">${phoneStr}</td>
          <td style="border: 1px solid #7f9db9; padding: 6px 5px; text-align: center;">${locationStr}</td>
          <td style="border: 1px solid #7f9db9; padding: 6px 5px; text-align: center;">${relocateStr}</td>
          <td style="border: 1px solid #7f9db9; padding: 6px 5px; text-align: center;">${expStr}</td>
          <td style="border: 1px solid #7f9db9; padding: 6px 5px; text-align: center;">${relExpStr}</td>
          <td style="border: 1px solid #7f9db9; padding: 6px 5px; text-align: center;">${desigStr}</td>
          <td style="border: 1px solid #7f9db9; padding: 6px 5px; text-align: center;">${qualStr}</td>
          <td style="border: 1px solid #7f9db9; padding: 6px 5px; text-align: center;">${companyStr}</td>
          <td style="border: 1px solid #7f9db9; padding: 6px 5px; text-align: center;">${currSalStr}</td>
          <td style="border: 1px solid #7f9db9; padding: 6px 5px; text-align: center;">${expSalStr}</td>
          <td style="border: 1px solid #7f9db9; padding: 6px 5px; text-align: center;">${noticeStr}</td>
          <td style="border: 1px solid #7f9db9; padding: 6px 5px; text-align: center;">${reasonStr}</td>
          <td style="border: 1px solid #7f9db9; padding: 6px 5px; text-align: center;">${offerStr}</td>
        </tr>
      `;
    }).join('');

    const emailHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
</head>
<body style="font-family: Arial, sans-serif; font-size: 13px; color: #111111; margin: 0; padding: 10px;">
  <p style="font-size: 14px; margin-bottom: 12px;">Please have a look at the tracker and submitted candidate profiles for <strong>${positionTitle}</strong>.</p>
  
  ${payload.recruiterMessage ? `<p style="font-style: italic; background: #f1f5f9; padding: 10px 14px; border-left: 4px solid #0d3859; margin-bottom: 16px;"><strong>Recruiter Note:</strong> "${payload.recruiterMessage}"</p>` : ''}

  <p style="background: #e0f2fe; border: 1px solid #7dd3fc; padding: 10px; border-radius: 6px; margin-bottom: 16px;">
    <strong>Client Review Portal (Track & Record Decisions Online):</strong><br/>
    <a href="${reviewUrl}" target="_blank" style="color: #0284c7; text-decoration: underline; word-break: break-all;">${reviewUrl}</a>
  </p>

  <div style="overflow-x: auto; margin-bottom: 20px;">
    <table style="border-collapse: collapse; width: 100%; font-family: Arial, sans-serif; font-size: 11px; border: 1px solid #0d3859;">
      <thead>
        <tr style="background-color: #0d3859; color: #ffffff; text-align: center;">
          <th style="border: 1px solid #0d3859; padding: 7px 5px; font-size: 11px; font-weight: bold; white-space: nowrap;">Date</th>
          <th style="border: 1px solid #0d3859; padding: 7px 5px; font-size: 11px; font-weight: bold; white-space: nowrap;">Source</th>
          <th style="border: 1px solid #0d3859; padding: 7px 5px; font-size: 11px; font-weight: bold; white-space: nowrap;">Client Name</th>
          <th style="border: 1px solid #0d3859; padding: 7px 5px; font-size: 11px; font-weight: bold; white-space: nowrap;">Applied Position Name</th>
          <th style="border: 1px solid #0d3859; padding: 7px 5px; font-size: 11px; font-weight: bold; white-space: nowrap;">Candidate Name</th>
          <th style="border: 1px solid #0d3859; padding: 7px 5px; font-size: 11px; font-weight: bold; white-space: nowrap;">Email ID</th>
          <th style="border: 1px solid #0d3859; padding: 7px 5px; font-size: 11px; font-weight: bold; white-space: nowrap;">Number</th>
          <th style="border: 1px solid #0d3859; padding: 7px 5px; font-size: 11px; font-weight: bold; white-space: nowrap;">Location</th>
          <th style="border: 1px solid #0d3859; padding: 7px 5px; font-size: 11px; font-weight: bold; white-space: nowrap;">Ready to Relocate</th>
          <th style="border: 1px solid #0d3859; padding: 7px 5px; font-size: 11px; font-weight: bold; white-space: nowrap;">Experience</th>
          <th style="border: 1px solid #0d3859; padding: 7px 5px; font-size: 11px; font-weight: bold; white-space: nowrap;">Relevant Exp</th>
          <th style="border: 1px solid #0d3859; padding: 7px 5px; font-size: 11px; font-weight: bold; white-space: nowrap;">Designation</th>
          <th style="border: 1px solid #0d3859; padding: 7px 5px; font-size: 11px; font-weight: bold; white-space: nowrap;">Qualification</th>
          <th style="border: 1px solid #0d3859; padding: 7px 5px; font-size: 11px; font-weight: bold; white-space: nowrap;">Current/Last Company</th>
          <th style="border: 1px solid #0d3859; padding: 7px 5px; font-size: 11px; font-weight: bold; white-space: nowrap;">Current Salary</th>
          <th style="border: 1px solid #0d3859; padding: 7px 5px; font-size: 11px; font-weight: bold; white-space: nowrap;">Expectation</th>
          <th style="border: 1px solid #0d3859; padding: 7px 5px; font-size: 11px; font-weight: bold; white-space: nowrap;">Notice Period</th>
          <th style="border: 1px solid #0d3859; padding: 7px 5px; font-size: 11px; font-weight: bold; white-space: nowrap;">Reason of Leaving</th>
          <th style="border: 1px solid #0d3859; padding: 7px 5px; font-size: 11px; font-weight: bold; white-space: nowrap;">Offer in Hand</th>
        </tr>
      </thead>
      <tbody>
        ${candidateTableRowsHtml}
      </tbody>
    </table>
  </div>

  <p style="margin-top: 20px; font-weight: bold;">
    Regards,<br/>
    Recruitment Team
  </p>
</body>
</html>`;

    // Construct 19-Column Plain Text Tab-Separated Table for mailto: URI body
    const candidateTableRowsText = candidates.map((c: any) => {
      const note = c.discussionNote;
      const dateStr = formatShortDate(c.createdAt);
      const sourceStr = c.source === 'DIRECT_INTAKE' ? 'Naukri' : (c.source || 'Naukri');
      const fullName = `${c.firstName} ${c.lastName}`.trim();
      const emailStr = c.email || 'N/A';
      const phoneStr = c.phone || 'N/A';
      const locationStr = c.currentLocation || 'N/A';
      const relocateStr = note?.readyToRelocate || 'N/A';
      const expStr = note?.totalExperience || (c.totalExperienceYears ? `${c.totalExperienceYears}yr` : 'N/A');
      const relExpStr = note?.relevantExperience || 'N/A';
      const desigStr = note?.currentDesignation || c.currentDesignation || 'N/A';
      const qualStr = note?.qualification || 'N/A';
      const companyStr = note?.currentCompany || c.currentCompany || 'N/A';
      const currSalStr = note?.currentSalary || (c.currentCtcLpa ? `${c.currentCtcLpa}LPA` : 'N/A');
      const expSalStr = note?.expectedSalary || (c.expectedCtcLpa ? `${c.expectedCtcLpa}LPA` : 'N/A');
      const noticeStr = note?.noticePeriod || 'N/A';
      const reasonStr = note?.reasonOfLeaving || 'N/A';
      const offerStr = note?.offerInHand || 'N/A';

      return `${dateStr}\t${sourceStr}\t${clientName}\t${positionTitle}\t${fullName}\t${emailStr}\t${phoneStr}\t${locationStr}\t${relocateStr}\t${expStr}\t${relExpStr}\t${desigStr}\t${qualStr}\t${companyStr}\t${currSalStr}\t${expSalStr}\t${noticeStr}\t${reasonStr}\t${offerStr}`;
    }).join('\n');

    const emailSubject = `Candidate Profiles for Review – ${positionTitle}`;

    const emailBodyText = `Please have a look at the tracker and attached candidate profiles for ${positionTitle}.\n\n${payload.recruiterMessage ? `Recruiter Note: "${payload.recruiterMessage}"\n\n` : ''}Client Review Portal (Track & Record Decisions Online):\n${reviewUrl}\n\nCandidate Tracker:\nDate\tSource\tClient Name\tApplied Position Name\tCandidate Name\tEmail ID\tNumber\tLocation\tReady to Relocate\tExperience\tRelevant Exp\tDesignation\tQualification\tCurrent/Last Company\tCurrent Salary\tExpectation\tNotice Period\tReason of Leaving\tOffer in Hand\n${candidateTableRowsText}\n\nRegards,\nRecruitment Team`;

    const targetRecipient = payload.clientEmail?.trim() || '';

    try {
      if (targetRecipient && process.env.SMTP_HOST && process.env.SMTP_USER) {
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
          html: emailHtml,
          text: emailBodyText
        });
      } else {
        console.log(`[CLIENT_SUBMISSION_EMAIL] Target Recipient: ${targetRecipient || 'Manual mailto trigger'}`);
        console.log(`[CLIENT_SUBMISSION_EMAIL] Subject: ${emailSubject}`);
        console.log(`[CLIENT_SUBMISSION_EMAIL] Review Link: ${reviewUrl}`);
      }
    } catch (mailErr) {
      console.warn('Mail transport execution warning:', mailErr);
    }

    return {
      success: true,
      count: candidates.length,
      token: secureReviewToken,
      reviewUrl,
      clientEmail: targetRecipient,
      emailSubject,
      emailBodyText,
      emailHtml
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
