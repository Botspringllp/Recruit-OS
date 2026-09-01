import { logger } from '@/lib/logger';
import { extractResumeText } from './extractor';
import { extractWithRegex } from './regex';
import { parseWithAI } from './aiParser';
import { mergeParsedOutputs } from './mergeEngine';
import { checkForDuplicateCandidate } from './duplicateDetector';
import { ParseResumeResult } from './types';

export * from './types';
export * from './extractor';
export * from './regex';
export * from './aiParser';
export * from './mergeEngine';
export * from './duplicateDetector';

/**
 * High-level orchestration function to parse an uploaded resume buffer.
 */
export async function parseResumeBuffer(
  buffer: Buffer,
  mimeType: string,
  fileName: string,
  agencyId: string,
  userId?: string
): Promise<ParseResumeResult> {
  logger.info({
    event: 'RESUME_UPLOADED',
    agencyId,
    userId,
    fileName,
    fileSizeBytes: buffer.length,
    mimeType
  });

  // 1. Text Extraction
  const rawText = await extractResumeText(buffer, mimeType, fileName);

  // 2. Deterministic Regex Parsing
  const regexData = extractWithRegex(rawText);

  // 3. AI LLM Extraction (with fileName context for accurate name resolution)
  const aiData = await parseWithAI(rawText, fileName);

  // 4. Merge Engine Synthesis
  const parsedCandidate = mergeParsedOutputs(regexData, aiData, fileName);

  logger.info({
    event: 'RESUME_PARSED',
    agencyId,
    userId,
    candidateName: `${parsedCandidate.firstName} ${parsedCandidate.lastName}`,
    email: parsedCandidate.email,
    skillsCount: parsedCandidate.skills.length,
    totalExperienceYears: parsedCandidate.totalExperienceYears
  });

  // 5. Multi-Tenant Duplicate Detection
  const duplicateMatch = await checkForDuplicateCandidate(agencyId, parsedCandidate);

  if (duplicateMatch) {
    logger.warn({
      event: 'DUPLICATE_DETECTED',
      agencyId,
      userId,
      duplicateCandidateId: duplicateMatch.id,
      email: duplicateMatch.email,
      matchedOn: duplicateMatch.matchedOn
    });
  }

  return {
    parsedCandidate,
    duplicateMatch,
    rawText
  };
}
