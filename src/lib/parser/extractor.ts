import mammoth from 'mammoth';

/**
 * Extracts raw textual content from uploaded PDF or DOCX file buffer.
 * Performs deep text cleaning to eliminate raw PDF binary artifacts (obj, stream, FlateDecode, xref, trailer).
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
    } catch (error: any) {
      console.warn('PDF Primary Extractor Warning:', error.message);
    }

    // Clean PDF extracted text
    let cleanedText = sanitizePdfText(extractedText);

    // If cleaned text is too short (< 30 chars) or contains binary markers, use stream text extractor
    if (cleanedText.length < 30 || cleanedText.includes('%PDF-') || cleanedText.includes('FlateDecode')) {
      const rawFallback = extractPdfTextFromStreams(buffer);
      if (rawFallback.length > cleanedText.length) {
        cleanedText = rawFallback;
      }
    }

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
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const pdfModule = require('pdf-parse');

  // 1. Direct function export (pdf-parse v1)
  if (typeof pdfModule === 'function') {
    const res = await pdfModule(buffer);
    if (res?.text) return res.text;
  }

  // 2. Default function export
  if (typeof pdfModule?.default === 'function') {
    try {
      const res = await pdfModule.default(buffer);
      if (res?.text) return res.text;
    } catch (e) {
      // Continue
    }
  }

  // 3. Class-based API (pdf-parse v2)
  const PDFParseClass = pdfModule?.PDFParse || pdfModule?.default?.PDFParse;
  if (typeof PDFParseClass === 'function') {
    try {
      const parser = new PDFParseClass({ data: new Uint8Array(buffer) });
      if (typeof parser.load === 'function') {
        await parser.load();
      }
      if (typeof parser.getText === 'function') {
        const textResult = await parser.getText();
        if (typeof textResult === 'string') return textResult;
        if (textResult?.text) return textResult.text;
        if (Array.isArray(textResult?.pages)) {
          return textResult.pages.map((p: any) => p.text || '').join('\n');
        }
      }
    } catch (e) {
      // Continue to fallback
    }
  }

  return '';
}

export function sanitizePdfText(rawText: string): string {
  if (!rawText) return '';

  let cleaned = rawText;

  // 1. Strip PDF xref tables and trailer blocks
  cleaned = cleaned.replace(/xref\s*[\r\n]+[\s\S]*?startxref[\s\S]*?EOF/gi, '');
  cleaned = cleaned.replace(/trailer\s*[\r\n]+[\s\S]*?startxref[\s\S]*?EOF/gi, '');
  cleaned = cleaned.replace(/startxref[\s\S]*?EOF/gi, '');

  // 2. Strip repeated PDF xref entry lines (e.g. "0000000000 65535 f", "f n f n f n")
  cleaned = cleaned.replace(/\b\d{10}\s+\d{5}\s+[fn]\b/gi, '');
  cleaned = cleaned.replace(/\b(f\s+|n\s+){3,}\b/gi, '');
  cleaned = cleaned.replace(/\b(xref|trailer|startxref|EOF)\b/gi, '');

  // 3. Strip PDF object stream tags
  cleaned = cleaned.replace(/%PDF-\d\.\d/g, '');
  cleaned = cleaned.replace(/\d+\s+\d+\s+obj[\s\S]*?endobj/g, '');
  cleaned = cleaned.replace(/stream[\s\S]*?endstream/g, '');
  cleaned = cleaned.replace(/(\d+\s+\d+\s+obj|endobj|FlateDecode|TypeCatalogPages)/gi, '');
  cleaned = cleaned.replace(/<<[\s\S]*?>>/g, '');

  // 4. Normalize excess whitespace & blank lines
  cleaned = cleaned.replace(/[^\x20-\x7E\n\r\t]/g, ' ');
  cleaned = cleaned.replace(/[ \t]+/g, ' ').replace(/\n\s*\n+/g, '\n').trim();

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
    return sanitizePdfText(textBlocks.join(' '));
  }

  // Pure printable ASCII filter fallback
  return sanitizePdfText(rawString);
}
