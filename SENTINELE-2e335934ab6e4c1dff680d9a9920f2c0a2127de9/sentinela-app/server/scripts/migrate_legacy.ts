import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const CSV_PATH = path.join('C:', 'Users', 'sheld', 'sentinela ai', 'sentinela', 'scratch', 'adverse_event_system', 'bando de dados', 'SENTINE AI - DATA.csv');

async function migrate() {
    console.log('🚀 Starting migration...');

    // 1. Clear Database
    console.log('🗑️  Clearing existing incidents...');
    await prisma.incident.deleteMany({});
    console.log('✅ Database cleared.');

    // 2. Read and Parse CSV
    console.log(`📂 Reading CSV from: ${CSV_PATH}`);
    const records: any[] = [];

    const parser = fs.createReadStream(CSV_PATH).pipe(parse({
        columns: true,
        skip_empty_lines: true,
        trim: true
    }));

    for await (const record of parser) {
        records.push(record);
    }

    console.log(`📊 Found ${records.length} records to import.`);

    // 3. Import Records
    let successCount = 0;
    let errorCount = 0;

    for (const row of records) {
        try {
            // Map CSV columns to Prisma model
            // "07/04/2025 16:05:06" -> Date object
            const eventDateStr = row['DATA DO EVENTO'] || '';
            const createdAtStr = row['Carimbo de data/hora'] || '';

            // Helper to parse DD/MM/YYYY HH:mm:ss
            const parseDate = (dateStr: string) => {
                if (!dateStr) return new Date();
                const [datePart, timePart] = dateStr.split(' ');
                const [day, month, year] = datePart.split('/');
                const [hour, minute, second] = (timePart || '00:00:00').split(':');
                return new Date(Number(year), Number(month) - 1, Number(day), Number(hour || 0), Number(minute || 0), Number(second || 0));
            };

            const data = {
                tenantId: 'default-tenant-id', // Placeholder to satisfy schema
                createdAt: parseDate(createdAtStr),
                patientName: row['NOME COMPLETO DO PACIENTE'] || 'Não Identificado',
                motherName: row['NOME DA MÃE'] || null,
                birthDate: row['DATA DE NASCIMENTO'] ? parseDate(row['DATA DE NASCIMENTO']) : null,
                sex: row['SEXO'] || null,
                // admissionDate: Not in CSV clearly, skip or null
                eventDate: parseDate(eventDateStr),
                period: row['PERÍODO'] || null,
                sector: row['SETOR ONDE OCORREU (Origem)'] || 'Não Informado',
                notifySector: row['SETOR NOTIFICADO (Destino - Vem do Form)'] || 'Não Informado',
                type: row['TIPO DE NOTIFICAÇÃO (IA: Evento Adverso / Não Conf.)'] || 'EVENTO ADVERSO',
                description: row['DESCRIÇÃO DETALHADA (Analise da IA)'] || '',
                reporterEmail: row['EMAIL 1'] || null,
                status: 'Concluído', // Assuming legacy data is mostly closed/historical

                // AI Fields
                eventTypeAi: row['TIPO DE EVENTO (IA: Queda, Erro Medicação...)'] || null,
                riskLevel: row['CLASSIFICAÇÃO DO EVENTO (IA: Leve, Grave...)'] || null,

                // Action Plan / Investigation
                rootCause: row['ANÁLISE DE CAUSA (5 PORQUÊS)'] || null,
                actionPlan: row['PLANO DE AÇÃO (5W2H)'] || null,
                actionPlanStatus: row['PLANO DE AÇÃO (5W2H)'] ? 'COMPLETED' : 'NOT_STARTED',
                // actionPlanDeadline: row['PRAZO PARA TRATATIVA (Calculado Automático)'] ? parseDate(row['PRAZO PARA TRATATIVA (Calculado Automático)']) : null
            };

            await prisma.incident.create({ data });
            successCount++;
        } catch (error) {
            console.error(`❌ Failed to import record ID ${row['ID']}:`, error);
            errorCount++;
        }
    }

    console.log(`\n🎉 Migration finished!`);
    console.log(`✅ Success: ${successCount}`);
    console.log(`❌ Errors: ${errorCount}`);
}

migrate()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
