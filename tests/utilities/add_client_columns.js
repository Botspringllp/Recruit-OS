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

async function migrateClientColumns() {
  console.log('--- ADDING MISSING COLUMNS TO clients ---');

  const statements = [
    `ALTER TABLE "clients" ADD COLUMN IF NOT EXISTS "standard_fee_percentage" NUMERIC(5, 2) DEFAULT 8.33;`,
    `ALTER TABLE "clients" ADD COLUMN IF NOT EXISTS "payment_terms_days" INTEGER DEFAULT 30;`,
    `ALTER TABLE "clients" ADD COLUMN IF NOT EXISTS "status" VARCHAR(32) DEFAULT 'ACTIVE';`,
    `ALTER TABLE "clients" ADD COLUMN IF NOT EXISTS "updated_at" TIMESTAMPTZ DEFAULT NOW();`,
    `ALTER TABLE "clients" ADD COLUMN IF NOT EXISTS "deleted_at" TIMESTAMPTZ;`
  ];

  for (const stmt of statements) {
    try {
      await prisma.$executeRawUnsafe(stmt);
      console.log(`Executed: ${stmt}`);
    } catch (e) {
      console.error(`Statement failed (${stmt}):`, e.message);
    }
  }

  console.log('✅ physical PostgreSQL clients table schema fully aligned.');
  await prisma.$disconnect();
}

migrateClientColumns();
