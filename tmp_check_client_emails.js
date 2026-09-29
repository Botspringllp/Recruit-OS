const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const clients = await prisma.client.findMany({
    include: {
      contacts: true
    }
  });

  console.log('=== CLIENTS & CONTACTS ===');
  clients.forEach(c => {
    console.log(`Client ID: ${c.id}, Name: ${c.companyName}`);
    c.contacts.forEach(contact => {
      console.log(`  Contact: ${contact.name}, Email: ${contact.email}`);
    });
  });

  const jobs = await prisma.jobMandate.findMany({
    include: {
      client: {
        include: {
          contacts: true
        }
      }
    }
  });

  console.log('\n=== JOB MANDATES & CLIENT CONTACTS ===');
  jobs.forEach(j => {
    console.log(`Job ID: ${j.id}, Title: ${j.title}, Client: ${j.client?.companyName}`);
    j.client?.contacts.forEach(contact => {
      console.log(`  Job Client Contact Email: ${contact.email}`);
    });
  });
}

main().catch(console.error).finally(() => prisma.$disconnect());
