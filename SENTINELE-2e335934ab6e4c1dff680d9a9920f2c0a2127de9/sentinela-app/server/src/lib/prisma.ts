import { PrismaClient } from '@prisma/client';

const globalForPrisma = global as unknown as { prisma: PrismaClient };

let prismaInstance: PrismaClient;

try {
    console.log('Attempting to initialize Prisma Client...');
    prismaInstance = globalForPrisma.prisma || new PrismaClient({
        log: ['query', 'error', 'warn']
    });
    console.log('Prisma Client initialized successfully.');
} catch (error: any) {
    console.error('FATAL: Prisma Client initialization failed:', error);
    // Fallback to avoid crash on import, allows /api/health to run
    prismaInstance = new Proxy({} as PrismaClient, {
        get: (_target, prop) => {
            return () => {
                const msg = `Database access blocked: Prisma failed to initialize. Error: ${error?.message || 'Unknown'}`;
                console.error(msg);
                return Promise.reject(new Error(msg));
            };
        }
    });
}

export const prisma = prismaInstance;

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
