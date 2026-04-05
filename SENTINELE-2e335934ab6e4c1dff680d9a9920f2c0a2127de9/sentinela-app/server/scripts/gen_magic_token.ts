import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

const prisma = new PrismaClient();

async function main() {
    const email = 'qualidade@inmceb.med.br';
    const token = crypto.randomBytes(32).toString('hex');
    const expiry = new Date(Date.now() + 3600000); // 1 hour

    await prisma.user.update({
        where: { email },
        data: {
            resetToken: token,
            resetTokenExpiry: expiry
        }
    });

    console.log('MAGIC_TOKEN_START');
    console.log(token);
    console.log('MAGIC_TOKEN_END');
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
