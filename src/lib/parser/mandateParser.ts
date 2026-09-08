export interface ExtractedMandateData {
  title: string;
  clientName: string;
  industry: string;
  employmentType: string;
  experience: string;
  education: string;
  skills: string;
  description: string;
  companyOverview: string;
  headcount: number;
  minCtcLpa: string;
  maxCtcLpa: string;
  feePercentage: string;
  status: string;
  location: string;
  noticePeriod: string;
}

export interface ExtractedMandateResult {
  data: ExtractedMandateData;
  confidence: Record<keyof ExtractedMandateData, number>;
  warning?: string;
}

// Canonical Skill Normalization Dictionary
const SKILL_NORMALIZATION_MAP: Record<string, string> = {
  'reactjs': 'React',
  'react.js': 'React',
  'react js': 'React',
  'nodejs': 'Node.js',
  'node.js': 'Node.js',
  'node js': 'Node.js',
  'postgres': 'PostgreSQL',
  'postgresql': 'PostgreSQL',
  'nextjs': 'Next.js',
  'next.js': 'Next.js',
  'next js': 'Next.js',
  'js': 'JavaScript',
  'javascript': 'JavaScript',
  'ts': 'TypeScript',
  'typescript': 'TypeScript',
  'python3': 'Python',
  'aws cloud': 'AWS',
  'amazon web services': 'AWS',
  'gcp': 'Google Cloud',
  'google cloud platform': 'Google Cloud',
  'mongo': 'MongoDB',
  'mongodb': 'MongoDB',
  'docker container': 'Docker',
  'k8s': 'Kubernetes',
  'expressjs': 'Express.js',
  'vuejs': 'Vue.js',
  'angularjs': 'Angular'
};

// Known Technology and Functional Skills Dictionary for Document Scanning
const KNOWN_SKILLS_DICTIONARY = [
  'React', 'Node.js', 'TypeScript', 'JavaScript', 'Python', 'Java', 'C++', 'C#', '.NET',
  'Spring Boot', 'AWS', 'Azure', 'Google Cloud', 'PostgreSQL', 'MySQL', 'MongoDB',
  'Redis', 'Docker', 'Kubernetes', 'GraphQL', 'REST API', 'Next.js', 'Express.js',
  'HTML', 'CSS', 'TailwindCSS', 'Redux', 'Git', 'CI/CD', 'Jenkins', 'Terraform',
  'Kafka', 'Elasticsearch', 'Microservices', 'System Design', 'Figma', 'UI/UX',
  'Machine Learning', 'Data Science', 'SQL', 'NoSQL', 'Linux', 'Agile', 'Scrum',
  'Sales', 'Lead Generation', 'Business Development', 'Digital Marketing', 'SEO',
  'Accounting', 'Tally', 'Financial Analysis', 'Excel', 'Customer Support'
];

// Regex matching any section boundary header to prevent over-extraction
const SECTION_BOUNDARY_REGEX = /^(?:About\s*(?:Company|Us|The Organization)|Company\s*Overview|Organization\s*Profile|Company\s*Profile|Key\s*Skills|Primary\s*Skills|Technical\s*Skills|Must\s*Have|Skills\s*&\s*Qualifications|Required\s*Skills|Skills|Tech\s*Stack|Education|Qualifications?|Academic\s*Background|Experience|Location|Job\s*Location|Salary|Compensation|CTC|Budget|Fee|How\s*to\s*Apply|Contact|Positions|Headcount|Notice\s*Period)\b/i;

/**
 * Standardize and clean extracted skills list
 */
function normalizeSkills(rawSkillsStr: string): string {
  if (!rawSkillsStr) return '';
  
  const tokens = rawSkillsStr.split(/[,;\n|/•\t\-]/).map(s => s.trim()).filter(Boolean);
  const normalizedSet = new Set<string>();

  for (const token of tokens) {
    const key = token.toLowerCase();
    if (SKILL_NORMALIZATION_MAP[key]) {
      normalizedSet.add(SKILL_NORMALIZATION_MAP[key]);
    } else {
      const cleanToken = token.replace(/^[^\w]+|[^\w]+$/g, '');
      if (cleanToken.length >= 2 && !/^(and|or|with|the|in|for|to|of|on|a|an|is|are|skills|required|must|have)$/i.test(cleanToken)) {
        normalizedSet.add(cleanToken);
      }
    }
  }

  return Array.from(normalizedSet).join(', ');
}

