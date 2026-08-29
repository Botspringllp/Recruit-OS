const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');
const { createClient } = require('@supabase/supabase-js');

// Load environment variables
const envPath = path.join(__dirname, '.env.local');
if (fs.existsSync(envPath)) {
  const envConfig = fs.readFileSync(envPath, 'utf-8');
  envConfig.split('\n').forEach(line => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      let value = match[2].trim();
      if (value.startsWith('"') && value.endsWith('"')) {
        value = value.substring(1, value.length - 1);
      }
      process.env[key] = value;
    }
  });
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

const prisma = new PrismaClient();

async function main() {
  console.log('==================================================');
  console.log('📊 RECRUITOS PLATFORM BOOTSTRAP VERIFICATION REPORT');
  console.log('==================================================');

  // 1. Supabase Auth Users Count
  const { data: authUsers } = await supabaseAdmin.auth.admin.listUsers();
  console.log(`Supabase Auth Users Count: ${authUsers?.users?.length || 0}`);
  const founderAuth = authUsers?.users?.find(u => u.email === 'admin@recruitos.local');
  console.log(`Founder Auth Email:        ${founderAuth ? founderAuth.email : 'NOT FOUND'}`);
  console.log(`Founder User Metadata:     ${JSON.stringify(founderAuth ? founderAuth.user_metadata : {})}`);
  console.log('');

  // 2. Table Counts
  const tables = [
    { name: 'agencies', sql: 'SELECT count(*)::int as count FROM public.agencies;' },
    { name: 'users', sql: 'SELECT count(*)::int as count FROM public.users;' },
    { name: 'user_roles', sql: 'SELECT count(*)::int as count FROM public.user_roles;' },
    { name: 'clients', sql: 'SELECT count(*)::int as count FROM public.clients;' },
    { name: 'job_mandates', sql: 'SELECT count(*)::int as count FROM public.job_mandates;' },
    { name: 'candidate_records', sql: 'SELECT count(*)::int as count FROM public.candidate_records;' },
    { name: 'candidate_submissions', sql: 'SELECT count(*)::int as count FROM public.candidate_submissions;' },
    { name: 'interview_schedules', sql: 'SELECT count(*)::int as count FROM public.interview_schedules;' }
  ];

  for (const t of tables) {
    const res = await prisma.$queryRawUnsafe(t.sql);
    console.log(`Table '${t.name}': ${res[0].count} rows`);
  }

  console.log('==================================================');
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });
