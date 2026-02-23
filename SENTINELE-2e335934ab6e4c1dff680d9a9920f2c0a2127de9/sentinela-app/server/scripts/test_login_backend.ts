import dotenv from 'dotenv';
dotenv.config();
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function testLoginSimulation() {
    const email = 'sheldonfeitosa@gmail.com';
    const password = 'sentinela123';

    // 1. Force Reset
    const hashedPassword = await bcrypt.hash(password, 10);
    await prisma.user.update({
        where: { email },
        data: { password: hashedPassword }
    });
    console.log(`✅ Reseted ${email} to ${password}`);

    // 2. Simulate Login
    const user = await prisma.user.findUnique({
        where: { email },
        include: { tenant: true }
    });

    if (!user) {
        console.log('❌ User not found after reset?');
        return;
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (isValid) {
        console.log('✅ BACKEND LOGIN SIMULATION SUCCESSFUL!');
        console.log(`User: ${user.name}, Role: ${user.role}, Tenant: ${user.tenant.slug}`);
    } else {
        console.log('❌ BACKEND LOGIN SIMULATION FAILED!');
    }
}

testLoginSimulation().catch(console.error).finally(() => prisma.$disconnect());
