import dotenv from 'dotenv';
dotenv.config();
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
const prisma = new PrismaClient();

async function main() {
    const email = 'qualidadeinmceb@gmail.com';
    const hashedPassword = await bcrypt.hash('admin123', 10);

    try {
        await prisma.user.update({
            where: { email },
            data: { password: hashedPassword }
        });
        console.log(`Password reset for ${email} to: admin123`);
    } catch (e) {
        console.error(`User ${email} not found or error.`);
    }
}

main()
    .catch(console.error)
    .finally(async () => await prisma.$disconnect());
