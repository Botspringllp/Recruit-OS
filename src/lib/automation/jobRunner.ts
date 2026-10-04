import { AutomationJobDef } from './jobRegistry';
import { createJobLog, updateJobLog, JobStatus } from './automationLogger';

export interface RunJobSummary {
  jobName: string;
  success: boolean;
  status: JobStatus;
  durationMs: number;
  processedCount: number;
  failedCount: number;
  errorMessage?: string | null;
  metadata?: Record<string, any>;
  logId?: string | null;
}

/**
 * Runs a single automation job definition with full error isolation and logging.
 */
export async function executeAutomationJob(
  jobDef: AutomationJobDef,
  agencyId?: string | null
): Promise<RunJobSummary> {
  const startTime = Date.now();
  const logEntry = await createJobLog({
    jobName: jobDef.jobName,
    agencyId,
    metadata: { category: jobDef.category, description: jobDef.description }
  });

  const logId = logEntry?.id || null;

  try {
    const result = await jobDef.handler();
    const durationMs = Math.max(0, Date.now() - startTime);

    let finalStatus: JobStatus = JobStatus.SUCCESS;
    if (!result.success) {
      finalStatus = JobStatus.FAILED;
    } else if (result.failedCount > 0) {
      finalStatus = JobStatus.PARTIAL_SUCCESS;
    }

    if (logId) {
      await updateJobLog({
        logId,
        status: finalStatus,
        processedCount: result.processedCount || 0,
        failedCount: result.failedCount || 0,
        errorMessage: result.error || null,
        metadata: result.details
      });
    }

    return {
      jobName: jobDef.jobName,
      success: result.success,
      status: finalStatus,
      durationMs,
      processedCount: result.processedCount || 0,
      failedCount: result.failedCount || 0,
      errorMessage: result.error || null,
      metadata: result.details,
      logId
    };
  } catch (error: any) {
    const durationMs = Math.max(0, Date.now() - startTime);
    const errorMessage = String(error?.message || error);

    if (logId) {
      await updateJobLog({
        logId,
        status: JobStatus.FAILED,
        processedCount: 0,
        failedCount: 1,
        errorMessage
      });
    }

    return {
      jobName: jobDef.jobName,
      success: false,
      status: JobStatus.FAILED,
      durationMs,
      processedCount: 0,
      failedCount: 1,
      errorMessage,
      logId
    };
  }
}
