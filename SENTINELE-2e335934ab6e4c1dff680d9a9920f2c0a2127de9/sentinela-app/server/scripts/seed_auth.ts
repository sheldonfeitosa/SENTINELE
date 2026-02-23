import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    console.log('Seeding default tenant and user...');

    // 1. Create Default Tenant
    const tenantName = 'Hospital Geral Modelo';
    const tenantSlug = 'hospital-modelo';

    let tenant = await prisma.tenant.findUnique({ where: { slug: tenantSlug } });
    if (!tenant) {
        tenant = await prisma.tenant.create({
            data: {
                name: tenantName,
                slug: tenantSlug
            }
        });
        console.log(`Created Tenant: ${tenant.name} (${tenant.id})`);
    } else {
        console.log(`Tenant already exists: ${tenant.name}`);
    }

    // 2. Create Admin User
    const adminEmail = 'admin@hospital.com';
    const adminPassword = 'admin'; // For demo simplicity
    const hashedPassword = await bcrypt.hash(adminPassword, 10);

    let user = await prisma.user.findUnique({ where: { email: adminEmail } });
    if (!user) {
        user = await prisma.user.create({
            data: {
                name: 'Administrador',
                email: adminEmail,
                password: hashedPassword,
                role: 'TENANT_ADMIN',
                tenantId: tenant.id
            }
        });
        console.log(`Created Admin: ${user.email} (Password: ${adminPassword})`);
    } else {
        console.log(`Admin already exists: ${user.email}`);
    }

    // 3. Create Default Sectors (Optional but helpful)
    const sectors = ['UTI Adulto', 'Emergência', 'Centro Cirúrgico', 'Enfermaria'];
    for (const sectorName of sectors) {
        const exists = await prisma.sector.findUnique({
            where: {
                name_tenantId: {
                    name: sectorName,
                    tenantId: tenant.id
                }
            }
        });

        if (!exists) {
            await prisma.sector.create({
                data: {
                    name: sectorName,
                    tenantId: tenant.id
                }
            });
            console.log(`Created Sector: ${sectorName}`);
        }
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
