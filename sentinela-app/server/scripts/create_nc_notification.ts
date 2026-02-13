import axios from 'axios';

async function createAndVerify() {
    try {
        console.log('Criando notificação via API...');
        const newNotification = {
            paciente: 'Teste API NC',
            nome_mae: 'Mãe Teste',
            data_evento: '2023-10-27',
            setor: 'Farmácia',
            setor_notificado: 'Farmácia',
            tipo_notificacao: 'NÃO CONFORMIDADE',
            descricao: 'Teste de criação via API para verificar skip de IA.',
            email_relator: 'teste@exemplo.com'
        };

        const response = await axios.post('http://localhost:3001/api/notifications', newNotification);
        console.log('Notificação criada com sucesso:', response.data);

        const createdId = response.data.id;

        // Verify immediately
        console.log(`Verificando notificação ID: ${createdId}...`);
        const verifyResponse = await axios.get(`http://localhost:3001/api/notifications/${createdId}`);
        const notification = verifyResponse.data;

        console.log('--- Dados da Notificação ---');
        console.log(`ID: ${notification.id}`);
        console.log(`Tipo: ${notification.type}`);
        console.log(`Tipo Evento (IA): ${notification.eventTypeAi}`);
        console.log('----------------------------');

        if (notification.eventTypeAi === 'N/A') {
            console.log('SUCESSO: IA ignorada corretamente.');
        } else {
            console.log(`FALHA: Esperado 'N/A', recebido '${notification.eventTypeAi}'`);
        }

    } catch (error) {
        console.error('Erro:', error.message);
        if (error.response) {
            console.error('Dados do erro:', error.response.data);
        }
    }
}

createAndVerify();
