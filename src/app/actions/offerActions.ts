'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/rbac';
import { publishNotification } from '@/lib/notifications/notificationPublisher';
import { NotificationType, NotificationCategory } from '@/lib/notifications';
import {
  logOfferSentEmail,
  logOfferAcceptedEmail,
  logOfferDeclinedEmail,
  logOfferClarificationEmail,
  logJoiningConfirmedEmail,
  logPlacementClosedEmail
} from '@/lib/email';
import crypto from 'crypto';

export interface CreateOfferInput {
  candidateSubmissionId: string;
  title: string;
  offeredCTC: number;
  fixedSalary?: number;
  variableSalary?: number;
  joiningDate: string; // YYYY-MM-DD
  workLocation?: string;
  employmentType?: string;
  bondPeriod?: string;
  probationPeriod?: string;
  noticePeriod?: string;
  benefits?: string;
  specialTerms?: string;
  internalNotes?: string;
}

/**
 * PART B: Recruiter Offer Builder Action
 */
export async function createOfferLetterAction(input: CreateOfferInput) {
  try {
    const dbUser = await getCurrentUser();
    if (!dbUser || !dbUser.agencyId) {
      return { success: false, error: 'Unauthorized: Active recruiter session required' };
    }

    const submission = await (prisma as any).candidateSubmission.findUnique({
      where: { id: input.candidateSubmissionId },
      include: {
        candidate: true,
        job: true,
        client: true
      }
    });

    if (!submission) {
      return { success: false, error: 'Candidate submission record not found' };
    }

    const token = crypto.randomBytes(24).toString('hex');
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const offerUrl = `${baseUrl}/offer/${token}`;

    const offerLetter = await (prisma as any).offerLetter.create({
      data: {
        agencyId: dbUser.agencyId,
        candidateSubmissionId: submission.id,
        candidateId: submission.candidateId,
        jobId: submission.jobId,
        clientId: submission.clientId || null,
        recruiterId: dbUser.id,
        token,
        title: input.title.trim(),
        offeredCTC: input.offeredCTC,
        fixedSalary: input.fixedSalary || null,
        variableSalary: input.variableSalary || null,
        joiningDate: new Date(input.joiningDate),
        workLocation: input.workLocation || null,
        employmentType: input.employmentType || 'FULL_TIME',
        bondPeriod: input.bondPeriod || null,
        probationPeriod: input.probationPeriod || null,
        noticePeriod: input.noticePeriod || null,
        benefits: input.benefits || null,
        specialTerms: input.specialTerms || null,
        internalNotes: input.internalNotes || null,
        status: 'SENT',
        sentAt: new Date()
      }
    });

    // Update Submission Stage to OFFER_SENT
    await (prisma as any).candidateSubmission.update({
      where: { id: submission.id },
      data: { stage: 'OFFER_SENT' }
    });

    // Log Email Event OFFER_SENT
    if (submission.candidate.email) {
      const offeredCtcStr = `₹${(input.offeredCTC / 100000).toFixed(2)} LPA`;
      await logOfferSentEmail(
        dbUser.agencyId,
        submission.candidate.email,
        `${submission.candidate.firstName} ${submission.candidate.lastName}`,
        submission.job.companyName || submission.client?.companyName || 'RecruitOS Client',
        submission.job.title,
        offeredCtcStr,
        offerUrl
      );
    }

    // Dispatch SSE Notification
    await publishNotification({
      agencyId: dbUser.agencyId,
      recipientUserId: dbUser.id,
      title: 'Offer Letter Sent',
      message: `Offer extended to ${submission.candidate.firstName} ${submission.candidate.lastName} for ${submission.job.title}`,
      type: NotificationType.SUCCESS,
      category: NotificationCategory.CANDIDATE,
      entityType: 'OFFER',
      entityId: offerLetter.id
    });

    revalidatePath('/offers');
    return { success: true, offerLetterId: offerLetter.id, offerUrl };
  } catch (err: any) {
    console.error('[createOfferLetterAction Error]:', err);
    return { success: false, error: err?.message || 'Failed to create offer letter' };
  }
}

/**
 * PART C: Public Guest Offer Fetcher (Tokenized)
 */
