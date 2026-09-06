const { PrismaClient } = require('@prisma/client');
const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');

const prisma = new PrismaClient();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://hadrlwfcsoouttnzeoye.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

const supabaseClient = createClient(supabaseUrl, supabaseAnonKey);

const defaultPassword = 'RecruitOS@123';

const targetAccounts = [
  { email: 'superadmin@recruitos.local', role: 'SUPER_ADMIN' },
  { email: 'admin@recruitos.local', role: 'AGENCY_OWNER' },
  { email: 'recruiter@recruitos.local', role: 'RECRUITER' },
  { email: 'finance@recruitos.local', role: 'FINANCE_MANAGER' },
  { email: 'compliance@recruitos.local', role: 'COMPLIANCE_OFFICER' },
  { email: 'coordinator@recruitos.local', role: 'INTERVIEW_COORDINATOR' }
];

async function main() {
  console.log("=== STEP 1: AUDITING DB & SUPABASE AUTH ACCOUNTS ===");

  // 1. Fetch Prisma DB Users
  const dbUsers = await prisma.user.findMany({
    include: { agency: true }
  });

  // 2. Fetch Supabase Auth Users via Admin API
  const { data: sbData, error: sbErr } = await supabaseAdmin.auth.admin.listUsers();
  if (sbErr) {
    console.error("Error listing Supabase Auth users:", sbErr.message);
  }
  const sbUsers = sbData?.users || [];

  console.log(`Found ${dbUsers.length} total users in DB, ${sbUsers.length} in Supabase Auth.`);

  console.log("\n=== STEP 2 & 3: CHECKING AND SYNCING MISSING ACCOUNTS ===");

  const agency = await prisma.agency.findFirst({ where: { subdomain: 'demo' } }) || await prisma.agency.findFirst();
  const agencyId = agency ? agency.id : null;

  for (const target of targetAccounts) {
    const email = target.email.toLowerCase();
    const dbUser = dbUsers.find(u => u.email.toLowerCase() === email);
    let sbUser = sbUsers.find(u => u.email.toLowerCase() === email);

    console.log(`\nChecking: ${email} (${target.role})`);
    console.log(`- Exists in User table (Prisma)? ${dbUser ? 'YES' : 'NO'}`);
    console.log(`- Exists in Supabase Auth? ${sbUser ? 'YES' : 'NO'}`);

    // If missing in Supabase Auth, create/sync it
    if (!sbUser) {
      console.log(`  -> Syncing ${email} into Supabase Auth...`);
      const { data: newSb, error: createErr } = await supabaseAdmin.auth.admin.createUser({
        email,
        password: defaultPassword,
        email_confirm: true,
        user_metadata: { role: target.role }
      });

      if (createErr) {
        console.error(`  ❌ Failed to create Supabase Auth account for ${email}:`, createErr.message);
      } else {
        sbUser = newSb.user;
        console.log(`  ✅ Successfully created Supabase Auth account (ID: ${sbUser.id})`);
      }
    } else {
      // Ensure password and metadata are up-to-date
      const { error: updateErr } = await supabaseAdmin.auth.admin.updateUserById(sbUser.id, {
        password: defaultPassword,
        email_confirm: true,
        user_metadata: { role: target.role }
      });
      if (updateErr) {
        console.warn(`  ⚠️ Could not update password for ${email}:`, updateErr.message);
      } else {
        console.log(`  ✅ Updated & confirmed password in Supabase Auth.`);
      }
    }

    // If missing or unlinked in Prisma DB, update or create
    const passwordHash = `$sha256$${crypto.createHash('sha256').update(defaultPassword).digest('hex')}`;
    if (!dbUser) {
      await prisma.user.create({
        data: {
          id: sbUser ? sbUser.id : undefined,
          email,
          firstName: target.role.split('_')[0],
          lastName: 'User',
          role: target.role,
          status: 'ACTIVE',
          isActive: true,
          passwordHash,
          agencyId: agencyId
        }
      });
      console.log(`  ✨ Created missing Prisma DB user record for ${email}`);
    } else {
      await prisma.user.update({
        where: { id: dbUser.id },
        data: {
          role: target.role,
          status: 'ACTIVE',
          isActive: true,
          passwordHash
        }
      });
      console.log(`  ✅ Updated Prisma DB record to ACTIVE for ${email}`);
    }
  }

  // STEP 4: REAL AUTHENTICATION TESTING VIA signInWithPassword()
  console.log("\n=== STEP 4: RUNNING REAL AUTHENTICATION TEST (signInWithPassword) ===");

  const results = [];

  for (const target of targetAccounts) {
    const email = target.email;
    const password = defaultPassword;

    let authSuccess = false;
    let authError = null;
    let sessionToken = null;

    try {
      const { data: authData, error: authErr } = await supabaseClient.auth.signInWithPassword({
        email,
        password
      });

      if (authErr) {
        authError = authErr.message;
      } else if (authData && authData.session) {
        authSuccess = true;
        sessionToken = authData.session.access_token;
      }
    } catch (e) {
      authError = e.message;
    }

    results.push({
      email,
      role: target.role,
      password,
      authSuccess,
      authError,
      sessionToken: sessionToken ? 'VALID_TOKEN_ISSUED' : 'NONE'
    });
  }

  console.log("\n=== AUTHENTICATION RESULTS ===");
  results.forEach(r => {
    console.log(`- Email: ${r.email}`);
    console.log(`  Role: ${r.role}`);
    console.log(`  Auth Success: ${r.authSuccess ? 'YES' : 'NO'}`);
    if (!r.authSuccess) console.log(`  Auth Error: ${r.authError}`);
  });
}

main().catch(console.error).finally(() => prisma.$disconnect());
