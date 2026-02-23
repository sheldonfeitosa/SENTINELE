
const { EmailService } = require('../src/services/email.service');
const dotenv = require('dotenv');
const path = require('path');

// Configure dotenv
dotenv.config({ path: path.resolve(__dirname, '../.env') });

async function testAllEmails() {
    const emailService = new EmailService();
    const targetEmail = 'sheldonfeitosa@gmail.com';

    console.log(`🚀 Iniciando disparo de TODOS os templates de e-mail para: ${targetEmail}`);

    const dummyIncident = {
        id: 999,
        patientName: 'PACIENTE TESTE COMPLETO',
        birthDate: '1990-01-01',
        sector: 'UTI ADULTO',
        notifySector: 'QUALIDADE',
        type: 'QUEDA DA PRÓPRIA ALTURA',
        riskLevel: 'GRAVE',
        description: 'Descrição de teste para validar o layout de todos os e-mails disparados pelo sistema Sentinela AI.',
        aiAnalysis: 'Recomendação de teste gerada pela IA para validar o campo no template de e-mail.',
        eventDate: new Date()
    };

    try {
        // 1. Welcome Email
        console.log('--- 1/9: Enviando Welcome Email...');
        await emailService.sendWelcomeEmail(targetEmail, 'Sheldon Feitosa', 'senha123', 'https://sentinelaai.com.br/login');

        // 2. Incident Notification (Operacional)
        console.log('--- 2/9: Enviando Notificação de Incidente...');
        await emailService.sendIncidentNotification(dummyIncident, targetEmail);

        // 3. Action Request (Encaminhamento)
        console.log('--- 3/9: Enviando Solicitação de Ação...');
        await emailService.sendActionRequest(dummyIncident, targetEmail);

        // 4. High Management Report (Escalonamento)
        console.log('--- 4/9: Enviando Reporte Alta Gestão...');
        await emailService.sendHighManagementReport(dummyIncident, [targetEmail]);

        // 5. Risk Manager Contact (Solicitação de Prazo)
        console.log('--- 5/9: Enviando Solicitação de Prazo...');
        await emailService.sendRiskManagerContactEmail(dummyIncident, targetEmail, 'Necessito de mais tempo devido à complexidade da investigação.', targetEmail, '20/02/2026');

        // 6. Deadline Approval
        console.log('--- 6/9: Enviando Deferimento de Prazo...');
        await emailService.sendDeadlineApprovalEmail(dummyIncident, '25/02/2026', targetEmail);

        // 7. Deadline Rejection
        console.log('--- 7/9: Enviando Indeferimento de Prazo...');
        await emailService.sendDeadlineRejectionEmail(dummyIncident, targetEmail);

        // 8. Password Reset (Novo Fluxo Seguro)
        console.log('--- 8/9: Enviando Reset de Senha...');
        await emailService.sendPasswordResetEmail(targetEmail, 'Sheldon Feitosa', 'https://sentinelaai.com.br/reset-password?token=token-teste-123');

        // 9. Trial Request (Lead)
        console.log('--- 9/9: Enviando Notificação de Lead...');
        await emailService.sendTrialRequestNotification({
            name: 'Lead de Vendas',
            hospital: 'Hospital de Teste S.A.',
            email: 'contato@vendas.com',
            phone: '(11) 99999-9999'
        });

        console.log('\n✅ TODOS os e-mails foram processados e enviados para a fila!');
    } catch (error) {
        console.error('\n❌ Erro durante o disparo de testes:', error.message || error);
    }
}

testAllEmails();
