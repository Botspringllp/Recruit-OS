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

async function fixNullability() {
  console.log('--- DROPPING NOT NULL ON OLD COLUMNS IN invoice_records ---');

  const statements = [
    `ALTER TABLE "invoice_records" ALTER COLUMN "gross_amount" DROP NOT NULL;`,
    `ALTER TABLE "invoice_records" ALTER COLUMN "net_amount" DROP NOT NULL;`
  ];

  for (const stmt of statements) {
    try {
      await prisma.$executeRawUnsafe(stmt);
      console.log(`Executed: ${stmt}`);
    } catch (e) {
      console.error(`Statement failed (${stmt}):`, e.message);
    }
  }

  console.log('✅ Physical PostgreSQL invoice_records table nullability updated.');
  await prisma.$disconnect();
}

fixNullability();
