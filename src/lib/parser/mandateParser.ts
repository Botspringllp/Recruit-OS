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

/**
 * Intelligent AI & Regex Parser for Job Mandate Documents (Phase JM-02)
 * Extracts recruiter-focused job requirements and computes confidence scores.
 * Guaranteed never to throw errors on missing or unextracted fields.
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
      warning: 'Unable to fully extract mandate details. Please review manually.'
    };
  }

  // 1. Extract Position Title
  const titlePatterns = [
    /(?:Job Title|Position Title|Position|Role|Requirement|Mandate Title|Designation)\s*[:|-]\s*([^\r\n]+)/i,
    /(?:Hiring for|Looking for|Title)\s*[:|-]?\s*([^\r\n]+)/i
  ];

  for (const pattern of titlePatterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      title = match[1].trim().replace(/^[^\w]+|[^\w]+$/g, '');
      confidence.title = 0.95;
      break;
    }
  }

  if (!title && lines.length > 0) {
    const candidateLine = lines.find(l => l.length < 80 && !/description|overview|company|client|about|table|requirements/i.test(l));
    if (candidateLine) {
      title = candidateLine.trim();
      confidence.title = 0.7;
    }
  }

  // 2. Extract Company Name / Client
  const clientPatterns = [
    /(?:Client Name|Company Name|Client|Company|Employer|Organization)\s*[:|-]\s*([^\r\n]+)/i,
    /(?:Hiring Company|Client Company|About)\s*[:|-]\s*([^\r\n]+)/i
  ];

  for (const pattern of clientPatterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      clientName = match[1].trim();
      confidence.clientName = 0.9;
      break;
    }
  }

  // 3. Extract Industry Type
  const industryPatterns = [
    /(?:Industry Type|Industry|Domain|Sector)\s*[:|-]\s*([^\r\n]+)/i,
    /\b(IT Services|Software Development|FinTech|BFSI|Healthcare|E-Commerce|EdTech|Retail|Manufacturing|Consulting|Automotive|Telecommunications|Logistics)\b/i
  ];

  for (const pattern of industryPatterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      industry = match[1].trim();
      confidence.industry = 0.88;
      break;
    }
  }

  // 4. Extract Employment Type
  const empTypePatterns = [
    /(?:Employment Type|Job Type|Work Type|Engagement Type)\s*[:|-]\s*([^\r\n]+)/i,
    /\b(Full-Time|Full Time|Permanent|Contract|Part-Time|Part Time|Remote|Hybrid|Freelance)\b/i
  ];

  for (const pattern of empTypePatterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      const val = match[1].trim();
      if (/contract/i.test(val)) employmentType = 'Contract';
      else if (/part/i.test(val)) employmentType = 'Part-Time';
      else if (/remote/i.test(val)) employmentType = 'Remote';
      else if (/hybrid/i.test(val)) employmentType = 'Hybrid';
      else employmentType = 'Full-Time';
      confidence.employmentType = 0.92;
      break;
    }
  }

  // 5. Extract Experience Required
  const expPatterns = [
    /(?:Experience Required|Experience|Exp|YOE|Years of Exp)\s*[:|-]\s*([^\r\n]+)/i,
    /(\d+)\s*(?:-|to|–)\s*(\d+)\s*(?:years|yrs)?/i,
    /(\d+)\+\s*(?:years|yrs)\s*(?:of)?\s*experience/i
  ];

  for (const pattern of expPatterns) {
    const match = text.match(pattern);
    if (match) {
      if (match[1] && match[2]) {
        experience = `${match[1]} - ${match[2]} Years`;
      } else if (match[1]) {
        experience = match[1].trim();
      }
      confidence.experience = 0.9;
      break;
    }
  }

  // 6. Extract Education Requirements
  const eduPatterns = [
    /(?:Education Requirements|Education|Qualification|Degree|Academic Background)\s*[:|-]\s*([^\r\n]+)/i,
    /\b(B\.?Tech|B\.?E\.?|M\.?Tech|M\.?C\.?A\.?|B\.?C\.?A\.?|M\.?B\.?A\.?|B\.?Sc|M\.?Sc|Bachelor'?s|Master'?s|PhD)\b/i
  ];

  for (const pattern of eduPatterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      education = match[1].trim();
      confidence.education = 0.88;
      break;
    }
  }

  // 7. Extract Key Skills
  const skillPatterns = [
    /(?:Key Skills|Primary Skills|Must Have|Required Skills|Skills Required|Technical Skills|Mandatory Skills|Skills)\s*[:|-]\s*([^\r\n]+)/i
  ];

  for (const pattern of skillPatterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      skills = match[1].trim();
      confidence.skills = 0.9;
      break;
    }
  }

  // 8. Extract Company Overview
  const overviewPatterns = [
    /(?:Company Overview|About Company|About Us|Organization Overview)\s*[:|-]?\s*([\s\S]*?)(?=\n\n|\n[A-Z][a-z]+:|$)/i
  ];

  for (const pattern of overviewPatterns) {
    const match = text.match(pattern);
    if (match && match[1] && match[1].trim().length > 15) {
      companyOverview = match[1].trim();
      confidence.companyOverview = 0.85;
      break;
    }
  }

  // 9. Extract Headcount & Budget (Advanced details)
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

  // Warning check
  let warningMessage: string | undefined = undefined;
  if (!title || !skills) {
    warningMessage = 'Unable to fully extract mandate details. Please review manually.';
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
