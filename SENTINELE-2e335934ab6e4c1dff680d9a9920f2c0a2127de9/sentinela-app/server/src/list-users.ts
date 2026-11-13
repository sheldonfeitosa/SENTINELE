
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
const prisma = new PrismaClient();

async function main() {
    // Uso: npx ts-node src/list-users.ts <email>  (ou ADMIN_EMAIL). A senha nova e aleatoria e aparece uma unica vez.
    const email = process.argv[2] || process.env.ADMIN_EMAIL;
    if (!email) throw new Error('Informe o e-mail: npx ts-node src/list-users.ts <email>');
    const newPassword = require('crypto').randomBytes(12).toString('base64url');
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    const user = await prisma.user.update({
        where: { email },
        data: {
            password: hashedPassword,
            role: 'SUPER_ADMIN'
        }
    });

    console.log('--- ADMIN PASSWORD RESET ---');
    console.log(`User: ${user.email}`);
    console.log(`New Password: ${newPassword}`);
    console.log(`Role: ${user.role}`);
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
