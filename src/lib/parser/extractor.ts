import mammoth from 'mammoth';
import path from 'path';
import { pathToFileURL } from 'url';

let workerConfigured = false;
function ensurePdfWorkerConfigured() {
  if (workerConfigured) return;
  try {
    const { PDFParse } = require('pdf-parse');
    const workerPath = path.join(process.cwd(), 'node_modules', 'pdf-parse', 'dist', 'worker', 'pdf.worker.mjs');
    const workerUrl = pathToFileURL(workerPath).href;
    PDFParse.setWorker(workerUrl);
    workerConfigured = true;
  } catch (e) {
    console.warn('PDF_WORKER_SETUP_FAILED:', e instanceof Error ? e.message : e);
  }
}

/**
 * Extracts raw textual content from uploaded PDF or DOCX file buffer.
 * Performs safe text cleaning without destroying extracted candidate details.
 */
export async function extractResumeText(
  buffer: Buffer,
  mimeType: string,
  fileName: string
): Promise<string> {
  const isPdf =
    mimeType === 'application/pdf' ||
    fileName.toLowerCase().endsWith('.pdf');

  const isDocx =
    mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    mimeType === 'application/msword' ||
    fileName.toLowerCase().endsWith('.docx') ||
    fileName.toLowerCase().endsWith('.doc');

  if (isPdf) {
    let extractedText = '';
    try {
      extractedText = await parsePdfBuffer(buffer);
      console.log('EXTRACTION_STAGE', { stage: 'parsePdfBuffer', length: extractedText.length });
    } catch (error: any) {
      console.warn('PDF Primary Extractor Warning:', error.message);
    }

    // Clean PDF extracted text safely
    let cleanedText = sanitizePdfText(extractedText);
    console.log('EXTRACTION_STAGE', { stage: 'sanitizePdfText', length: cleanedText.length });

    // If cleaned text is too short (< 20 chars), use stream text extractor fallback
    if (cleanedText.length < 20) {
      const rawFallback = extractPdfTextFromStreams(buffer);
      console.log('EXTRACTION_STAGE', { stage: 'extractPdfTextFromStreams', length: rawFallback.length });
      if (rawFallback.length > cleanedText.length) {
        cleanedText = rawFallback;
      }
    }

    console.log('EXTRACTION_STAGE', { stage: 'finalResult', length: cleanedText.length });

    if (cleanedText.length > 0) {
      return cleanedText;
    }

    throw new Error('Unable to extract readable text from PDF resume.');
  }

  if (isDocx) {
    try {
      const result = await mammoth.extractRawText({ buffer });
      return (result.value || '').trim();
    } catch (error: any) {
      throw new Error(`DOCX text extraction failed: ${error.message}`);
    }
  }

  throw new Error(
    'Unsupported file format. Please upload a valid PDF (.pdf) or Word document (.docx).'
  );
}

async function parsePdfBuffer(buffer: Buffer): Promise<string> {
  ensurePdfWorkerConfigured();
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const pdfModule = require('pdf-parse');

  // 1. Direct function export (pdf-parse v1)
  if (typeof pdfModule === 'function') {
    try {
      const res = await pdfModule(buffer);
      if (res?.text) return res.text;
    } catch (e: any) {
      console.warn('PDF_PARSE_STEP_FAILED (v1 function):', e instanceof Error ? e.message : e);
    }
  }

  // 2. Default function export
  if (typeof pdfModule?.default === 'function') {
    try {
      const res = await pdfModule.default(buffer);
      if (res?.text) return res.text;
    } catch (e: any) {
      console.warn('PDF_PARSE_STEP_FAILED (default function):', e instanceof Error ? e.message : e);
    }
  }

  // 3. Class-based API (pdf-parse v2)
  const PDFParseClass = pdfModule?.PDFParse || pdfModule?.default?.PDFParse;
  if (typeof PDFParseClass === 'function') {
    try {
      const parser = new PDFParseClass({ data: new Uint8Array(buffer) });
      const textResult = await parser.getText();
      if (typeof textResult === 'string') return textResult;
      if (textResult?.text) return textResult.text;
      if (Array.isArray(textResult?.pages)) {
        return textResult.pages.map((p: any) => p.text || '').join('\n');
      }
    } catch (e: any) {
      console.warn('PDF_PARSE_STEP_FAILED (v2 PDFParse class):', e instanceof Error ? e.message : e);
    }
  }

  return '';
}

export function sanitizePdfText(rawText: string): string {
  if (!rawText) return '';

  let cleaned = rawText;

  // 1. Strip PDF header, trailer, and xref markers line-by-line
  cleaned = cleaned.replace(/^%PDF-\d\.\d$/gm, '');
  cleaned = cleaned.replace(/^xref$/gm, '');
  cleaned = cleaned.replace(/^trailer$/gm, '');
  cleaned = cleaned.replace(/^startxref$/gm, '');
  cleaned = cleaned.replace(/^%%EOF$/gm, '');
  cleaned = cleaned.replace(/\b\d{10}\s+\d{5}\s+[fn]\b/g, '');

  // 2. Remove non-printable ASCII control characters (keep space, tab, newlines)
  cleaned = cleaned.replace(/[^\x20-\x7E\n\r\t]/g, ' ');

  // 3. Normalize horizontal whitespace line by line
  cleaned = cleaned
    .split(/\r?\n/)
    .map(line => line.replace(/[ \t]+/g, ' ').trim())
    .filter(Boolean)
    .join('\n');

  return cleaned;
}

function extractPdfTextFromStreams(buffer: Buffer): string {
  const rawString = buffer.toString('utf-8');
  const textBlocks: string[] = [];

  // Extract text within BT (Begin Text) and ET (End Text) pdf blocks
  const btMatches = rawString.match(/BT[\s\S]*?ET/g) || [];
  for (const block of btMatches) {
    const tjMatches = block.match(/\((.*?)\)\s*Tj/g) || block.match(/\[(.*?)\]\s*TJ/g) || [];
    for (const match of tjMatches) {
      const cleaned = match.replace(/^[(\[]|[)\\]*(?:Tj|TJ)$/g, '').replace(/\\([()])/g, '$1');
      if (cleaned.trim() && !cleaned.includes('obj') && !cleaned.includes('stream') && !cleaned.includes('xref')) {
        textBlocks.push(cleaned.trim());
      }
    }
  }

  if (textBlocks.length > 0) {
    return sanitizePdfText(textBlocks.join('\n'));
  }

  // Pure printable ASCII filter fallback
  return sanitizePdfText(rawString);
}
