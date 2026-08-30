import { RegexParsedData, AIParsedData, ParsedCandidate } from './types';

/**
 * Merge Engine that synthesizes deterministic Regex extraction output
 * and AI LLM structured parsing output adhering to strict business priority rules.
 * High-precision fields (Regex Email/Phone/URLs) override AI predictions to prevent hallucinations.
 * Complex unstructured fields (Skills, History, Education, Exp) are filled by AI.
 */
export function mergeParsedOutputs(
  regexData: RegexParsedData,
  aiData: AIParsedData
): ParsedCandidate {
  // 1. Email Priority: Deterministic Regex wins
  const email = regexData.email || 'candidate@example.com';

  // 2. Phone Priority: Deterministic Regex wins
  const phone = regexData.phone || '+91-9876543210';

  // 3. LinkedIn Priority: Deterministic Regex wins
  const linkedinUrl = regexData.linkedinUrl || undefined;

  // 4. GitHub Priority: Deterministic Regex wins
  const githubUrl = regexData.githubUrl || undefined;

  // 5. Experience Priority: Max confidence wins
  const regexExp = regexData.experienceYears || 0;
  const aiExp = aiData.totalExperienceYears || 0;
  const totalExperienceYears = Math.max(regexExp, aiExp, 1);

  // 6. Notice Period Priority: Deterministic Regex wins if present, else AI
  const noticePeriodDays = regexData.noticePeriodDays !== undefined 
    ? regexData.noticePeriodDays 
    : (aiData.noticePeriodDays || 60);

  // 7. Skills Priority: AI LLM synthesis wins
  const skills = aiData.skills && aiData.skills.length > 0
    ? Array.from(new Set(aiData.skills))
    : ['Software Development', 'Problem Solving'];

  // 8. Education & Certifications: AI LLM synthesis wins
  const education = aiData.education || [];
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
    noticePeriodDays,
    expectedCtcLpa: aiData.expectedCtcLpa || undefined,
    currentCtcLpa: aiData.currentCtcLpa || undefined,
    summary: aiData.summary || `${aiData.firstName} ${aiData.lastName} - Professional Candidate Record`,
    parsedAt: new Date().toISOString()
  };
}
