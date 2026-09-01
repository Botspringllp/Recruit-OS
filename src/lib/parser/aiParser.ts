import { AIParsedData } from './types';

/**
 * Safe Regex Escaper Helper to prevent regex syntax errors for C++, C#, etc.
 */
function escapeRegExp(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * AI Parsing Layer using Gemini API with real text structural fallback.
 * Enforces 6,000 max character rawText truncation and a 6-second AbortController timeout.
 */
export async function parseWithAI(rawText: string, fileName?: string): Promise<AIParsedData> {
  const geminiApiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  const truncatedText = rawText.slice(0, 6000);

  if (geminiApiKey) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          signal: controller.signal,
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    text: `You are an expert resume parser for an enterprise recruitment system. Extract candidate information from the following raw resume text into STRICT JSON ONLY. Do not include markdown code blocks, backticks, or any conversational text.

Return JSON adhering to this exact schema:
{
  "firstName": "String",
  "lastName": "String",
  "currentDesignation": "String or null",
  "currentCompany": "String or null",
  "totalExperienceYears": Number or null,
  "skills": ["Array of Skill Strings"],
  "education": [{"degree": "String", "institution": "String", "year": "String"}],
  "certifications": ["Array of Certification Strings"],
  "currentLocation": "String or null",
  "preferredLocations": ["Array of Strings"],
  "noticePeriodDays": Number or null,
  "expectedCtcLpa": Number or null,
  "currentCtcLpa": Number or null,
  "summary": "String or null"
}

Resume Text:
${truncatedText}`
                  }
                ]
              }
            ],
            generationConfig: {
              temperature: 0.1,
              responseMimeType: 'application/json'
            }
          })
        }
      );

      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        const jsonText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (jsonText) {
          const cleanedJson = jsonText.replace(/```json/g, '').replace(/```/g, '').trim();
          const parsed = JSON.parse(cleanedJson);
          return sanitizeAIParsedData(parsed, truncatedText, fileName);
        }
      }
    } catch (error: any) {
      clearTimeout(timeoutId);
      console.warn('Gemini API call bypassed or timed out, using real text structural extractor fallback:', error.message || error);
    }
  }

  // Fallback structural parser extracting REAL candidate data directly from text & fileName
  return extractFallbackCandidate(truncatedText, fileName);
}

function sanitizeAIParsedData(parsed: any, rawText: string, fileName?: string): AIParsedData {
  const fallback = extractFallbackCandidate(rawText, fileName);

  return {
    firstName: String(parsed.firstName || '').trim() || fallback.firstName,
    lastName: String(parsed.lastName || '').trim() || fallback.lastName,
    currentDesignation: parsed.currentDesignation ? String(parsed.currentDesignation).trim() : fallback.currentDesignation,
    currentCompany: parsed.currentCompany ? String(parsed.currentCompany).trim() : fallback.currentCompany,
    totalExperienceYears: typeof parsed.totalExperienceYears === 'number' ? parsed.totalExperienceYears : fallback.totalExperienceYears,
    skills: Array.isArray(parsed.skills) && parsed.skills.length > 0
      ? parsed.skills.map((s: any) => String(s).trim()).filter(Boolean)
      : fallback.skills,
    education: Array.isArray(parsed.education)
      ? parsed.education.map((e: any) => ({
          degree: e.degree ? String(e.degree).trim() : undefined,
          institution: e.institution ? String(e.institution).trim() : undefined,
          year: e.year ? String(e.year).trim() : undefined
        }))
      : [],
    certifications: Array.isArray(parsed.certifications)
      ? parsed.certifications.map((c: any) => String(c).trim()).filter(Boolean)
      : [],
    currentLocation: parsed.currentLocation ? String(parsed.currentLocation).trim() : fallback.currentLocation,
    preferredLocations: Array.isArray(parsed.preferredLocations)
      ? parsed.preferredLocations.map((l: any) => String(l).trim()).filter(Boolean)
      : [],
    noticePeriodDays: typeof parsed.noticePeriodDays === 'number' ? parsed.noticePeriodDays : 60,
    expectedCtcLpa: typeof parsed.expectedCtcLpa === 'number' ? parsed.expectedCtcLpa : undefined,
    currentCtcLpa: typeof parsed.currentCtcLpa === 'number' ? parsed.currentCtcLpa : undefined,
    summary: parsed.summary ? String(parsed.summary).trim() : fallback.summary
  };
}

