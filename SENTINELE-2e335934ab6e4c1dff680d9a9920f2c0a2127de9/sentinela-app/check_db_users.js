const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient({ 
    datasources: { 
        db: { 
            url: "postgresql://neondb_owner:npg_9JCwW1azkXPM@ep-divine-rain-ac8cy96b-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require" 
        } 
    } 
});

async function main() {
  const users = await prisma.user.findMany({ 
      where: { tenantId: '0ca52289-b1bf-431f-8790-bff3749420be' },
      select: { id: true, email: true, role: true, name: true }
  });
  console.log("Users in INMCEB:", users);
}
main().catch(console.error).finally(() => prisma.$disconnect());
