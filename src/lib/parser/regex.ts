import { RegexParsedData } from './types';

/**
 * Extracts reliable structured fields from raw resume text using deterministic regex rules.
 */
export function extractWithRegex(rawText: string): RegexParsedData {
  const result: RegexParsedData = {};

  // 1. Email Extraction
  const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g;
  const emailMatches = rawText.match(emailRegex);
  if (emailMatches && emailMatches.length > 0) {
    // Pick first valid email match
    result.email = emailMatches[0].toLowerCase().trim();
  }

  // 2. Phone Number Extraction (supports Indian +91 & International formats)
  const phoneRegex = /(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}|\+?\d{10,12}/g;
  const phoneMatches = rawText.match(phoneRegex);
  if (phoneMatches && phoneMatches.length > 0) {
    // Filter matches that look like legitimate phone numbers
    const validPhone = phoneMatches.find(p => p.replace(/\D/g, '').length >= 10);
    if (validPhone) {
      result.phone = validPhone.trim();
    }
  }

  // 3. LinkedIn URL Extraction
  const linkedinRegex = /(?:https?:\/\/)?(?:www\.)?linkedin\.com\/in\/[A-Za-z0-9_-]+\/?/gi;
  const linkedinMatches = rawText.match(linkedinRegex);
  if (linkedinMatches && linkedinMatches.length > 0) {
    let url = linkedinMatches[0].trim();
    if (!url.startsWith('http')) {
      url = 'https://' + url;
    }
    result.linkedinUrl = url;
  }

  // 4. GitHub URL Extraction
  const githubRegex = /(?:https?:\/\/)?(?:www\.)?github\.com\/[A-Za-z0-9_-]+\/?/gi;
  const githubMatches = rawText.match(githubRegex);
  if (githubMatches && githubMatches.length > 0) {
    let url = githubMatches[0].trim();
    if (!url.startsWith('http')) {
      url = 'https://' + url;
    }
    result.githubUrl = url;
  }

  // 5. Experience Years Extraction
  // Pattern matches: "5 years of experience", "4.5 yrs exp", "6+ Years", "Total Experience: 8 Years"
  const expRegex = /(\d+(?:\.\d+)?)\s*(?:\+)?\s*(?:years?|yrs?)\s*(?:of)?\s*(?:experience|exp)?/gi;
  let expMatch: RegExpExecArray | null;
  let maxYears = 0;

  while ((expMatch = expRegex.exec(rawText)) !== null) {
    const parsedYears = parseFloat(expMatch[1]);
    if (!isNaN(parsedYears) && parsedYears > 0 && parsedYears <= 45) {
      if (parsedYears > maxYears) {
        maxYears = parsedYears;
      }
    }
  }

  if (maxYears > 0) {
    result.experienceYears = maxYears;
  }

  return result;
}
