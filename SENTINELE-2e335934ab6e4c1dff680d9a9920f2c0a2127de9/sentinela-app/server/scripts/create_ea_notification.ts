import axios from 'axios';

async function createAndVerifyEA() {
    try {
        console.log('Criando notificação EA via API...');
        const newNotification = {
            paciente: "Maria Silva (Teste RCA)",
            data_nascimento: "1950-05-15",
            sexo: "F",
            data_internacao: "2023-10-01",
            setor: "Psiquiatria A",
            setor_notificado: "Enfermagem",
            tipo_notificacao: "EVENTO ADVERSO",
            data_evento: "2023-10-27",
            hora_evento: "14:30",
            descricao: "Paciente sofreu queda da própria altura no banheiro. Relatou tontura ao levantar. Grades estavam baixas.",
            acao_imediata: "Avaliação médica realizada.",
            email_relator: "teste@hospital.com.br"
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

        if (notification.eventTypeAi === 'EM ANÁLISE') {
            console.log('SUCESSO: Tentou IA (retornou padrão EM ANÁLISE devido a erro de chave).');
        } else if (notification.eventTypeAi !== 'N/A') {
            console.log(`SUCESSO PARCIAL: Valor diferente de N/A (${notification.eventTypeAi}).`);
        } else {
            console.log(`FALHA: Recebeu 'N/A', o que indica que pulou a IA incorretamente.`);
        }

    } catch (error: any) {
        console.error('Erro:', error.message);
        if (error.response) {
            console.error('Response Status:', error.response.status);
            console.error('Response Data:', error.response.data);
        }
    }
}

createAndVerifyEA();
