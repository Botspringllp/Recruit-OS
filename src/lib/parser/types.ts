export interface RegexParsedData {
  email?: string;
  phone?: string;
  linkedinUrl?: string;
  githubUrl?: string;
  experienceYears?: number;
  noticePeriodDays?: number;
}

export interface AIParsedData {
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  currentDesignation?: string;
  currentCompany?: string;
  totalExperienceYears?: number;
  skills: string[];
  education: Array<{
    degree?: string;
    institution?: string;
    year?: string;
  }>;
  certifications: string[];
  currentLocation?: string;
  preferredLocations: string[];
  noticePeriodDays?: number;
  expectedCtcLpa?: number;
  currentCtcLpa?: number;
  summary?: string;
}

export interface ParsedCandidate {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  linkedinUrl?: string;
  githubUrl?: string;
  currentDesignation?: string;
  currentCompany?: string;
  totalExperienceYears: number;
  skills: string[];
  education: Array<{
    degree?: string;
    institution?: string;
    year?: string;
  }>;
  certifications: string[];
  currentLocation?: string;
  preferredLocations: string[];
  noticePeriodDays: number;
  expectedCtcLpa?: number;
  currentCtcLpa?: number;
  summary?: string;
  source?: string;
  parsedAt: string;
}

export interface DuplicateCandidateMatch {
  id: string;
  firstName?: string;
  lastName?: string;
  email: string;
  phone: string;
  ownershipStatus?: string;
  createdAt?: string;
  matchedOn: 'EMAIL' | 'PHONE' | 'LINKEDIN' | 'email' | 'phone' | 'linkedin';
}

export interface ParseResumeResult {
  parsedCandidate: ParsedCandidate;
  duplicateMatch: DuplicateCandidateMatch | null;
  rawText: string;
}
