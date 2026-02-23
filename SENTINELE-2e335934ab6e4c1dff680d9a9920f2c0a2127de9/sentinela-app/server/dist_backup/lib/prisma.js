"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.prisma = void 0;
const client_1 = require("@prisma/client");
const globalForPrisma = global;
let prismaInstance;
try {
    console.log('Attempting to initialize Prisma Client...');
    prismaInstance = globalForPrisma.prisma || new client_1.PrismaClient({
        log: ['query', 'error', 'warn']
    });
    console.log('Prisma Client initialized successfully.');
}
catch (error) {
    console.error('FATAL: Prisma Client initialization failed:', error);
    // Fallback to avoid crash on import, allows /api/health to run
    prismaInstance = new Proxy({}, {
        get: (_target, prop) => {
            return () => {
                const msg = `Database access blocked: Prisma failed to initialize. Error: ${(error === null || error === void 0 ? void 0 : error.message) || 'Unknown'}`;
                console.error(msg);
                return Promise.reject(new Error(msg));
            };
        }
    });
}
exports.prisma = prismaInstance;
if (process.env.NODE_ENV !== 'production')
    globalForPrisma.prisma = exports.prisma;
