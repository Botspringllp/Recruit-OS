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
    result.email = emailMatches[0].toLowerCase().trim();
  }

  // 2. Phone Number Extraction (supports Indian 5-5, 10-digit, +91 & International formats)
  const phoneRegex = /(?:\+?\d{1,3}[-.\s]?)?\(?\d{2,5}\)?[-.\s]?\d{3,5}[-.\s]?\d{3,5}|\+?\d{10,12}/g;
  const phoneMatches = rawText.match(phoneRegex);
  if (phoneMatches && phoneMatches.length > 0) {
    const validPhone = phoneMatches.find(p => {
      const digits = p.replace(/\D/g, '');
      return digits.length >= 10 && digits.length <= 13;
    });
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

  // 5. Notice Period Extraction
  const noticeRegex = /(\d{1,3})\s*(?:days?|months?)\s*(?:notice\s*period|notice)/gi;
  const noticeMatch = noticeRegex.exec(rawText);
  if (noticeMatch) {
    const num = parseInt(noticeMatch[1], 10);
    if (!isNaN(num) && num > 0 && num <= 180) {
      result.noticePeriodDays = num;
    }
  } else if (/immediate\s*(?:joiner|joining)/i.test(rawText)) {
    result.noticePeriodDays = 0;
  }

  // 6. Experience Years Extraction
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
