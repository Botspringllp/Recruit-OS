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

async function checkSlaTypes() {
  const cols = await prisma.$queryRaw`SELECT column_name, data_type, character_maximum_length, udt_name FROM information_schema.columns WHERE table_name = 'pipeline_sla_logs'`;
  console.log('Columns in pipeline_sla_logs:', cols);
  await prisma.$disconnect();
}

checkSlaTypes();
