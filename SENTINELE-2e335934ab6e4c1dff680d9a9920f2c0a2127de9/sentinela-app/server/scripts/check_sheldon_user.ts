import dotenv from 'dotenv';
dotenv.config();
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function checkSpecificUser() {
    const user = await prisma.user.findUnique({
        where: { email: 'sheldonfeitosa@gmail.com' }
    });

    if (user) {
        console.log('--- USER FOUND ---');
        console.log(`ID: ${user.id}`);
        console.log(`Name: ${user.name}`);
        console.log(`Email: ${user.email}`);
        console.log(`Role: ${user.role}`);
        console.log(`TenantId: ${user.tenantId}`);
        console.log(`Sectors: ${user.sectors}`);
        // Password is hashed, we can't show it, but we can reset it to a known one if needed.
        console.log('Password: [HASHED]');
    } else {
        console.log('User sheldonfeitosa@gmail.com not found in the database.');
    }
}

checkSpecificUser().catch(console.error).finally(() => prisma.$disconnect());
