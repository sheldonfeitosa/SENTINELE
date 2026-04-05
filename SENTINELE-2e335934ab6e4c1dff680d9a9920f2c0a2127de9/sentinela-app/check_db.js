const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient({ 
    datasources: { 
        db: { 
            url: "postgresql://neondb_owner:npg_9JCwW1azkXPM@ep-divine-rain-ac8cy96b-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require" 
        } 
    } 
});

async function main() {
  const tenants = await prisma.tenant.findMany();
  console.log("Tenants:", tenants.map(t => ({ id: t.id, name: t.name, slug: t.slug })));
  const inmcebTenant = tenants.find(t => t.slug === 'inmceb');
  
  const notifsCount = await prisma.incident.count();
  console.log("Total incidents in DB:", notifsCount);
  
  if (inmcebTenant) {
      const inmcebIncidents = await prisma.incident.findMany({ where: { tenantId: inmcebTenant.id }, select: { id: true, type: true, status: true } });
      console.log("INMCEB Incidents count:", inmcebIncidents.length);
      console.log("INMCEB Incidents:", inmcebIncidents.slice(0, 5));
  } else {
      console.log("tenant INMCEB not found");
  }
}
main().catch(console.error).finally(() => prisma.$disconnect());
