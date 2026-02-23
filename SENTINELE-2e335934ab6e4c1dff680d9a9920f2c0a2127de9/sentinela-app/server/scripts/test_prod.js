
const axios = require('axios');

async function testProd() {
    const API_URL = 'https://sentinela-app.vercel.app/api/notifications';

    const data = {
        paciente: "ASDF",
        nascimento: "2026-02-12",
        data_internacao: "2026-02-04",
        data_evento: "2026-02-13",
        periodo: "Tarde",
        setor: "CÂNDIDA",
        descricao: "paciente com hetero agressão agredindo os outros pacientes agrediu o técnico de enfermagem foi chamado G5 feito com tensão mecânica levado para o Pronto Atendimento feito contenção medicamentosa paciente mantém contenção",
        tipo_notificacao: "EVENTO ADVERSO",
        tenantSlug: "inmceb"
    };

    console.log('Sending to:', API_URL);
    try {
        const response = await axios.post(API_URL, data);
        console.log('SUCCESS:', response.data);
    } catch (error) {
        console.error('ERROR status:', error.response?.status);
        console.error('ERROR data:', JSON.stringify(error.response?.data, null, 2));
    }
}

testProd();