/**
 * Extract lines belonging strictly to a section without spilling into subsequent sections
 */
function extractSectionLines(
  lines: string[],
  headerRegex: RegExp,
  maxLines: number = 8
): string[] {
  let inSection = false;
  const sectionLines: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (!inSection) {
      if (headerRegex.test(line)) {
        inSection = true;
        // If inline content exists after colon/dash, capture it
        const parts = line.split(/[:|-]/);
        if (parts.length > 1) {
          const inlineText = parts.slice(1).join(':').trim();
          if (inlineText.length > 2) {
            sectionLines.push(inlineText);
          }
        }
      }
    } else {
      // Stop immediately if current line matches ANY section boundary header
      if (SECTION_BOUNDARY_REGEX.test(line) && sectionLines.length > 0) {
        break;
      }
      if (sectionLines.length >= maxLines) {
        break;
      }
      if (line.length > 0) {
        sectionLines.push(line);
      }
    }
  }

  return sectionLines;
}

/**
 * Perform contextual NLP inference for Industry Type when not explicitly defined
 */
function inferIndustryType(text: string): { industry: string; confidence: number } {
  const lowerText = text.toLowerCase();

  const industryClusters: { name: string; keywords: string[]; weight: number }[] = [
    {
      name: 'FinTech / BFSI',
      keywords: ['bank', 'fintech', 'payment', 'lending', 'financial', 'bfsi', 'trading', 'crypto', 'wealth', 'insurance', 'nbfc', 'gateway'],
      weight: 0
    },
    {
      name: 'Software / SaaS',
      keywords: ['saas', 'software', 'cloud', 'full stack', 'web application', 'api', 'microservices', 'frontend', 'backend', 'developer', 'b2b saas'],
      weight: 0
    },
    {
      name: 'IT Services & Consulting',
      keywords: ['it services', 'system integrator', 'consulting', 'outsourcing', 'managed services', 'client project', 'offshore'],
      weight: 0
    },
    {
      name: 'Healthcare / MedTech',
      keywords: ['health', 'pharma', 'hospital', 'medical', 'biotech', 'clinical', 'patient', 'telemedicine'],
      weight: 0
    },
    {
      name: 'E-Commerce / Retail',
      keywords: ['e-commerce', 'ecommerce', 'retail', 'shopping', 'marketplace', 'd2c', 'cart', 'inventory'],
      weight: 0
    },
    {
      name: 'EdTech / Education',
      keywords: ['education', 'learning', 'edtech', 'students', 'academy', 'courses', 'lms', 'tutor'],
      weight: 0
    },
    {
      name: 'Telecom & Networking',
      keywords: ['telecom', 'telecommunication', '5g', 'network', 'wireless', 'spectrum', 'voip'],
      weight: 0
    },
    {
      name: 'Manufacturing & Supply Chain',
      keywords: ['manufacturing', 'automotive', 'factory', 'assembly', 'supply chain', 'logistics', 'warehouse'],
      weight: 0
    }
  ];

  for (const cluster of industryClusters) {
    for (const kw of cluster.keywords) {
      const matches = (lowerText.match(new RegExp(`\\b${kw}\\b`, 'gi')) || []).length;
      cluster.weight += matches;
    }
  }

  industryClusters.sort((a, b) => b.weight - a.weight);

  if (industryClusters[0] && industryClusters[0].weight > 0) {
    return {
      industry: industryClusters[0].name,
      confidence: Math.min(0.70 + (industryClusters[0].weight * 0.04), 0.92)
    };
  }

  return { industry: 'IT Services & Technology', confidence: 0.65 };
}

/**
 * Robust AI & Regex Parser for Job Mandates
 * Guarantees exact Position Title, Company Name, Education, Skills, and Bounded JD extraction.
 */