export async function getPublicOfferLetterAction(token: string) {
  try {
    const offer = await (prisma as any).offerLetter.findUnique({
      where: { token },
      include: {
        candidate: true,
        job: true,
        client: true,
        recruiter: true,
        clarifications: {
          orderBy: { createdAt: 'asc' }
        }
      }
    });

    if (!offer) {
      return { success: false, error: 'Offer not found or link has expired' };
    }

    // Mark as VIEWED if previously SENT
    if (offer.status === 'SENT') {
      await (prisma as any).offerLetter.update({
        where: { id: offer.id },
        data: { status: 'VIEWED', viewedAt: new Date() }
      });

      // Dispatch SSE to Recruiter (PART M)
      if (offer.recruiterId) {
        await publishNotification({
          agencyId: offer.agencyId,
          recipientUserId: offer.recruiterId,
          title: 'Offer Letter Viewed',
          message: `Candidate ${offer.candidate.firstName} ${offer.candidate.lastName} opened their offer letter.`,
          type: NotificationType.INFO,
          category: NotificationCategory.CANDIDATE,
          entityType: 'OFFER',
          entityId: offer.id
        });
      }
    }

    return { success: true, offer };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Failed to fetch offer letter' };
  }
}

/**
 * PART E: Candidate Accept Offer Action
 */
export async function acceptOfferAction(token: string) {
  try {
    const offer = await (prisma as any).offerLetter.findUnique({
      where: { token },
      include: { candidate: true, job: true, client: true }
    });

    if (!offer) return { success: false, error: 'Offer not found' };
    if (offer.status === 'ACCEPTED') return { success: true, message: 'Offer already accepted' };

    const now = new Date();

    // 1. Update Offer Status
    await (prisma as any).offerLetter.update({
      where: { id: offer.id },
      data: { status: 'ACCEPTED', respondedAt: now }
    });

    // 2. Update Submission Pipeline Stage
    await (prisma as any).candidateSubmission.update({
      where: { id: offer.candidateSubmissionId },
      data: { stage: 'OFFER_ACCEPTED' }
    });

    // 3. Initialize Joining Tracker (PART F & G)
    const defaultDocs = [
      { key: 'RESUME', name: 'Updated Resume', status: 'PENDING', fileUrl: null },
      { key: 'AADHAAR', name: 'Aadhaar Card', status: 'PENDING', fileUrl: null },
      { key: 'PAN', name: 'PAN Card', status: 'PENDING', fileUrl: null },
      { key: 'DEGREE', name: 'Degree Certificate', status: 'PENDING', fileUrl: null },
      { key: 'EXPERIENCE_LETTER', name: 'Experience / Relieving Letter', status: 'PENDING', fileUrl: null },
      { key: 'OFFER_ACCEPTANCE', name: 'Signed Offer Acceptance Proof', status: 'PENDING', fileUrl: null }
    ];

    await (prisma as any).joiningTracker.upsert({
      where: { offerLetterId: offer.id },
      create: {
        agencyId: offer.agencyId,
        offerLetterId: offer.id,
        candidateSubmissionId: offer.candidateSubmissionId,
        candidateId: offer.candidateId,
        jobId: offer.jobId,
        recruiterId: offer.recruiterId,
        clientId: offer.clientId,
        joiningDate: offer.joiningDate,
        status: 'OFFER_ACCEPTED',
        requiredDocuments: defaultDocs
      },
      update: {
        status: 'OFFER_ACCEPTED',
        joiningDate: offer.joiningDate
      }
    });

    // 4. Send Email Notifications
    if (offer.recruiterId) {
      const recruiterUser = await prisma.user.findUnique({ where: { id: offer.recruiterId } });
      if (recruiterUser?.email) {
        await logOfferAcceptedEmail(
          offer.agencyId,
          recruiterUser.email,
          `${offer.candidate.firstName} ${offer.candidate.lastName}`,
          offer.job.companyName || offer.client?.companyName || 'RecruitOS Client',
          offer.job.title,
          new Date(offer.joiningDate).toLocaleDateString(),
          `₹${(Number(offer.offeredCTC) / 100000).toFixed(2)} LPA`
        );
      }
    }

    // 5. Dispatch Real-Time SSE Notification (PART M)
    if (offer.recruiterId) {
      await publishNotification({
        agencyId: offer.agencyId,
        recipientUserId: offer.recruiterId,
        title: '🎉 Offer ACCEPTED!',
        message: `${offer.candidate.firstName} ${offer.candidate.lastName} accepted the offer for ${offer.job.title}`,
        type: NotificationType.SUCCESS,
        category: NotificationCategory.CANDIDATE,
        entityType: 'OFFER',
        entityId: offer.id
      });
    }

    revalidatePath('/joining');
    return { success: true };
  } catch (err: any) {
    console.error('[acceptOfferAction Error]:', err);
    return { success: false, error: err?.message || 'Failed to accept offer' };
  }
}

