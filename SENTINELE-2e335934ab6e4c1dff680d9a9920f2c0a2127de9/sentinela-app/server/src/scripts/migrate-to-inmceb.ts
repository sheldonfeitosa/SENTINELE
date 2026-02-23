
import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    console.log('🚀 Starting Migration to INMCEB...');

    // 1. Find or Create INMCEB Tenant
    let tenant = await prisma.tenant.findUnique({ where: { slug: 'inmceb' } });
    if (!tenant) {
        tenant = await prisma.tenant.create({
            data: {
                name: 'INMCEB - Instituto de Medicina de Central Brasileira',
                slug: 'inmceb'
            }
        });
        console.log('✅ Created INMCEB Tenant');
    } else {
        console.log('ℹ️ INMCEB Tenant already exists');
    }

    // 2. Resolve orphaned Incidents
    // Records without a tenantId (if somehow bypass schema) or default ones
    // Since schema requires tenantId, they might belong to another tenant.
    // We'll move all incidents to INMCEB for this "isolation" task as requested.
    const allIncidents = await prisma.incident.findMany();
    console.log(`📊 Found ${allIncidents.length} total incidents.`);

    if (allIncidents.length > 0) {
        const updateResult = await prisma.incident.updateMany({
            where: { NOT: { tenantId: tenant.id } },
            data: { tenantId: tenant.id }
        });
        console.log(`✅ Migrated ${updateResult.count} incidents to INMCEB`);
    }

    // 3. Ensure Sheldon has access to INMCEB
    const email = 'sheldonfeitosa@gmail.com';
    let sheldon = await prisma.user.findUnique({ where: { email } });

    if (sheldon) {
        await prisma.user.update({
            where: { email },
            data: {
                tenantId: tenant.id,
                // We keep him as SUPER_ADMIN if he is, but associate with INMCEB for operational visibility
            }
        });
        console.log('✅ Associated Sheldon with INMCEB');
    }

    // 4. Create an INMCEB Admin User for testing isolation
    const adminEmail = 'admin@inmceb.med.br';
    const hashedPassword = await bcrypt.hash('inmceb123', 10);

    const inmcebAdmin = await prisma.user.upsert({
        where: { email: adminEmail },
        update: { tenantId: tenant.id, role: 'TENANT_ADMIN' },
        create: {
            email: adminEmail,
            password: hashedPassword,
            name: 'Administrador INMCEB',
            role: 'TENANT_ADMIN',
            tenantId: tenant.id
        }
    });
    console.log(`✅ INMCEB Admin User Ready: ${adminEmail} / inmceb123`);

    console.log('🎉 Migration Finished!');
}

main()
    .catch(e => {
        console.error('❌ Migration Failed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
