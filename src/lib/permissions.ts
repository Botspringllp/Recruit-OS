export type PermissionKey =
  | 'candidate.view'
  | 'candidate.create'
  | 'candidate.edit'
  | 'candidate.delete'
  | 'job.view'
  | 'job.create'
  | 'job.edit'
  | 'job.delete'
  | 'submission.view'
  | 'submission.create'
  | 'submission.edit'
  | 'interview.view'
  | 'interview.schedule'
  | 'interview.edit'
  | 'offer.view'
  | 'offer.create'
  | 'offer.approve'
  | 'compliance.view'
  | 'compliance.approve'
  | 'finance.view'
  | 'finance.edit'
  | 'partner.view'
  | 'partner.manage'
  | 'user.manage';

export const AVAILABLE_PERMISSIONS = [
  { key: 'candidate.view', label: 'View Candidates', group: 'Candidate Management' },
  { key: 'candidate.create', label: 'Create Candidates', group: 'Candidate Management' },
  { key: 'candidate.edit', label: 'Edit Candidates', group: 'Candidate Management' },
  { key: 'candidate.delete', label: 'Delete Candidates', group: 'Candidate Management' },

  { key: 'job.view', label: 'View Job Mandates', group: 'Job Management' },
  { key: 'job.create', label: 'Create Job Mandates', group: 'Job Management' },
  { key: 'job.edit', label: 'Edit Job Mandates', group: 'Job Management' },
  { key: 'job.delete', label: 'Delete Job Mandates', group: 'Job Management' },

  { key: 'submission.view', label: 'View Submissions', group: 'Submissions' },
  { key: 'submission.create', label: 'Create Submissions', group: 'Submissions' },
  { key: 'submission.edit', label: 'Edit Submissions', group: 'Submissions' },

  { key: 'interview.view', label: 'View Interviews', group: 'Interviews' },
  { key: 'interview.schedule', label: 'Schedule Interviews', group: 'Interviews' },
  { key: 'interview.edit', label: 'Edit Interviews', group: 'Interviews' },

  { key: 'offer.view', label: 'View Offers', group: 'Offers' },
  { key: 'offer.create', label: 'Create Offers', group: 'Offers' },
  { key: 'offer.approve', label: 'Approve Offers', group: 'Offers' },

  { key: 'compliance.view', label: 'View Compliance', group: 'Compliance' },
  { key: 'compliance.approve', label: 'Approve Compliance Docs', group: 'Compliance' },

  { key: 'finance.view', label: 'View Financial Records', group: 'Finance' },
  { key: 'finance.edit', label: 'Edit Invoices & Vouchers', group: 'Finance' },

  { key: 'partner.view', label: 'View Partners', group: 'Partner Network' },
  { key: 'partner.manage', label: 'Manage Partner Network', group: 'Partner Network' },

  { key: 'user.manage', label: 'Manage Team Users', group: 'User & Team Management' }
];

export const ROLE_DEFAULT_PERMISSIONS: Record<string, string[]> = {
  MASTER_OWNER: ['*'],
  AGENCY_OWNER: ['*'],
  AGENCY_FOUNDER: ['*'],
  RECRUITER: [
    'candidate.view',
    'candidate.create',
    'candidate.edit',
    'candidate.delete',
    'job.view',
    'job.create',
    'job.edit',
    'job.delete',
    'submission.view',
    'submission.create',
    'submission.edit',
    'interview.view',
    'interview.schedule',
    'interview.edit'
  ],
  FINANCE_MANAGER: [
    'finance.view',
    'finance.edit',
    'invoice.view',
    'invoice.create',
    'invoice.edit'
  ],
  FINANCE_ADMIN: [
    'finance.view',
    'finance.edit',
    'invoice.view',
    'invoice.create',
    'invoice.edit'
  ],
  COMPLIANCE_OFFICER: [
    'compliance.view',
    'compliance.approve',
    'document.view',
    'document.approve'
  ],
  INTERVIEW_COORDINATOR: [
    'interview.view',
    'interview.schedule',
    'interview.edit'
  ]
};
