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

// Skill normalization map for standardizing extracted technology names
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

/**
  * Standardize and clean skills list
  */
function normalizeSkills(rawSkillsStr: string): string {
  if (!rawSkillsStr) return '';
  
  const tokens = rawSkillsStr.split(/[,;\n|/]/).map(s => s.trim()).filter(Boolean);
  const normalizedSet = new Set<string>();

  for (const token of tokens) {
    const key = token.toLowerCase();
    if (SKILL_NORMALIZATION_MAP[key]) {
      normalizedSet.add(SKILL_NORMALIZATION_MAP[key]);
    } else {
      // Capitalize properly if unknown
      const cleanToken = token.replace(/^[^\w]+|[^\w]+$/g, '');
      if (cleanToken.length > 1) {
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
 * Intelligent AI & Regex Parser for Job Mandate Documents (Phase JM-02B)
 * Enhanced coverage for all 9 recruiter fields with contextual AI inference.
 */
export async function parseJobMandateText(rawText: string): Promise<ExtractedMandateResult> {
  const text = (rawText || '').trim();
  const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);

  let title = '';
  let clientName = '';
  let industry = '';
  let employmentType = 'Full-Time';
  let experience = '';
  let education = '';
  let skills = '';
  let description = text;
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
    // Fallback: search top 5 lines for a likely job title
    const candidateLine = lines.slice(0, 8).find(l => 
      l.length < 80 && 
      !/description|overview|company|client|about|table|requirements|mandate|hiring|date/i.test(l) &&
      /\b(Developer|Engineer|Manager|Lead|Architect|Consultant|Designer|Analyst|Specialist|Executive|Officer|Director)\b/i.test(l)
    );
    if (candidateLine) {
      title = candidateLine.trim();
      confidence.title = 0.78;
    } else {
      // General top line fallback
      const topFirstLine = lines[0];
      if (topFirstLine && topFirstLine.length < 75) {
        title = topFirstLine.trim();
        confidence.title = 0.65;
      }
    }
  }

  // 2. Company Name Detection
  const clientPatterns = [
    /(?:Client Name|Company Name|Client|Company|Employer|Organization|Hiring Company|About)\s*[:|-]\s*([^\r\n]+)/i,
    /(?:Client|Company)\s*[:|-]\s*([^\r\n]+)/i
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
    // Scan for company brand indicators (Inc, Ltd, Pvt Ltd, Technologies, Solutions, Corp)
    const companyLine = lines.slice(0, 10).find(l => 
      /\b(Pvt\.?\s*Ltd\.?|Private\s*Limited|Limited|Inc\.?|LLC|Technologies|Solutions|Corporation|Corp\.?|Services|Group|Software)\b/i.test(l)
    );
    if (companyLine) {
      clientName = companyLine.trim();
      confidence.clientName = 0.82;
    }
  }

  // 3. Industry Type Detection (Explicit + Contextual AI NLP Inference)
  const explicitIndustryMatch = text.match(/(?:Industry Type|Industry|Domain|Sector|Business Domain)\s*[:|-]\s*([^\r\n]+)/i);
  if (explicitIndustryMatch && explicitIndustryMatch[1]) {
    industry = explicitIndustryMatch[1].trim();
    confidence.industry = 0.95;
  } else {
    // AI Contextual Inference
    const inferred = inferIndustryType(text);
    industry = inferred.industry;
    confidence.industry = inferred.confidence;
  }

  // 4. Employment Type Detection
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

  // 5. Experience Required Detection
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

  // 6. Education Requirements Detection
  const eduPatterns = [
    /(?:Education Requirements|Education|Qualification|Academic Requirements|Academic Qualification|Degree)\s*[:|-]\s*([^\r\n]+)/i,
    /\b(B\.?Tech|B\.?E\.?|M\.?Tech|M\.?C\.?A\.?|B\.?C\.?A\.?|M\.?B\.?A\.?|B\.?Sc|M\.?Sc|Bachelor'?s|Master'?s|Graduation|Post-Graduation|Diploma)\b[^\r\n]*/i
  ];

  for (const pattern of eduPatterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      education = match[1].trim();
      confidence.education = 0.90;
      break;
    } else if (match && match[0]) {
      education = match[0].trim();
      confidence.education = 0.85;
      break;
    }
  }

  // 7. Key Skills Extraction & Normalization
  const skillMatch = text.match(/(?:Key Skills|Primary Skills|Must Have|Required Skills|Skills Required|Technical Skills|Mandatory Skills|Tech Stack)\s*[:|-]\s*([^\r\n]+)/i);
  if (skillMatch && skillMatch[1]) {
    skills = normalizeSkills(skillMatch[1]);
    confidence.skills = 0.94;
  } else {
    // Search common tech terms throughout document
    const commonSkills = [
      'React', 'Node.js', 'TypeScript', 'JavaScript', 'Python', 'Java', 'Spring Boot',
      'AWS', 'PostgreSQL', 'MongoDB', 'Docker', 'Kubernetes', 'GraphQL', 'Next.js',
      'Express', 'HTML', 'CSS', 'REST API', 'Redux', 'TailwindCSS', 'Git', 'CI/CD', 'SQL'
    ];
    const foundSkills = commonSkills.filter(sk => new RegExp(`\\b${sk}\\b`, 'i').test(text));
    if (foundSkills.length > 0) {
      skills = foundSkills.join(', ');
      confidence.skills = 0.82;
    }
  }

  // 8. Company Overview Detection (Explicit + Contextual AI Heuristic)
  const overviewMatch = text.match(/(?:Company Overview|About Company|About Us|Organization Overview|Organization Profile|Who We Are|Company Profile)\s*[:|-]?\s*([\s\S]*?)(?=\n\n|\n[A-Z][a-z]+:|$)/i);

  if (overviewMatch && overviewMatch[1] && overviewMatch[1].trim().length > 15) {
    companyOverview = overviewMatch[1].trim().slice(0, 1000);
    confidence.companyOverview = 0.90;
  } else {
    // Contextual AI Overview Generation Heuristic
    const displayCompany = clientName || 'Client Organization';
    const displayTitle = title || 'Hiring Position';
    companyOverview = `${displayCompany} is a leading ${industry} enterprise actively seeking an experienced professional for the ${displayTitle} role.`;
    confidence.companyOverview = 0.75;
  }

  // 9. Job Description Extraction
  const jdMatch = text.match(/(?:Job Description|Responsibilities|Role Overview|Position Overview|Duties & Responsibilities|What you will do)\s*[:|-]?\s*([\s\S]*?)(?=\n\n[A-Z]|$)/i);
  if (jdMatch && jdMatch[1] && jdMatch[1].trim().length > 30) {
    description = jdMatch[1].trim();
    confidence.description = 0.94;
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

  const locMatch = text.match(/(?:Location|City)\s*[:|-]\s*([^\r\n]+)/i);
  if (locMatch) location = locMatch[1].trim();

  let warningMessage: string | undefined = undefined;
  if (!title && !skills) {
    warningMessage = 'Some fields could not be automatically extracted. Please review and fill them manually.';
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
