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

async function main() {
  const agency = await prisma.agency.findFirst({ where: { subdomain: 'demo' } });
  const partner = await prisma.partnerAgency.findFirst({ where: { agencyId: agency.id } });
  const job = await prisma.jobMandate.findFirst({ where: { agencyId: agency.id } });
  const candidate = await prisma.candidateRecord.findFirst({ where: { agencyId: agency.id } });

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

  try {
    const ps = await prisma.partnerCandidateSubmission.create({
      data: {
        agencyId: agency.id,
        shareId: share.id,
        candidateId: candidate.id
      }
    });
    console.log('SUCCESS! Partner candidate submission created:', ps.id);
    await prisma.partnerCandidateSubmission.delete({ where: { id: ps.id } });
  } catch (err) {
    console.error('PS ERR MSG:', err.message);
    console.error('PS ERR META:', err.meta);
  } finally {
    await prisma.partnerMandateShare.delete({ where: { id: share.id } });
  }
}

main().finally(() => prisma.$disconnect());
