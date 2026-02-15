import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: 'c:\\Users\\sheld\\sentinela ai\\sentinela-app\\server\\.env' });

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    const email = 'sheldonfeitosa@gmail.com';
    const hashedPassword = await bcrypt.hash('admin123', 10);

    console.log(`Checking for user: ${email}...`);

    const users = await prisma.user.findMany({
        where: { email: { equals: email, mode: 'insensitive' } }
    });

    if (users.length === 0) {
        console.log('User not found. Creating new Super Admin...');
        const tenant = await prisma.tenant.upsert({
            where: { slug: 'admin' },
            update: {},
            create: { name: 'Sentinela AI Admin', slug: 'admin' }
        });

        await prisma.user.create({
            data: {
                email,
                password: hashedPassword,
                name: 'Sheldon Feitosa',
                role: 'SUPER_ADMIN',
                tenantId: tenant.id
            }
        });
        console.log('New Super Admin created.');
    } else {
        console.log(`Found ${users.length} user(s). Updating all to SUPER_ADMIN...`);
        for (const u of users) {
            await prisma.user.update({
                where: { id: u.id },
                data: {
                    role: 'SUPER_ADMIN',
                    password: hashedPassword
                }
            });
            console.log(`Updated ID ${u.id} to SUPER_ADMIN.`);
        }
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
