import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const databaseUrl = "postgresql://neondb_owner:npg_9JCwW1azkXPM@ep-divine-rain-ac8cy96b-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require";
const prisma = new PrismaClient({ datasources: { db: { url: databaseUrl } } });

async function main() {
    const users = await prisma.user.findMany({ select: { id: true, email: true, name: true, role: true } });
    for (const u of users) {
        process.stdout.write(`ID=${u.id} | ${u.email} | ${u.name} | ${u.role}\n`);
    }
    process.stdout.write(`\nTotal: ${users.length} users\n`);
    await prisma.$disconnect();
}

main().catch(e => { console.error(e); process.exit(1); });