/**
 * PART C: Candidate Decline Offer Action
 */
export async function declineOfferAction(token: string, declineReason: string) {
  try {
    const offer = await (prisma as any).offerLetter.findUnique({
      where: { token },
      include: { candidate: true, job: true, client: true }
    });

    if (!offer) return { success: false, error: 'Offer not found' };

    await (prisma as any).offerLetter.update({
      where: { id: offer.id },
      data: {
        status: 'DECLINED',
        declineReason: declineReason.trim(),
        respondedAt: new Date()
      }
    });

    await (prisma as any).candidateSubmission.update({
      where: { id: offer.candidateSubmissionId },
      data: { stage: 'OFFER_DECLINED' }
    });

    if (offer.recruiterId) {
      const recruiterUser = await prisma.user.findUnique({ where: { id: offer.recruiterId } });
      if (recruiterUser?.email) {
        await logOfferDeclinedEmail(
          offer.agencyId,
          recruiterUser.email,
          `${offer.candidate.firstName} ${offer.candidate.lastName}`,
          offer.job.companyName || offer.client?.companyName || 'RecruitOS Client',
          offer.job.title,
          declineReason
        );
      }

      await publishNotification({
        agencyId: offer.agencyId,
        recipientUserId: offer.recruiterId,
        title: 'Offer Declined',
        message: `${offer.candidate.firstName} ${offer.candidate.lastName} declined the offer: ${declineReason}`,
        type: NotificationType.WARNING,
        category: NotificationCategory.CANDIDATE,
        entityType: 'OFFER',
        entityId: offer.id
      });
    }

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Failed to decline offer' };
  }
}

/**
 * PART D: Request Clarification Action
 */
export async function requestOfferClarificationAction(
  token: string,
  questionTitle: string,
  questionDetails: string
) {
  try {
    const offer = await (prisma as any).offerLetter.findUnique({
      where: { token },
      include: { candidate: true, job: true, client: true }
    });

    if (!offer) return { success: false, error: 'Offer not found' };

    await (prisma as any).offerClarification.create({
      data: {
        offerLetterId: offer.id,
        senderRole: 'CANDIDATE',
        senderName: `${offer.candidate.firstName} ${offer.candidate.lastName}`,
        questionTitle: questionTitle.trim(),
        questionDetails: questionDetails.trim()
      }
    });

    await (prisma as any).offerLetter.update({
      where: { id: offer.id },
      data: { status: 'CLARIFICATION_REQUESTED' }
    });

    if (offer.recruiterId) {
      const recruiterUser = await prisma.user.findUnique({ where: { id: offer.recruiterId } });
      if (recruiterUser?.email) {
        await logOfferClarificationEmail(
          offer.agencyId,
          recruiterUser.email,
          `${offer.candidate.firstName} ${offer.candidate.lastName}`,
          offer.job.companyName || offer.client?.companyName || 'RecruitOS Client',
          offer.job.title,
          questionTitle,
          questionDetails
        );
      }

      await publishNotification({
        agencyId: offer.agencyId,
        recipientUserId: offer.recruiterId,
        title: 'Offer Clarification Requested',
        message: `${offer.candidate.firstName} ${offer.candidate.lastName} asked: ${questionTitle}`,
        type: NotificationType.INFO,
        category: NotificationCategory.CANDIDATE,
        entityType: 'OFFER',
        entityId: offer.id
      });
    }

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Failed to submit clarification request' };
  }
}

/**
 * PART G: Update Joining Document Status
 */
