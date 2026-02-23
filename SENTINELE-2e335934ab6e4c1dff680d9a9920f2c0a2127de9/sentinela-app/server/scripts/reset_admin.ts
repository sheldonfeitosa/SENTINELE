import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    const email = 'admin@hospital.com';
    const password = 'admin';
    const hashedPassword = await bcrypt.hash(password, 10);

    console.log(`Searching for user: ${email}...`);

    // Check if tenant exists, if not create basic one
    let tenant = await prisma.tenant.findFirst();
    if (!tenant) {
        console.log("No tenant found. Creating default tenant...");
        tenant = await prisma.tenant.create({
            data: {
                name: 'Hospital Geral Modelo',
                slug: 'hospital-modelo'
            }
        });
    }

    const user = await prisma.user.findUnique({
        where: { email }
    });

    if (user) {
        console.log(`User found. Resetting password...`);
        await prisma.user.update({
            where: { email },
            data: { password: hashedPassword }
        });
        console.log(`Password reset successfully for ${email}`);
    } else {
        console.log(`User not found. Creating user...`);
        await prisma.user.create({
            data: {
                name: 'Administrador',
                email,
                password: hashedPassword,
                role: 'TENANT_ADMIN',
                tenantId: tenant.id
            }
        });
        console.log(`User created successfully: ${email}`);
    }
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
