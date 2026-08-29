const fs = require('fs');

if (fs.existsSync('.env.local')) {
  const envConfig = fs.readFileSync('.env.local', 'utf8');
  for (const line of envConfig.split('\n')) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const idx = trimmed.indexOf('=');
      if (idx > 0) {
        const key = trimmed.substring(0, idx).trim();
        const value = trimmed.substring(idx + 1).trim().replace(/^["']|["']$/g, '');
        process.env[key] = value;
      }
    }
  }
}

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testShare() {
  const agency = await prisma.agency.findFirst({ where: { subdomain: 'demo' } });
  const partner = await prisma.partnerAgency.findFirst({ where: { agencyId: agency.id } });
  const job = await prisma.jobMandate.findFirst({ where: { agencyId: agency.id } });

  console.log('Agency ID:', agency.id);
  console.log('Partner ID:', partner ? partner.id : 'null');
  console.log('Job ID:', job ? job.id : 'null');

  try {
    const share = await prisma.partnerMandateShare.create({
      data: {
        agencyId: agency.id,
        partnerAgencyId: partner.id,
        jobId: job.id,
        partnerAgencyName: partner.name,
        partnerAccessToken: 'test_token_' + Date.now(),
        splitPercentage: 50.00,
        notes: 'Test note',
        status: 'ACTIVE',
        expiresAt: new Date()
      }
    });
    console.log('SUCCESS! Share created:', share.id);
    await prisma.partnerMandateShare.delete({ where: { id: share.id } });
  } catch (err) {
    console.error('SHARE ERROR MESSAGE:', err.message);
    console.error('SHARE ERROR CODE:', err.code);
  }
}

testShare().finally(() => prisma.$disconnect());
