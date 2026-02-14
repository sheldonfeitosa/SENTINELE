
import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(__dirname, '../.env') });

import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import { parse } from 'csv-parse/sync';

const prisma = new PrismaClient();

async function main() {
    const tenant = await prisma.tenant.findUnique({ where: { slug: 'inmceb' } });
    if (!tenant) throw new Error('Tenant INMCEB not found');

    const csvPath = path.resolve(__dirname, '../../prisma/import.csv');
    const fileContent = fs.readFileSync(csvPath, 'utf8');

    const records = parse(fileContent, {
        columns: true,
        skip_empty_lines: true,
    });

    console.log(`🚀 Importing ${records.length} records from CSV...`);

    for (const record of records) {
        // Basic mapping based on column names from your CSV view
        // ID,Carimbo de data/hora,NOME COMPLETO DO PACIENTE,NOME DA MÃE,DATA DE NASCIMENTO,SEXO...
        try {
            await prisma.incident.create({
                data: {
                    tenantId: tenant.id,
                    patientName: record['NOME COMPLETO DO PACIENTE'] || 'Anônimo',
                    motherName: record['NOME DA MÃE'] || null,
                    birthDate: record['DATA DE NASCIMENTO'] ? new Date(record['DATA DE NASCIMENTO']) : null,
                    sex: record['SEXO'] || null,
                    eventDate: record['DATA DO EVENTO'] ? new Date(record['DATA DO EVENTO']) : new Date(),
                    sector: record['SETOR ONDE OCORREU (Origem)'] || 'Não Informado',
                    notifySector: record['SETOR NOTIFICADO (Destino - Vem do Form)'] || 'Não Informado',
                    type: record['TIPO DE NOTIFICAÇÃO (IA: Evento Adverso / Não Conf.)'] || 'EVENTO ADVERSO',
                    description: record['DESCRIÇÃO DETALHADA (Analise da IA)'] || 'Sem descrição',
                    status: 'Concluído', // Set as concluded for history
                    riskLevel: record['CLASSIFICAÇÃO DO EVENTO (IA: Leve, Grave...)'] || 'MODERADO',
                    aiAnalysis: record['RECOMENDAÇÕES DA QUALIDADE (IA: Black Belt)'] || null,
                    eventTypeAi: record['TIPO DE EVENTO (IA: Queda, Erro Medicação...)'] || null,
                    rootCause: record['ANÁLISE DE CAUSA (5 PORQUÊS)'] || null,
                    actionPlan: record['PLANO DE AÇÃO (5W2H)'] || null,
                }
            });
        } catch (err) {
            // Skip errors for individual records (e.g. invalid dates)
        }
    }

    const total = await prisma.incident.count({ where: { tenantId: tenant.id } });
    console.log(`✅ Finished! Total incidents for INMCEB: ${total}`);
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
