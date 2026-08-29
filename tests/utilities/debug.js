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

async function test() {
  console.log('1. Connecting...');
  const agency = await prisma.agency.findFirst({
    where: { subdomain: 'demo' },
    select: { id: true, name: true }
  });
  console.log('2. Agency:', agency);

  const count = await prisma.jobMandate.count({ where: { agencyId: agency.id } });
  console.log('3. Mandates count:', count);

  const candidate = await prisma.candidateRecord.findFirst({
    where: { agencyId: agency.id },
    select: { id: true, firstName: true, lastName: true }
  });
  console.log('4. Candidate:', candidate);

  await prisma.$disconnect();
  console.log('5. Done!');
}

test().catch(err => {
  console.error('ERROR:', err);
  process.exit(1);
});
