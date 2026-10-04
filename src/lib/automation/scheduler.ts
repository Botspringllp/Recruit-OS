import { getAllRegisteredJobs, getRegisteredJob } from './jobRegistry';
import { executeAutomationJob, RunJobSummary } from './jobRunner';

export interface SchedulerRunSummary {
  success: boolean;
  jobsExecuted: number;
  processed: number;
  failed: number;
  durationMs: number;
  jobSummaries: RunJobSummary[];
}

/**
 * Runs all registered automation jobs with full error isolation per job.
 * One failing job will never crash or stop other jobs from running.
 */
export async function runAllAutomationJobs(agencyId?: string | null): Promise<SchedulerRunSummary> {
  const startTime = Date.now();
  const jobs = getAllRegisteredJobs();
  const summaries: RunJobSummary[] = [];

  let totalProcessed = 0;
  let totalFailed = 0;

  for (const jobDef of jobs) {
    const summary = await executeAutomationJob(jobDef, agencyId);
    summaries.push(summary);

    totalProcessed += summary.processedCount;
    if (!summary.success || summary.failedCount > 0) {
      totalFailed += summary.failedCount || 1;
    }
  }

  const durationMs = Math.max(0, Date.now() - startTime);
  const overallSuccess = summaries.every(s => s.success);

  return {
    success: overallSuccess,
    jobsExecuted: summaries.length,
    processed: totalProcessed,
    failed: totalFailed,
    durationMs,
    jobSummaries: summaries
  };
}

/**
 * Runs a single registered job by name.
 */
export async function runSingleAutomationJob(
  jobName: string,
  agencyId?: string | null
): Promise<RunJobSummary> {
  const jobDef = getRegisteredJob(jobName);
  if (!jobDef) {
    throw new Error(`Automation job '${jobName}' is not registered in JOB_REGISTRY.`);
  }

  return executeAutomationJob(jobDef, agencyId);
}
