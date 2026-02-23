"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
dotenv_1.default.config({ path: path_1.default.resolve(__dirname, '../.env') });
const client_1 = require("@prisma/client");
const fs_1 = __importDefault(require("fs"));
const sync_1 = require("csv-parse/sync");
const prisma = new client_1.PrismaClient();
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        const tenant = yield prisma.tenant.findUnique({ where: { slug: 'inmceb' } });
        if (!tenant)
            throw new Error('Tenant INMCEB not found');
        const csvPath = path_1.default.resolve(__dirname, '../../prisma/import.csv');
        const fileContent = fs_1.default.readFileSync(csvPath, 'utf8');
        const records = (0, sync_1.parse)(fileContent, {
            columns: true,
            skip_empty_lines: true,
        });
        console.log(`🚀 Importing ${records.length} records from CSV...`);
        for (const record of records) {
            // Basic mapping based on column names from your CSV view
            // ID,Carimbo de data/hora,NOME COMPLETO DO PACIENTE,NOME DA MÃE,DATA DE NASCIMENTO,SEXO...
            try {
                yield prisma.incident.create({
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
            }
            catch (err) {
                // Skip errors for individual records (e.g. invalid dates)
            }
        }
        const total = yield prisma.incident.count({ where: { tenantId: tenant.id } });
        console.log(`✅ Finished! Total incidents for INMCEB: ${total}`);
    });
}
main()
    .catch(e => {
    console.error(e);
    process.exit(1);
})
    .finally(() => __awaiter(void 0, void 0, void 0, function* () {
    yield prisma.$disconnect();
}));
