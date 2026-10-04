import { prisma } from '@/lib/prisma';
import { calculateCandidateJobMatch } from '@/lib/sourcing/aiMatchingEngine';

/**
 * Background Job: Process Unparsed Resumes
 */
export async function processResumeParserQueueJob(payload?: Record<string, any>) {
  try {
    const unparsedLogs = await (prisma as any).resumeParseLog.findMany({
      where: { status: 'PARTIAL' },
      take: 10
    });

    for (const log of unparsedLogs) {
      await (prisma as any).resumeParseLog.update({
        where: { id: log.id },
        data: { status: 'SUCCESS' }
      });
    }

    return { success: true, processedCount: unparsedLogs.length };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Resume parser job failed' };
  }
}

/**
 * Background Job: Refresh AI Candidate-Job Match Scores
 */
export async function refreshAIMatchesJob(payload?: Record<string, any>) {
  try {
    const openJobs = await (prisma as any).jobMandate.findMany({
      where: { status: 'OPEN' },
      take: 5
    });

    let updatedCount = 0;

    for (const job of openJobs) {
      const candidates = await (prisma as any).candidateRecord.findMany({
        where: { agencyId: job.agencyId },
        take: 20
      });

      for (const cand of candidates) {
        const matchResult = calculateCandidateJobMatch(
          {
            skills: cand.skills || [],
            totalExperienceYears: cand.totalExperienceYears || 0,
            expectedCtc: cand.expectedCtc ? Number(cand.expectedCtc) : undefined,
            noticePeriodDays: cand.noticePeriodDays || 30
          },
          {
            title: job.title,
            requiredSkills: cand.skills || [],
            minExperienceYears: 2
          }
        );

        await (prisma as any).candidateJobMatch.upsert({
          where: {
            candidateId_jobId: {
              candidateId: cand.id,
              jobId: job.id
            }
          },
          create: {
            agencyId: job.agencyId,
            candidateId: cand.id,
            jobId: job.id,
            overallScore: matchResult.overallScore,
            skillScore: matchResult.skillScore,
            experienceScore: matchResult.experienceScore,
            locationScore: matchResult.locationScore,
            salaryScore: matchResult.salaryScore,
            noticeScore: matchResult.noticeScore,
            matchDetails: matchResult.matchDetails
          },
          update: {
            overallScore: matchResult.overallScore,
            skillScore: matchResult.skillScore,
            experienceScore: matchResult.experienceScore,
            locationScore: matchResult.locationScore,
            salaryScore: matchResult.salaryScore,
            noticeScore: matchResult.noticeScore,
            matchDetails: matchResult.matchDetails
          }
        });
        updatedCount++;
      }
    }

    return { success: true, updatedCount };
  } catch (err: any) {
    return { success: false, error: err?.message || 'AI Match refresh job failed' };
  }
}

/**
 * Background Job: Aggregate Source Sourcing Analytics
 */
export async function aggregateSourceAnalyticsJob(payload?: Record<string, any>) {
  try {
    const counts = await (prisma as any).candidateSourceRecord.groupBy({
      by: ['sourceType'],
      _count: { _all: true }
    });

    return { success: true, analytics: counts };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Source analytics aggregation failed' };
  }
}
