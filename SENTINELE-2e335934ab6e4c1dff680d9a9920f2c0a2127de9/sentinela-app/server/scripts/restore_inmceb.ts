import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const p = new PrismaClient();

async function restoreINMCEB() {
    const tenantId = '0ca52289-b1bf-431f-8790-bff3749420be';
    try {
        console.log('Restoring INMCEB tenant...');

        const tenant = await p.tenant.upsert({
            where: { id: tenantId },
            create: {
                id: tenantId,
                name: 'INMCEB',
                slug: 'inmceb',
                createdAt: new Date('2026-02-11T23:07:06.740Z')
            },
            update: {}
        });

        console.log('Tenant restored:', tenant);

        const hashedPassword = await bcrypt.hash('123456', 10);
        const email = 'qualidade@inmceb.med.br';
        const user = await p.user.upsert({
            where: { email },
            create: {
                email,
                name: 'Gestor de Qualidade INMCEB',
                password: hashedPassword,
                role: 'TENANT_ADMIN',
                tenantId: tenant.id
            },
            update: {}
        });

        console.log('Admin user restored:', user.email);

        console.log('✅ INMCEB Restored Successfully!');
    } catch (err) {
        console.error('❌ Error restoring INMCEB:', err);
    } finally {
        await p.$disconnect();
    }
}

restoreINMCEB();