export function extractFallbackCandidate(rawText: string, fileName?: string): AIParsedData {
  let candidateName = '';

  if (rawText && typeof rawText === 'string') {
    const lines = rawText
      .split(/[\r\n]+/)
      .map(l => l.trim())
      .filter(Boolean);

    const skipKeywords = /resume|curriculum|vitae|page|email|phone|address|profile|summary|experience|education|skills|contact|objective|xref|pdf|obj|stream|trailer|startxref|github|linkedin/i;

    // Scan top 15 lines for candidate full name
    for (const line of lines.slice(0, 15)) {
      const cleanLine = line.split(/[|•,\-–]/)[0].trim();
      if (cleanLine.includes('@') || cleanLine.includes('http') || cleanLine.includes('www.') || /\d/.test(cleanLine)) {
        continue; // Skip emails, URLs, and numeric strings
      }

      const words = cleanLine.split(/\s+/).filter(w => /^[A-Za-z]+$/.test(w));
      if (
        words.length >= 1 &&
        words.length <= 4 &&
        cleanLine.length >= 3 &&
        cleanLine.length <= 40 &&
        !skipKeywords.test(cleanLine)
      ) {
        candidateName = words.map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
        break;
      }
    }
  }

  // Fallback to fileName name extraction if text scan yielded no clean name
  if (!candidateName && fileName) {
    let cleanFile = fileName.replace(/\.(pdf|docx|doc)$/i, '');
    cleanFile = cleanFile.replace(/[\(\[\{]\d+[\)\]\}]/g, '');
    cleanFile = cleanFile.replace(/[_-]?(original|resume|cv|final|latest|updated|draft|copy|v\d+)[_-]?/gi, ' ');
    cleanFile = cleanFile.replace(/[_-]+/g, ' ').trim();
    const fileWords = cleanFile.split(/\s+/).filter(w => /^[A-Za-z]+$/.test(w));
    if (fileWords.length >= 1 && fileWords.length <= 4) {
      candidateName = fileWords.map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
    }
  }

  const nameParts = (candidateName || 'Candidate').split(/\s+/).filter(Boolean);
  const firstName = nameParts[0] || 'Candidate';
  const lastName = nameParts.slice(1).join(' ') || '';

  // Extract skills safely from rawText
  const commonSkills = [
    'React', 'Node.js', 'TypeScript', 'JavaScript', 'Next.js', 'Python', 'Java',
    'PostgreSQL', 'MySQL', 'MongoDB', 'AWS', 'Docker', 'Kubernetes', 'GraphQL',
    'TailwindCSS', 'Tailwind', 'CSS', 'HTML', 'SQL', 'Git', 'Agile', 'Redux',
    'Express', 'REST API', 'Microservices', 'System Design', 'C++', 'C#', '.NET',
    'Flutter', 'React Native', 'Vue.js', 'Angular', 'DevOps', 'CI/CD', 'Linux'
  ];

  const lowerRawText = (rawText || '').toLowerCase();
  const foundSkills = commonSkills.filter(skill => {
    const lowerSkill = skill.toLowerCase();

    if (lowerSkill === 'c++' || lowerSkill === 'c#' || lowerSkill === '.net') {
      return lowerRawText.includes(lowerSkill);
    }

    try {
      const escaped = escapeRegExp(skill);
      return new RegExp(`\\b${escaped}\\b`, 'i').test(rawText || '');
    } catch (e) {
      return lowerRawText.includes(lowerSkill);
    }
  });

  // Designation matching
  const titles = [
    'Senior Full Stack Engineer', 'Full Stack Developer', 'Software Development Engineer',
    'Software Engineer', 'Senior Software Engineer', 'Frontend Developer', 'Backend Developer',
    'Lead Cloud Architect', 'DevOps Engineer', 'Data Scientist', 'Product Manager', 'System Administrator'
  ];

  let currentDesignation: string | undefined;
  for (const title of titles) {
    if (new RegExp(`\\b${title}\\b`, 'i').test(rawText || '')) {
      currentDesignation = title;
      break;
    }
  }

  // Location matching
  const locations = [
    'Bengaluru', 'Bangalore', 'Mumbai', 'Delhi', 'NCR', 'Gurugram', 'Gurgaon',
    'Noida', 'Hyderabad', 'Pune', 'Chennai', 'Kolkata', 'Ahmedabad', 'San Francisco',
    'New York', 'London', 'Singapore'
  ];
  let currentLocation: string | undefined;
  for (const loc of locations) {
    if (new RegExp(`\\b${loc}\\b`, 'i').test(rawText || '')) {
      currentLocation = loc;
      break;
    }
  }

  // Total Experience Extraction
  let totalExperienceYears: number | undefined;
  const expMatch = (rawText || '').match(/(\d+(?:\.\d+)?)\s*(?:\+)?\s*(?:years?|yrs?)/i);
  if (expMatch) {
    const yrs = parseFloat(expMatch[1]);
    if (!isNaN(yrs) && yrs > 0 && yrs <= 45) {
      totalExperienceYears = yrs;
    }
  }

  // Company Extraction
  let currentCompany: string | undefined;
  const companyMatch = (rawText || '').match(/(?:at|company[:\s]+|working\s+at)\s+([A-Za-z0-9\s,.&]+?)(?=\n|,|\.|$)/i);
  if (companyMatch) {
    const comp = companyMatch[1].trim();
    if (comp.length >= 2 && comp.length <= 40) {
      currentCompany = comp;
    }
  }

  const summary = (rawText || '').slice(0, 300).replace(/\s+/g, ' ').trim();

  return {
    firstName,
    lastName,
    currentDesignation,
    currentCompany,
    totalExperienceYears,
    skills: foundSkills,
    education: [],
    certifications: [],
    currentLocation,
    preferredLocations: [],
    noticePeriodDays: 60,
    expectedCtcLpa: undefined,
    currentCtcLpa: undefined,
    summary: summary || undefined
  };
}
