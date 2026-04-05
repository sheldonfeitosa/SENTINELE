import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function migrateData() {
    const tenantId = '0ca52289-b1bf-431f-8790-bff3749420be';

    // Mapeamento correto para o modelo Incident no schema.prisma
    const dataToMigrate = {
        tenantId: tenantId,
        patientName: "DAVI LUKA RODRIGUES FRANCA",
        motherName: "ALINE CARLA RODRIGUES FRANCA",
        birthDate: new Date("2013-04-22T00:00:00Z"),
        sex: "MASCULINO",
        admissionDate: new Date("2026-01-01T00:00:00Z"),
        eventDate: new Date("2026-01-01T09:00:00Z"), // Incidente ocorreu em 01/01/2026
        period: "MANHÃ",
        sector: "Pronto Atendimento",
        notifySector: "Pronto Atendimento", // Usando o mesmo para simplificar
        type: "EVENTO ADVERSO",
        description: "Paciente apresentou grave crise de APM, jogando a refeição no chão e móveis e danificando o computador. Necessitou de suporte intenso da equipe (CMA e SOS). Abordagem realizada por Célio, Elizenir, Vitória, Moiseys, Juliana e Marinalva. Tentativa de contato com médico (Dr. Wanderley) sem sucesso.",
        status: "Pendente",
        eventTypeAi: "AGRESSIVIDADE / DANO PATRIMÔNIO",
        riskLevel: "GRAVE",
        createdAt: new Date("2026-01-02T13:31:41Z")
    };

    try {
        const incident = await prisma.incident.create({
            data: dataToMigrate
        });
        console.log(`✅ Sucesso! Incidente migrado com ID: ${incident.id}`);
    } catch (err) {
        console.error(`❌ Erro na migração:`, err);
    } finally {
        await prisma.$disconnect();
    }
}

migrateData();
