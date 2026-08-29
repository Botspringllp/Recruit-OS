const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  const cols = await prisma.$queryRawUnsafe("SELECT column_name, is_nullable FROM information_schema.columns WHERE table_name='candidate_compliance_docs'");
  console.log(cols);
}

check().then(() => prisma.$disconnect());
