import fs from 'fs';
import path from 'path';
import { PrismaClient } from '@prisma/client';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

// Load environment variables from .env.local
const envPath = path.join(__dirname, '..', '.env.local');
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

if (!supabaseUrl || !serviceRoleKey) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local');
  process.exit(1);
}

const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

const prisma = new PrismaClient();

function genUuid() {
  return crypto.randomUUID();
}

async function execSql(name: string, sql: string) {
  try {
    await prisma.$executeRawUnsafe(sql);
  } catch (err: any) {
    console.error(`❌ Error executing ${name}:`, err?.message || err);
    throw err;
  }
}

async function main() {
  console.log('🚀 Starting RecruitOS Initial Platform Bootstrap Execution...');

  const founderEmail = 'admin@recruitos.local';
  const founderPassword = 'StrongPassword123!';

  // 1. Supabase Auth Founder User
  let authUserId = null;
  const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
  const foundUser = existingUsers?.users?.find((u: any) => u.email === founderEmail);

  if (foundUser) {
    authUserId = foundUser.id;
    console.log(`✅ Found existing Supabase Auth user: ${authUserId}`);
  } else {
    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email: founderEmail,
      password: founderPassword,
      email_confirm: true,
      user_metadata: {
        first_name: 'Admin',
        last_name: 'Founder',
        user_role: 'AGENCY_FOUNDER'
      }
    });

    if (createError) {
      console.error('❌ Failed to create Supabase Auth user:', createError.message);
      process.exit(1);
    }
    authUserId = newUser.user.id;
    console.log(`✅ Created Supabase Auth Founder user: ${authUserId}`);
  }

  // 2. Insert Agency
  let agencyId = genUuid();
  const existingAgencies = await prisma.$queryRawUnsafe<any[]>("SELECT agency_id FROM public.agencies WHERE subdomain = 'demo' LIMIT 1;");

  if (existingAgencies.length > 0) {
    agencyId = existingAgencies[0].agency_id;
    console.log(`✅ Found existing Agency: ${agencyId}`);
  } else {
    await execSql('Insert Agency', `
      INSERT INTO public.agencies (agency_id, name, subdomain, tier, status, created_at, updated_at)
      VALUES ('${agencyId}', 'RecruitOS Demo Agency', 'demo', 'ENTERPRISE'::agency_tier, 'ACTIVE', NOW(), NOW());
    `);
    console.log(`✅ Inserted 1 Agency: RecruitOS Demo Agency (${agencyId})`);
  }

  // Update Auth User Metadata with agency_id
  await supabaseAdmin.auth.admin.updateUserById(authUserId, {
    user_metadata: {
      agency_id: agencyId,
      first_name: 'Admin',
      last_name: 'Founder',
      user_role: 'AGENCY_FOUNDER'
    }
  });

  // 3. Insert Founder User in public.users
  const existingFounderUsers = await prisma.$queryRawUnsafe<any[]>(`SELECT user_id FROM public.users WHERE email = '${founderEmail}' LIMIT 1;`);
  let founderUserId = authUserId;

  if (existingFounderUsers.length === 0) {
    await execSql('Insert Founder User', `
      INSERT INTO public.users (user_id, agency_id, email, first_name, last_name, phone, is_active, created_at, updated_at)
      VALUES ('${authUserId}', '${agencyId}', '${founderEmail}', 'Admin', 'Founder', '+919876543210', true, NOW(), NOW());
    `);
    console.log(`✅ Inserted Founder User record in public.users`);
  }

  // Assign Founder Role in user_roles
  await execSql('Assign Founder Role', `
    INSERT INTO public.user_roles (role_id, user_id, agency_id, role, granted_at)
    VALUES ('${genUuid()}', '${founderUserId}', '${agencyId}', 'AGENCY_FOUNDER'::user_role, NOW())
    ON CONFLICT DO NOTHING;
  `);

  // 4. Insert 3 Recruiters
  const recruiterData = [
    { email: 'sarah@recruitos.local', firstName: 'Sarah', lastName: 'Sharma' },
    { email: 'rahul@recruitos.local', firstName: 'Rahul', lastName: 'Verma' },
    { email: 'priya@recruitos.local', firstName: 'Priya', lastName: 'Patel' }
  ];

  const recruiterUserIds = [founderUserId];
  for (const r of recruiterData) {
    let recId = genUuid();
    const existingRecs = await prisma.$queryRawUnsafe<any[]>(`SELECT user_id FROM public.users WHERE email = '${r.email}' LIMIT 1;`);
    if (existingRecs.length > 0) {
      recId = existingRecs[0].user_id;
    } else {
      await execSql(`Insert Recruiter ${r.email}`, `
        INSERT INTO public.users (user_id, agency_id, email, first_name, last_name, phone, is_active, created_at, updated_at)
        VALUES ('${recId}', '${agencyId}', '${r.email}', '${r.firstName}', '${r.lastName}', '+919800000000', true, NOW(), NOW());
      `);

      await execSql(`Assign Recruiter Role ${r.email}`, `
        INSERT INTO public.user_roles (role_id, user_id, agency_id, role, granted_at)
        VALUES ('${genUuid()}', '${recId}', '${agencyId}', 'RECRUITER'::user_role, NOW())
        ON CONFLICT DO NOTHING;
      `);
    }
    recruiterUserIds.push(recId);
  }
  console.log(`✅ Inserted 3 Recruiter Accounts (Roles = RECRUITER)`);

  // 5. Insert 5 Clients
  const clientData = [
    { name: 'Acme Corp Technologies', ind: 'SaaS / Enterprise Software', web: 'https://acmecorp.tech' },
    { name: 'FinTech Dynamics Global', ind: 'Financial Technology', web: 'https://fintechdynamics.com' },
    { name: 'HealthTech Solutions', ind: 'Healthcare Innovation', web: 'https://healthtechsol.com' },
    { name: 'Nexus CyberSystems', ind: 'Cybersecurity', web: 'https://nexuscyber.com' },
    { name: 'Aether Cloud Infrastructure', ind: 'Cloud & Infrastructure', web: 'https://aethercloud.io' }
  ];

  const clientIds: string[] = [];
  for (const c of clientData) {
    let clientId = genUuid();
    const existingClients = await prisma.$queryRawUnsafe<any[]>(`SELECT client_id FROM public.clients WHERE company_name = '${c.name}' AND agency_id = '${agencyId}' LIMIT 1;`);
    if (existingClients.length > 0) {
      clientId = existingClients[0].client_id;
    } else {
      await execSql(`Insert Client ${c.name}`, `
        INSERT INTO public.clients (client_id, agency_id, company_name, industry, website, created_at)
        VALUES ('${clientId}', '${agencyId}', '${c.name}', '${c.ind}', '${c.web}', NOW());
      `);
    }
    clientIds.push(clientId);
  }
  console.log(`✅ Inserted 5 Client Companies`);

  // 6. Insert 10 Job Mandates
  const mandateTitles = [
    { title: 'Senior Full Stack Engineer (Node + React)', minCtc: 24, maxCtc: 36, headcount: 3, status: 'ACTIVE' },
    { title: 'Lead DevOps & Cloud Platform Architect', minCtc: 35, maxCtc: 50, headcount: 1, status: 'ACTIVE' },
    { title: 'Staff AI / ML Infrastructure Engineer', minCtc: 40, maxCtc: 65, headcount: 2, status: 'ACTIVE' },
    { title: 'Principal Cybersecurity Specialist', minCtc: 30, maxCtc: 45, headcount: 2, status: 'ACTIVE' },
    { title: 'Senior Product Manager - Core Platform', minCtc: 28, maxCtc: 38, headcount: 1, status: 'OPEN' },
    { title: 'Backend Tech Lead (Golang / Microservices)', minCtc: 32, maxCtc: 48, headcount: 2, status: 'OPEN' },
    { title: 'Data Platform & Analytics Manager', minCtc: 26, maxCtc: 40, headcount: 1, status: 'ON_HOLD' },
    { title: 'Frontend Systems Lead (Next.js)', minCtc: 22, maxCtc: 34, headcount: 2, status: 'OPEN' },
    { title: 'Site Reliability Engineering Lead', minCtc: 30, maxCtc: 42, headcount: 1, status: 'ACTIVE' },
    { title: 'Director of Enterprise Engineering', minCtc: 60, maxCtc: 90, headcount: 1, status: 'OPEN' }
  ];

  const mandateIds: string[] = [];
  for (let i = 0; i < mandateTitles.length; i++) {
    const item = mandateTitles[i];
    const cid = clientIds[i % clientIds.length];

    let mid = genUuid();
    const existingMandates = await prisma.$queryRawUnsafe<any[]>(`SELECT mandate_id FROM public.job_mandates WHERE title = '${item.title}' AND agency_id = '${agencyId}' LIMIT 1;`);
    if (existingMandates.length > 0) {
      mid = existingMandates[0].mandate_id;
    } else {
      await execSql(`Insert Mandate ${item.title}`, `
        INSERT INTO public.job_mandates (mandate_id, agency_id, client_id, title, headcount, min_ctc_lpa, max_ctc_lpa, fee_percentage, status, created_at, updated_at)
        VALUES ('${mid}', '${agencyId}', '${cid}', '${item.title}', ${item.headcount}, ${item.minCtc}, ${item.maxCtc}, 8.33, '${item.status}'::mandate_status, NOW(), NOW());
      `);
    }
    mandateIds.push(mid);
  }
  console.log(`✅ Inserted 10 Job Mandates`);

  // 7. Insert 25 Candidate Records
  const firstNames = ['Aarav', 'Ananya', 'Rohan', 'Sneha', 'Vikram', 'Meera', 'Karan', 'Pooja', 'Aditya', 'Riya', 'Siddharth', 'Neha', 'Varun', 'Divya', 'Manish', 'Kavya', 'Deepak', 'Ishita', 'Gaurav', 'Tanvi', 'Nikhil', 'Simran', 'Amit', 'Priti', 'Rajesh'];
  const lastNames = ['Sharma', 'Verma', 'Patel', 'Gupta', 'Singh', 'Rao', 'Joshi', 'Mehta', 'Nair', 'Kumar', 'Reddy', 'Agarwal', 'Shah', 'Bhat', 'Deshmukh', 'Chopra', 'Malhotra', 'Srinivasan', 'Kapoor', 'Saxena', 'Pandey', 'Kulkarni', 'Bhasin', 'Trivedi', 'Dutta'];

  const candidateIds: string[] = [];
  for (let i = 0; i < 25; i++) {
    const fn = firstNames[i];
    const ln = lastNames[i];
    const email = `${fn.toLowerCase()}.${ln.toLowerCase()}@example.com`;

    let candidateId = genUuid();
    const existingCands = await prisma.$queryRawUnsafe<any[]>(`SELECT candidate_id FROM public.candidate_records WHERE email = '${email}' AND agency_id = '${agencyId}' LIMIT 1;`);
    if (existingCands.length > 0) {
      candidateId = existingCands[0].candidate_id;
    } else {
      await execSql(`Insert Candidate ${email}`, `
        INSERT INTO public.candidate_records (candidate_id, agency_id, first_name, last_name, email, phone, current_city, total_experience_years, current_ctc_lpa, expected_ctc_lpa, notice_period_days, status, created_at, updated_at)
        VALUES ('${candidateId}', '${agencyId}', '${fn}', '${ln}', '${email}', '+91910000${String(i).padStart(4, '0')}', 'Bengaluru', ${4 + (i%8)}, ${15 + (i%15)}, ${22 + (i%20)}, ${(i%3 === 0) ? 30 : 60}, 'NEW'::candidate_status, NOW(), NOW());
      `);
    }
    candidateIds.push(candidateId);
  }
  console.log(`✅ Inserted 25 Candidate Records`);

  // 8. Insert 50 Candidate Submissions
  const stages = ['SCREENED', 'SUBMITTED_TO_CLIENT', 'INTERVIEW_SCHEDULED', 'OFFER_EXTENDED', 'JOINED', 'REJECTED'];

  const submissionIds: string[] = [];
  for (let i = 0; i < 50; i++) {
    const mid = mandateIds[i % mandateIds.length];
    const cid = candidateIds[i % candidateIds.length];
    const stage = stages[i % stages.length];
    const slaStatus = (stage === 'SCREENED' && i % 4 === 0) ? 'WARNING' : ((stage === 'SCREENED' && i % 7 === 0) ? 'BREACHED' : 'ON_TRACK');

    let subId = genUuid();
    const existingSubs = await prisma.$queryRawUnsafe<any[]>(`SELECT submission_id FROM public.candidate_submissions WHERE mandate_id = '${mid}' AND candidate_id = '${cid}' AND agency_id = '${agencyId}' LIMIT 1;`);
    if (existingSubs.length > 0) {
      subId = existingSubs[0].submission_id;
    } else {
      await execSql(`Insert Submission ${i+1}`, `
        INSERT INTO public.candidate_submissions (submission_id, agency_id, mandate_id, candidate_id, stage, sla_status, created_at, updated_at)
        VALUES ('${subId}', '${agencyId}', '${mid}', '${cid}', '${stage}'::pipeline_stage, '${slaStatus}'::sla_status, NOW(), NOW());
      `);
    }
    submissionIds.push(subId);
  }
  console.log(`✅ Inserted 50 Candidate Submissions`);

  // 9. Insert 10 Interview Schedules
  for (let i = 0; i < 10; i++) {
    const subId = submissionIds[i];
    let intId = genUuid();
    const existingInts = await prisma.$queryRawUnsafe<any[]>(`SELECT interview_id FROM public.interview_schedules WHERE submission_id = '${subId}' LIMIT 1;`);
    if (existingInts.length === 0) {
      await execSql(`Insert Interview ${i+1}`, `
        INSERT INTO public.interview_schedules (interview_id, submission_id, agency_id, round_type, scheduled_at, meeting_link, mode, created_at)
        VALUES ('${intId}', '${subId}', '${agencyId}', 'CLIENT_ROUND_1'::interview_type, NOW(), 'https://meet.google.com/abc-defg-hij-${i}', 'GOOGLE_MEET'::interview_mode, NOW());
      `);
    }
  }
  console.log(`✅ Inserted 10 Interview Schedules`);

  console.log('\n🎉 INITIAL PLATFORM BOOTSTRAP COMPLETE!');
  console.log('==================================================');
  console.log(`Founder Email:    ${founderEmail}`);
  console.log(`Founder Password: ${founderPassword}`);
  console.log(`Agency Subdomain: demo`);
  console.log('==================================================');
}

main()
  .catch((err) => {
    console.error('❌ Fatal Seed Error:', err.message || err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
