
import { EmailService } from '../src/services/email.service';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

async function massTest() {
    const emailService = new EmailService();
    const targetEmail = 'sheldonfeitosa@gmail.com';

    console.log(`🚀 DISPARO FINAL DE TESTE - TODOS OS TEMPLATES PARA: ${targetEmail}`);

    const dummyIncident = {
        id: "777",
        patientName: "SHELDON FEITOSA (TESTE FINAL)",
        birthDate: "1990-01-01",
        sector: "LABORATÓRIO DE INOVAÇÃO",
        notifySector: "ENGENHARIA",
        type: "VALIDAÇÃO DE SISTEMA",
        riskLevel: "MODERADO",
        description: "Este é um teste final de integração para validar que o mecanismo de fallback está funcionando perfeitamente enquanto o domínio oficial aguarda propagação DNS.",
        aiAnalysis: "Sistema pronto para produção. Fallback ativado com sucesso.",
        eventDate: new Date()
    };

    try {
        console.log('--- Iniciando Sequência ---');

        // 1. Welcome
        await emailService.sendWelcomeEmail(targetEmail, 'Sheldon', 'sentinela2026', 'https://sentinelaai.com.br');
        console.log('✅ Welcome');

        // 2. Incident
        await emailService.sendIncidentNotification(dummyIncident, targetEmail);
        console.log('✅ Incident');

        // 3. Action Request
        await emailService.sendActionRequest(dummyIncident, targetEmail);
        console.log('✅ Action Request');

        // 4. High Management
        await emailService.sendHighManagementReport(dummyIncident, [targetEmail]);
        console.log('✅ High Management');

        // 5. Password Reset
        await emailService.sendPasswordResetEmail(targetEmail, 'Sheldon', 'https://sentinelaai.com.br/reset-password?token=final-check');
        console.log('✅ Password Reset');

        console.log('--- 🏁 Sequência concluída com sucesso! ---');
    } catch (err: any) {
        console.error('❌ Erro na sequência:', err.message);
    }
}

massTest();
