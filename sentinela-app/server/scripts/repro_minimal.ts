import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testMinimal() {
    console.log("Testing Minimal Insertion...");
    try {
        const incident = await prisma.incident.create({
            data: {
                patientName: "Teste Minimal",
                eventDate: new Date(),
                sector: "Teste",
                notifySector: "Teste",
                type: "EVENTO ADVERSO",
                description: "Teste de inserção mínima",
            }
        });
        console.log("Success:", incident);
    } catch (error) {
        console.error("Error:", error);
    } finally {
        await prisma.$disconnect();
    }
}

testMinimal();
