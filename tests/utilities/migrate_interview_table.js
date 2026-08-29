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

async function migrateInterviewTable() {
  console.log('Migrating interview_schedules table in PostgreSQL...');
  try {
    await prisma.$executeRawUnsafe(`ALTER TABLE interview_schedules ADD COLUMN IF NOT EXISTS status VARCHAR(32) DEFAULT 'SCHEDULED';`);
    console.log('✅ Added status column');
  } catch (e) {
    console.log('Error adding status column:', e.message);
  }

  try {
    await prisma.$executeRawUnsafe(`ALTER TABLE interview_schedules ADD COLUMN IF NOT EXISTS notes TEXT;`);
    console.log('✅ Added notes column');
  } catch (e) {
    console.log('Error adding notes column:', e.message);
  }

  try {
    await prisma.$executeRawUnsafe(`ALTER TABLE interview_schedules ADD COLUMN IF NOT EXISTS duration_minutes INT DEFAULT 45;`);
    console.log('✅ Added duration_minutes column');
  } catch (e) {
    console.log('Error adding duration_minutes column:', e.message);
  }

  try {
    await prisma.$executeRawUnsafe(`ALTER TABLE interview_schedules ADD COLUMN IF NOT EXISTS outcome VARCHAR(32);`);
    console.log('✅ Added outcome column');
  } catch (e) {
    console.log('Error adding outcome column:', e.message);
  }

  const cols = await prisma.$queryRaw`SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'interview_schedules' ORDER BY ordinal_position`;
  console.log('Updated columns in interview_schedules:');
  cols.forEach(c => console.log(`- ${c.column_name} (${c.data_type})`));

  await prisma.$disconnect();
}

migrateInterviewTable();
