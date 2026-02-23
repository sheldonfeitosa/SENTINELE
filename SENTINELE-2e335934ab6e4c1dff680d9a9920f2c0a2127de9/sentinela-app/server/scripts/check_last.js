
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
    const last = await prisma.incident.findFirst({
        orderBy: { createdAt: 'desc' }
    });
    console.log('ID:', last.id);
}

check().catch(console.error).finally(() => prisma.$disconnect());
