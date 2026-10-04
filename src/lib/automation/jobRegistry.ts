import { checkAndSendPrepKitRemindersAction } from '@/app/actions/interviewPrep';
import { processEmailQueueJob } from './jobs/emailQueueProcessor';
import { processSubscriptionMonitorJob } from './jobs/subscriptionMonitor';
import { processRecruiterFollowUpJob } from './jobs/recruiterFollowUp';

export interface JobExecutionResult {
  success: boolean;
  processedCount: number;
  failedCount: number;
  details?: Record<string, any>;
  error?: string;
}

export interface AutomationJobDef {
  jobName: string;
  description: string;
  category: 'INTERVIEW' | 'EMAIL' | 'SUBSCRIPTION' | 'PIPELINE';
  handler: () => Promise<JobExecutionResult>;
}

export const JOB_REGISTRY: Record<string, AutomationJobDef> = {
  INTERVIEW_REMINDER: {
    jobName: 'INTERVIEW_REMINDER',
    description: 'Automated 7-Hour and 1-Hour Candidate Interview Preparation Reminders (IW-03)',
    category: 'INTERVIEW',
    handler: async () => {
      const res = await checkAndSendPrepKitRemindersAction();
      const totalSent = (res.sent7hCount || 0) + (res.sent1hCount || 0);
      return {
        success: res.success,
        processedCount: totalSent,
        failedCount: res.success ? 0 : 1,
        details: { sent7hCount: res.sent7hCount, sent1hCount: res.sent1hCount },
        error: res.error
      };
    }
  },

  EMAIL_QUEUE_PROCESSOR: {
    jobName: 'EMAIL_QUEUE_PROCESSOR',
    description: 'Process PENDING and FAILED emails with exponential backoff retries (EM-02)',
    category: 'EMAIL',
    handler: processEmailQueueJob
  },

  SUBSCRIPTION_MONITOR: {
    jobName: 'SUBSCRIPTION_MONITOR',
    description: 'Monitor agency subscription expiry dates and dispatch warning alerts (30/15/7/3/1 days)',
    category: 'SUBSCRIPTION',
    handler: processSubscriptionMonitorJob
  },

  RECRUITER_FOLLOW_UP: {
    jobName: 'RECRUITER_FOLLOW_UP',
    description: 'Identify candidate submissions awaiting client review for 48+ hours and alert recruiters',
    category: 'PIPELINE',
    handler: processRecruiterFollowUpJob
  }
};

export function getRegisteredJob(jobName: string): AutomationJobDef | undefined {
  return JOB_REGISTRY[jobName];
}

export function getAllRegisteredJobs(): AutomationJobDef[] {
  return Object.values(JOB_REGISTRY);
}
