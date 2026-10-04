import React from 'react';
import { redirect } from 'next/navigation';
import { getCurrentUser, hasPermission } from '@/lib/rbac';
import { getAutomationMetricsAction } from '@/app/actions/automation';
import { AutomationDashboardView } from '@/components/automation/AutomationDashboardView';

export const revalidate = 0;

export default async function AutomationSettingsPage() {
  const dbUser = await getCurrentUser();
  if (!dbUser || !hasPermission(dbUser, 'settings.view')) {
    redirect('/403');
  }

  const metrics = await getAutomationMetricsAction();

  return (
    <AutomationDashboardView
      systemHealth={metrics.systemHealth}
      totalRegisteredJobs={metrics.totalRegisteredJobs}
      lastRunTime={metrics.lastRunTime ? new Date(metrics.lastRunTime).toISOString() : null}
      totalRuns={metrics.totalRuns}
      successRate={metrics.successRate}
      emailQueue={metrics.emailQueue}
      jobStats={metrics.jobStats.map(j => ({
        ...j,
        lastRunAt: j.lastRunAt ? new Date(j.lastRunAt).toISOString() : null
      }))}
      recentLogs={metrics.recentLogs}
    />
  );
}
