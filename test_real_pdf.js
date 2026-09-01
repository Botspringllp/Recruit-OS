const fs = require('fs');
const path = require('path');
const { extractResumeText } = require('./src/lib/parser/extractor');
const { extractWithRegex } = require('./src/lib/parser/regex');
const { parseWithAI } = require('./src/lib/parser/aiParser');
const { mergeParsedOutputs } = require('./src/lib/parser/mergeEngine');

async function testPdf() {
  const filePath = 'C:\\Users\\divya\\Downloads\\Divyanshu_kumar_resume.pdf';
  if (!fs.existsSync(filePath)) {
    console.log('File not found:', filePath);
    return;
  }

  const buffer = fs.readFileSync(filePath);
  console.log('File size:', buffer.length, 'bytes');

  const rawText = await extractResumeText(buffer, 'application/pdf', 'Divyanshu_kumar_resume.pdf');
  console.log('--------------------------------------------------');
  console.log('RAW EXTRACTED TEXT LENGTH:', rawText.length);
  console.log('RAW EXTRACTED TEXT SAMPLE (first 500 chars):');
  console.log(rawText.slice(0, 500));
  console.log('--------------------------------------------------');

  const regexData = extractWithRegex(rawText);
  console.log('REGEX DATA:', regexData);

  const aiData = await parseWithAI(rawText, 'Divyanshu_kumar_resume.pdf');
  console.log('AI/STRUCTURAL DATA:', aiData);

  const merged = mergeParsedOutputs(regexData, aiData, 'Divyanshu_kumar_resume.pdf');
  console.log('--------------------------------------------------');
  console.log('FINAL MERGED CANDIDATE RECORD:');
  console.log(JSON.stringify(merged, null, 2));
  console.log('--------------------------------------------------');
}

testPdf();
