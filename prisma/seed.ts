import fs from 'fs';
import path from 'path';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
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

const prisma = new PrismaClient();

function genUuid() {
  return crypto.randomUUID();
}

async function main() {
  console.log('🚀 Starting RecruitOS Initial Platform Bootstrap Execution...');

  const founderEmail = 'admin@recruitos.local';
  const founderPassword = 'RecruitOS@123';
  const passwordHash = await bcrypt.hash(founderPassword, 10);

  // 1. Insert Agency
  let agencyId = genUuid();
  const existingAgencies = await prisma.$queryRawUnsafe<any[]>("SELECT agency_id FROM public.agencies WHERE subdomain = 'demo' LIMIT 1;");

  if (existingAgencies.length > 0) {
    agencyId = existingAgencies[0].agency_id;
    console.log(`✅ Found existing Agency: ${agencyId}`);
  } else {
    await prisma.$executeRawUnsafe(`
      INSERT INTO public.agencies (agency_id, name, subdomain, tier, status, created_at, updated_at)
      VALUES ('${agencyId}', 'RecruitOS Demo Agency', 'demo', 'ENTERPRISE'::agency_tier, 'ACTIVE', NOW(), NOW());
    `);
    console.log(`✅ Inserted 1 Agency: RecruitOS Demo Agency (${agencyId})`);
  }

  // 2. Insert Founder User in public.users
  const existingUsers = await prisma.user.findFirst({ where: { email: founderEmail } });
  if (!existingUsers) {
    const founderUserId = genUuid();
    await prisma.user.create({
      data: {
        id: founderUserId,
        agencyId,
        email: founderEmail,
        passwordHash,
        firstName: 'Admin',
        lastName: 'Founder',
        role: 'AGENCY_OWNER',
        status: 'ACTIVE',
        isActive: true
      }
    });
    console.log(`✅ Created Founder User record in public.users`);
  } else {
    await prisma.user.update({
      where: { id: existingUsers.id },
      data: { passwordHash, status: 'ACTIVE', isActive: true }
    });
  }

  console.log('\n🎉 INITIAL PLATFORM BOOTSTRAP COMPLETE!');
  console.log('==================================================');
  console.log(`Founder Email:    ${founderEmail}`);
  console.log(`Founder Password: ${founderPassword}`);
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
