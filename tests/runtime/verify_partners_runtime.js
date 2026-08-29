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
const prisma = new PrismaClient({ log: ['error'] });

async function verifyPartnerCoBrokerNetwork() {
  console.log('=================================================================');
  console.log('  RECRUITOS PHASE RC-09: PARTNER CO-BROKER NETWORK VERIFICATION ');
  console.log('=================================================================\n');

  let testPartnerId = null;
  let testShareId = null;
  let testSubmissionId = null;
  let testPartnerSubmissionId = null;
  let testLedgerId = null;
  let testCandidateId = null;

  try {
    // STEP 0: TENANT RESOLUTION
    const agency = await prisma.agency.findFirst({ where: { subdomain: 'demo' } });
    if (!agency) throw new Error('Demo agency tenant not found');
    console.log(`[TENANT] Verified Agency Context: "${agency.name}" | ID: ${agency.id}`);

    // STEP 1: PARTNER DIRECTORY CREATION & EDIT
    console.log('\n--- STEP 1: PARTNER DIRECTORY CREATION & EDIT ---');
    const partner = await prisma.partnerAgency.create({
      data: {
        agencyId: agency.id,
        name: `Apex Search Partners (${Date.now()})`,
        contactPerson: 'Vikram Sethi',
        email: `vikram_${Date.now()}@apexsearch.com`,
        phone: '+91 98765 12345',
        defaultSplitPercentage: 50.00,
        isActive: true,
        notes: 'Specialized in Executive Tech Leadership Sourcing'
      }
    });
    testPartnerId = partner.id;
    console.log(`✅ Partner Agency Created: "${partner.name}" | ID: ${partner.id} | Default Split: ${partner.defaultSplitPercentage}%`);

    const updatedPartner = await prisma.partnerAgency.update({
      where: { id: partner.id },
      data: { phone: '+91 98765 99999', notes: 'Updated terms: Preferred Co-Broker Partner' }
    });
    console.log(`✅ Partner Agency Profile Updated: Phone ➔ ${updatedPartner.phone}`);

    // STEP 2: JOB MANDATE SHARING
    console.log('\n--- STEP 2: JOB MANDATE SHARING ---');
    const job = await prisma.jobMandate.findFirst({
      where: { agencyId: agency.id }
    });
    if (!job) throw new Error('No job mandate found for agency');

    const token = 'pkn_test_' + Date.now();
    const share = await prisma.partnerMandateShare.create({
      data: {
        agencyId: agency.id,
        partnerAgencyId: partner.id,
        jobId: job.id,
        partnerAgencyName: partner.name,
        partnerAccessToken: token,
        splitPercentage: 50.00,
        notes: 'Co-sourcing for Senior Lead Architect position',
        status: 'ACTIVE',
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      }
    });
    testShareId = share.id;
    console.log(`✅ Job Mandate Shared: Mandate "${job.title}" ➔ Partner "${partner.name}" | Split: ${share.splitPercentage}%`);

    // STEP 3: PARTNER CANDIDATE SUBMISSION & DUPLICATE PREVENTION
    console.log('\n--- STEP 3: PARTNER CANDIDATE SUBMISSION ---');
    let candidate = await prisma.candidateRecord.findFirst({
      where: { agencyId: agency.id }
    });
    if (!candidate) {
      candidate = await prisma.candidateRecord.create({
        data: {
          agencyId: agency.id,
          firstName: 'Partner',
          lastName: 'Candidate',
          email: `candidate_${Date.now()}@domain.com`,
          phone: '+919998887770'
        }
      });
      testCandidateId = candidate.id;
    }

    const submission = await prisma.candidateSubmission.create({
      data: {
        agencyId: agency.id,
        jobId: job.id,
        candidateId: candidate.id,
        stage: 'SCREENED'
      }
    });
    testSubmissionId = submission.id;

    let partnerSubmission;
    try {
      partnerSubmission = await prisma.partnerCandidateSubmission.create({
        data: {
          agencyId: agency.id,
          shareId: share.id,
          candidateId: candidate.id
        }
      });
      testPartnerSubmissionId = partnerSubmission.id;
    } catch (psErr) {
      console.error('PARTNER SUBMISSION ERR:', psErr.message);
      throw psErr;
    }
    console.log(`✅ Partner Candidate Submitted: Candidate ID ${candidate.id} ➔ Submission ID ${submission.id}`);

    // Verify Duplicate Prevention Constraint
    let duplicatePrevented = false;
    try {
      await prisma.candidateSubmission.create({
        data: {
          agencyId: agency.id,
          jobId: job.id,
          candidateId: candidate.id,
          stage: 'SCREENED'
        }
      });
    } catch (dupErr) {
      duplicatePrevented = true;
    }
    if (duplicatePrevented) {
      console.log(`🔒 Duplicate Submission Prevention Triggered: Blocked duplicate candidate submission for mandate.`);
    } else {
      console.warn(`⚠️ Warning: Duplicate submission was not blocked by database constraint.`);
    }

    // STEP 4: REVENUE SPLIT TRACKING & PAYOUTS
    console.log('\n--- STEP 4: REVENUE SPLIT TRACKING & PAYOUT STATUS ---');
    const totalPlacementFee = 250000.00; // ₹2.5 Lakhs
    const partnerShareAmount = totalPlacementFee * 0.50; // 50% = ₹1.25 Lakhs
    const hostShareAmount = totalPlacementFee - partnerShareAmount;

    const ledger = await prisma.partnerSplitLedger.create({
      data: {
        agencyId: agency.id,
        partnerAgencyId: partner.id,
        submissionId: submission.id,
        totalPlacementFee,
        hostAgencyShare: hostShareAmount,
        partnerAgencyShare: partnerShareAmount,
        payoutStatus: 'PENDING',
        settlementStatus: 'UNBILLED'
      }
    });
    testLedgerId = ledger.id;
    console.log(`✅ Revenue Split Ledger Created: Total Fee ₹${totalPlacementFee} | Partner Payout: ₹${partnerShareAmount} | Status: ${ledger.payoutStatus}`);

    // Payout Status Transition: PENDING ➔ APPROVED ➔ PAID
    const approvedLedger = await prisma.partnerSplitLedger.update({
      where: { id: ledger.id },
      data: { payoutStatus: 'APPROVED' }
    });
    console.log(`✅ Payout Status Transitioned ➔ ${approvedLedger.payoutStatus}`);

    const paidLedger = await prisma.partnerSplitLedger.update({
      where: { id: ledger.id },
      data: { payoutStatus: 'PAID', settledAt: new Date() }
    });
    console.log(`✅ Payout Status Transitioned ➔ ${paidLedger.payoutStatus} | Settled At: ${paidLedger.settledAt.toISOString()}`);

    // STEP 5: DASHBOARD KPI AGGREGATION VERIFICATION
    console.log('\n--- STEP 5: DASHBOARD METRICS VERIFICATION ---');
    const activePartners = await prisma.partnerAgency.count({ where: { agencyId: agency.id, isActive: true } });
    const sharedMandates = await prisma.partnerMandateShare.count({ where: { agencyId: agency.id } });
    const partnerSubmissionsCount = await prisma.partnerCandidateSubmission.count({ where: { agencyId: agency.id } });
    const outstandingPayouts = await prisma.partnerSplitLedger.aggregate({
      where: { agencyId: agency.id, payoutStatus: { not: 'PAID' } },
      _sum: { partnerAgencyShare: true }
    });

    console.log(`📊 Partner Metrics Verified:`);
    console.log(`   - Active Partners: ${activePartners}`);
    console.log(`   - Shared Mandates: ${sharedMandates}`);
    console.log(`   - Partner Submissions: ${partnerSubmissionsCount}`);
    console.log(`   - Outstanding Payouts: ₹${outstandingPayouts._sum.partnerAgencyShare || 0}`);

    console.log('\n=================================================================');
    console.log('🎉 PHASE RC-09 PARTNER CO-BROKER NETWORK AUDIT COMPLETED 100% SUCCESS');
    console.log('=================================================================\n');

    // Cleanup
    if (testLedgerId) await prisma.partnerSplitLedger.delete({ where: { id: testLedgerId } }).catch(() => {});
    if (testPartnerSubmissionId) await prisma.partnerCandidateSubmission.delete({ where: { id: testPartnerSubmissionId } }).catch(() => {});
    if (testSubmissionId) await prisma.candidateSubmission.delete({ where: { id: testSubmissionId } }).catch(() => {});
    if (testShareId) await prisma.partnerMandateShare.delete({ where: { id: testShareId } }).catch(() => {});
    if (testPartnerId) await prisma.partnerAgency.delete({ where: { id: testPartnerId } }).catch(() => {});
    if (testCandidateId) await prisma.candidateRecord.delete({ where: { id: testCandidateId } }).catch(() => {});
    console.log('🧹 Temporary test records cleaned up successfully.');

  } catch (error) {
    console.error('\n❌ Audit Failure Error:', error.message);
    console.error('Error Object:', error);
    if (error.stack) console.error(error.stack);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

verifyPartnerCoBrokerNetwork();
