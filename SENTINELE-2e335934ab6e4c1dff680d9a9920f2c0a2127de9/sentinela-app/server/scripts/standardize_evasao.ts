import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function standardizeTerms() {
    try {
        // Atualizar strings que contenham "FUGA" para "EVASÃO" no campo eventTypeAi
        const result = await prisma.incident.updateMany({
            where: {
                eventTypeAi: {
                    contains: 'FUGA',
                    mode: 'insensitive'
                }
            },
            data: {
                eventTypeAi: 'EVASÃO DE PACIENTE'
            }
        });

        console.log(`✅ Sucesso! ${result.count} registros foram padronizados para "EVASÃO DE PACIENTE".`);

        // Também verificar se há variações na descrição que a IA possa ter classificado erroneamente no futuro (opcional)

    } catch (err) {
        console.error('❌ Erro ao padronizar termos:', err);
    } finally {
        await prisma.$disconnect();
    }
}

standardizeTerms();
