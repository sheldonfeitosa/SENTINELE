import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const lastIncident = await prisma.incident.findFirst({
    orderBy: { createdAt: 'desc' }
  });

  if (lastIncident) {
      console.log('--- Latest Incident ---');
      console.log(`ID: ${lastIncident.id}`);
      console.log(`Sector (Event): "${lastIncident.sector}"`);
      console.log(`Notify Sector: "${lastIncident.notifySector}"`); // might be empty/null
  } else {
      console.log('No incidents found.');
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
