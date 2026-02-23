import { NotificationService } from './src/services/notification.service';
import { RiskManagerService } from './src/services/risk-manager.service';

async function testEmailWorkflow() {
    const notificationService = new NotificationService();
    const riskManagerService = new RiskManagerService();

    console.log('--- STARTING EMAIL WORKFLOW TEST ---');

    // 1. Create a Risk Manager (Admin) to receive the email
    console.log('\n1. Creating Admin Risk Manager...');
    try {
        await riskManagerService.createManager({
            name: 'Admin Test',
            email: 'admin.test@resend.dev', // Use a testing email
            role: 'ADMIN',
            sectors: ['Qualidade']
        });
    } catch (e) {
        console.log('Admin might already exist, proceeding...');
    }

    // 2. Create a High Management User
    console.log('\n2. Creating High Management User...');
    try {
        await riskManagerService.createManager({
            name: 'Diretor Test',
            email: 'director.test@resend.dev',
            role: 'ALTA_GESTAO',
            sectors: ['Diretoria']
        });
    } catch (e) {
        console.log('Director might already exist, proceeding...');
    }

    // 3. Create a Non-Conformity Notification (Should trigger AI now)
    console.log('\n3. Creating Non-Conformity Notification...');
    const ncData = {
        paciente: 'Teste NC',
        data_evento: new Date().toISOString(),
        setor: 'Farmácia',
        setor_notificado: 'Farmácia',
        tipo_notificacao: 'NÃO CONFORMIDADE',
        descricao: 'Geladeira de medicamentos com temperatura acima do permitido (15°C) por 4 horas.',
        email_relator: 'relator@test.com'
    };

    const nc = await notificationService.createNotification(ncData);
    console.log('NC Created:', nc.id);
    console.log('NC AI Analysis:', nc.aiAnalysis); // Should not be default text anymore

    // 4. Forward to Sector Manager
    console.log('\n4. Forwarding to Sector Manager...');
    await notificationService.forwardToSector(nc.id, 'sector.manager@resend.dev');
    console.log('Forwarded successfully.');

    // 5. Notify High Management
    console.log('\n5. Notifying High Management...');
    await notificationService.notifyHighManagement(nc.id);
    console.log('High Management notified successfully.');

    console.log('\n--- TEST COMPLETE ---');
}

testEmailWorkflow().catch(console.error);
