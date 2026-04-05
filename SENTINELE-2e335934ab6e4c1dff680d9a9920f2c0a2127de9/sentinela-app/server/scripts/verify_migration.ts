import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function verifyMigration() {
    const tenantId = '0ca52289-b1bf-431+8790-bff3749420be'; // Actually use the correct one from before
    // Let's just find by tenantId directly
    const idFromScript = '0ca52289-b1bf-431f-8790-bff3749420be';

    try {
        const incidents = await prisma.incident.findMany({
            where: { tenantId: idFromScript },
            select: {
                id: true,
                patientName: true,
                eventDate: true,
                description: true
            },
            orderBy: { eventDate: 'asc' }
        });

        console.log(`Summary of Migrated Incidents (${incidents.length} found):`);
        incidents.forEach(inc => {
            console.log(`- ID: ${inc.id} | Date: ${inc.eventDate.toISOString().split('T')[0]} | Patient: ${inc.patientName}`);
        });
    } catch (err) {
        console.error('Error verifying migration:', err);
    } finally {
        await prisma.$disconnect();
    }
}

verifyMigration();
