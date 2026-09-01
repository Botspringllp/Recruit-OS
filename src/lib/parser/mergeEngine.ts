import { RegexParsedData, AIParsedData, ParsedCandidate } from './types';

/**
 * Merge Engine that synthesizes deterministic Regex extraction output
 * and AI LLM structured parsing output adhering to strict business priority rules.
 * High-precision fields (Regex Email/Phone/URLs) override AI predictions.
 */
export function mergeParsedOutputs(
  regexData: RegexParsedData,
  aiData: AIParsedData,
  fileName?: string
): ParsedCandidate {
  // 1. Email Priority: Deterministic Regex wins, else AI, else empty string
  const email = regexData.email || aiData.email || '';

  // 2. Phone Priority: Deterministic Regex wins, else AI, else empty string
  const phone = regexData.phone || aiData.phone || '';

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

  let firstName = (aiData.firstName || '').trim();
  let lastName = (aiData.lastName || '').trim();

  // If Name contains digits, email handles, or is 'Candidate', attempt filename extraction
  const isInvalidName = !firstName || firstName === 'Candidate' || /\d/.test(firstName) || firstName.includes('@');
  if (isInvalidName && fileName) {
    let cleanFile = fileName.replace(/\.(pdf|docx|doc)$/i, '');
    cleanFile = cleanFile.replace(/[\(\[\{]\d+[\)\]\}]/g, '');
    cleanFile = cleanFile.replace(/[_-]?(original|resume|cv|final|latest|updated|draft|copy|v\d+)[_-]?/gi, ' ');
    cleanFile = cleanFile.replace(/[_-]+/g, ' ').trim();
    const fileWords = cleanFile.split(/\s+/).filter(w => /^[A-Za-z]+$/.test(w));
    if (fileWords.length >= 1 && fileWords.length <= 4) {
      firstName = fileWords[0].charAt(0).toUpperCase() + fileWords[0].slice(1).toLowerCase();
      lastName = fileWords.slice(1).map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
    }
  }

  // Secondary Fallback: Email Handle Name Resolution if name is still invalid
  if ((!firstName || firstName === 'Candidate' || /\d/.test(firstName)) && email.includes('@')) {
    const handle = email.split('@')[0];
    const parts = handle.split(/[._-]/).filter(p => /^[A-Za-z]+$/.test(p));
    if (parts.length >= 1) {
      firstName = parts[0].charAt(0).toUpperCase() + parts[0].slice(1).toLowerCase();
    }
    if (parts.length >= 2) {
      lastName = parts.slice(1).map(p => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase()).join(' ');
    }
  }

  if (!firstName) firstName = 'Candidate';

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
