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

async function checkOfferCols() {
  const cols = await prisma.$queryRaw`SELECT column_name, data_type, udt_name FROM information_schema.columns WHERE table_name = 'job_offer_audits' ORDER BY ordinal_position`;
  cols.forEach(c => console.log(`${c.column_name} | ${c.data_type} | ${c.udt_name}`));
  await prisma.$disconnect();
}

checkOfferCols();
