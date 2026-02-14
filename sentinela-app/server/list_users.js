require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function listUsers() {
    try {
        const users = await prisma.user.findMany({
            select: {
                id: true,
                email: true,
                name: true,
                subscriptionStatus: true
            }
        });

        console.log('Users in database:');
        users.forEach(user => {
            console.log(`- ID: ${user.id}, Name: ${user.name}, Email: ${user.email}, Sub: ${user.subscriptionStatus}`);
        });

    } catch (error) {
        console.error('Error listing users:', error);
    } finally {
        await prisma.$disconnect();
    }
}

listUsers();
