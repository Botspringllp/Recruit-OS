import mammoth from 'mammoth';

/**
 * Extracts raw textual content from uploaded PDF or DOCX file buffer.
 * Performs deep text cleaning to eliminate raw PDF binary artifacts (obj, stream, FlateDecode).
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

function sanitizePdfText(text: string): string {
  if (!text) return '';
  return text
    .replace(/%PDF-\d\.\d/g, '')
    .replace(/\d+\s+\d+\s+obj[\s\S]*?endobj/g, '')
    .replace(/stream[\s\S]*?endstream/g, '')
    .replace(/FlateDecode/g, '')
    .replace(/TypeCatalogPages/g, '')
    .replace(/<<[\s\S]*?>>/g, '')
    .replace(/[^\x20-\x7E\n\r\t]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
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
      if (cleaned.trim() && !cleaned.includes('obj') && !cleaned.includes('stream')) {
        textBlocks.push(cleaned.trim());
      }
    }
  }

  if (textBlocks.length > 0) {
    return textBlocks.join(' ');
  }

  // Pure printable ASCII filter fallback
  return sanitizePdfText(rawString);
}
