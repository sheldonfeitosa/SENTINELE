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
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const prisma = new client_1.PrismaClient();
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        const email = 'sheldonfeitosa@gmail.com';
        const hashedPassword = yield bcryptjs_1.default.hash('admin123', 10);
        // Try to find if user exists first
        let user = yield prisma.user.findUnique({ where: { email } });
        if (user) {
            user = yield prisma.user.update({
                where: { email },
                data: {
                    password: hashedPassword,
                    role: 'SUPER_ADMIN'
                }
            });
            console.log('--- ADMIN PASSWORD RESET ---');
        }
        else {
            // If user doesn't exist, we might need a tenant first
            // In this app, users usually belong to tenants.
            // Let's see if we can find a 'system' tenant or create one.
            let tenant = yield prisma.tenant.findFirst();
            if (!tenant) {
                tenant = yield prisma.tenant.create({
                    data: {
                        name: 'Sentinela AI Admin',
                        slug: 'admin'
                    }
                });
            }
            user = yield prisma.user.create({
                data: {
                    email,
                    password: hashedPassword,
                    name: 'Sheldon Feitosa',
                    role: 'SUPER_ADMIN',
                    tenantId: tenant.id
                }
            });
            console.log('--- ADMIN USER CREATED ---');
        }
        console.log(`User: ${user.email}`);
        console.log(`New Password: admin123`);
        console.log(`Role: ${user.role}`);
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