export async function updateJoiningDocumentAction(
  joiningId: string,
  docKey: string,
  status: 'PENDING' | 'UPLOADED' | 'VERIFIED' | 'REJECTED',
  fileUrl?: string
) {
  try {
    const dbUser = await getCurrentUser();
    if (!dbUser) return { success: false, error: 'Unauthorized' };

    const tracker = await (prisma as any).joiningTracker.findUnique({
      where: { id: joiningId }
    });

    if (!tracker) return { success: false, error: 'Joining tracker not found' };

    let docs: any[] = tracker.requiredDocuments || [];
    docs = docs.map((d: any) => {
      if (d.key === docKey) {
        return { ...d, status, fileUrl: fileUrl || d.fileUrl };
      }
      return d;
    });

    const allVerified = docs.every((d: any) => d.status === 'VERIFIED');
    const newStatus = allVerified ? 'DOCUMENT_VERIFIED' : 'DOCUMENT_PENDING';

    await (prisma as any).joiningTracker.update({
      where: { id: joiningId },
      data: {
        requiredDocuments: docs,
        status: tracker.status === 'OFFER_ACCEPTED' || tracker.status === 'PRE_JOINING' ? newStatus : tracker.status
      }
    });

    revalidatePath('/joining');
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Failed to update document status' };
  }
}

/**
 * PART H: Joining Confirmation Engine (Recruiter & Client Double Verification)
 */
export async function confirmJoiningAction(joiningId: string, party: 'RECRUITER' | 'CLIENT') {
  try {
    const dbUser = await getCurrentUser();
    if (!dbUser) return { success: false, error: 'Unauthorized' };

    const tracker = await (prisma as any).joiningTracker.findUnique({
      where: { id: joiningId },
      include: {
        candidate: true,
        job: true,
        client: true,
        submission: true,
        offerLetter: true
      }
    });

    if (!tracker) return { success: false, error: 'Joining record not found' };

    const now = new Date();
    const isRecruiter = party === 'RECRUITER';

    const updatedData: any = {};
    if (isRecruiter) {
      updatedData.recruiterConfirmed = true;
      updatedData.recruiterConfirmedAt = now;
    } else {
      updatedData.clientConfirmed = true;
      updatedData.clientConfirmedAt = now;
    }

    const recruiterDone = isRecruiter ? true : tracker.recruiterConfirmed;
    const clientDone = !isRecruiter ? true : tracker.clientConfirmed;

    // When BOTH parties confirm -> Stage = JOINED, create PlacementRecord and RevenueRecord
    if (recruiterDone && clientDone) {
      updatedData.status = 'JOINED';

      // 1. Update Candidate Submission Stage to JOINED
      await (prisma as any).candidateSubmission.update({
        where: { id: tracker.candidateSubmissionId },
        data: { stage: 'JOINED' }
      });

      // 2. Create Placement Record (PART I)
      const finalSalary = tracker.offerLetter?.offeredCTC || 1000000;

      const placementRecord = await (prisma as any).placementRecord.upsert({
        where: { joiningTrackerId: tracker.id },
        create: {
          agencyId: tracker.agencyId,
          joiningTrackerId: tracker.id,
          candidateSubmissionId: tracker.candidateSubmissionId,
          candidateId: tracker.candidateId,
          jobId: tracker.jobId,
          clientId: tracker.clientId,
          recruiterId: tracker.recruiterId,
          joiningDate: tracker.joiningDate,
          finalSalary,
          placementStatus: 'ACTIVE'
        },
        update: { placementStatus: 'ACTIVE', finalSalary }
      });

      // 3. Create Revenue Record (PART J)
      const feePercentage = tracker.client?.standardFeePercentage || 8.33;
      const annualSalary = Number(finalSalary);
      const totalRevenue = (annualSalary * Number(feePercentage)) / 100;

      await (prisma as any).revenueRecord.upsert({
        where: { placementRecordId: placementRecord.id },
        create: {
          agencyId: tracker.agencyId,
          placementRecordId: placementRecord.id,
          recruiterId: tracker.recruiterId,
          clientId: tracker.clientId,
          jobId: tracker.jobId,
          candidateId: tracker.candidateId,
          feeType: 'PERCENTAGE',
          feePercentage,
          annualSalary,
          totalRevenue,
          status: 'PENDING'
        },
        update: { annualSalary, totalRevenue }
      });

      // 4. Trigger Email & SSE Notifications (PART M)
      if (tracker.recruiterId) {
        const recruiterUser = await prisma.user.findUnique({ where: { id: tracker.recruiterId } });
        if (recruiterUser?.email) {
          await logJoiningConfirmedEmail(
            tracker.agencyId,
            recruiterUser.email,
            `${tracker.candidate.firstName} ${tracker.candidate.lastName}`,
            tracker.job.companyName || tracker.client?.companyName || 'RecruitOS Client',
            tracker.job.title,
            new Date(tracker.joiningDate).toLocaleDateString(),
            `₹${(annualSalary / 100000).toFixed(2)} LPA`
          );

          await logPlacementClosedEmail(
            tracker.agencyId,
            recruiterUser.email,
            `${tracker.candidate.firstName} ${tracker.candidate.lastName}`,
            tracker.job.companyName || tracker.client?.companyName || 'RecruitOS Client',
            `₹${totalRevenue.toLocaleString()}`
          );
        }

        await publishNotification({
          agencyId: tracker.agencyId,
          recipientUserId: tracker.recruiterId,
          title: '🚀 JOINING CONFIRMED & PLACEMENT CLOSED!',
          message: `${tracker.candidate.firstName} ${tracker.candidate.lastName} joined ${tracker.job.title}. Revenue generated: ₹${totalRevenue.toLocaleString()}`,
          type: NotificationType.SUCCESS,
          category: NotificationCategory.CANDIDATE,
          entityType: 'PLACEMENT',
          entityId: placementRecord.id
        });
      }
    } else {
      updatedData.status = 'JOINING_CONFIRMED';
    }

    await (prisma as any).joiningTracker.update({
      where: { id: joiningId },
      data: updatedData
    });

    revalidatePath('/joining');
    revalidatePath('/placements');
    revalidatePath('/revenue');
    return { success: true, fullyConfirmed: recruiterDone && clientDone };
  } catch (err: any) {
    console.error('[confirmJoiningAction Error]:', err);
    return { success: false, error: err?.message || 'Failed to confirm joining' };
  }
}

