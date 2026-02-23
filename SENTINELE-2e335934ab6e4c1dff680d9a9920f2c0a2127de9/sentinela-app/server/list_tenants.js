const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const tenants = await prisma.tenant.findMany({
        select: { id: true, name: true, slug: true }
    });
    console.log('=== TENANTS ===');
    for (const t of tenants) {
        console.log(`Name: ${t.name} | Slug: ${t.slug} | ID: ${t.id}`);
        console.log(`  URL publica: https://sentinelaai.com.br/n/${t.slug}`);
    }
}

main().catch(console.error).finally(() => prisma.$disconnect());
