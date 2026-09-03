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
    const modelsToTry = ['gemini-pro-latest', 'gemini-2.5-flash', 'gemini-1.5-flash'];

    for (const modelName of modelsToTry) {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      try {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${geminiApiKey}`,
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
        // Continue to next model or fallback
      }
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

  const skipKeywords = /resume|curriculum|vitae|page|email|phone|address|profile|summary|experience|education|skills|contact|objective|xref|pdf|obj|stream|trailer|startxref|github|linkedin|developer|engineer|manager|architect|analyst|consultant|designer|specialist|lead|director|executive|officer|student|intern/i;

  if (rawText && typeof rawText === 'string') {
    const lines = rawText
      .split(/[\r\n]+/)
      .map(l => l.trim())
      .filter(Boolean);

    // 1. Scan top 12 lines for full candidate name
    for (const line of lines.slice(0, 12)) {
      // Strip URLs, emails, phone numbers, and special symbols
      const cleanLine = line
        .replace(/https?:\/\/\S+/gi, '')
        .replace(/\S+@\S+/g, '')
        .replace(/[\§\ï\•\|\,\-–]/g, ' ')
        .trim();

      if (/\d/.test(cleanLine)) continue; // Skip numeric lines
      if (skipKeywords.test(cleanLine)) continue; // Skip headers & job titles

      const words = cleanLine.split(/\s+/).filter(w => /^[A-Za-z]+$/.test(w) && w.length >= 2);
      if (words.length >= 1 && words.length <= 4 && cleanLine.length <= 45) {
        candidateName = words.map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
        break;
      }
    }
  }

  // 2. Fallback to fileName extraction if text scan yielded no clean name
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

  // 3. Dynamic Designation Extraction
  let currentDesignation: string | undefined;
  const desigRegex = /(?:Senior|Junior|Lead|Principal|Staff|Chief|Head of)?\s*(?:Full\s*-?\s*Stack|Frontend|Backend|Software|Web|Mobile|Cloud|DevOps|Data|System|UI\/UX|Product|QA|Test)\s*(?:Developer|Engineer|Architect|Manager|Analyst|Consultant|Designer|Specialist|Lead)/gi;
  const desigMatch = (rawText || '').match(desigRegex);
  if (desigMatch && desigMatch.length > 0) {
    currentDesignation = desigMatch[0].trim();
  }

  // 4. Extract Skills safely from rawText
  const commonSkills = [
    'React', 'Node.js', 'TypeScript', 'JavaScript', 'Next.js', 'Python', 'Flask', 'Django', 'Java',
    'PostgreSQL', 'MySQL', 'MongoDB', 'AWS', 'Docker', 'Kubernetes', 'GraphQL', 'Prisma', 'Spring Boot',
    'TailwindCSS', 'Tailwind', 'CSS', 'HTML', 'SQL', 'Git', 'Agile', 'Redux', 'Express', 'REST API',
    'Microservices', 'System Design', 'C++', 'C#', '.NET', 'Flutter', 'React Native', 'Vue.js', 'Angular',
    'DevOps', 'CI/CD', 'Linux', 'Firebase', 'Redis'
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

  // 5. Location Matching
  const locations = [
    'Bengaluru', 'Bangalore', 'Mumbai', 'Delhi', 'NCR', 'Gurugram', 'Gurgaon',
    'Noida', 'Hyderabad', 'Pune', 'Chennai', 'Kolkata', 'Ahmedabad', 'Jaipur',
    'Chandigarh', 'Kochi', 'Indore', 'Bhubaneswar', 'Sambalpur', 'Odisha',
    'San Francisco', 'New York', 'London', 'Singapore', 'Remote', 'India'
  ];
  let currentLocation: string | undefined;
  for (const loc of locations) {
    if (new RegExp(`\\b${loc}\\b`, 'i').test(rawText || '')) {
      currentLocation = loc;
      break;
    }
  }

  // 6. Total Experience Extraction
  let totalExperienceYears: number | undefined;
  const expMatch = (rawText || '').match(/(\d+(?:\.\d+)?)\s*(?:\+)?\s*(?:years?|yrs?)/i);
  if (expMatch) {
    const yrs = parseFloat(expMatch[1]);
    if (!isNaN(yrs) && yrs > 0 && yrs <= 45) {
      totalExperienceYears = yrs;
    }
  }

  // 7. Company Extraction
  let currentCompany: string | undefined;
  const companyMatch = (rawText || '').match(/(?:at|company[:\s]+|working\s+at)\s+([A-Za-z0-9\s,.&]+?)(?=\n|,|\.|$)/i);
  if (companyMatch) {
    const comp = companyMatch[1].trim();
    if (comp.length >= 2 && comp.length <= 40) {
      currentCompany = comp;
    }
  }

  // Secondary Company Match for Pvt Ltd / Tech / Solutions / InfoTech
  if (!currentCompany) {
    const corpMatch = (rawText || '').match(/\b([A-Z][A-Za-z0-9\s,.&]{2,30}\s+(?:Pvt\s*Ltd|Technologies|Solutions|Systems|Inc|Labs|Software|Infotech|Services|Global))\b/i);
    if (corpMatch) {
      currentCompany = corpMatch[1].trim();
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
