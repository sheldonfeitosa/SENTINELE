
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

    const csvPath = path.resolve(__dirname, '../../../../SENTINE AI - DATA (2).csv');
    const fileContent = fs.readFileSync(csvPath, 'utf8');

    const records = parse(fileContent, {
        columns: true,
        skip_empty_lines: true,
    });

    console.log(`🚀 Re-Importing records from NEW CSV: ${csvPath}`);

    // Clear previous imports to avoid duplication if needed, 
    // but for safety we'll just add. Or we can clear incidents for this tenant.
    await prisma.incident.deleteMany({ where: { tenantId: tenant.id } });
    console.log('🧹 Cleared previous INMCEB incidents.');

    let successCount = 0;
    let errorCount = 0;

    for (const record of records) {
        try {
            const patientName = record['NOME COMPLETO DO PACIENTE'] || record['NOME COMPLETO DO PACIENTE'] || 'Anônimo';
            const description = record['DESCRIÇÃO DETALHADA (Analise da IA)'] || 'Sem descrição';

            // Skip empty records if ID is missing or all key fields are empty
            if (!record['ID'] && !patientName && !description) continue;

            await prisma.incident.create({
                data: {
                    tenantId: tenant.id,
                    patientName: patientName.substring(0, 255),
                    motherName: record['NOME DA MÃE'] ? record['NOME DA MÃE'].substring(0, 255) : null,
                    birthDate: record['DATA DE NASCIMENTO'] ? new Date(record['DATA DE NASCIMENTO'].split('/').reverse().join('-')) : null,
                    sex: record['SEXO'] || null,
                    eventDate: record['DATA DO EVENTO'] ? new Date(record['DATA DO EVENTO'].split('/').reverse().join('-')) : new Date(),
                    sector: record['SETOR ONDE OCORREU (Origem)'] || 'Não Informado',
                    notifySector: record['SETOR NOTIFICADO (Destino - Vem do Form)'] || 'Não Informado',
                    type: record['TIPO DE NOTIFICAÇÃO (IA: Evento Adverso / Não Conf.)'] || 'EVENTO ADVERSO',
                    description: description,
                    status: 'Concluído',
                    riskLevel: record['CLASSIFICAÇÃO DO EVENTO (IA: Leve, Grave...)'] || 'MODERADO',
                    aiAnalysis: record['RECOMENDAÇÕES DA QUALIDADE (IA: Black Belt)'] || null,
                    eventTypeAi: record['TIPO DE EVENTO (IA: Queda, Erro Medicação...)'] || null,
                    rootCause: record['ANÁLISE DE CAUSA (5 PORQUÊS)'] || null,
                    actionPlan: record['PLANO DE AÇÃO (5W2H)'] || null,
                }
            });
            successCount++;
        } catch (err: any) {
            errorCount++;
            // console.error(`Failed to import record: ${err.message}`);
        }
    }

    const total = await prisma.incident.count({ where: { tenantId: tenant.id } });
    console.log(`✅ Finished! Success: ${successCount}, Errors: ${errorCount}`);
    console.log(`📊 Total incidents for INMCEB in DB: ${total}`);
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
