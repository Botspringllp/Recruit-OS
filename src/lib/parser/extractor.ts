import mammoth from 'mammoth';

/**
 * Extracts raw textual content from uploaded PDF or DOCX file buffer.
 * Supports pdf-parse v1, pdf-parse v2, mammoth for docx, and raw stream parsing fallback.
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
    try {
      const extractedText = await parsePdfBuffer(buffer);
      if (extractedText && extractedText.trim().length > 0) {
        return extractedText.trim();
      }
    } catch (error: any) {
      console.warn('PDF Primary Extractor Warning:', error.message);
    }

    // Fallback: raw stream buffer extraction
    const rawFallback = extractRawPdfText(buffer);
    if (rawFallback.trim().length > 0) {
      return rawFallback;
    }

    throw new Error('Unable to extract text from PDF resume.');
  }

  if (isDocx) {
    try {
      const result = await mammoth.extractRawText({ buffer });
      return result.value || '';
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

  // 1. Direct function export (pdf-parse v1.x)
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
      // Continue to class approach
    }
  }

  // 3. Class-based API (pdf-parse v2.x)
  const PDFParseClass = pdfModule?.PDFParse || pdfModule?.default?.PDFParse;
  if (typeof PDFParseClass === 'function') {
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
  }

  return '';
}

function extractRawPdfText(buffer: Buffer): string {
  const rawString = buffer.toString('utf-8');
  const textBlocks: string[] = [];
  const btMatches = rawString.match(/BT[\s\S]*?ET/g) || [];
  for (const block of btMatches) {
    const tjMatches = block.match(/\((.*?)\)\s*Tj/g) || block.match(/\[(.*?)\]\s*TJ/g) || [];
    for (const match of tjMatches) {
      const cleaned = match.replace(/^[(\[]|[)\\]*(?:Tj|TJ)$/g, '').replace(/\\([()])/g, '$1');
      if (cleaned.trim()) textBlocks.push(cleaned.trim());
    }
  }

  if (textBlocks.length > 0) {
    return textBlocks.join(' ');
  }

  return rawString.replace(/[^\x20-\x7E\n\r\t]/g, ' ').replace(/\s+/g, ' ').trim();
}