/**
 * PART I: Close Placement & Invoice Action
 */
export async function closePlacementAction(placementId: string) {
  try {
    const dbUser = await getCurrentUser();
    if (!dbUser) return { success: false, error: 'Unauthorized' };

    const placement = await (prisma as any).placementRecord.update({
      where: { id: placementId },
      data: {
        placementStatus: 'CLOSED',
        closedAt: new Date()
      }
    });

    await (prisma as any).revenueRecord.updateMany({
      where: { placementRecordId: placementId },
      data: { status: 'INVOICED', invoicedAt: new Date() }
    });

    revalidatePath('/placements');
    revalidatePath('/revenue');
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Failed to close placement' };
  }
}

/**
 * PART O: Dashboard Data Fetchers
 */
export async function getOfferDashboardDataAction() {
  try {
    const dbUser = await getCurrentUser();
    if (!dbUser || !dbUser.agencyId) return { success: false, offers: [], metrics: null };

    const agencyId = dbUser.agencyId;

    const [offers, totalSent, totalAccepted, totalDeclined, totalClarifications] = await Promise.all([
      (prisma as any).offerLetter.findMany({
        where: { agencyId },
        include: {
          candidate: true,
          job: true,
          client: true,
          recruiter: true
        },
        orderBy: { createdAt: 'desc' }
      }),
      (prisma as any).offerLetter.count({ where: { agencyId } }),
      (prisma as any).offerLetter.count({ where: { agencyId, status: 'ACCEPTED' } }),
      (prisma as any).offerLetter.count({ where: { agencyId, status: 'DECLINED' } }),
      (prisma as any).offerLetter.count({ where: { agencyId, status: 'CLARIFICATION_REQUESTED' } })
    ]);

    const acceptanceRate = totalSent > 0 ? Math.round((totalAccepted / totalSent) * 100) : 0;

    return {
      success: true,
      offers,
      metrics: {
        totalSent,
        totalAccepted,
        totalDeclined,
        totalClarifications,
        acceptanceRate
      }
    };
  } catch (err: any) {
    return { success: false, offers: [], metrics: null };
  }
}

