import { NotificationService } from './src/services/notification.service';
import dotenv from 'dotenv';

dotenv.config();

const service = new NotificationService();

async function runTests() {
    console.log('--- TESTE DE LÓGICA DE NOTIFICAÇÃO ---\n');

    // Test 1: Não Conformidade (Should SKIP AI)
    console.log('TESTE 1: Não Conformidade');
    const ncData = {
        paciente: 'Teste NC',
        setor: 'Farmácia',
        tipo_notificacao: 'NÃO CONFORMIDADE',
        data_evento: '2023-10-27',
        descricao: 'Medicamento vencido encontrado na prateleira.'
    };
    const ncResult = await service.createNotification(ncData);
    console.log('Resultado NC (Esperado: eventTypeAi = "N/A"):');
    console.log(`ID: ${ncResult.id}, Tipo IA: ${ncResult.eventTypeAi}, Risco: ${ncResult.riskLevel}`);
    console.log('--------------------------------------------------\n');

    // Test 2: Evento Adverso (Should TRY AI)
    console.log('TESTE 2: Evento Adverso');
    const eaData = {
        paciente: 'Teste EA',
        setor: 'UTI',
        tipo_notificacao: 'EVENTO ADVERSO',
        data_evento: '2023-10-27',
        descricao: 'Paciente caiu do leito.'
    };
    const eaResult = await service.createNotification(eaData);
    console.log('Resultado EA (Esperado: Tenta AI, falha por chave, retorna fallback ou sucesso se chave ok):');
    console.log(`ID: ${eaResult.id}, Tipo IA: ${eaResult.eventTypeAi}, Risco: ${eaResult.riskLevel}`);
    console.log('--------------------------------------------------\n');
}

runTests();
