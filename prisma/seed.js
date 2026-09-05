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
  console.log('🚀 Starting RecruitOS Minimal Essential Seed...');

  const founderEmail = 'admin@recruitos.local';
  const authUserId = 'e7d6c5b4-a3f2-4109-8765-43210fe98765';
  console.log(`✅ Using existing Supabase Auth user: ${authUserId} (${founderEmail})`);

  // 1. Create Demo Agency
  let agency = await prisma.agency.findFirst({
    where: { subdomain: 'demo' }
  });

  if (!agency) {
    agency = await prisma.agency.create({
      data: {
        name: 'RecruitOS Enterprise Workspace',
        subdomain: 'demo',
        status: 'ACTIVE',
        subscriptionTier: 'ENTERPRISE'
      }
    });
    console.log(`✅ Created Agency: ${agency.name} (subdomain: 'demo', id: ${agency.id})`);
  } else {
    console.log(`✅ Found existing Agency: (${agency.id})`);
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
  console.log(`✅ Updated Supabase Auth metadata for ${founderEmail}`);

  // 2. Create Founder User in local DB
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
    console.log(`✅ Created User record in local DB (id: ${founderUser.id})`);
  } else {
    console.log(`✅ Found existing User record in local DB`);
  }

  // 3. Assign Role in user_roles table
  const existingRole = await prisma.userRoleAssignment.findFirst({
    where: { userId: founderUser.id, roleName: 'AGENCY_FOUNDER' }
  });
  if (!existingRole) {
    await prisma.userRoleAssignment.create({
      data: {
        agencyId: agency.id,
        userId: founderUser.id,
        roleName: 'AGENCY_FOUNDER'
      }
    });
    console.log(`✅ Assigned AGENCY_FOUNDER role to user`);
  }

  console.log('\n🎉 ESSENTIAL SEED COMPLETE!');
  console.log('==================================================');
  console.log(`Agency Name:     ${agency.name}`);
  console.log(`Agency Subdomain: demo`);
  console.log(`Founder Email:    ${founderEmail}`);
  console.log(`Founder Auth ID:  ${authUserId}`);
  console.log('Business Data:   0 Clients, 0 Jobs, 0 Candidates, 0 Submissions, 0 Interviews');
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
