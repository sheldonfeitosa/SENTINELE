import dotenv from 'dotenv';
dotenv.config();
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    const email = 'sheldonfeitosa@gmail.com';
    const user = await prisma.user.findUnique({
        where: { email },
        include: { tenant: true }
    });

    if (!user) {
        console.log(`User ${email} NOT FOUND.`);
    } else {
        console.log('--- USER DATA ---');
        console.log(`ID: ${user.id}`);
        console.log(`Email: ${user.email}`);
        console.log(`Name: ${user.name}`);
        console.log(`Role: ${user.role}`);
        console.log(`Tenant: ${user.tenant?.name} (${user.tenant?.slug})`);
        console.log(`Subscription Status: ${user.subscriptionStatus}`);
        console.log(`Active: ${user.active}`);
    }
}

main()
    .catch(console.error)
    .finally(async () => await prisma.$disconnect());
