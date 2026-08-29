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

async function testCreate() {
  try {
    const agency = await prisma.agency.findFirst({ where: { subdomain: 'demo' } });
    const client = await prisma.client.findFirst({ where: { agencyId: agency.id } });

    console.log('Agency ID:', agency.id);
    console.log('Client ID:', client.id);

    const inv = await prisma.invoiceRecord.create({
      data: {
        agencyId: agency.id,
        clientId: client.id,
        invoiceNumber: 'INV-TEST-999',
        baseFeeAmount: '10000.00',
        gstPercentage: '18.00',
        gstAmount: '1800.00',
        totalInvoiceAmount: '11800.00',
        amountReceived: '0.00',
        balanceDue: '11800.00',
        dueDate: new Date()
      }
    });

    console.log('Created invoice:', inv.id);
    await prisma.invoiceRecord.delete({ where: { id: inv.id } });
  } catch (err) {
    console.error('Error in testCreate:', err.message);
    console.error(err);
  } finally {
    await prisma.$disconnect();
  }
}

testCreate();
