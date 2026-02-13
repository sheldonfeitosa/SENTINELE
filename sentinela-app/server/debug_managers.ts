import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const managers = await prisma.riskManager.findMany();
  console.log('--- Database Managers ---');
  managers.forEach(m => {
    console.log(`ID: ${m.id}`);
    console.log(`Name: ${m.name}`);
    console.log(`Email: ${m.email}`);
    console.log(`Sectors (Raw): "${m.sectors}"`);
    console.log('---');
  });
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
