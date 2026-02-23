
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
const prisma = new PrismaClient();

async function main() {
    const email = 'sheldonfeitosa@gmail.com';
    const hashedPassword = await bcrypt.hash('admin123', 10);

    const user = await prisma.user.update({
        where: { email },
        data: {
            password: hashedPassword,
            role: 'SUPER_ADMIN'
        }
    });

    console.log('--- ADMIN PASSWORD RESET ---');
    console.log(`User: ${user.email}`);
    console.log(`New Password: admin123`);
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
