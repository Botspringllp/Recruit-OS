import { PipelineStage, SlaStatus } from '@prisma/client';

export interface KpiMetricItem {
  id: string;
  title: string;
  value: number | string;
  changeTrend: string; // e.g. "+12% from last month"
  isPositiveTrend: boolean;
  badgeText?: string;
  badgeVariant?: 'brand' | 'amber' | 'emerald' | 'rose';
  icon: 'Briefcase' | 'Users' | 'AlertTriangle' | 'Calendar' | 'TrendingUp';
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
