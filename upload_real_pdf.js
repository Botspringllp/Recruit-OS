const fs = require('fs');
const path = require('path');

async function uploadRealPdf() {
  const pdfPath = path.resolve('docs/PRD/recruitos_v2.pdf');
  if (!fs.existsSync(pdfPath)) {
    console.error('File not found:', pdfPath);
    return;
  }

  const fileBuffer = fs.readFileSync(pdfPath);
  const blob = new Blob([fileBuffer], { type: 'application/pdf' });

  const formData = new FormData();
  formData.append('file', blob, 'recruitos_v2.pdf');

  console.log('Sending real PDF upload request to http://localhost:3000/api/candidates/import/parse ...');
  const res = await fetch('http://localhost:3000/api/candidates/import/parse', {
    method: 'POST',
    body: formData
  });

  console.log('Status Code:', res.status);
  const json = await res.json();
  console.log('\n--- API RESPONSE ---');
  console.log(JSON.stringify(json, null, 2));
}

uploadRealPdf().catch(err => console.error(err));
