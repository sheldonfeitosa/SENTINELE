import dotenv from 'dotenv';
dotenv.config();
import { AuthService } from '../src/services/auth.service';
import { prisma } from '../src/lib/prisma';

async function testMultiUseMagicToken() {
    const authService = new AuthService();
    const testEmail = 'sheldonfeitosa@gmail.com';

    console.log(`--- Starting Multi-use Magic Token Test for ${testEmail} ---`);

    try {
        // 1. Generate a magic token
        console.log('1. Generating magic token...');
        const token = await authService.generateMagicToken(testEmail);
        if (!token) {
            throw new Error('Failed to generate magic token. User might not exist.');
        }
        console.log(`   Token generated: ${token.substring(0, 10)}...`);

        // 2. First login attempt
        console.log('2. First login attempt with token...');
        const firstLogin = await authService.loginWithMagicToken(token);
        console.log('   ✅ First login successful!');

        // 3. Second login attempt (previously this would fail)
        console.log('3. Second login attempt with SAME token...');
        const secondLogin = await authService.loginWithMagicToken(token);
        console.log('   ✅ Second login successful (Multi-use works!)');

        if (firstLogin.user.id !== secondLogin.user.id) {
            throw new Error('User IDs do not match between logins.');
        }

        console.log('--- TEST PASSED SUCCESSFULLY ---');
    } catch (error: any) {
        console.error('--- TEST FAILED ---');
        console.error(error.message);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

testMultiUseMagicToken();
