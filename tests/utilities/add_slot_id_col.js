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

async function addSlotIdCol() {
  try {
    await prisma.$executeRawUnsafe(`ALTER TABLE interview_schedules ADD COLUMN IF NOT EXISTS slot_id UUID;`);
    console.log('✅ Added slot_id column to interview_schedules');
  } catch (e) {
    console.error('Error adding slot_id column:', e.message);
  }

  try {
    await prisma.$executeRawUnsafe(`ALTER TABLE candidate_records ADD COLUMN IF NOT EXISTS assigned_recruiter_id UUID;`);
    console.log('✅ Added assigned_recruiter_id column to candidate_records');
  } catch (e) {
    console.error('Error adding assigned_recruiter_id column:', e.message);
  }

  try {
    await prisma.$executeRawUnsafe(`ALTER TABLE agencies ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;`);
    console.log('✅ Added deleted_at column to agencies');
  } catch (e) {
    console.error('Error adding deleted_at column:', e.message);
  }

  await prisma.$disconnect();
}

addSlotIdCol();
