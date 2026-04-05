import { PrismaClient } from '@prisma/client';
import fs from 'fs';

const prisma = new PrismaClient();

function parseCSV(content) {
    const records = [];
    let currentField = '';
    let currentRecord = [];
    let inQuotes = false;

    for (let i = 0; i < content.length; i++) {
        const char = content[i];
        const nextChar = content[i + 1];

        if (inQuotes) {
            if (char === '"' && nextChar === '"') {
                currentField += '"';
                i++;
            } else if (char === '"') {
                inQuotes = false;
            } else {
                currentField += char;
            }
        } else {
            if (char === '"') {
                inQuotes = true;
            } else if (char === ',') {
                currentRecord.push(currentField);
                currentField = '';
            } else if (char === '\n' || char === '\r') {
                currentRecord.push(currentField);
                if (currentRecord.length > 1 || (currentRecord.length === 1 && currentRecord[0] !== '')) {
                    records.push(currentRecord);
                }
                currentRecord = [];
                currentField = '';
                if (char === '\r' && nextChar === '\n') i++;
            } else {
                currentField += char;
            }
        }
    }
    if (currentRecord.length > 0 || currentField !== '') {
        currentRecord.push(currentField);
        records.push(currentRecord);
    }
    return records;
}

// Helper to parse DD/MM/YYYY
function parseDate(dateStr) {
    if (!dateStr || dateStr.trim() === "") return null;
    const parts = dateStr.trim().split('/');
    if (parts.length !== 3) return null;
    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const year = parseInt(parts[2], 10);
    const date = new Date(Date.UTC(year, month, day));
    return isNaN(date.getTime()) ? null : date;
}

// Helper to parse DD/MM/YYYY HH:mm:ss
function parseDateTime(dateTimeStr) {
    if (!dateTimeStr || dateTimeStr.trim() === "") return null;
    const [datePart, timePart] = dateTimeStr.trim().split(' ');
    const date = parseDate(datePart);
    if (!date) return null;
    if (timePart) {
        const timeParts = timePart.split(':');
        if (timeParts.length >= 2) {
            date.setUTCHours(parseInt(timeParts[0], 10));
            date.setUTCMinutes(parseInt(timeParts[1], 10));
            if (timeParts[2]) date.setUTCSeconds(parseInt(timeParts[2], 10));
        }
    }
    return date;
}

async function migrate() {
    const csvPath = 'c:/Users/sheld/SENTINELE-2e335934ab6e4c1dff680d9a9920f2c0a2127de9/BK_Sistema antigo 25 e 26/BK_NIT_25_26.csv';
    const tenantId = '0ca52289-b1bf-431f-8790-bff3749420be';

    console.log('--- Iniciando Migração Robusta ---');

    // 1. Limpar dados anteriores do INMCEB
    await prisma.$executeRawUnsafe(`DELETE FROM "Incident" WHERE "tenantId" = $1`, tenantId);
    console.log('🗑️ Banco limpo para o tenant INMCEB.');

    // 2. Ler e parsear CSV
    const content = fs.readFileSync(csvPath, 'utf8');
    const allRecords = parseCSV(content);
    console.log(`📄 Total de linhas processadas: ${allRecords.length}`);

    let count = 0;
    for (let i = 1; i < allRecords.length; i++) {
        const row = allRecords[i];
        const carimbo = row[1];

        // Filtro por Janeiro e Fevereiro de 2026 no Carimbo
        if (carimbo && (carimbo.includes('/01/2026') || carimbo.includes('/02/2026'))) {

            // Se não tem nome do paciente e nem descrição relevante, talvez pular?
            // O usuário disse 38. Se eu encontrar 42, vou importar todos, 
            // mas se houver vazios gritantes eu posso logar.

            const patientName = row[2]?.trim() || "NÃO INFORMADO";
            const description = row[8]?.trim() || "Sem descrição";

            try {
                await prisma.incident.create({
                    data: {
                        tenantId: tenantId,
                        createdAt: parseDateTime(carimbo) || new Date(),
                        patientName: patientName,
                        motherName: row[3]?.trim() || null,
                        birthDate: parseDate(row[4]),
                        sex: row[5]?.trim() || null,
                        sector: row[6]?.trim() || "DESCONHECIDO",
                        notifySector: row[7]?.trim() || row[6]?.trim() || "DESCONHECIDO",
                        description: description,
                        type: row[9]?.trim() || "EVENTO ADVERSO",
                        eventDate: parseDate(row[10]) || parseDate(carimbo.split(' ')[0]) || new Date(),
                        period: row[11]?.trim() || null,
                        admissionDate: parseDate(row[13]),
                        eventTypeAi: row[14]?.trim() || null,
                        riskLevel: row[15]?.trim() || null,
                        status: "Pendente"
                    }
                });
                count++;
            } catch (err) {
                console.error(`❌ Erro na linha ${i} (ID ${row[0]}):`, err.message);
            }
        }
    }

    console.log(`\n✅ Sucesso! Migrados ${count} registros para Jan/Fev 2026.`);
}

migrate()
    .catch(err => console.error('FATAL ERROR:', err))
    .finally(() => prisma.$disconnect());
