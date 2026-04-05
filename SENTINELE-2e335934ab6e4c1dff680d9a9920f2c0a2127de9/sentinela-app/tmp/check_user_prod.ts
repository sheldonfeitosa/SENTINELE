
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
        const email = 'sheldonfeitosa@gmail.com';
        const user = await prisma.user.findUnique({
            where: { email },
            include: { tenant: true }
        });

        if (user) {
            console.log('✅ User found in production:');
            console.log(JSON.stringify(user, null, 2));
        } else {
            console.log('❌ User NOT found in production.');
            
            // Let's list some users if possible to see what's there
            const someUsers = await prisma.user.findMany({ take: 5 });
            console.log('Current users (sample):', someUsers.map(u => u.email));
        }
    } catch (error) {
        console.error('Error connecting to production database:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
