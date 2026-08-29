const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load env
const envPath = path.join(__dirname, '../.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  envContent.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
      const parts = trimmed.split('=');
      const key = parts[0].trim();
      let value = parts.slice(1).join('=').trim();
      if (value.startsWith('"') && value.endsWith('"')) {
        value = value.slice(1, -1);
      }
      process.env[key] = value;
    }
  });
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Missing Supabase env configuration');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function testStorage() {
  console.log('--- SUPABASE STORAGE INIT TEST ---');
  const buckets = ['resumes', 'compliance-docs', 'offer-documents'];

  for (const b of buckets) {
    const { data: existing, error: getErr } = await supabase.storage.getBucket(b);
    if (getErr || !existing) {
      console.log(`Creating bucket: ${b}...`);
      const { data, error } = await supabase.storage.createBucket(b, {
        public: true,
        fileSizeLimit: 10485760 // 10MB
      });
      if (error) {
        console.log(`Notice creating ${b}:`, error.message);
      } else {
        console.log(`✅ Bucket created: ${b}`);
      }
    } else {
      console.log(`✅ Bucket already exists: ${b}`);
    }
  }

  // Upload test file to compliance-docs bucket
  const testPath = `adaa404d-0ce3-4b72-9981-882a8f31a2af/test-cand-123/${Date.now()}_test_compliance.txt`;
  const fileContent = Buffer.from('RecruitOS Compliance Verification Document Test Content', 'utf-8');

  console.log(`Uploading test file to 'compliance-docs' bucket at path: ${testPath}...`);
  const { data: uploadData, error: uploadErr } = await supabase.storage
    .from('compliance-docs')
    .upload(testPath, fileContent, {
      contentType: 'text/plain',
      upsert: true
    });

  if (uploadErr) {
    console.error('❌ Upload error:', uploadErr.message);
    process.exit(1);
  }

  console.log('✅ Upload successful:', uploadData);

  const { data: urlData } = supabase.storage.from('compliance-docs').getPublicUrl(testPath);
  console.log('✅ Generated Public URL:', urlData.publicUrl);
}

testStorage().catch(err => {
  console.error('Test crashed:', err);
  process.exit(1);
});
