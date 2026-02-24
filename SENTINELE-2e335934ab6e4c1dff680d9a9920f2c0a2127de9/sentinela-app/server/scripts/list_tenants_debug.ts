import dotenv from 'dotenv';
dotenv.config();
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    console.log('--- DATABASE TENANTS ---');
    const ts = await prisma.tenant.findMany();
    ts.forEach(t => {
        console.log(`SLUG: [${t.slug}] | NAME: [${t.name}] | ID: ${t.id}`);
    });
}

main()
    .catch(console.error)
    .finally(async () => await prisma.$disconnect());
