const fs = require('fs');
const path = require('path');

async function testExtractor() {
  const { extractResumeText } = require('../c/Users/divya/Desktop/Recruit-OS/src/lib/parser/extractor');
  const { parseWithAI, extractFallbackCandidate } = require('../c/Users/divya/Desktop/Recruit-OS/src/lib/parser/aiParser');

  const samplePdfPath = path.join(process.cwd(), 'docs', 'PRD', 'recruitos_v2.pdf');
  if (fs.existsSync(samplePdfPath)) {
    const buffer = fs.readFileSync(samplePdfPath);
    console.log('--- Testing PDF Extractor on PRD pdf ---');
    const text = await extractResumeText(buffer, 'application/pdf', 'recruitos_v2.pdf');
    console.log('Extracted Length:', text.length);
    console.log('Sample Text (first 500 chars):');
    console.log(text.slice(0, 500));
    console.log('\n--- Testing Fallback Extractor ---');
    const fallback = extractFallbackCandidate(text);
    console.log('Parsed Fallback Result:', fallback);
  } else {
    console.log('Sample PDF path does not exist');
  }
}

testExtractor().catch(err => console.error(err));
