'use server';

import { extractResumeText } from '@/lib/parser/extractor';
import { parseJobMandateText, ExtractedMandateData } from '@/lib/parser/mandateParser';
import { getCurrentUser, requirePermission } from '@/lib/rbac';
import { logger } from '@/lib/logger';

export interface ParseMandateActionResult {
  success: boolean;
  data?: ExtractedMandateData;
  confidence?: Record<string, number>;
  warning?: string | null;
  error?: string;
}

export async function parseJobMandateAction(formData: FormData): Promise<ParseMandateActionResult> {
  try {
    const user = await getCurrentUser();
    await requirePermission('job.create', user);

    const file = formData.get('file') as File | null;
    if (!file) {
      return { success: false, error: 'No document file uploaded.' };
    }

    const fileSizeMb = file.size / (1024 * 1024);
    if (fileSizeMb > 20) {
      return { success: false, error: 'File size exceeds 20 MB limit. Please upload a smaller file.' };
    }

    const fileName = file.name || '';
    const mimeType = file.type || '';

    const validExtensions = ['.pdf', '.docx', '.doc'];
    const lowerName = fileName.toLowerCase();
    const isValidExtension = validExtensions.some(ext => lowerName.endsWith(ext));

    if (!isValidExtension) {
      return {
        success: false,
        error: 'Unsupported file format. Please upload a valid PDF (.pdf) or Word document (.docx, .doc).'
      };
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 1. Extract plain text from PDF / DOCX / DOC
    let extractedText = '';
    try {
      extractedText = await extractResumeText(buffer, mimeType, fileName);
    } catch (err: any) {
      logger.warn({ event: 'MANDATE_TEXT_EXTRACT_FAILED', fileName, error: err.message }, 'Text extraction failed');
      return {
        success: false,
        error: 'Unable to read mandate document. Please review file format or upload another file.'
      };
    }

    if (!extractedText || extractedText.trim().length < 10) {
      return {
        success: false,
        error: 'Unable to extract readable text from document. Please review manually.'
      };
    }

    // 2. Parse & extract job mandate fields using AI parser
    const parsedResult = await parseJobMandateText(extractedText);

    logger.info({
      event: 'MANDATE_PARSED_SUCCESS',
      fileName,
      extractedTitle: parsedResult.data.title,
      agencyId: user?.agencyId
    }, 'Successfully extracted job mandate details from document');

    return {
      success: true,
      data: parsedResult.data,
      confidence: parsedResult.confidence,
      warning: parsedResult.warning || null
    };
  } catch (error: any) {
    logger.error({ event: 'MANDATE_PARSING_ACTION_ERROR', error: error.message }, 'Failed to parse job mandate document');
    return {
      success: false,
      error: error.message || 'An unexpected error occurred while analyzing mandate document.'
    };
  }
}
