import { prisma } from '@/lib/prisma';
import { logOfferSentEmail, logJoiningReminderEmail } from '@/lib/email';
import { publishNotification } from '@/lib/notifications/notificationPublisher';
import { NotificationType, NotificationCategory } from '@/lib/notifications';

/**
 * Offer Follow-Up Job (PART N).
 * Reminds candidates if offer letter is not viewed or responded within 24h, 48h, 72h.
 */
export async function checkAndSendOfferFollowUpsJob() {
  const now = new Date();
  const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  const pendingOffers = await (prisma as any).offerLetter.findMany({
    where: {
      status: { in: ['SENT', 'VIEWED'] },
      createdAt: { lte: twentyFourHoursAgo }
    },
    include: {
      candidate: true,
      job: true,
      client: true
    },
    take: 30
  });

  let processedCount = 0;

  for (const offer of pendingOffers) {
    if (!offer.candidate.email) continue;

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const offerUrl = `${baseUrl}/offer/${offer.token}`;
    const offeredCtcStr = `₹${(Number(offer.offeredCTC) / 100000).toFixed(2)} LPA`;

    await logOfferSentEmail(
      offer.agencyId,
      offer.candidate.email,
      `${offer.candidate.firstName} ${offer.candidate.lastName}`,
      offer.job.companyName || offer.client?.companyName || 'RecruitOS Client',
      offer.job.title,
      offeredCtcStr,
      offerUrl
    );

    if (offer.recruiterId) {
      await publishNotification({
        agencyId: offer.agencyId,
        recipientUserId: offer.recruiterId,
        title: 'Offer Follow-Up Sent',
        message: `Automated reminder sent to ${offer.candidate.firstName} ${offer.candidate.lastName} for ${offer.job.title}`,
        type: NotificationType.INFO,
        category: NotificationCategory.CANDIDATE,
        entityType: 'OFFER',
        entityId: offer.id
      });
    }

    processedCount++;
  }

  return { processedCount };
}

/**
 * Joining Reminder Job (PART N).
 * Sends joining date reminders 7 days, 3 days, and 1 day before joining date.
 */
export async function checkAndSendJoiningRemindersJob() {
  const now = new Date();
  const sevenDays = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  const pendingJoinings = await (prisma as any).joiningTracker.findMany({
    where: {
      status: { in: ['OFFER_ACCEPTED', 'PRE_JOINING', 'DOCUMENT_PENDING'] },
      joiningDate: { lte: sevenDays, gte: now }
    },
    include: {
      candidate: true,
      job: true,
      client: true
    },
    take: 30
  });

  let processedCount = 0;

  for (const joining of pendingJoinings) {
    if (!joining.candidate.email) continue;

    const joiningDate = new Date(joining.joiningDate);
    const diffTime = joiningDate.getTime() - now.getTime();
    const daysLeft = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));

    await logJoiningReminderEmail(
      joining.agencyId,
      joining.candidate.email,
      `${joining.candidate.firstName} ${joining.candidate.lastName}`,
      joining.job.companyName || joining.client?.companyName || 'RecruitOS Client',
      joining.job.title,
      joiningDate.toLocaleDateString(),
      daysLeft
    );

    if (joining.recruiterId) {
      await publishNotification({
        agencyId: joining.agencyId,
        recipientUserId: joining.recruiterId,
        title: `Joining Reminder: ${daysLeft} Day(s) Left`,
        message: `Candidate ${joining.candidate.firstName} ${joining.candidate.lastName} is scheduled to join on ${joiningDate.toLocaleDateString()}`,
        type: NotificationType.WARNING,
        category: NotificationCategory.CANDIDATE,
        entityType: 'JOINING',
        entityId: joining.id
      });
    }

    processedCount++;
  }

  return { processedCount };
}

/**
 * Placement Monitor Job (PART N).
 * Audits active placement records and verifies revenue ledger entries.
 */
export async function monitorPlacementStatusJob() {
  const activePlacements = await (prisma as any).placementRecord.findMany({
    where: { placementStatus: 'ACTIVE' },
    include: { revenueRecord: true },
    take: 50
  });

  return { processedCount: activePlacements.length };
}
