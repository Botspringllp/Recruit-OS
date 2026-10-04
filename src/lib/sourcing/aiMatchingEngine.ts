export interface AIMatchScoreResult {
  overallScore: number;
  skillScore: number;
  experienceScore: number;
  locationScore: number;
  salaryScore: number;
  noticeScore: number;
  matchDetails: {
    matchedSkills: string[];
    missingSkills: string[];
    experienceRatio: string;
    salaryFit: string;
    locationFit: string;
    noticeFit: string;
  };
}

export interface CandidateMatchInput {
  skills: string[];
  totalExperienceYears: number;
  expectedCtc?: number; // In INR or LPA
  preferredLocation?: string;
  noticePeriodDays?: number;
}

export interface JobMatchCriteria {
  title: string;
  requiredSkills: string[];
  minExperienceYears?: number;
  maxExperienceYears?: number;
  maxCtcLpa?: number; // In LPA
  workLocation?: string;
  maxNoticePeriodDays?: number;
}

/**
 * Enterprise AI Candidate-Job Matching Engine (PART H)
 */
export function calculateCandidateJobMatch(
  candidate: CandidateMatchInput,
  job: JobMatchCriteria
): AIMatchScoreResult {
  // 1. Skill Match (40% Weight)
  const reqSkills = job.requiredSkills.map((s) => s.toLowerCase());
  const candSkills = candidate.skills.map((s) => s.toLowerCase());

  let matchedSkillsCount = 0;
  const matchedSkills: string[] = [];
  const missingSkills: string[] = [];

  if (reqSkills.length > 0) {
    reqSkills.forEach((req) => {
      if (candSkills.some((c) => c.includes(req) || req.includes(c))) {
        matchedSkillsCount++;
        matchedSkills.push(req);
      } else {
        missingSkills.push(req);
      }
    });
  } else {
    matchedSkillsCount = 1;
  }

  const skillScore = reqSkills.length > 0
    ? Math.round((matchedSkillsCount / reqSkills.length) * 100)
    : 85;

  // 2. Experience Match (25% Weight)
  const minExp = job.minExperienceYears || 2;
  const candExp = candidate.totalExperienceYears || 0;
  let experienceScore = 100;

  if (candExp < minExp) {
    const diff = minExp - candExp;
    experienceScore = Math.max(40, 100 - diff * 20);
  } else if (candExp > minExp + 5) {
    experienceScore = 90; // Slightly overqualified
  }

  // 3. Location Match (15% Weight)
  let locationScore = 100;
  const jobLoc = (job.workLocation || '').toLowerCase();
  const candLoc = (candidate.preferredLocation || '').toLowerCase();

  if (jobLoc.includes('remote') || candLoc.includes('remote') || !jobLoc) {
    locationScore = 100;
  } else if (jobLoc && candLoc && !jobLoc.includes(candLoc) && !candLoc.includes(jobLoc)) {
    locationScore = 70; // Relocation or different city
  }

  // 4. Salary Match (10% Weight)
  let salaryScore = 90;
  const maxBudgetLpa = job.maxCtcLpa || 25;
  const expectedLpa = candidate.expectedCtc ? (candidate.expectedCtc > 100000 ? candidate.expectedCtc / 100000 : candidate.expectedCtc) : 18;

  if (expectedLpa <= maxBudgetLpa) {
    salaryScore = 100;
  } else {
    const overBudgetPercent = ((expectedLpa - maxBudgetLpa) / maxBudgetLpa) * 100;
    salaryScore = Math.max(30, Math.round(100 - overBudgetPercent * 2));
  }

  // 5. Notice Period Match (10% Weight)
  let noticeScore = 90;
  const maxNotice = job.maxNoticePeriodDays || 60;
  const candNotice = candidate.noticePeriodDays || 30;

  if (candNotice <= maxNotice) {
    noticeScore = 100;
  } else {
    noticeScore = Math.max(50, 100 - (candNotice - maxNotice));
  }

  // Weighted Overall Score Formula
  const overallScore = Math.round(
    skillScore * 0.40 +
    experienceScore * 0.25 +
    locationScore * 0.15 +
    salaryScore * 0.10 +
    noticeScore * 0.10
  );

  return {
    overallScore,
    skillScore,
    experienceScore,
    locationScore,
    salaryScore,
    noticeScore,
    matchDetails: {
      matchedSkills,
      missingSkills,
      experienceRatio: `${candExp} Yrs vs ${minExp}+ Yrs Required`,
      salaryFit: expectedLpa <= maxBudgetLpa ? 'Within Budget' : `Above Budget by ₹${(expectedLpa - maxBudgetLpa).toFixed(1)} LPA`,
      locationFit: locationScore === 100 ? 'Exact / Remote Fit' : 'Location Preference Gap',
      noticeFit: candNotice <= maxNotice ? 'Immediate / Within Limits' : `${candNotice} Days Notice`
    }
  };
}
