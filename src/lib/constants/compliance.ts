export const MANDATORY_COMPLIANCE_CATEGORIES = [
  'RESUME',
  'AADHAAR',
  'PAN',
  'PASSPORT',
  'OFFER_LETTER',
  'RELIEVING_LETTER',
  'EXPERIENCE_LETTER',
  'SALARY_SLIPS',
  'EDUCATION_CERTIFICATES',
  'JOINING_DOCUMENTS',
  'BGV_REPORT'
] as const;

export type ComplianceCategory = (typeof MANDATORY_COMPLIANCE_CATEGORIES)[number];

export const COMPLIANCE_STATUSES = [
  'PENDING',
  'SUBMITTED',
  'UNDER_REVIEW',
  'VERIFIED',
  'REJECTED',
  'EXPIRED'
] as const;

export type ComplianceStatus = (typeof COMPLIANCE_STATUSES)[number];