export async function parseJobMandateText(rawText: string): Promise<ExtractedMandateResult> {
  const text = (rawText || '').replace(/\u00A0/g, ' ').trim();
  const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);

  let title = '';
  let clientName = '';
  let industry = '';
  let employmentType = 'Full-Time';
  let experience = '';
  let education = '';
  let skills = '';
  let description = '';
  let companyOverview = '';
  let headcount = 1;
  let minCtcLpa = '';
  let maxCtcLpa = '';
  let feePercentage = '8.33';
  let status = 'OPEN';
  let location = '';
  let noticePeriod = '';

  const confidence: Record<keyof ExtractedMandateData, number> = {
    title: 0.5,
    clientName: 0.5,
    industry: 0.5,
    employmentType: 0.8,
    experience: 0.5,
    education: 0.5,
    skills: 0.5,
    description: 0.85,
    companyOverview: 0.5,
    headcount: 0.8,
    minCtcLpa: 0.5,
    maxCtcLpa: 0.5,
    feePercentage: 0.9,
    status: 0.9,
    location: 0.5,
    noticePeriod: 0.5
  };

  if (!text || lines.length === 0) {
    return {
      data: {
        title: '',
        clientName: '',
        industry: '',
        employmentType: 'Full-Time',
        experience: '',
        education: '',
        skills: '',
        description: '',
        companyOverview: '',
        headcount: 1,
        minCtcLpa: '',
        maxCtcLpa: '',
        feePercentage: '8.33',
        status: 'OPEN',
        location: '',
        noticePeriod: ''
      },
      confidence,
      warning: 'Document text is empty. Please enter job details manually.'
    };
  }

  // 1. POSITION TITLE EXTRACTION
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const titleHeaderMatch = line.match(/^(?:Job\s*Title|Position\s*Title|Position|Role|Requirement\s*Title|Mandate\s*Title|Designation|Hiring\s*for|Opening\s*for|Role\s*Name)\s*[:|-]?\s*(.*)/i);
    if (titleHeaderMatch) {
      const val = titleHeaderMatch[1].trim();
      if (val.length > 2) {
        title = val.replace(/^[^\w]+|[^\w]+$/g, '');
        confidence.title = 0.96;
        break;
      } else if (i + 1 < lines.length && lines[i + 1].length < 80) {
        title = lines[i + 1].trim().replace(/^[^\w]+|[^\w]+$/g, '');
        confidence.title = 0.90;
        break;
      }
    }
  }

  if (!title) {
    // Scan top 10 lines for typical job designation keywords
    const candidateLine = lines.slice(0, 10).find(l => 
      l.length < 85 && 
      !/description|overview|company|client|about|table|requirements|mandate|hiring|date|location|salary/i.test(l) &&
      /\b(Developer|Engineer|Manager|Lead|Architect|Consultant|Designer|Analyst|Specialist|Executive|Officer|Director|Tester|QA|Accountant|Recruiter|Scientist)\b/i.test(l)
    );
    if (candidateLine) {
      title = candidateLine.trim();
      confidence.title = 0.80;
    } else {
      const topFirstLine = lines[0];
      if (topFirstLine && topFirstLine.length < 75) {
        title = topFirstLine.trim();
        confidence.title = 0.65;
      }
    }
  }

  // 2. COMPANY NAME EXTRACTION
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const companyHeaderMatch = line.match(/^(?:Company\s*Name|Client\s*Name|Employer|Organization|Hiring\s*Company|Client|Company|Hiring\s*Client)\s*[:|-]?\s*(.*)/i);
    if (companyHeaderMatch) {
      const val = companyHeaderMatch[1].trim();
      if (val.length > 2 && !/^(overview|profile|description|about)$/i.test(val)) {
        clientName = val.replace(/^[^\w]+|[^\w]+$/g, '');
        confidence.clientName = 0.94;
        break;
      } else if (i + 1 < lines.length && lines[i + 1].length < 80) {
        clientName = lines[i + 1].trim().replace(/^[^\w]+|[^\w]+$/g, '');
        confidence.clientName = 0.90;
        break;
      }
    }
  }

  if (!clientName) {
    // Scan top 12 lines for corporate legal entity indicators
    const companyLine = lines.slice(0, 12).find(l => 
      /\b(Pvt\.?\s*Ltd\.?|Private\s*Limited|Limited|Inc\.?|LLC|Technologies|Solutions|Corporation|Corp\.?|Services|Group|Software|Systems|Labs|Global|Infotech)\b/i.test(l) &&
      !/description|overview|requirements/i.test(l)
    );
    if (companyLine) {
      clientName = companyLine.trim();
      confidence.clientName = 0.82;
    }
  }

  // 3. JOB LOCATION EXTRACTION
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const locMatch = line.match(/^(?:Location|Job\s*Location|Work\s*Location|Base\s*Location|City|Place\s*of\s*Posting)\s*[:|-]?\s*(.*)/i);
    if (locMatch) {
      const val = locMatch[1].trim();
      if (val.length > 2) {
        location = val;
        confidence.location = 0.94;
        break;
      } else if (i + 1 < lines.length) {
        location = lines[i + 1].trim();
        confidence.location = 0.88;
        break;
      }
    }
  }

  if (!location) {
    const cityMatch = text.match(/\b(Bangalore|Bengaluru|Mumbai|Delhi|NCR|Gurgaon|Gurugram|Noida|Hyderabad|Pune|Chennai|Kolkata|Ahmedabad|Remote|Hybrid)\b/i);
    if (cityMatch && cityMatch[0]) {
      location = cityMatch[0].trim();
      confidence.location = 0.85;
    }
  }

  // 4. INDUSTRY TYPE EXTRACTION
  const explicitIndustryMatch = text.match(/(?:Industry\s*Type|Industry|Domain|Sector|Business\s*Domain)\s*[:|-]\s*([^\r\n]+)/i);
  if (explicitIndustryMatch && explicitIndustryMatch[1]) {
    industry = explicitIndustryMatch[1].trim();
    confidence.industry = 0.95;
  } else {
    const inferred = inferIndustryType(text);
    industry = inferred.industry;
    confidence.industry = inferred.confidence;
  }

  // 5. EMPLOYMENT TYPE EXTRACTION
  const empTypeMatch = text.match(/(?:Employment\s*Type|Job\s*Type|Work\s*Type|Engagement\s*Type)\s*[:|-]\s*([^\r\n]+)/i);
  if (empTypeMatch && empTypeMatch[1]) {
    const val = empTypeMatch[1].trim();
    if (/contract/i.test(val)) employmentType = 'Contract';
    else if (/part/i.test(val)) employmentType = 'Part-Time';
    else if (/remote/i.test(val)) employmentType = 'Remote';
    else if (/hybrid/i.test(val)) employmentType = 'Hybrid';
    else if (/intern/i.test(val)) employmentType = 'Internship';
    else if (/freelance/i.test(val)) employmentType = 'Freelance';
    else employmentType = 'Full-Time';
    confidence.employmentType = 0.95;
  } else {
    if (/\b(Contract|Contractual)\b/i.test(text)) employmentType = 'Contract';
    else if (/\b(Remote)\b/i.test(text)) employmentType = 'Remote';
    else if (/\b(Hybrid)\b/i.test(text)) employmentType = 'Hybrid';
    else if (/\b(Part-Time|Part Time)\b/i.test(text)) employmentType = 'Part-Time';
    else employmentType = 'Full-Time';
    confidence.employmentType = 0.88;
  }

  // 6. EXPERIENCE REQUIRED EXTRACTION
  const expMatch = text.match(/(?:Experience\s*Required|Experience|Relevant\s*Experience|Exp|YOE|Years\s*of\s*Exp)\s*[:|-]\s*([^\r\n]+)/i) ||
                   text.match(/(\d+)\s*(?:-|to|–)\s*(\d+)\s*(?:years|yrs)?/i) ||
                   text.match(/(\d+)\+\s*(?:years|yrs)\s*(?:of)?\s*experience/i);

  if (expMatch) {
    if (expMatch[1] && expMatch[2]) {
      experience = `${expMatch[1]} - ${expMatch[2]} Years`;
      confidence.experience = 0.94;
    } else if (expMatch[1]) {
      const matchedText = expMatch[1].trim();
      experience = matchedText.includes('Year') ? matchedText : `${matchedText} Years`;
      confidence.experience = 0.90;
    }
  }

  // 7. HIGH-PRECISION EDUCATION / QUALIFICATION EXTRACTION (MULTI-LINE BLOCK)
  const eduBlockLines = extractSectionLines(
    lines,
    /^(?:Education\s*Requirements|Education|Qualifications?|Academic\s*Background|Academic\s*Qualification|Eligibility|Degree\s*Required)\b/i,
    4
  );

  if (eduBlockLines.length > 0) {
    education = eduBlockLines.join(' / ');
    confidence.education = 0.95;
  } else {
    // Exact degree keyword fallback in document
    const eduDegreeMatch = text.match(/\b(B\.?Tech|B\.?E\.?|M\.?Tech|M\.?C\.?A\.?|B\.?C\.?A\.?|M\.?B\.?A\.?|B\.?Sc|M\.?Sc|Bachelor'?s(?:\s+degree)?|Master'?s(?:\s+degree)?|Graduation|Post-Graduation|Diploma|Ph\.?D)\b[^\r\n]*/i);
    if (eduDegreeMatch && eduDegreeMatch[0]) {
      education = eduDegreeMatch[0].trim();
      confidence.education = 0.88;
    }
  }

  // 8. STRICT & HIGH-PRECISION SKILLS EXTRACTION (MULTI-LINE BLOCK)
  const skillBlockLines = extractSectionLines(
    lines,
    /^(?:Key\s*Skills|Primary\s*Skills|Must\s*Have\s*Skills|Must\s*Have|Required\s*Skills|Skills\s*Required|Technical\s*Skills|Mandatory\s*Skills|Tech\s*Stack|Tools\s*&\s*Technologies|Technologies|Competencies|Skills)\b/i,
    6
  );

  if (skillBlockLines.length > 0) {
    skills = normalizeSkills(skillBlockLines.join(', '));
    confidence.skills = 0.96;
  } else {
    // Scan document text for known skills dictionary
    const presentSkills = KNOWN_SKILLS_DICTIONARY.filter(sk => 
      new RegExp(`\\b${sk.replace('.', '\\.')}\\b`, 'i').test(text)
    );
    if (presentSkills.length > 0) {
      skills = presentSkills.join(', ');
      confidence.skills = 0.88;
    } else {
      skills = '';
      confidence.skills = 0.0;
    }
  }

  // 9. STRICTLY BOUNDED JOB DESCRIPTION EXTRACTION (NO OVER-FILLING!)
  const jdBlockLines = extractSectionLines(
    lines,
    /^(?:Job\s*Description|Responsibilities|Roles\s*&\s*Responsibilities|Key\s*Responsibilities|Duties|What\s*you\s*will\s*do|Role\s*Overview)\b/i,
    6 // Max 6 lines of Job Description ONLY
  );

  if (jdBlockLines.length > 0) {
    description = jdBlockLines.join('\n');
    confidence.description = 0.95;
  } else {
    // Fallback: extract max 4 bullet points matching action verbs
    const bulletLines = lines.filter(l => 
      /^[•\-\*]/.test(l) && 
      /develop|build|manage|lead|create|design|implement|maintain|coordinate|deliver/i.test(l) &&
      !SECTION_BOUNDARY_REGEX.test(l)
    );
    if (bulletLines.length > 0) {
      description = bulletLines.slice(0, 4).join('\n');
      confidence.description = 0.75;
    } else {
      // Clean fallback: max first 3 non-header lines
      const cleanTop = lines.filter(l => !SECTION_BOUNDARY_REGEX.test(l) && l.length > 15).slice(0, 3);
      description = cleanTop.join('\n');
      confidence.description = 0.60;
    }
  }

  // 10. COMPANY OVERVIEW EXTRACTION
  const overviewBlockLines = extractSectionLines(
    lines,
    /^(?:Company\s*Overview|About\s*Company|About\s*Us|Organization\s*Overview|Organization\s*Profile|Who\s*We\s*Are|Company\s*Profile)\b/i,
    5
  );

  if (overviewBlockLines.length > 0) {
    companyOverview = overviewBlockLines.join('\n');
    confidence.companyOverview = 0.92;
  } else {
    const displayCompany = clientName || 'Client Organization';
    const displayTitle = title || 'Hiring Position';
    companyOverview = `${displayCompany} is a leading ${industry} enterprise hiring for the ${displayTitle} role.`;
    confidence.companyOverview = 0.75;
  }

  // Advanced metadata extraction
  const headcountMatch = text.match(/(?:Positions|Headcount|Vacancies|Openings|No\. of Openings)\s*[:|-]\s*(\d+)/i);
  if (headcountMatch && headcountMatch[1]) {
    headcount = parseInt(headcountMatch[1], 10) || 1;
  }

  const salaryMatch = text.match(/(\d+(?:\.\d+)?)\s*(?:-|to|–)\s*(\d+(?:\.\d+)?)\s*(?:LPA|Lacs|Lakhs)/i);
  if (salaryMatch) {
    minCtcLpa = salaryMatch[1];
    maxCtcLpa = salaryMatch[2];
  }

  let warningMessage: string | undefined = undefined;
  if (!title || !skills) {
    warningMessage = 'Some mandate details could not be extracted automatically. Please review and fill them manually.';
  }

  return {
    data: {
      title,
      clientName,
      industry,
      employmentType,
      experience,
      education,
      skills,
      description,
      companyOverview,
      headcount,
      minCtcLpa,
      maxCtcLpa,
      feePercentage,
      status,
      location,
      noticePeriod
    },
    confidence,
    warning: warningMessage
  };
}
