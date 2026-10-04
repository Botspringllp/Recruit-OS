'use server';
import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/rbac';
import { runSingleAutomationJob, runAllAutomationJobs } from '@/lib/automation/scheduler';
import { getAllRegisteredJobs } from '@/lib/automation/jobRegistry';

export async function runSingleJobNowAction(jobName: string) {
  try {
    const dbUser = await getCurrentUser();
    if (!dbUser) {
      return { success: false, error: 'Unauthorized user' };
    }

    const summary = await runSingleAutomationJob(jobName, dbUser.agencyId);
    revalidatePath('/settings/automation');

    return {
      success: summary.success,
      processed: summary.processedCount,
      failed: summary.failedCount,
      durationMs: summary.durationMs,
      errorMessage: summary.errorMessage
    };
  } catch (err: any) {
    console.error(`[runSingleJobNowAction Error - ${jobName}]:`, err);
    return { success: false, error: err?.message || 'Failed to run automation job' };
  }
}

export async function runAllJobsNowAction() {
  try {
    const dbUser = await getCurrentUser();
    if (!dbUser) {
      return { success: false, error: 'Unauthorized user' };
    }

    const summary = await runAllAutomationJobs(dbUser.agencyId);
    revalidatePath('/settings/automation');

    return {
      success: summary.success,
      jobsExecuted: summary.jobsExecuted,
      processed: summary.processed,
      failed: summary.failed,
      durationMs: summary.durationMs
    };
  } catch (err: any) {
    console.error('[runAllJobsNowAction Error]:', err);
    return { success: false, error: err?.message || 'Failed to run automation jobs' };
  }
}

export async function getAutomationMetricsAction() {
  try {
    const dbUser = await getCurrentUser();
    const agencyId = dbUser?.agencyId;

    const registeredJobs = getAllRegisteredJobs();

    // Fetch recent 100 job logs
    const recentLogs = await (prisma as any).automationJobLog.findMany({
      where: agencyId ? { OR: [{ agencyId }, { agencyId: null }] } : undefined,
      orderBy: { createdAt: 'desc' },
      take: 50
    });

    // Fetch Email Queue stats
    const [pendingEmailsCount, failedEmailsCount, sentEmailsCount] = await Promise.all([
      (prisma as any).emailLog.count({ where: { status: 'PENDING' } }),
      (prisma as any).emailLog.count({ where: { status: 'FAILED' } }),
      (prisma as any).emailLog.count({ where: { status: 'SENT' } })
    ]);

    // Calculate job health & metrics
    const totalRuns = recentLogs.length;
    const successfulRuns = recentLogs.filter((l: any) => l.status === 'SUCCESS').length;
    const failedRuns = recentLogs.filter((l: any) => l.status === 'FAILED').length;
    const partialRuns = recentLogs.filter((l: any) => l.status === 'PARTIAL_SUCCESS').length;

    const successRate = totalRuns > 0 ? Math.round((successfulRuns / totalRuns) * 100) : 100;

    let systemHealth: 'HEALTHY' | 'WARNING' | 'FAILED' = 'HEALTHY';
    if (failedRuns > 3 || (totalRuns > 0 && successRate < 70)) {
      systemHealth = 'FAILED';
    } else if (failedRuns > 0 || partialRuns > 0 || failedEmailsCount > 0) {
      systemHealth = 'WARNING';
    }

    // Get last run per registered job
    const jobStats = registeredJobs.map((job) => {
      const lastRun = recentLogs.find((l: any) => l.jobName === job.jobName);
      return {
        jobName: job.jobName,
        description: job.description,
        category: job.category,
        lastRunAt: lastRun?.startedAt || null,
        status: lastRun?.status || 'NEVER_RUN',
        durationMs: lastRun?.durationMs || 0,
        processedCount: lastRun?.processedCount || 0,
        failedCount: lastRun?.failedCount || 0,
        errorMessage: lastRun?.errorMessage || null
      };
    });

    const lastRunTime = recentLogs.length > 0 ? recentLogs[0].startedAt : null;

    return {
      success: true,
      systemHealth,
      totalRegisteredJobs: registeredJobs.length,
      lastRunTime,
      totalRuns,
      successRate,
      emailQueue: {
        pending: pendingEmailsCount,
        failed: failedEmailsCount,
        sent: sentEmailsCount
      },
      jobStats,
      recentLogs
    };
  } catch (err: any) {
    console.error('[getAutomationMetricsAction Error]:', err);
    return {
      success: false,
      error: err?.message || 'Failed to fetch automation metrics',
      systemHealth: 'FAILED' as const,
      totalRegisteredJobs: 0,
      lastRunTime: null,
      totalRuns: 0,
      successRate: 0,
      emailQueue: { pending: 0, failed: 0, sent: 0 },
      jobStats: [],
      recentLogs: []
    };
  }
}
