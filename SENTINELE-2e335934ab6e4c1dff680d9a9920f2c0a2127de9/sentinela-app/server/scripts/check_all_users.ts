import dotenv from 'dotenv';
dotenv.config();
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    const users = await prisma.user.findMany();
    console.log('--- USERS IN DATABASE ---');
    users.forEach(u => {
        console.log(`Name: ${u.name}, Email: ${u.email}, Role: ${u.role}, Tenant: ${u.tenantId}`);
    });
}

main().catch(console.error).finally(() => prisma.$disconnect());
