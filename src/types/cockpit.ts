import { PipelineStage, SlaStatus } from '@prisma/client';

export interface KpiMetricItem {
  id: string;
  title: string;
  value: number | string;
  changeTrend: string; // e.g. "+12% from last month"
  isPositiveTrend: boolean;
  badgeText?: string;
  badgeVariant?: 'brand' | 'amber' | 'emerald' | 'rose';
  icon: 'Briefcase' | 'Users' | 'AlertTriangle' | 'Calendar' | 'TrendingUp' | 'Inbox';
  href?: string;
}

export interface MandateStageCount {
  stage: PipelineStage;
  count: number;
}

export interface MandateSummaryCard {
  id: string;
  agencyId: string;
  title: string;
  companyName: string;
  companyLogoUrl?: string | null;
  location: string;
  minCtcLpa: number;
  maxCtcLpa: number;
  feePercentage: number;
  headcount: number;
  status: 'OPEN' | 'ON_HOLD' | 'FILLED' | 'CLOSED';
  priority?: 'Urgent' | 'High' | 'Medium' | 'Low';
  assignedBy?: {
    name: string;
    email: string;
  };
  assignedRecruiterIds?: string[];
  assignedRecruitersCount?: number;
  recruiterPositionText?: string;
  isAssignedToCurrentUser?: boolean;
  assignmentDate?: string;
  daysSinceAssignment?: number;
  leadRecruiter: {
    userId: string;
    name: string;
    email: string;
    avatarUrl?: string | null;
  };
  totalSubmissions: number;
  slaWarningCount: number;
  stageBreakdown: MandateStageCount[];
  createdAt: string;
}

export interface MandateFilterParams {
  searchQuery?: string;
  statusFilter?: string;
  recruiterId?: string;
}

export interface RecruiterActionQueueItem {
  id: string;
  title: string;
  count: number;
  description: string;
  badgeVariant: 'amber' | 'blue' | 'purple' | 'emerald' | 'rose';
  href: string;
  iconName: 'FileQuestion' | 'CalendarClock' | 'MessageSquareQuote' | 'UserCheck';
}

export interface SlaWatchdogItem {
  id: string;
  mandateId?: string;
  submissionId?: string;
  title: string;
  severity: 'WARNING' | 'BREACHED' | 'HIGH_RISK';
  entityTitle: string;
  clientName?: string;
  hoursElapsed?: number;
  daysElapsed?: number;
  message: string;
  href: string;
}
