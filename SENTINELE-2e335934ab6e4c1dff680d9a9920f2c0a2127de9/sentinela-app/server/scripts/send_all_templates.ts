
import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(__dirname, '../.env') });
process.env.EMAIL_FROM = 'onboarding@resend.dev';

import { EmailService } from '../src/services/email.service';

async function main() {
    const emailService = new EmailService();
    const targetEmail = 'sheldonfeitosa@gmail.com';

    // Mock Data
    const dummyIncident = {
        id: '999',
        patientName: 'PACIENTE TESTE MODELO',
        birthDate: '1985-05-20',
        type: 'QUEDA DA PRÓPRIA ALTURA',
        riskLevel: 'GRAVE',
        sector: 'UTI CENTRO',
        notifySector: 'ENFERMAGEM',
        description: 'Paciente tentou se locomover sem auxílio e sofreu queda lateral. Escoriações leves detectadas no braço direito.',
        aiAnalysis: 'Revisar protocolo de contenção física se aplicável e garantir que as grades do leito estejam elevadas. Realizar treinamento de prevenção de quedas com a equipe noturna.',
        eventDate: new Date().toISOString()
    };

    console.log(`🚀 Iniciando envio de TODOS os modelos de e-mail para ${targetEmail}...`);

    try {
        // 1. Bem-vindo / Boas-vindas
        console.log('1. Enviando Welcome Email...');
        await emailService.sendWelcomeEmail(targetEmail, 'Sheldon Feitosa', 'SENHA123', 'https://sentinelaai.com.br/login');

        // 2. Notificação de Incidente (Admin/Qualidade)
        console.log('2. Enviando Incident Notification...');
        await emailService.sendIncidentNotification(dummyIncident, targetEmail);

        // 3. Solicitação de Plano de Ação (Gestor de Setor)
        console.log('3. Enviando Action Request...');
        await emailService.sendActionRequest(dummyIncident, targetEmail);

        // 4. Reporte de Escalonação (Alta Gestão)
        console.log('4. Enviando High Management Report...');
        await emailService.sendHighManagementReport(dummyIncident, [targetEmail]);

        // 5. Solicitação de Prazo (Gestor de Risco)
        console.log('5. Enviando Deadline Change Request...');
        await emailService.sendRiskManagerContactEmail(dummyIncident, 'gestor@setor.com', 'Equipe reduzida devido a feriado local.', targetEmail, '25/02/2026');

        // 6. Aprovação de Prazo
        console.log('6. Enviando Deadline Approval...');
        await emailService.sendDeadlineApprovalEmail(dummyIncident, '01/03/2026', targetEmail);

        // 7. Reprovação de Prazo
        console.log('7. Enviando Deadline Rejection...');
        await emailService.sendDeadlineRejectionEmail(dummyIncident, targetEmail);

        // 8. Recuperação de Senha
        console.log('8. Enviando Password Reset...');
        await emailService.sendPasswordResetEmail(targetEmail, 'Sheldon Feitosa', 'https://sentinelaai.com.br/reset-password?token=XYZ');

        // 9. Solicitação de Lead (Internal)
        console.log('9. Enviando Trial Request Notification...');
        await emailService.sendTrialRequestNotification({
            name: 'Luiz Silva',
            hospital: 'Hospital de Testes do Brasil',
            email: 'contato@hospitalteste.com',
            phone: '(11) 98888-7777'
        });

        console.log('\n✅ Todos os 9 modelos foram disparados com sucesso!');
        console.log('Verifique sua caixa de entrada (incluindo Spam/Promoções).');

    } catch (error) {
        console.error('❌ Falha ao disparar bateria de testes de modelos:', error);
    }
}

main();
