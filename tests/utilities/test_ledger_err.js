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
  const submission = await prisma.candidateSubmission.findFirst({ where: { agencyId: agency.id } });

  try {
    const ledger = await prisma.partnerSplitLedger.create({
      data: {
        agencyId: agency.id,
        partnerAgencyId: partner.id,
        submissionId: submission.id,
        totalPlacementFee: 250000.00,
        hostAgencyShare: 125000.00,
        partnerAgencyShare: 125000.00,
        payoutStatus: 'PENDING',
        settlementStatus: 'UNBILLED'
      }
    });
    console.log('SUCCESS! Ledger created:', ledger.id);
    await prisma.partnerSplitLedger.delete({ where: { id: ledger.id } });
  } catch (err) {
    console.error('LEDGER PRISMA ERR:', err.message);
  }
}

main().finally(() => prisma.$disconnect());
