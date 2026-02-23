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
dotenv_1.default.config({ path: path_1.default.resolve(__dirname, '../../.env') });
const client_1 = require("@prisma/client");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const prisma = new client_1.PrismaClient();
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        console.log('🚀 Starting Migration to INMCEB...');
        // 1. Find or Create INMCEB Tenant
        let tenant = yield prisma.tenant.findUnique({ where: { slug: 'inmceb' } });
        if (!tenant) {
            tenant = yield prisma.tenant.create({
                data: {
                    name: 'INMCEB - Instituto de Medicina de Central Brasileira',
                    slug: 'inmceb'
                }
            });
            console.log('✅ Created INMCEB Tenant');
        }
        else {
            console.log('ℹ️ INMCEB Tenant already exists');
        }
        // 2. Resolve orphaned Incidents
        // Records without a tenantId (if somehow bypass schema) or default ones
        // Since schema requires tenantId, they might belong to another tenant.
        // We'll move all incidents to INMCEB for this "isolation" task as requested.
        const allIncidents = yield prisma.incident.findMany();
        console.log(`📊 Found ${allIncidents.length} total incidents.`);
        if (allIncidents.length > 0) {
            const updateResult = yield prisma.incident.updateMany({
                where: { NOT: { tenantId: tenant.id } },
                data: { tenantId: tenant.id }
            });
            console.log(`✅ Migrated ${updateResult.count} incidents to INMCEB`);
        }
        // 3. Ensure Sheldon has access to INMCEB
        const email = 'sheldonfeitosa@gmail.com';
        let sheldon = yield prisma.user.findUnique({ where: { email } });
        if (sheldon) {
            yield prisma.user.update({
                where: { email },
                data: {
                    tenantId: tenant.id,
                    // We keep him as SUPER_ADMIN if he is, but associate with INMCEB for operational visibility
                }
            });
            console.log('✅ Associated Sheldon with INMCEB');
        }
        // 4. Create an INMCEB Admin User for testing isolation
        const adminEmail = 'admin@inmceb.med.br';
        const hashedPassword = yield bcryptjs_1.default.hash('inmceb123', 10);
        const inmcebAdmin = yield prisma.user.upsert({
            where: { email: adminEmail },
            update: { tenantId: tenant.id, role: 'TENANT_ADMIN' },
            create: {
                email: adminEmail,
                password: hashedPassword,
                name: 'Administrador INMCEB',
                role: 'TENANT_ADMIN',
                tenantId: tenant.id
            }
        });
        console.log(`✅ INMCEB Admin User Ready: ${adminEmail} / inmceb123`);
        console.log('🎉 Migration Finished!');
    });
}
main()
    .catch(e => {
    console.error('❌ Migration Failed:', e);
    process.exit(1);
})
    .finally(() => __awaiter(void 0, void 0, void 0, function* () {
    yield prisma.$disconnect();
}));
