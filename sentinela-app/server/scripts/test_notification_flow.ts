import { NotificationService } from './src/services/notification.service';
import dotenv from 'dotenv';

dotenv.config();

const service = new NotificationService();

async function test() {
    console.log('🚀 Starting Notification Flow Test...');
    console.log('Target Email (from env):', process.env.RISK_MANAGER_EMAIL);

    const mockData = {
        paciente: "TESTE AUTOMATIZADO EMAIL",
        data_evento: new Date().toISOString(),
        setor: "Emergência",
        tipo_notificacao: "Incidente",
        descricao: "Teste de envio de email para Gestor de Risco. Por favor ignorar.",
        classificacao: "BAIXO",
        setor_notificado: "Farmácia"
    };

    try {
        const result = await service.createNotification(mockData);
        console.log('✅ Notification Created:', result.id);
        console.log('📧 Check the console logs above for email sending confirmation.');
    } catch (error) {
        console.error('❌ Error:', error);
    }
}

test();
