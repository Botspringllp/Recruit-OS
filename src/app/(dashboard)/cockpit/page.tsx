import React from 'react';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Calendar, Plus, Clock, Sparkles, Inbox, ArrowRight } from 'lucide-react';
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
    slaAlertsCount,
    interviewsTodayCount,
    monthlyPlacementsCount,
    incomingReqPendingCount,
    dbMandates
  ] = await Promise.all([
    prisma.jobMandate.count({
      where: { agencyId, status: { in: ['ACTIVE', 'OPEN'] } }
    }).catch(() => 0),

    prisma.candidateSubmission.count({
      where: { agencyId }
    }).catch(() => 0),

    prisma.candidateSubmission.count({
      where: { agencyId, slaStatus: { in: ['WARNING', 'BREACHED'] } }
    }).catch(() => 0),

    prisma.interviewSchedule.count({
      where: {
        agencyId,
        status: { notIn: ['CANCELLED'] }
      }
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
      title: 'Incoming Reqs Queue',
      value: incomingReqPendingCount,
      changeTrend: incomingReqPendingCount > 0 ? 'Pending Review' : 'Queue Clear',
      isPositiveTrend: true,
      badgeText: `${incomingReqPendingCount} Pending`,
      badgeVariant: incomingReqPendingCount > 0 ? 'amber' : 'emerald',
      icon: 'Inbox',
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
      id: 'metric-sla-alerts',
      title: 'SLA Warnings / Breaches',
      value: slaAlertsCount,
      changeTrend: slaAlertsCount > 0 ? 'Requires Action' : 'All Clear',
      isPositiveTrend: slaAlertsCount === 0,
      badgeText: slaAlertsCount > 0 ? 'Action Required' : 'Optimal',
      badgeVariant: slaAlertsCount > 0 ? 'amber' : 'emerald',
      icon: 'AlertTriangle',
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
          <button className="px-4 py-2.5 text-xs font-bold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-xl shadow-2xs interactive-hover flex items-center gap-2">
            <Calendar className="h-4 w-4 text-indigo-600" />
            <span>Today ({now.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })})</span>
          </button>
          <Link href="/jobs/new" className="px-4 py-2.5 text-xs font-extrabold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-md shadow-indigo-600/20 interactive-hover flex items-center gap-2">
            <Plus className="h-4 w-4" />
            <span>New Mandate</span>
          </Link>
        </div>
      </div>

      {/* KPI Metric Strip */}
      <KpiMetricStrip metrics={kpiMetrics} />

      {/* Main Cockpit Workspace Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Columns: Active Mandates Grid Control */}
        <div className="lg:col-span-2">
          <MandatesGridControl mandates={mandateCards} />
        </div>

        {/* Right Column (1/3 width) */}
        <div className="space-y-6">
          {/* Owner Intake Queue Card */}
          <div className="rounded-2xl bg-gradient-to-br from-slate-900 to-slate-950 p-6 border border-slate-800 text-white shadow-xl">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
                  <Inbox className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-white">Owner Intake Queue</h3>
                  <p className="text-[10px] text-slate-400 font-bold">Incoming Client Reqs</p>
                </div>
              </div>
              <span className="px-2.5 py-1 text-[11px] font-black rounded-full bg-amber-500 text-slate-950">
                {incomingReqPendingCount} Pending
              </span>
            </div>

            <p className="text-xs text-slate-300 font-medium leading-relaxed mb-4">
              Review raw client intake requests, assign recruiters, and convert into formal Job Mandates.
            </p>

            <Link
              href="/incoming-requirements"
              className="w-full py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs flex items-center justify-center gap-2 shadow-md shadow-amber-500/20 transition-all"
            >
              <span>Manage Requirements Queue</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="rounded-2xl bg-white p-6 border border-slate-200 shadow-sm shadow-slate-200/50 hover:shadow-md hover:border-indigo-400 transition-all duration-200">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-indigo-600" />
                <h3 className="text-sm font-extrabold text-slate-900">SLA Watchdog</h3>
              </div>
              <span className="px-2.5 py-0.5 text-[10px] font-extrabold rounded bg-amber-100 text-amber-950 border border-amber-300">
                Phase RC-01.C
              </span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed font-medium">
              SLA Watchdog Countdown Feed & Today's Interview Agenda Widget will be mounted here in Phase RC-01.C.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
