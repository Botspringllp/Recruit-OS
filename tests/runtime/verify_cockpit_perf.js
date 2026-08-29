const fs = require('fs');
const path = require('path');

// Read .env.local manually
try {
  const envConfig = fs.readFileSync(path.join(__dirname, '../../.env.local'), 'utf8');
  envConfig.split('\n').forEach(line => {
    const [key, ...valueParts] = line.split('=');
    if (key && valueParts.length > 0) {
      process.env[key.trim()] = valueParts.join('=').trim().replace(/^["']|["']$/g, '');
    }
  });
} catch (e) {
  console.log('No .env.local file found, using system env');
}

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function runBenchmark() {
  console.log('--- COCKPIT PERFORMANCE BENCHMARK ---');

  // Sequential baseline measurement
  const startSequential = Date.now();

  const demoAgencySeq = await prisma.agency.findFirst({
    where: { subdomain: 'demo' },
    select: { id: true }
  });
  const agencyIdSeq = demoAgencySeq?.id;

  const activeMandatesSeq = await prisma.jobMandate.count({
    where: { agencyId: agencyIdSeq, status: { in: ['ACTIVE', 'OPEN'] } }
  });

  const pipelineCandidatesSeq = await prisma.candidateSubmission.count({
    where: { agencyId: agencyIdSeq }
  });

  const slaAlertsSeq = await prisma.candidateSubmission.count({
    where: { agencyId: agencyIdSeq, slaStatus: { in: ['WARNING', 'BREACHED'] } }
  });

  const interviewsTodaySeq = await prisma.interviewSchedule.count({
    where: { agencyId: agencyIdSeq, status: { notIn: ['CANCELLED'] } }
  });

  const monthlyPlacementsSeq = await prisma.candidateSubmission.count({
    where: { agencyId: agencyIdSeq, stage: 'JOINED' }
  });

  const dbMandatesSeq = await prisma.jobMandate.findMany({
    where: { agencyId: agencyIdSeq },
    orderBy: { createdAt: 'desc' },
    take: 20,
    include: {
      client: { select: { companyName: true } },
      submissions: { select: { id: true, stage: true, slaStatus: true } }
    }
  });

  const durationSequential = Date.now() - startSequential;
  console.log(`Sequential execution time: ${durationSequential}ms`);

  // Optimized parallel measurement (Promise.all)
  const startParallel = Date.now();

  const demoAgencyPar = await prisma.agency.findFirst({
    where: { subdomain: 'demo' },
    select: { id: true }
  });
  const agencyIdPar = demoAgencyPar?.id;

  const [
    activeMandatesCount,
    pipelineCandidatesCount,
    slaAlertsCount,
    interviewsTodayCount,
    monthlyPlacementsCount,
    dbMandates
  ] = await Promise.all([
    prisma.jobMandate.count({ where: { agencyId: agencyIdPar, status: { in: ['ACTIVE', 'OPEN'] } } }),
    prisma.candidateSubmission.count({ where: { agencyId: agencyIdPar } }),
    prisma.candidateSubmission.count({ where: { agencyId: agencyIdPar, slaStatus: { in: ['WARNING', 'BREACHED'] } } }),
    prisma.interviewSchedule.count({ where: { agencyId: agencyIdPar, status: { notIn: ['CANCELLED'] } } }),
    prisma.candidateSubmission.count({ where: { agencyId: agencyIdPar, stage: 'JOINED' } }),
    prisma.jobMandate.findMany({
      where: { agencyId: agencyIdPar },
      orderBy: { createdAt: 'desc' },
      take: 20,
      include: {
        client: { select: { companyName: true } },
        submissions: { select: { id: true, stage: true, slaStatus: true } }
      }
    })
  ]);

  const durationParallel = Date.now() - startParallel;
  console.log(`Parallel execution time: ${durationParallel}ms`);
  console.log(`Speedup factor: ${(durationSequential / (durationParallel || 1)).toFixed(2)}x`);

  await prisma.$disconnect();
}

runBenchmark().catch(console.error);
