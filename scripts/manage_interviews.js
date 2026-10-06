const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const records = await prisma.interviewSchedule.findMany({
    include: {
      submission: {
        include: {
          candidate: true,
          job: true
        }
      }
    },
    orderBy: { confirmedStartTime: 'asc' }
  });

  console.log(`Found ${records.length} interview records in database.`);

  records.forEach((r, idx) => {
    const candName = r.submission?.candidate
      ? `${r.submission.candidate.firstName} ${r.submission.candidate.lastName}`.trim()
      : 'Unknown Candidate';
    const jobTitle = r.submission?.job?.title || 'Unknown Job';
    console.log(`[Item #${idx + 1}] ID: ${r.id} | Candidate: ${candName} | Position: ${jobTitle} | Status: ${r.status}`);
  });

  if (records.length <= 1) {
    console.log('Only 1 or 0 records exist. Nothing to delete.');
    return;
  }

  // Keep Item #2 (index 1), delete all others
  const keepRecord = records[1];
  console.log(`\nKEEPING Item #2: ID=${keepRecord.id} (${keepRecord.submission?.candidate?.firstName} ${keepRecord.submission?.candidate?.lastName})`);

  const recordsToDelete = records.filter((_, idx) => idx !== 1);
  console.log(`Deleting ${recordsToDelete.length} records...`);

  for (const r of recordsToDelete) {
    // Delete related proposed slots, prep kits if any
    try {
      await prisma.proposedInterviewSlot.deleteMany({ where: { submissionId: r.submissionId } });
    } catch (e) {}
    try {
      await prisma.interviewPreparationKit.deleteMany({ where: { interviewScheduleId: r.id } });
    } catch (e) {}
    try {
      await prisma.interviewSchedule.delete({ where: { id: r.id } });
      console.log(`Deleted interview schedule ${r.id}`);
    } catch (e) {
      console.error(`Failed to delete interview schedule ${r.id}:`, e.message);
    }
  }

  console.log('\nCleanup finished successfully!');
}

main()
  .catch(err => console.error(err))
  .finally(() => prisma.$disconnect());
