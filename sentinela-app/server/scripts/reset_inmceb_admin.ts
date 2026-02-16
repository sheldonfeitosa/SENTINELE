import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();
const SALT_ROUNDS = 10;

async function main() {
    const email = 'admin@inmceb.med.br';
    const newPassword = 'admin123';

    console.log(`Resetting password for user: ${email}...`);

    try {
        const hashedPassword = await bcrypt.hash(newPassword, SALT_ROUNDS);

        const user = await prisma.user.update({
            where: { email: email },
            data: { password: hashedPassword }
        });

        console.log(`Successfully updated password for ${user.email}`);
        console.log(`New temporary password: ${newPassword}`);
    } catch (error: any) {
        console.error('Error updating password:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

main();
