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

async function inspectComplianceTable() {
  try {
    const cols = await prisma.$queryRawUnsafe(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'candidate_compliance_docs';
    `);
    console.log('Columns in candidate_compliance_docs:');
    cols.forEach(c => console.log(` - ${c.column_name} (${c.data_type})`));
  } catch (err) {
    console.error('Error inspecting candidate_compliance_docs:', err.message);
  } finally {
    await prisma.$disconnect();
  }
}

inspectComplianceTable();
