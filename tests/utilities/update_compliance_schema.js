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

async function fixCandidateDefaults() {
  console.log('--- FIXING NULL ENUMS IN candidate_records ---');

  const statements = [
    `UPDATE "candidate_records" SET "source" = 'DIRECT_INTAKE' WHERE "source" IS NULL OR "source" NOT IN ('DIRECT_INTAKE', 'PARTNER', 'STOREFRONT', 'SILVER_MEDALIST');`,
    `UPDATE "candidate_records" SET "ownership_status" = 'ACTIVE' WHERE "ownership_status" IS NULL OR "ownership_status" NOT IN ('ACTIVE', 'STALE', 'UNASSIGNED');`
  ];

  for (const stmt of statements) {
    try {
      await prisma.$executeRawUnsafe(stmt);
      console.log(`Executed: ${stmt}`);
    } catch (e) {
      console.error(`Statement error (${stmt}):`, e.message);
    }
  }

  console.log('✅ Physical PostgreSQL candidate_records defaults updated.');
  await prisma.$disconnect();
}

fixCandidateDefaults();
