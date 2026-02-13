import axios from 'axios';

async function verifyLastNotification() {
    try {
        const response = await axios.get('http://localhost:3001/api/notifications');
        const notifications = response.data;

        if (notifications.length === 0) {
            console.log('Nenhuma notificação encontrada.');
            return;
        }

        const latest = notifications[notifications.length - 1];

        console.log('--- Última Notificação ---');
        console.log(`ID: ${latest.id}`);
        console.log(`Paciente: ${latest.patientName}`);
        console.log(`Tipo: ${latest.type}`);
        console.log(`Descrição: ${latest.description}`);
        console.log(`Tipo Evento (IA): ${latest.eventTypeAi}`);
        console.log(`Risco (IA): ${latest.riskLevel}`);
        console.log('--------------------------');

        if (latest.patientName === 'Teste NC Skip' && latest.type === 'NÃO CONFORMIDADE') {
            if (latest.eventTypeAi === 'N/A') {
                console.log('SUCESSO: IA ignorada corretamente para Não Conformidade.');
            } else {
                console.log(`FALHA: Esperado 'N/A', recebido '${latest.eventTypeAi}'`);
            }
        } else {
            console.log('AVISO: A última notificação não é a de teste "Teste NC Skip".');
        }

    } catch (error) {
        console.error('Erro ao buscar notificações:', error.message);
    }
}

verifyLastNotification();
