import React from 'react';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Calendar, Plus } from 'lucide-react';
import { KpiMetricStrip } from '@/components/cockpit/KpiMetricStrip';
import { MandatesGridControl } from '@/components/cockpit/MandatesGridControl';
import { KpiMetricItem, MandateSummaryCard } from '@/types/cockpit';
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
    dbMandates
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

    agencyId ? prisma.incomingRequirement.count({
      where: { agencyId, status: { in: ['Pending Review', 'Assigned'] } }
    }).catch(() => 0) : 0,

    agencyId ? prisma.incomingRequirement.count({
      where: { agencyId }
    }).catch(() => 0) : 0,

    prisma.jobMandate.findMany({
      where: { agencyId },
      orderBy: { createdAt: 'desc' },
      take: 20,
      include: {
        client: {
          select: { companyName: true }
        },
        submissions: {
          select: { id: true, stage: true, slaStatus: true }
        }
      }
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

    m.submissions.forEach((sub) => {
      const stageKey = sub.stage || 'SCREENED';
      stageCounts[stageKey] = (stageCounts[stageKey] || 0) + 1;
      if (sub.slaStatus === 'WARNING' || sub.slaStatus === 'BREACHED') {
        warningCount++;
      }
    });

    const stageBreakdown = Object.entries(stageCounts).map(([stage, count]) => ({
      stage: stage as any,
      count
    }));

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
      leadRecruiter: {
        userId: 'recruiter-default',
        name: 'Assigned Team',
        email: 'team@recruitos.local'
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

  return (
    <div className="space-y-8">
      {/* Page Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-black tracking-tight text-slate-900">Recruiter Cockpit</h1>
          </div>
          <p className="mt-1 text-xs text-slate-600 font-semibold">
            Real-time pipeline analytics, mandate tracking, and operational telemetry.
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

      {/* Main Cockpit Workspace Grid */}
      <div className="w-full">
        <MandatesGridControl mandates={mandateCards} />
      </div>
    </div>
  );
}
