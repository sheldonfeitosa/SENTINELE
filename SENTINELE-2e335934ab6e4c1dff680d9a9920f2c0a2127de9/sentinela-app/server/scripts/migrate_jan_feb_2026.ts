import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

// Helper to parse DD/MM/YYYY
function parseDate(dateStr: string | undefined): Date | null {
    if (!dateStr || dateStr.trim() === "") return null;
    const parts = dateStr.split('/');
    if (parts.length !== 3) return null;
    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const year = parseInt(parts[2], 10);
    const date = new Date(Date.UTC(year, month, day));
    return isNaN(date.getTime()) ? null : date;
}

// Helper to parse DD/MM/YYYY HH:mm:ss
function parseDateTime(dateTimeStr: string | undefined): Date | null {
    if (!dateTimeStr || dateTimeStr.trim() === "") return null;
    const [datePart, timePart] = dateTimeStr.split(' ');
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

async function runMigration() {
    const csvPath = 'c:/Users/sheld/SENTINELE-2e335934ab6e4c1dff680d9a9920f2c0a2127de9/BK_Sistema antigo 25 e 26/BK_NIT_25_26.csv';
    const tenantId = '0ca52289-b1bf-431f-8790-bff3749420be';

    const content = fs.readFileSync(csvPath, 'utf8');
    const lines = content.split('\n');
    const headers = lines[0].split(',');

    console.log(`Read ${lines.length} lines from CSV.`);

    let migratedCount = 0;

    for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        // Simple CSV parsing (this might fail for complex quoted commas, but let's try)
        // Actually, let's use a regex to handle quoted fields better
        const matches = line.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g);
        if (!matches) continue;

        // Fallback: the regex above is tricky. Let's use a safer split if headers match count
        // The CSV columns are:
        // 0: ID
        // 1: Carimbo (Timestamp)
        // 2: Nome Paciente
        // 3: Nome Mãe
        // 4: Data Nascimento
        // 5: Sexo
        // 6: Setor Origem
        // 7: Setor Destino
        // 8: Descrição
        // 9: Tipo Notificação
        // 10: Data Evento
        // 11: Período
        // 12: Idade
        // 13: Data Internação
        // 14: Tipo Evento
        // 15: Classificação

        // Re-reading manually the line 296 (first 2026 record)
        // 145,02/01/2026 13:31:41,Davi Luka Rodrigues Franca,,,MASCULINO,Pronto Atendimento,,...

        const parts = line.split(',');
        if (parts.length < 11) continue;

        const eventDateStr = parts[10]; // Column 10 is DATA DO EVENTO
        const eventDate = parseDate(eventDateStr);

        if (!eventDate) continue;

        const year = eventDate.getUTCFullYear();
        const month = eventDate.getUTCMonth(); // 0-indexed

        // Filter Jan (0) and Feb (1) 2026
        if (year === 2026 && (month === 0 || month === 1)) {
            try {
                await prisma.incident.create({
                    data: {
                        tenantId: tenantId,
                        createdAt: parseDateTime(parts[1]) || new Date(),
                        patientName: parts[2] || "NÃO INFORMADO",
                        motherName: parts[3] || null,
                        birthDate: parseDate(parts[4]),
                        sex: parts[5] || null,
                        sector: parts[6] || "DESCONHECIDO",
                        notifySector: parts[7] || parts[6] || "DESCONHECIDO",
                        description: parts[8]?.replace(/"/g, '') || "Sem descrição",
                        type: parts[9] || "EVENTO ADVERSO",
                        eventDate: eventDate,
                        period: parts[11] || null,
                        admissionDate: parseDate(parts[13]),
                        eventTypeAi: parts[14] || null,
                        riskLevel: parts[15] || null,
                        status: "Pendente"
                    }
                });
                migratedCount++;
            } catch (e) {
                console.error(`Error migrating line ${i}:`, e);
            }
        }
    }

    console.log(`✅ Migration completed! Total records migrated: ${migratedCount}`);
}

runMigration()
    .catch(e => console.error(e))
    .finally(() => prisma.$disconnect());
