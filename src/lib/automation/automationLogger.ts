import { prisma } from '@/lib/prisma';

export enum JobStatus {
  RUNNING = 'RUNNING',
  SUCCESS = 'SUCCESS',
  FAILED = 'FAILED',
  PARTIAL_SUCCESS = 'PARTIAL_SUCCESS'
}

export interface CreateJobLogParams {
  jobName: string;
  agencyId?: string | null;
  metadata?: Record<string, any>;
}

export async function createJobLog({ jobName, agencyId, metadata }: CreateJobLogParams) {
  try {
    const log = await (prisma as any).automationJobLog.create({
      data: {
        jobName,
        agencyId: agencyId || null,
        status: JobStatus.RUNNING as any,
        startedAt: new Date(),
        metadata: metadata || {}
      }
    });
    return log;
  } catch (error) {
    console.error(`[AutomationLogger]: Failed to create job log for ${jobName}:`, error);
    return null;
  }
}

export interface UpdateJobLogParams {
  logId: string;
  status: JobStatus;
  processedCount?: number;
  failedCount?: number;
  errorMessage?: string | null;
  metadata?: Record<string, any>;
}

export async function updateJobLog({
  logId,
  status,
  processedCount = 0,
  failedCount = 0,
  errorMessage = null,
  metadata
}: UpdateJobLogParams) {
  if (!logId) return null;

  try {
    const existing = await (prisma as any).automationJobLog.findUnique({
      where: { id: logId }
    });

    const startedAt = existing?.startedAt ? new Date(existing.startedAt).getTime() : Date.now();
    const durationMs = Math.max(0, Date.now() - startedAt);

    const updated = await (prisma as any).automationJobLog.update({
      where: { id: logId },
      data: {
        status: status as any,
        completedAt: new Date(),
        durationMs,
        processedCount,
        failedCount,
        errorMessage: errorMessage || null,
        metadata: metadata ? { ...existing?.metadata, ...metadata } : existing?.metadata
      }
    });

    return updated;
  } catch (error) {
    console.error(`[AutomationLogger]: Failed to update job log ${logId}:`, error);
    return null;
  }
}
