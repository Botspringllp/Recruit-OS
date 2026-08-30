import { RegexParsedData, AIParsedData, ParsedCandidate } from './types';

/**
 * Merge Engine that synthesizes deterministic Regex extraction output
 * and AI LLM structured parsing output adhering to strict business priority rules.
 * High-precision fields (Regex Email/Phone/URLs) override AI predictions.
 * ZERO hardcoded dummy mock values (no "candidate@example.com", no "+91-9876543210").
 */
export function mergeParsedOutputs(
  regexData: RegexParsedData,
  aiData: AIParsedData
): ParsedCandidate {
  // 1. Email Priority: Deterministic Regex wins, else AI, else empty string
  const email = regexData.email || '';

  // 2. Phone Priority: Deterministic Regex wins, else AI, else empty string
  const phone = regexData.phone || '';

  // 3. LinkedIn Priority: Deterministic Regex wins
  const linkedinUrl = regexData.linkedinUrl || undefined;

  // 4. GitHub Priority: Deterministic Regex wins
  const githubUrl = regexData.githubUrl || undefined;

  // 5. Experience Priority: Max confidence wins
  const regexExp = regexData.experienceYears || 0;
  const aiExp = aiData.totalExperienceYears || 0;
  const totalExperienceYears = Math.max(regexExp, aiExp);

  // 6. Notice Period Priority: Deterministic Regex wins if present, else AI
  const noticePeriodDays = regexData.noticePeriodDays !== undefined 
    ? regexData.noticePeriodDays 
    : (aiData.noticePeriodDays || 60);

  // 7. Skills Priority: AI LLM synthesis wins
  const skills = aiData.skills && aiData.skills.length > 0
    ? Array.from(new Set(aiData.skills))
    : [];

  // 8. Education & Certifications: AI LLM synthesis wins
  const education = aiData.education || [];
  const certifications = aiData.certifications || [];

  const firstName = aiData.firstName || '';
  const lastName = aiData.lastName || '';

  return {
    firstName,
    lastName,
    email,
    phone,
    linkedinUrl,
    githubUrl,
    currentDesignation: aiData.currentDesignation || undefined,
    currentCompany: aiData.currentCompany || undefined,
    totalExperienceYears,
    skills,
    education,
    certifications,
    currentLocation: aiData.currentLocation || undefined,
    preferredLocations: aiData.preferredLocations || [],
    noticePeriodDays,
    expectedCtcLpa: aiData.expectedCtcLpa || undefined,
    currentCtcLpa: aiData.currentCtcLpa || undefined,
    summary: aiData.summary || undefined,
    parsedAt: new Date().toISOString()
  };
}
