import mammoth from 'mammoth';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const pdfParse = require('pdf-parse');

/**
 * Extracts raw textual content from uploaded PDF or DOCX file buffer
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
      const parsed = await pdfParse(buffer);
      return parsed.text || '';
    } catch (error: any) {
      throw new Error(`PDF text extraction failed: ${error.message}`);
    }
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
