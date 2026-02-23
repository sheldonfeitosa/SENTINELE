import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Starting DB Repair...');

    // 1. Remove specific email if exists
    const targetEmail = 'sheldonfeitosa@gmail.com';
    try {
        const user = await prisma.riskManager.findUnique({
            where: { email: targetEmail }
        });

        if (user) {
            await prisma.riskManager.delete({
                where: { id: user.id }
            });
            console.log(`[DELETED] Manager with email: ${targetEmail}`);
        } else {
            console.log(`[INFO] Email ${targetEmail} not found.`);
        }
    } catch (e) {
        console.error(`[ERROR] deleting ${targetEmail}:`, e);
    }

    // 2. Fix corrupted sectors
    console.log('Checking for corrupted sector data...');
    const managers = await prisma.riskManager.findMany();

    for (const m of managers) {
        let needsFix = false;
        try {
            JSON.parse(m.sectors);
        } catch (e) {
            console.log(`[FIXING] Manager ID ${m.id} (${m.name}) has bad sectors: "${m.sectors}"`);
            needsFix = true;
        }

        if (needsFix) {
            await prisma.riskManager.update({
                where: { id: m.id },
                data: { sectors: '[]' }
            });
            console.log(`[FIXED] Reset sectors for ID ${m.id} to []`);
        }
    }

    console.log('Repair complete.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
