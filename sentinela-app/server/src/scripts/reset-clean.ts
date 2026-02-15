import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: 'c:\\Users\\sheld\\sentinela ai\\sentinela-app\\server\\.env' });

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    const email = 'sheldonfeitosa@gmail.com';
    const hashedPassword = await bcrypt.hash('admin123', 10);

    console.log(`🧹 Cleaning up user: ${email}...`);

    await prisma.user.deleteMany({
        where: { email: { equals: email, mode: 'insensitive' } }
    });

    console.log('✨ Creating fresh SUPER_ADMIN user...');

    // Find or create a base tenant for the admin
    let tenant = await prisma.tenant.findUnique({ where: { slug: 'admin' } });
    if (!tenant) {
        tenant = await prisma.tenant.create({
            data: { name: 'Sentinela AI Admin', slug: 'admin' }
        });
    }

    const newUser = await prisma.user.create({
        data: {
            email,
            password: hashedPassword,
            name: 'Sheldon Feitosa',
            role: 'SUPER_ADMIN',
            tenantId: tenant.id
        }
    });

    console.log(`✅ Success! User ${newUser.email} is now a SUPER_ADMIN.`);
    console.log(`Assigned to Tenant: ${tenant.name} (${tenant.slug})`);
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
