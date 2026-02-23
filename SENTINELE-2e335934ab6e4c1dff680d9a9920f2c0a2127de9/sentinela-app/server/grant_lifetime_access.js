const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function grantLifetimeAccess(email) {
    if (!email) {
        console.error('Please provide an email address.');
        console.log('Usage: node grant_lifetime_access.js <email>');
        process.exit(1);
    }

    try {
        let user = await prisma.user.findUnique({
            where: { email: email }
        });

        if (!user) {
            console.log(`User with email ${email} not found. Creating new user...`);

            // Try to import bcrypt, fallback to simple hash if fails (but it should work as per package.json)
            let passwordHash;
            try {
                const bcrypt = require('bcryptjs');
                passwordHash = await bcrypt.hash('Sentinela2024!', 10);
            } catch (e) {
                console.warn('bcryptjs not found, using placeholder hash. User might need reset.');
                passwordHash = '$2b$10$EpOd.zI/kI/wI/wI/wI/wO'; // Fallback
            }

            user = await prisma.user.create({
                data: {
                    email: email,
                    name: email.split('@')[0],
                    password: passwordHash,
                    role: 'USER',
                    tenant: {
                        create: {
                            name: 'Instituição Parceira',
                            slug: email.split('@')[0] + '-' + Math.random().toString(36).substring(7)
                        }
                    }
                }
            });
            console.log(`✅ Created new user.`);
            console.log(`🔑 Temporary Password: Sentinela2024!`);
        }

        // Set subscription to a future date (e.g., 100 years from now)
        const lifetimeEnd = new Date();
        lifetimeEnd.setFullYear(lifetimeEnd.getFullYear() + 100);

        await prisma.user.update({
            where: { email: email },
            data: {
                subscriptionStatus: 'active',
                subscriptionId: 'manual_lifetime_grant',
                stripeCustomerId: 'charity_grant',
                currentPeriodEnd: lifetimeEnd
            }
        });

        console.log(`✅ Success! User ${user.name} (${email}) now has LIFETIME access.`);
        console.log(`Expires on: ${lifetimeEnd.toLocaleDateString()}`);

    } catch (error) {
        console.error('Error granting access:', error);
    } finally {
        await prisma.$disconnect();
    }
}

// Get email from command line argument
const targetEmail = process.argv[2];
grantLifetimeAccess(targetEmail);