export async function getJoiningDashboardDataAction() {
  try {
    const dbUser = await getCurrentUser();
    if (!dbUser || !dbUser.agencyId) return { success: false, joinings: [], metrics: null };

    const agencyId = dbUser.agencyId;

    const [joinings, totalAccepted, totalJoined, totalPendingDocs] = await Promise.all([
      (prisma as any).joiningTracker.findMany({
        where: { agencyId },
        include: {
          candidate: true,
          job: true,
          client: true,
          recruiter: true,
          offerLetter: true
        },
        orderBy: { joiningDate: 'asc' }
      }),
      (prisma as any).joiningTracker.count({ where: { agencyId } }),
      (prisma as any).joiningTracker.count({ where: { agencyId, status: 'JOINED' } }),
      (prisma as any).joiningTracker.count({ where: { agencyId, status: 'DOCUMENT_PENDING' } })
    ]);

    const joiningRate = totalAccepted > 0 ? Math.round((totalJoined / totalAccepted) * 100) : 0;

    return {
      success: true,
      joinings,
      metrics: {
        totalAccepted,
        totalJoined,
        totalPendingDocs,
        joiningRate
      }
    };
  } catch (err: any) {
    return { success: false, joinings: [], metrics: null };
  }
}

export async function getPlacementAndRevenueDashboardDataAction() {
  try {
    const dbUser = await getCurrentUser();
    if (!dbUser || !dbUser.agencyId) return { success: false, placements: [], revenues: [], metrics: null, leaderboard: [] };

    const agencyId = dbUser.agencyId;

    const [placements, revenues, totalPlacements, closedPlacements, totalRevenueAggregate, recruiters] = await Promise.all([
      (prisma as any).placementRecord.findMany({
        where: { agencyId },
        include: { candidate: true, job: true, client: true, recruiter: true, revenueRecord: true },
        orderBy: { createdAt: 'desc' }
      }),
      (prisma as any).revenueRecord.findMany({
        where: { agencyId },
        include: { candidate: true, job: true, client: true, recruiter: true },
        orderBy: { createdAt: 'desc' }
      }),
      (prisma as any).placementRecord.count({ where: { agencyId } }),
      (prisma as any).placementRecord.count({ where: { agencyId, placementStatus: 'CLOSED' } }),
      (prisma as any).revenueRecord.aggregate({
        where: { agencyId },
        _sum: { totalRevenue: true }
      }),
      prisma.user.findMany({
        where: { agencyId, isActive: true },
        select: { id: true, firstName: true, lastName: true, role: true }
      })
    ]);

    const totalRevenueSum = Number(totalRevenueAggregate._sum?.totalRevenue || 0);

    // PART K: Recruiter Leaderboard Calculation
    const leaderboard = await Promise.all(
      recruiters.map(async (r) => {
        const [subCount, offerCount, joinedCount, revenueSum] = await Promise.all([
          (prisma as any).candidateSubmission.count({ where: { agencyId, recruiterId: r.id } }),
          (prisma as any).offerLetter.count({ where: { agencyId, recruiterId: r.id } }),
          (prisma as any).placementRecord.count({ where: { agencyId, recruiterId: r.id } }),
          (prisma as any).revenueRecord.aggregate({
            where: { agencyId, recruiterId: r.id },
            _sum: { totalRevenue: true }
          })
        ]);

        return {
          recruiterId: r.id,
          name: `${r.firstName} ${r.lastName}`,
          role: r.role,
          submissions: subCount,
          offers: offerCount,
          placements: joinedCount,
          revenue: Number(revenueSum._sum?.totalRevenue || 0)
        };
      })
    );

    leaderboard.sort((a, b) => b.revenue - a.revenue);

    return {
      success: true,
      placements,
      revenues,
      metrics: {
        totalPlacements,
        closedPlacements,
        totalRevenueSum
      },
      leaderboard
    };
  } catch (err: any) {
    return { success: false, placements: [], revenues: [], metrics: null, leaderboard: [] };
  }
}
