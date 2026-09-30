const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('=== ALL USERS IN PRISMA USER TABLE (including deletedAt != null) ===');
  const allUsers = await prisma.user.findMany();
  console.log('Total count:', allUsers.length);
  allUsers.forEach(u => {
    console.log(`ID: ${u.id} | Email: ${u.email} | Role: ${u.role} | Active: ${u.isActive} | Status: ${u.status} | DeletedAt: ${u.deletedAt}`);
  });

  console.log('\n=== ALL AGENCIES ===');
  const agencies = await prisma.agency.findMany();
  agencies.forEach(a => {
    console.log(`ID: ${a.id} | Name: ${a.name} | Subdomain: ${a.subdomain} | Status: ${a.status} | DeletedAt: ${a.deletedAt}`);
  });
}

main().catch(console.error).finally(() => prisma.$disconnect());
