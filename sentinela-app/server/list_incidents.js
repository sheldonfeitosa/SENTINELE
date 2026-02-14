require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function listIncidents() {
    try {
        const incidents = await prisma.incident.findMany({
            take: 5,
            orderBy: { createdAt: 'desc' },
            select: { id: true, patientName: true, description: true }
        });

        console.log('Recent incidents:');
        incidents.forEach(i => console.log(`ID: ${i.id}, Patient: ${i.patientName}`));

        if (incidents.length > 0) {
            const id = incidents[0].id;
            console.log(`\nTo trigger re-analysis, hit: https://sentinela-app-eta.vercel.app/api/notifications/${id}/reanalyze`);
        }

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

listIncidents();
