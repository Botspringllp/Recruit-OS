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

/**
 * Standardize and clean extracted skills without inventing unmentioned skills
 */
function normalizeSkills(rawSkillsStr: string): string {
  if (!rawSkillsStr) return '';
  
  const tokens = rawSkillsStr.split(/[,;\n|/•\t]/).map(s => s.trim()).filter(Boolean);
  const normalizedSet = new Set<string>();

  for (const token of tokens) {
    const key = token.toLowerCase();
    if (SKILL_NORMALIZATION_MAP[key]) {
      normalizedSet.add(SKILL_NORMALIZATION_MAP[key]);
    } else {
      const cleanToken = token.replace(/^[^\w]+|[^\w]+$/g, '');
      if (cleanToken.length >= 2 && !/^(and|or|with|the|in|for|to|of|on|a|an)$/i.test(cleanToken)) {
        normalizedSet.add(cleanToken);
      }
    }
  }

  return Array.from(normalizedSet).join(', ');
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
 * High-Precision AI & Regex Parser for Job Mandates
 * Enhanced focus on exact Skills, Qualification/Education, bounded Job Description, and Location.
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

  if (!text) {
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

  // 1. Position Title Detection
  const titlePatterns = [
    /(?:Job Title|Position Title|Position|Role|Requirement Title|Mandate Title|Designation)\s*[:|-]\s*([^\r\n]+)/i,
    /(?:Hiring for|Looking for|Role Overview|Opening for)\s*[:|-]?\s*([^\r\n]+)/i
  ];

  for (const pattern of titlePatterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      title = match[1].trim().replace(/^[^\w]+|[^\w]+$/g, '');
      confidence.title = 0.96;
      break;
    }
  }

  if (!title && lines.length > 0) {
    const candidateLine = lines.slice(0, 8).find(l => 
      l.length < 80 && 
      !/description|overview|company|client|about|table|requirements|mandate|hiring|date/i.test(l) &&
      /\b(Developer|Engineer|Manager|Lead|Architect|Consultant|Designer|Analyst|Specialist|Executive|Officer|Director)\b/i.test(l)
    );
    if (candidateLine) {
      title = candidateLine.trim();
      confidence.title = 0.78;
    } else {
      const topFirstLine = lines[0];
      if (topFirstLine && topFirstLine.length < 75) {
        title = topFirstLine.trim();
        confidence.title = 0.65;
      }
    }
  }

  // 2. Company Name Detection
  const clientPatterns = [
    /(?:Client Name|Company Name|Client|Company|Employer|Organization|Hiring Company)\s*[:|-]\s*([^\r\n]+)/i,
    /(?:Hiring Client|About Us|Company Profile)\s*[:|-]\s*([^\r\n]+)/i
  ];

  for (const pattern of clientPatterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      clientName = match[1].trim().replace(/^[^\w]+|[^\w]+$/g, '');
      confidence.clientName = 0.94;
      break;
    }
  }

  if (!clientName) {
    const companyLine = lines.slice(0, 10).find(l => 
      /\b(Pvt\.?\s*Ltd\.?|Private\s*Limited|Limited|Inc\.?|LLC|Technologies|Solutions|Corporation|Corp\.?|Services|Group|Software)\b/i.test(l)
    );
    if (companyLine) {
      clientName = companyLine.trim();
      confidence.clientName = 0.82;
    }
  }

  // 3. Location Detection
  const locPatterns = [
    /(?:Location|Job Location|Work Location|Base Location|City|Place of Posting|Posting Location)\s*[:|-]\s*([^\r\n]+)/i,
    /\b(Bangalore|Bengaluru|Mumbai|Delhi|NCR|Gurgaon|Gurugram|Noida|Hyderabad|Pune|Chennai|Kolkata|Ahmedabad|Remote|Hybrid)\b/i
  ];

  for (const pattern of locPatterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      location = match[1].trim();
      confidence.location = 0.92;
      break;
    } else if (match && match[0]) {
      location = match[0].trim();
      confidence.location = 0.85;
      break;
    }
  }

  // 4. Industry Type Detection (Explicit + Contextual AI NLP Inference)
  const explicitIndustryMatch = text.match(/(?:Industry Type|Industry|Domain|Sector|Business Domain)\s*[:|-]\s*([^\r\n]+)/i);
  if (explicitIndustryMatch && explicitIndustryMatch[1]) {
    industry = explicitIndustryMatch[1].trim();
    confidence.industry = 0.95;
  } else {
    const inferred = inferIndustryType(text);
    industry = inferred.industry;
    confidence.industry = inferred.confidence;
  }

  // 5. Employment Type Detection
  const empTypeMatch = text.match(/(?:Employment Type|Job Type|Work Type|Engagement Type)\s*[:|-]\s*([^\r\n]+)/i);
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

  // 6. Experience Required Detection
  const expMatch = text.match(/(?:Experience Required|Experience|Relevant Experience|Exp|YOE|Years of Exp)\s*[:|-]\s*([^\r\n]+)/i) ||
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

  // 7. HIGH-PRECISION EDUCATION / QUALIFICATION EXTRACTION
  const eduHeaderMatch = text.match(/(?:Education Requirements|Education|Qualifications?|Academic Requirements|Academic Qualification|Degree|Eligibility)\s*[:|-]\s*([^\r\n]+)/i);

  if (eduHeaderMatch && eduHeaderMatch[1]) {
    education = eduHeaderMatch[1].trim();
    confidence.education = 0.95;
  } else {
    // Search explicit degree mentions without inventing
    const eduDegreeMatch = text.match(/\b(B\.?Tech|B\.?E\.?|M\.?Tech|M\.?C\.?A\.?|B\.?C\.?A\.?|M\.?B\.?A\.?|B\.?Sc|M\.?Sc|Bachelor'?s(?:\s+degree)?|Master'?s(?:\s+degree)?|Graduation|Post-Graduation|Diploma|Ph\.?D)\b[^\r\n]*/i);
    if (eduDegreeMatch && eduDegreeMatch[0]) {
      education = eduDegreeMatch[0].trim();
      confidence.education = 0.88;
    }
  }

  // 8. STRICT & HIGH-PRECISION SKILLS EXTRACTION (NO HALLUCINATION)
  const explicitSkillHeaderMatch = text.match(/(?:Key Skills|Primary Skills|Must Have Skills|Required Skills|Skills Required|Technical Skills|Mandatory Skills|Tech Stack|Tools & Technologies|Technologies|Competencies|Skill Requirements|Core Skills|Skill Set)\s*[:|-]?\s*([^\r\n]+(?:\n[•\-\*].+)*)/i);

  if (explicitSkillHeaderMatch && explicitSkillHeaderMatch[1]) {
    skills = normalizeSkills(explicitSkillHeaderMatch[1]);
    confidence.skills = 0.96;
  } else {
    // Exact matching against known skills dictionary present in document
    const presentSkills = KNOWN_SKILLS_DICTIONARY.filter(sk => 
      new RegExp(`\\b${sk.replace('.', '\\.')}\\b`, 'i').test(text)
    );
    if (presentSkills.length > 0) {
      skills = presentSkills.join(', ');
      confidence.skills = 0.88;
    } else {
      // Leave blank if no skills mentioned in PDF! Do NOT invent skills!
      skills = '';
      confidence.skills = 0.0;
    }
  }

  // 9. BOUNDED JOB DESCRIPTION EXTRACTION (NOT THE FULL DOCUMENT)
  const jdSectionMatch = text.match(/(?:Job Description|Responsibilities|Roles & Responsibilities|Key Responsibilities|Duties & Responsibilities|What you will do|Key Deliverables)\s*[:|-]?\s*([\s\S]*?)(?=\n\n(?:About Company|About Us|Company Overview|Key Skills|Skills|Education|Qualifications|Compensation|Salary|Location|How to Apply|Contact)|$)/i);

  if (jdSectionMatch && jdSectionMatch[1] && jdSectionMatch[1].trim().length > 20) {
    description = jdSectionMatch[1].trim().slice(0, 1500);
    confidence.description = 0.94;
  } else {
    // Extract max 3-4 bullet lines or paragraphs instead of full PDF dump
    const bulletLines = lines.filter(l => /^[•\-\*]/.test(l) || /responsib|develop|build|manage|lead|create|design/i.test(l));
    if (bulletLines.length > 0) {
      description = bulletLines.slice(0, 6).join('\n');
      confidence.description = 0.75;
    } else {
      description = lines.slice(0, 5).join('\n');
      confidence.description = 0.65;
    }
  }

  // 10. Company Overview Detection
  const overviewMatch = text.match(/(?:Company Overview|About Company|About Us|Organization Overview|Organization Profile|Who We Are|Company Profile)\s*[:|-]?\s*([\s\S]*?)(?=\n\n|\n[A-Z][a-z]+:|$)/i);

  if (overviewMatch && overviewMatch[1] && overviewMatch[1].trim().length > 15) {
    companyOverview = overviewMatch[1].trim().slice(0, 800);
    confidence.companyOverview = 0.90;
  } else {
    const displayCompany = clientName || 'Client Organization';
    const displayTitle = title || 'Hiring Position';
    companyOverview = `${displayCompany} is a leading ${industry} enterprise hiring for the ${displayTitle} role.`;
    confidence.companyOverview = 0.75;
  }

  // Advanced details
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
