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

async function migrateOfferTable() {
  console.log('Migrating job_offer_audits table in PostgreSQL...');
  
  try {
    await prisma.$executeRawUnsafe(`ALTER TABLE job_offer_audits ADD COLUMN IF NOT EXISTS joining_date TIMESTAMPTZ;`);
    console.log('✅ Added joining_date column');
  } catch (e) {
    console.log('Error adding joining_date:', e.message);
  }

  try {
    await prisma.$executeRawUnsafe(`ALTER TABLE job_offer_audits ADD COLUMN IF NOT EXISTS expiry_date TIMESTAMPTZ;`);
    console.log('✅ Added expiry_date column');
  } catch (e) {
    console.log('Error adding expiry_date:', e.message);
  }

  try {
    await prisma.$executeRawUnsafe(`ALTER TABLE job_offer_audits ADD COLUMN IF NOT EXISTS notice_buyout NUMERIC DEFAULT 0;`);
    console.log('✅ Added notice_buyout column');
  } catch (e) {
    console.log('Error adding notice_buyout:', e.message);
  }

  try {
    await prisma.$executeRawUnsafe(`ALTER TABLE job_offer_audits ADD COLUMN IF NOT EXISTS status VARCHAR(32) DEFAULT 'DRAFT';`);
    console.log('✅ Added status column');
  } catch (e) {
    console.log('Error adding status:', e.message);
  }

  try {
    await prisma.$executeRawUnsafe(`ALTER TABLE job_offer_audits ADD COLUMN IF NOT EXISTS notes TEXT;`);
    console.log('✅ Added notes column');
  } catch (e) {
    console.log('Error adding notes:', e.message);
  }

  try {
    await prisma.$executeRawUnsafe(`ALTER TABLE job_offer_audits ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();`);
    console.log('✅ Added created_at column');
  } catch (e) {
    console.log('Error adding created_at:', e.message);
  }

  const cols = await prisma.$queryRaw`SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'job_offer_audits' ORDER BY ordinal_position`;
  console.log('\nUpdated columns in job_offer_audits:');
  cols.forEach(c => console.log(`- ${c.column_name} (${c.data_type})`));

  await prisma.$disconnect();
}

migrateOfferTable();
