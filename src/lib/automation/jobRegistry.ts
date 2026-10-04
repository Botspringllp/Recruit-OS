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
  },

  OFFER_FOLLOW_UP: {
    jobName: 'OFFER_FOLLOW_UP',
    description: 'Automated follow-up emails for offer letters unviewed/unresponded within 24h/48h/72h (OF-01)',
    category: 'PIPELINE',
    handler: async () => {
      const { checkAndSendOfferFollowUpsJob } = await import('./jobs/offerJobs');
      const res = await checkAndSendOfferFollowUpsJob();
      return { success: true, processedCount: res.processedCount, failedCount: 0 };
    }
  },

  JOINING_REMINDER: {
    jobName: 'JOINING_REMINDER',
    description: 'Automated joining date reminders sent 7 days, 3 days, and 1 day prior to joining date (OF-01)',
    category: 'PIPELINE',
    handler: async () => {
      const { checkAndSendJoiningRemindersJob } = await import('./jobs/offerJobs');
      const res = await checkAndSendJoiningRemindersJob();
      return { success: true, processedCount: res.processedCount, failedCount: 0 };
    }
  },

  PLACEMENT_MONITOR: {
    jobName: 'PLACEMENT_MONITOR',
    description: 'Monitor active placements and audit placement revenue ledger records (OF-01)',
    category: 'PIPELINE',
    handler: async () => {
      const { monitorPlacementStatusJob } = await import('./jobs/offerJobs');
      const res = await monitorPlacementStatusJob();
      return { success: true, processedCount: res.processedCount, failedCount: 0 };
    }
  },

  RESUME_PARSER_PROCESSOR: {
    jobName: 'RESUME_PARSER_PROCESSOR',
    description: 'Processes incoming unparsed resumes and extracts structured candidate fields (CS-01)',
    category: 'PIPELINE',
    handler: async () => {
      const { processResumeParserQueueJob } = await import('./jobs/sourcingJobs');
      const res = await processResumeParserQueueJob();
      return { success: true, processedCount: res.processedCount || 0, failedCount: 0 };
    }
  },

  AI_MATCH_REFRESH: {
    jobName: 'AI_MATCH_REFRESH',
    description: 'Recalculates AI Candidate-Job Match Scores across open job mandates (CS-01)',
    category: 'PIPELINE',
    handler: async () => {
      const { refreshAIMatchesJob } = await import('./jobs/sourcingJobs');
      const res = await refreshAIMatchesJob();
      return { success: true, processedCount: res.updatedCount || 0, failedCount: 0 };
    }
  },

  SOURCE_ANALYTICS_AGGREGATOR: {
    jobName: 'SOURCE_ANALYTICS_AGGREGATOR',
    description: 'Aggregates candidate sourcing channel metrics and channel conversion rates (CS-01)',
    category: 'PIPELINE',
    handler: async () => {
      const { aggregateSourceAnalyticsJob } = await import('./jobs/sourcingJobs');
      const res = await aggregateSourceAnalyticsJob();
      return { success: true, processedCount: 1, failedCount: 0 };
    }
  }
};

export function getRegisteredJob(jobName: string): AutomationJobDef | undefined {
  return JOB_REGISTRY[jobName];
}

export function getAllRegisteredJobs(): AutomationJobDef[] {
  return Object.values(JOB_REGISTRY);
}
