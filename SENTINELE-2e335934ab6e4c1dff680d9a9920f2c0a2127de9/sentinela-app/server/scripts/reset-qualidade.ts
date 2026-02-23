
import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(__dirname, '../.env') });

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    const email = 'qualidade@inmceb.med.br';
    const password = '123456';
    const hashedPassword = await bcrypt.hash(password, 10);

    // Try to find if user exists first
    let user = await prisma.user.findUnique({ where: { email } });

    if (user) {
        user = await prisma.user.update({
            where: { email },
            data: {
                password: hashedPassword,
            }
        });
        console.log(`--- PASSWORD RESET SUCCESSFUL ---`);
    } else {
        // If user doesn't exist, we need a tenant.
        let tenant = await prisma.tenant.findFirst();
        if (!tenant) {
            // Create default tenant if none exists
            tenant = await prisma.tenant.create({
                data: {
                    name: 'Hospital Geral Default',
                    slug: 'hospital-default'
                }
            });
            console.log('Created default tenant for user.');
        }

        user = await prisma.user.create({
            data: {
                email,
                password: hashedPassword,
                name: 'Gestor de Qualidade',
                role: 'TENANT_ADMIN',
                tenantId: tenant.id
            }
        });
        console.log('--- USER CREATED ---');
    }

    console.log(`User: ${user.email}`);
    console.log(`New Password: ${password}`);
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
