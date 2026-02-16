
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { NotificationService } = require('./dist/services/notification.service');

async function testMultipleManagers() {
    console.log('--- Starting Multiple Managers Notification Test ---');
    const tenantSlug = 'test-hospital-' + Date.now();

    try {
        // 1. Create a Test Tenant
        console.log('Creating test tenant...');
        const tenant = await prisma.tenant.create({
            data: {
                name: 'Hospital de Teste Multi-Gestor',
                slug: tenantSlug,
                contactEmail: 'admin@test.com'
            }
        });
        console.log('Tenant created:', tenant.id);

        // 2. Create Two Managers for same sector
        console.log('Creating managers...');
        const manager1 = await prisma.user.create({
            data: {
                name: 'Gestor 1',
                email: `gestor1.${Date.now()}@test.com`,
                password: 'hashedpassword',
                role: 'GESTOR_SETOR',
                sectors: JSON.stringify(['UTI']),
                tenantId: tenant.id
            }
        });

        const manager2 = await prisma.user.create({
            data: {
                name: 'Gestor 2',
                email: `gestor2.${Date.now()}@test.com`,
                password: 'hashedpassword',
                role: 'GESTOR_SETOR',
                sectors: 'UTI', // Test string format too
                tenantId: tenant.id
            }
        });
        console.log('Managers created:', manager1.email, manager2.email);

        // 3. Create Incident
        console.log('Creating incident for UTI...');
        const service = new NotificationService();

        // Mock email service to avoid actual sending but log calls
        service.emailService = {
            sendActionRequest: async (notification, email) => {
                console.log(`[MOCK EMAIL] Sending Action Request to: ${email}`);
                return { success: true };
            },
            sendIncidentNotification: async () => {
                console.log(`[MOCK EMAIL] Sending Incident Notification (Risk Manager)`);
            }
        };

        const incidentData = {
            tipo_notificacao: 'INCIDENTE',
            paciente: 'Paciente Teste',
            setor_notificado: 'UTI',
            descricao: 'Teste de notificação múltipla',
            tenantSlug: tenantSlug
        };

        await service.createNotification(incidentData);

        console.log('--- Test Finished ---');

    } catch (error) {
        console.error('Test Failed:', error);
    } finally {
        // Cleanup would go here, skipping for now to allow inspection if needed
        await prisma.$disconnect();
    }
}

testMultipleManagers();
