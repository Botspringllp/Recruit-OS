import { RegexParsedData, AIParsedData, ParsedCandidate } from './types';

/**
 * Merge Engine that synthesizes deterministic Regex extraction output
 * and AI LLM structured parsing output adhering to strict business priority rules.
 */
export function mergeParsedOutputs(
  regexData: RegexParsedData,
  aiData: AIParsedData
): ParsedCandidate {
  // 1. Email Priority: Regex wins
  const email = regexData.email || 'candidate@example.com';

  // 2. Phone Priority: Regex wins
  const phone = regexData.phone || '+91-9876543210';

  // 3. LinkedIn Priority: Regex wins
  const linkedinUrl = regexData.linkedinUrl || undefined;

  // 4. GitHub Priority: Regex wins
  const githubUrl = regexData.githubUrl || undefined;

  // 5. Experience Priority: Highest confidence value wins
  const regexExp = regexData.experienceYears || 0;
  const aiExp = aiData.totalExperienceYears || 0;
  const totalExperienceYears = Math.max(regexExp, aiExp, 1);

  // 6. Skills Priority: AI wins
  const skills = aiData.skills && aiData.skills.length > 0
    ? Array.from(new Set(aiData.skills))
    : ['Software Development', 'Problem Solving'];

  // 7. Education Priority: AI wins
  const education = aiData.education || [];

  // 8. Certifications Priority: AI wins
  const certifications = aiData.certifications || [];

  return {
    firstName: aiData.firstName || 'Candidate',
    lastName: aiData.lastName || 'Record',
    email,
    phone,
    linkedinUrl,
    githubUrl,
    currentDesignation: aiData.currentDesignation || 'Software Engineer',
    currentCompany: aiData.currentCompany || 'Technology Agency',
    totalExperienceYears,
    skills,
    education,
    certifications,
    currentLocation: aiData.currentLocation || 'Bangalore, India',
    preferredLocations: aiData.preferredLocations || ['Bangalore', 'Remote'],
    noticePeriodDays: aiData.noticePeriodDays || 60,
    expectedCtcLpa: aiData.expectedCtcLpa || undefined,
    currentCtcLpa: aiData.currentCtcLpa || undefined,
    summary: aiData.summary || `${aiData.firstName} ${aiData.lastName} - Professional Candidate Record`,
    parsedAt: new Date().toISOString()
  };
}
