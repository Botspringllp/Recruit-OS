const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');
const { createClient } = require('@supabase/supabase-js');

// Load environment variables from .env.local if available
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
  console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in environment');
  process.exit(1);
}

const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

const prisma = new PrismaClient();

async function main() {
  console.log('🚀 Starting RecruitOS Platform Seed Execution (Prisma Client API)...');

  const founderEmail = 'admin@recruitos.local';
  const founderPassword = 'StrongPassword123!';

  // 1. Supabase Auth Founder User
  let authUserId = null;
  const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
  const foundUser = existingUsers?.users?.find(u => u.email === founderEmail);

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

  // 2. Demo Agency
  let agency = await prisma.agency.findFirst({
    where: { subdomain: 'demo' }
  });

  if (!agency) {
    agency = await prisma.agency.create({
      data: {
        name: 'RecruitOS Demo Agency',
        subdomain: 'demo',
        status: 'ACTIVE',
        subscriptionTier: 'ENTERPRISE'
      }
    });
    console.log(`✅ Created Demo Agency: RecruitOS Demo Agency (${agency.id})`);
  } else {
    console.log(`✅ Found existing Demo Agency: (${agency.id})`);
  }

  // Update Auth User Metadata with agency_id
  await supabaseAdmin.auth.admin.updateUserById(authUserId, {
    user_metadata: {
      agency_id: agency.id,
      first_name: 'Admin',
      last_name: 'Founder',
      user_role: 'AGENCY_FOUNDER'
    }
  });

  // 3. Founder User in Prisma
  let founderUser = await prisma.user.findFirst({
    where: { email: founderEmail }
  });

  if (!founderUser) {
    founderUser = await prisma.user.create({
      data: {
        id: authUserId,
        agencyId: agency.id,
        email: founderEmail,
        passwordHash: '$2b$10$hashedpasswordplaceholder',
        firstName: 'Admin',
        lastName: 'Founder',
        phone: '+919876543210',
        role: 'AGENCY_FOUNDER',
        status: 'ACTIVE',
        isActive: true
      }
    });
    console.log(`✅ Created Founder User record in DB`);
  } else {
    console.log(`✅ Found existing Founder User record`);
  }

  // Role Assignment for Founder
  const existingFounderRole = await prisma.userRoleAssignment.findFirst({
    where: { userId: founderUser.id, roleName: 'AGENCY_FOUNDER' }
  });
  if (!existingFounderRole) {
    await prisma.userRoleAssignment.create({
      data: {
        agencyId: agency.id,
        userId: founderUser.id,
        roleName: 'AGENCY_FOUNDER'
      }
    });
  }

  // 4. Recruiters
  const recruiterData = [
    { email: 'sarah@recruitos.local', firstName: 'Sarah', lastName: 'Sharma' },
    { email: 'rahul@recruitos.local', firstName: 'Rahul', lastName: 'Verma' },
    { email: 'priya@recruitos.local', firstName: 'Priya', lastName: 'Patel' }
  ];

  const recruiterUserIds = [founderUser.id];
  for (const r of recruiterData) {
    let recUser = await prisma.user.findFirst({
      where: { email: r.email }
    });

    if (!recUser) {
      recUser = await prisma.user.create({
        data: {
          agencyId: agency.id,
          email: r.email,
          passwordHash: '$2b$10$hashedpasswordplaceholder',
          firstName: r.firstName,
          lastName: r.lastName,
          phone: '+919800000000',
          role: 'RECRUITER',
          status: 'ACTIVE',
          isActive: true
        }
      });
    }

    const existingRole = await prisma.userRoleAssignment.findFirst({
      where: { userId: recUser.id, roleName: 'RECRUITER' }
    });
    if (!existingRole) {
      await prisma.userRoleAssignment.create({
        data: {
          agencyId: agency.id,
          userId: recUser.id,
          roleName: 'RECRUITER'
        }
      });
    }

    recruiterUserIds.push(recUser.id);
  }
  console.log(`✅ Created/Verified 3 Recruiter Accounts`);

  // 5. Clients
  const clientData = [
    { name: 'Acme Corp Technologies', ind: 'SaaS / Enterprise Software', web: 'https://acmecorp.tech' },
    { name: 'FinTech Dynamics Global', ind: 'Financial Technology', web: 'https://fintechdynamics.com' },
    { name: 'HealthTech Solutions', ind: 'Healthcare Innovation', web: 'https://healthtechsol.com' },
    { name: 'Nexus CyberSystems', ind: 'Cybersecurity', web: 'https://nexuscyber.com' },
    { name: 'Aether Cloud Infrastructure', ind: 'Cloud & Infrastructure', web: 'https://aethercloud.io' }
  ];

  const clientIds = [];
  for (const c of clientData) {
    let clientRecord = await prisma.client.findFirst({
      where: { agencyId: agency.id, companyName: c.name }
    });

    if (!clientRecord) {
      clientRecord = await prisma.client.create({
        data: {
          agencyId: agency.id,
          companyName: c.name,
          industry: c.ind,
          website: c.web,
          standardFeePercentage: 8.33,
          paymentTermsDays: 30,
          status: 'ACTIVE'
        }
      });
    }
    clientIds.push(clientRecord.id);
  }
  console.log(`✅ Created/Verified 5 Client Companies`);

  // 6. Job Mandates
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

  const mandateIds = [];
  for (let i = 0; i < mandateTitles.length; i++) {
    const item = mandateTitles[i];
    const cid = clientIds[i % clientIds.length];

    let mandate = await prisma.jobMandate.findFirst({
      where: { agencyId: agency.id, title: item.title }
    });

    if (!mandate) {
      mandate = await prisma.jobMandate.create({
        data: {
          agencyId: agency.id,
          clientId: cid,
          title: item.title,
          headcount: item.headcount,
          minCtcLpa: item.minCtc,
          maxCtcLpa: item.maxCtc,
          feePercentage: 8.33,
          status: item.status
        }
      });
    }
    mandateIds.push(mandate.id);
  }
  console.log(`✅ Created/Verified 10 Job Mandates`);

  // 7. Candidate Records
  const firstNames = ['Aarav', 'Ananya', 'Rohan', 'Sneha', 'Vikram', 'Meera', 'Karan', 'Pooja', 'Aditya', 'Riya', 'Siddharth', 'Neha', 'Varun', 'Divya', 'Manish', 'Kavya', 'Deepak', 'Ishita', 'Gaurav', 'Tanvi', 'Nikhil', 'Simran', 'Amit', 'Priti', 'Rajesh'];
  const lastNames = ['Sharma', 'Verma', 'Patel', 'Gupta', 'Singh', 'Rao', 'Joshi', 'Mehta', 'Nair', 'Kumar', 'Reddy', 'Agarwal', 'Shah', 'Bhat', 'Deshmukh', 'Chopra', 'Malhotra', 'Srinivasan', 'Kapoor', 'Saxena', 'Pandey', 'Kulkarni', 'Bhasin', 'Trivedi', 'Dutta'];

  const candidateIds = [];
  for (let i = 0; i < 25; i++) {
    const fn = firstNames[i];
    const ln = lastNames[i];
    const email = `${fn.toLowerCase()}.${ln.toLowerCase()}@example.com`;
    const phone = `+91910000${String(i).padStart(4, '0')}`;

    let candidate = await prisma.candidateRecord.findFirst({
      where: { agencyId: agency.id, email }
    });

    if (!candidate) {
      candidate = await prisma.candidateRecord.create({
        data: {
          agencyId: agency.id,
          assignedRecruiterId: recruiterUserIds[i % recruiterUserIds.length],
          firstName: fn,
          lastName: ln,
          email,
          phone,
          currentCompany: 'Tech Corp',
          currentDesignation: 'Senior Software Engineer',
          totalExperienceYears: 4 + (i % 8),
          noticePeriodDays: (i % 3 === 0) ? 30 : 60,
          currentCtcLpa: 15 + (i % 15),
          expectedCtcLpa: 22 + (i % 20),
          currentLocation: 'Bengaluru',
          preferredLocations: ['Bengaluru', 'Remote'],
          primarySkills: ['TypeScript', 'React', 'Node.js'],
          source: 'DIRECT_INTAKE',
          ownershipStatus: 'ACTIVE'
        }
      });
    }
    candidateIds.push(candidate.id);
  }
  console.log(`✅ Created/Verified 25 Candidate Records`);

  // 8. Candidate Submissions
  const stages = ['SCREENED', 'SUBMITTED_TO_CLIENT', 'INTERVIEW_SCHEDULED', 'OFFER_EXTENDED', 'JOINED', 'REJECTED'];

  const submissionIds = [];
  for (let i = 0; i < 50; i++) {
    const mid = mandateIds[i % mandateIds.length];
    const cid = candidateIds[i % candidateIds.length];
    const stage = stages[i % stages.length];
    const slaStatus = (stage === 'SCREENED' && i % 4 === 0) ? 'WARNING' : ((stage === 'SCREENED' && i % 7 === 0) ? 'BREACHED' : 'ON_TRACK');

    let sub = await prisma.candidateSubmission.findFirst({
      where: { agencyId: agency.id, jobId: mid, candidateId: cid }
    });

    if (!sub) {
      sub = await prisma.candidateSubmission.create({
        data: {
          agencyId: agency.id,
          jobId: mid,
          candidateId: cid,
          stage,
          slaStatus
        }
      });
    }
    submissionIds.push(sub.id);
  }
  console.log(`✅ Created/Verified 50 Candidate Submissions`);

  // 9. Interview Schedules
  for (let i = 0; i < 10; i++) {
    const subId = submissionIds[i];
    let interview = await prisma.interviewSchedule.findFirst({
      where: { agencyId: agency.id, submissionId: subId }
    });

    if (!interview) {
      await prisma.interviewSchedule.create({
        data: {
          agencyId: agency.id,
          submissionId: subId,
          roundType: 'CLIENT_ROUND_1',
          confirmedStartTime: new Date(),
          durationMinutes: 45,
          mode: 'GOOGLE_MEET',
          meetingLink: `https://meet.google.com/abc-defg-hij-${i}`,
          status: 'SCHEDULED'
        }
      });
    }
  }
  console.log(`✅ Created/Verified 10 Interview Schedules`);

  console.log('\n🎉 INITIAL PLATFORM BOOTSTRAP COMPLETE!');
  console.log('==================================================');
  console.log(`Founder Email:    ${founderEmail}`);
  console.log(`Founder Password: ${founderPassword}`);
  console.log(`Agency Subdomain: demo`);
  console.log('==================================================');
}

main()
  .catch((err) => {
    console.error('❌ Fatal Seed Error:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
