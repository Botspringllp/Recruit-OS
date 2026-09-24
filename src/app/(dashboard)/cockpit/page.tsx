import React from 'react';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Calendar, Plus } from 'lucide-react';
import { KpiMetricStrip } from '@/components/cockpit/KpiMetricStrip';
import { MandatesGridControl } from '@/components/cockpit/MandatesGridControl';
import { RecruiterActionQueueWidget } from '@/components/cockpit/RecruiterActionQueueWidget';
import { SlaWatchdogWidget } from '@/components/cockpit/SlaWatchdogWidget';
import { CockpitNotificationsFeed } from '@/components/cockpit/CockpitNotificationsFeed';
import { KpiMetricItem, MandateSummaryCard, RecruiterActionQueueItem, SlaWatchdogItem } from '@/types/cockpit';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/rbac';

export const revalidate = 0; // Enforce dynamic server rendering

export default async function CockpitPage() {
  const now = new Date();

  // Fetch agency context
  const dbUser = await getCurrentUser();
  if (!dbUser) {
    redirect('/login');
  }
  const roleStr = String(dbUser?.role || '').toUpperCase();
  if (roleStr === 'SUPER_ADMIN' || roleStr === 'MASTER_OWNER') {
    redirect('/super-admin');
  }

  const agencyId = dbUser?.agencyId;

  // Single-batch aggregate queries (Parallelized)
  const [
    activeMandatesCount,
    pipelineCandidatesCount,
    monthlyPlacementsCount,
    incomingReqPendingCount,
    totalIncomingReqCount,
    dbMandates,
    scheduledInterviewsCount,
    pendingFeedbackSubmissions,
    dbNotifications,
    noSubmissionsOldMandates
  ] = await Promise.all([
    prisma.jobMandate.count({
      where: { agencyId, status: { in: ['ACTIVE', 'OPEN'] } }
    }).catch(() => 0),

    prisma.candidateSubmission.count({
      where: { agencyId }
    }).catch(() => 0),

    prisma.candidateSubmission.count({
      where: {
        agencyId,
        stage: 'JOINED'
      }
    }).catch(() => 0),

    agencyId ? (prisma as any).incomingRequirement.count({
      where: { agencyId, status: { in: ['Pending Review', 'Assigned'] } }
    }).catch(() => 0) : 0,

    agencyId ? (prisma as any).incomingRequirement.count({
      where: { agencyId }
    }).catch(() => 0) : 0,

    prisma.jobMandate.findMany({
      where: { agencyId },
      orderBy: { createdAt: 'desc' },
      take: 25,
      include: {
        client: {
          select: { companyName: true }
        },
        incomingRequirements: {
          select: {
            assignedRecruiterId: true,
            createdAt: true,
            createdBy: true,
            priority: true,
            assignedRecruiter: {
              select: { id: true, firstName: true, lastName: true, email: true }
            }
          }
        },
        submissions: {
          select: {
            id: true,
            stage: true,
            slaStatus: true,
            createdAt: true,
            recruiterId: true,
            recruiter: {
              select: { id: true, firstName: true, lastName: true, email: true }
            }
          }
        }
      }
    }).catch(() => []),

    prisma.interviewSchedule.count({
      where: {
        agencyId,
        status: { in: ['SCHEDULED', 'PENDING'] }
      }
    }).catch(() => 0),

    prisma.candidateSubmission.findMany({
      where: {
        agencyId,
        stage: 'SUBMITTED_TO_CLIENT'
      },
      select: {
        id: true,
        stage: true,
        createdAt: true,
        slaStatus: true,
        job: { select: { title: true, client: { select: { companyName: true } } } },
        candidate: { select: { firstName: true, lastName: true } }
      },
      take: 10
    }).catch(() => []),

    (prisma as any).notification.findMany({
      where: { recipientUserId: dbUser.id },
      orderBy: { createdAt: 'desc' },
      take: 10
    }).catch(() => []),

    prisma.jobMandate.findMany({
      where: {
        agencyId,
        status: { in: ['ACTIVE', 'OPEN'] },
        createdAt: { lte: new Date(Date.now() - 48 * 60 * 60 * 1000) },
        submissions: { none: {} }
      },
      select: {
        id: true,
        title: true,
        createdAt: true,
        client: { select: { companyName: true } }
      },
      take: 5
    }).catch(() => [])
  ]);

  const kpiMetrics: KpiMetricItem[] = [
    {
      id: 'metric-incoming-reqs',
      title: 'Incoming Requirements',
      value: totalIncomingReqCount,
      changeTrend: incomingReqPendingCount > 0 ? `${incomingReqPendingCount} Pending Review` : 'Queue Clear',
      isPositiveTrend: true,
      badgeText: `${incomingReqPendingCount} Pending`,
      badgeVariant: incomingReqPendingCount > 0 ? 'amber' : 'emerald',
      icon: 'Inbox',
      href: '/incoming-requirements'
    },
    {
      id: 'metric-active-mandates',
      title: 'Active Mandates',
      value: activeMandatesCount,
      changeTrend: 'Live Database Query',
      isPositiveTrend: true,
      badgeText: `${activeMandatesCount} Mandates`,
      badgeVariant: 'brand',
      icon: 'Briefcase',
    },
    {
      id: 'metric-pipeline-candidates',
      title: 'Pipeline Candidates',
      value: pipelineCandidatesCount,
      changeTrend: 'Total Candidates in Pipeline',
      isPositiveTrend: true,
      badgeText: 'Active',
      badgeVariant: 'brand',
      icon: 'Users',
    },
    {
      id: 'metric-monthly-placements',
      title: 'Monthly Placements',
      value: monthlyPlacementsCount,
      changeTrend: 'Joined Candidates This Month',
      isPositiveTrend: true,
      badgeText: `${monthlyPlacementsCount} Joined`,
      badgeVariant: 'emerald',
      icon: 'TrendingUp',
    },
  ];

  const statusMap: Record<string, 'OPEN' | 'ON_HOLD' | 'FILLED' | 'CLOSED'> = {
    ACTIVE: 'OPEN',
    OPEN: 'OPEN',
    PAUSED: 'ON_HOLD',
    DRAFT: 'ON_HOLD',
    FILLED: 'FILLED',
    CLOSED: 'CLOSED'
  };

  const mandateCards: MandateSummaryCard[] = dbMandates.map((m) => {
    const stageCounts: Record<string, number> = {};
    let warningCount = 0;

    const assignedRecruiterIdsSet = new Set<string>();
    m.submissions.forEach((sub) => {
      const stageKey = sub.stage || 'SCREENED';
      stageCounts[stageKey] = (stageCounts[stageKey] || 0) + 1;
      if (sub.slaStatus === 'WARNING' || sub.slaStatus === 'BREACHED') {
        warningCount++;
      }
      if (sub.recruiterId) {
        assignedRecruiterIdsSet.add(sub.recruiterId);
      }
    });

    const originReq = m.incomingRequirements?.[0];
    if (originReq?.assignedRecruiterId) {
      assignedRecruiterIdsSet.add(originReq.assignedRecruiterId);
    }

    const assignedRecruiterIds = Array.from(assignedRecruiterIdsSet);
    const assignedRecruitersCount = Math.max(assignedRecruiterIds.length, 1);

    const isAssignedToCurrentUser =
      assignedRecruiterIds.includes(dbUser.id) ||
      originReq?.assignedRecruiterId === dbUser.id;

    const recruiterPositionIndex = assignedRecruiterIds.indexOf(dbUser.id);
    const recruiterPositionText = isAssignedToCurrentUser
      ? recruiterPositionIndex === 0
        ? 'Lead Recruiter (#1)'
        : `Recruiter #${recruiterPositionIndex + 1}`
      : 'Team Member';

    const daysSinceAssignment = Math.floor(
      (now.getTime() - new Date(originReq?.createdAt || m.createdAt).getTime()) / (1000 * 60 * 60 * 24)
    );

    const stageBreakdown = Object.entries(stageCounts).map(([stage, count]) => ({
      stage: stage as any,
      count
    }));

    const leadRecruiterUser = originReq?.assignedRecruiter || m.submissions[0]?.recruiter;

    return {
      id: m.id,
      agencyId: m.agencyId,
      title: m.title,
      companyName: m.client?.companyName || 'Unassigned Client',
      location: 'India',
      minCtcLpa: m.minCtcLpa ? Number(m.minCtcLpa) : 0,
      maxCtcLpa: m.maxCtcLpa ? Number(m.maxCtcLpa) : 0,
      feePercentage: m.feePercentage ? Number(m.feePercentage) : 8.33,
      headcount: m.headcount,
      status: statusMap[m.status] || 'OPEN',
      priority: (originReq?.priority as any) || 'Medium',
      assignedBy: {
        name: `${dbUser.firstName} ${dbUser.lastName}`,
        email: dbUser.email
      },
      assignedRecruiterIds,
      assignedRecruitersCount,
      recruiterPositionText,
      isAssignedToCurrentUser,
      assignmentDate: new Date(originReq?.createdAt || m.createdAt).toISOString(),
      daysSinceAssignment,
      leadRecruiter: {
        userId: leadRecruiterUser?.id || dbUser.id,
        name: leadRecruiterUser ? `${leadRecruiterUser.firstName} ${leadRecruiterUser.lastName}` : `${dbUser.firstName} ${dbUser.lastName}`,
        email: leadRecruiterUser?.email || dbUser.email
      },
      totalSubmissions: m.submissions.length,
      slaWarningCount: warningCount,
      stageBreakdown: stageBreakdown.length > 0 ? stageBreakdown : [
        { stage: 'SCREENED', count: 0 },
        { stage: 'SUBMITTED_TO_CLIENT', count: 0 }
      ],
      createdAt: m.createdAt.toISOString(),
    };
  });

  // Action Queue Metrics
  const mandatesZeroSubCount = dbMandates.filter(m => m.submissions.length === 0).length;

  const actionQueueItems: RecruiterActionQueueItem[] = [
    {
      id: 'aq-candidate-sub',
      title: 'Need Candidate Submission',
      count: mandatesZeroSubCount,
      description: 'Active mandates currently having 0 candidate submissions',
      badgeVariant: 'amber',
      href: '/jobs',
      iconName: 'FileQuestion'
    },
    {
      id: 'aq-interview-confirm',
      title: 'Interview Confirmation Pending',
      count: scheduledInterviewsCount,
      description: 'Interviews scheduled awaiting client/candidate confirmation',
      badgeVariant: 'blue',
      href: '/interviews',
      iconName: 'CalendarClock'
    },
    {
      id: 'aq-client-feedback',
      title: 'Client Feedback Awaiting',
      count: pendingFeedbackSubmissions.length,
      description: 'Candidates submitted to client awaiting decision/feedback',
      badgeVariant: 'purple',
      href: '/submissions',
      iconName: 'MessageSquareQuote'
    },
    {
      id: 'aq-incoming-req',
      title: 'Requirement Intake Assigned',
      count: incomingReqPendingCount,
      description: 'Incoming client requirements assigned for intake conversion',
      badgeVariant: 'emerald',
      href: '/incoming-requirements',
      iconName: 'UserCheck'
    }
  ];

  // SLA Watchdog Metrics
  const slaWatchdogItems: SlaWatchdogItem[] = [];

  noSubmissionsOldMandates.forEach((m) => {
    const hoursElapsed = Math.floor((now.getTime() - new Date(m.createdAt).getTime()) / (1000 * 60 * 60));
    slaWatchdogItems.push({
      id: `sla-mandate-0sub-${m.id}`,
      mandateId: m.id,
      title: 'No Candidate Submissions (>48h)',
      severity: hoursElapsed > 72 ? 'BREACHED' : 'WARNING',
      entityTitle: m.title,
      clientName: m.client?.companyName || 'Unassigned Client',
      hoursElapsed,
      message: `Mandate open for ${hoursElapsed} hours without any candidate submissions.`,
      href: `/jobs/${m.id}`
    });
  });

  pendingFeedbackSubmissions.forEach((sub) => {
    const daysElapsed = Math.floor((now.getTime() - new Date(sub.createdAt).getTime()) / (1000 * 60 * 60 * 24));
    if (daysElapsed >= 3 || sub.slaStatus === 'BREACHED' || sub.slaStatus === 'WARNING') {
      slaWatchdogItems.push({
        id: `sla-sub-feedback-${sub.id}`,
        submissionId: sub.id,
        title: 'Client Feedback Overdue',
        severity: daysElapsed >= 5 || sub.slaStatus === 'BREACHED' ? 'BREACHED' : 'WARNING',
        entityTitle: `${sub.candidate.firstName} ${sub.candidate.lastName} - ${sub.job.title}`,
        clientName: sub.job.client?.companyName || 'Client',
        daysElapsed,
        message: `Submitted to client ${daysElapsed} days ago. Client feedback pending.`,
        href: `/submissions`
      });
    }
  });

  const formattedNotifications = dbNotifications.map((n: any) => ({
    id: n.id,
    title: n.title,
    message: n.message,
    type: String(n.type),
    category: String(n.category),
    entityType: n.entityType,
    entityId: n.entityId,
    isRead: Boolean(n.isRead),
    createdAt: n.createdAt.toISOString()
  }));

  return (
    <div className="space-y-8 pb-12">
      {/* Page Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-black tracking-tight text-slate-900">Recruiter Cockpit</h1>
          </div>
          <p className="mt-1 text-xs text-slate-600 font-semibold">
            Real-time recruiter pipeline analytics, assignment tracking, and operational telemetry.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button className="px-4 py-2.5 text-xs font-bold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-xl shadow-2xs flex items-center gap-2">
            <Calendar className="h-4 w-4 text-indigo-600" />
            <span>Today ({now.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })})</span>
          </button>
          <Link href="/jobs/new" className="px-4 py-2.5 text-xs font-extrabold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-md shadow-indigo-600/20 flex items-center gap-2">
            <Plus className="h-4 w-4" />
            <span>New Mandate</span>
          </Link>
        </div>
      </div>

      {/* KPI Metric Strip */}
      <KpiMetricStrip metrics={kpiMetrics} />

      {/* Recruiter Action Queue Widget */}
      <RecruiterActionQueueWidget items={actionQueueItems} />

      {/* SLA Watchdog & Notification Center Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SlaWatchdogWidget items={slaWatchdogItems} />
        <CockpitNotificationsFeed notifications={formattedNotifications} />
      </div>

      {/* Main Cockpit Workspace Grid */}
      <div className="w-full">
        <MandatesGridControl mandates={mandateCards} />
      </div>
    </div>
  );
}
