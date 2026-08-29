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

async function addEnumValues() {
  console.log('Adding PAUSED and CLOSED to mandate_status enum in PostgreSQL...');
  try {
    await prisma.$executeRawUnsafe(`ALTER TYPE mandate_status ADD VALUE IF NOT EXISTS 'PAUSED';`);
    console.log('✅ Added PAUSED');
  } catch (e) {
    console.log('PAUSED already exists or error:', e.message);
  }

  try {
    await prisma.$executeRawUnsafe(`ALTER TYPE mandate_status ADD VALUE IF NOT EXISTS 'PAUSED';`);
  } catch (e) {}

  try {
    await prisma.$executeRawUnsafe(`ALTER TYPE mandate_status ADD VALUE IF NOT EXISTS 'CLOSED';`);
    console.log('✅ Added CLOSED');
  } catch (e) {
    console.log('CLOSED already exists or error:', e.message);
  }

  const enums = await prisma.$queryRaw`SELECT e.enumlabel FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid WHERE t.typname = 'mandate_status'`;
  console.log('Updated mandate_status enum values:', enums.map(e => e.enumlabel));

  await prisma.$disconnect();
}

addEnumValues();
