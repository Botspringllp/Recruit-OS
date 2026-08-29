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

async function addSlaEnumValues() {
  console.log('Adding HEALTHY and AT_RISK to sla_status enum in PostgreSQL...');
  try {
    await prisma.$executeRawUnsafe(`ALTER TYPE sla_status ADD VALUE IF NOT EXISTS 'HEALTHY';`);
    console.log('✅ Added HEALTHY');
  } catch (e) {
    console.log('HEALTHY already exists or error:', e.message);
  }

  try {
    await prisma.$executeRawUnsafe(`ALTER TYPE sla_status ADD VALUE IF NOT EXISTS 'AT_RISK';`);
    console.log('✅ Added AT_RISK');
  } catch (e) {
    console.log('AT_RISK already exists or error:', e.message);
  }

  const enums = await prisma.$queryRaw`SELECT e.enumlabel FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid WHERE t.typname = 'sla_status'`;
  console.log('Updated sla_status enum values:', enums.map(e => e.enumlabel));

  await prisma.$disconnect();
}

addSlaEnumValues();
