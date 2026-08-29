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

async function checkNullability() {
  const cols = await prisma.$queryRawUnsafe(`
    SELECT column_name, is_nullable, column_default 
    FROM information_schema.columns 
    WHERE table_name = 'invoice_records';
  `);
  console.log('Columns in invoice_records:');
  cols.forEach(c => console.log(` - ${c.column_name}: nullable=${c.is_nullable}, default=${c.column_default}`));
  await prisma.$disconnect();
}

checkNullability();
