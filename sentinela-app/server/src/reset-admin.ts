
import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(__dirname, '../.env') });

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    const email = 'sheldonfeitosa@gmail.com';
    const hashedPassword = await bcrypt.hash('admin123', 10);

    // Try to find if user exists first
    let user = await prisma.user.findUnique({ where: { email } });

    if (user) {
        user = await prisma.user.update({
            where: { email },
            data: {
                password: hashedPassword,
                role: 'SUPER_ADMIN'
            }
        });
        console.log('--- ADMIN PASSWORD RESET ---');
    } else {
        // If user doesn't exist, we might need a tenant first
        // In this app, users usually belong to tenants.
        // Let's see if we can find a 'system' tenant or create one.
        let tenant = await prisma.tenant.findFirst();
        if (!tenant) {
            tenant = await prisma.tenant.create({
                data: {
                    name: 'Sentinela AI Admin',
                    slug: 'admin'
                }
            });
        }

        user = await prisma.user.create({
            data: {
                email,
                password: hashedPassword,
                name: 'Sheldon Feitosa',
                role: 'SUPER_ADMIN',
                tenantId: tenant.id
            }
        });
        console.log('--- ADMIN USER CREATED ---');
    }

    console.log(`User: ${user.email}`);
    console.log(`New Password: admin123`);
    console.log(`Role: ${user.role}`);
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
