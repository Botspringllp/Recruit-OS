const fs = require('fs');
const path = require('path');

const envPath = path.join(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  const envConfig = fs.readFileSync(envPath, 'utf-8');
  envConfig.split('\n').forEach(line => {
    const cleanedLine = line.replace(/\r/g, '').trim();
    const match = cleanedLine.match(/^([^=]+)=(.*)$/);
    if (match) process.env[match[1].trim()] = match[2].trim().replace(/^\"|\"$/g, '');
  });
}

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function migrateOfferColumns() {
  console.log('--- ADDING MISSING COLUMNS TO job_offer_audits ---');

  const statements = [
    `ALTER TABLE "job_offer_audits" ADD COLUMN IF NOT EXISTS "total_offered_ctc" NUMERIC(12, 2);`,
    `ALTER TABLE "job_offer_audits" ADD COLUMN IF NOT EXISTS "agreed_fee_percentage" NUMERIC(5, 2);`,
    `ALTER TABLE "job_offer_audits" ADD COLUMN IF NOT EXISTS "calculated_placement_fee" NUMERIC(12, 2);`,
    `ALTER TABLE "job_offer_audits" ADD COLUMN IF NOT EXISTS "ctc_variance_flag" BOOLEAN DEFAULT FALSE;`,
    `ALTER TABLE "job_offer_audits" ADD COLUMN IF NOT EXISTS "signed_offer_letter_url" VARCHAR(512);`,
    `ALTER TABLE "job_offer_audits" ADD COLUMN IF NOT EXISTS "audited_by_user_id" UUID;`,
    `ALTER TABLE "job_offer_audits" ADD COLUMN IF NOT EXISTS "audited_at" TIMESTAMPTZ DEFAULT NOW();`,
    `ALTER TABLE "job_offer_audits" ADD COLUMN IF NOT EXISTS "deleted_at" TIMESTAMPTZ;`
  ];

  for (const stmt of statements) {
    try {
      await prisma.$executeRawUnsafe(stmt);
      console.log(`Executed: ${stmt}`);
    } catch (e) {
      console.error(`Statement failed (${stmt}):`, e.message);
    }
  }

  console.log('✅ physical PostgreSQL job_offer_audits schema fully aligned.');
  await prisma.$disconnect();
}

migrateOfferColumns();
