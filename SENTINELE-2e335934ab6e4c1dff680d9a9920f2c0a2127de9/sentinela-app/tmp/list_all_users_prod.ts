
import { PrismaClient } from '@prisma/client';

async function main() {
    const databaseUrl = "postgresql://neondb_owner:npg_9JCwW1azkXPM@ep-divine-rain-ac8cy96b-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require";
    const prisma = new PrismaClient({
        datasources: {
            db: {
                url: databaseUrl,
            },
        },
    });

    try {
        const users = await prisma.user.findMany({
            select: { email: true, name: true, role: true }
        });

        console.log('--- ALL USERS IN PRODUCTION ---');
        users.forEach(u => console.log(`${u.email} (${u.name}) - ${u.role}`));
    } catch (error) {
        console.error('Error connecting to production database:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
