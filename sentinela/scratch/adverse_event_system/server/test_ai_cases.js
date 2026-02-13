const axios = require('axios');

const cases = [
    {
        type: "N/C",
        data: {
            paciente: "Teste NC 1",
            nome_mae: "Mãe Teste",
            nascimento: "1980-01-01",
            sexo: "Masculino",
            setor: "ENFERMARIA",
            setor_notificado: "ENFERMARIA",
            periodo: "Noite",
            data_internacao: "2025-01-01",
            data_evento: "2025-11-26",
            descricao: "Grade da cama estava abaixada durante a ronda noturna, mas o paciente estava dormindo e não caiu."
        }
    },
    {
        type: "N/C",
        data: {
            paciente: "Teste NC 2",
            nome_mae: "Mãe Teste",
            nascimento: "1980-01-01",
            sexo: "Feminino",
            setor: "FARMÁCIA",
            setor_notificado: "FARMÁCIA",
            periodo: "Manhã",
            data_internacao: "2025-01-01",
            data_evento: "2025-11-26",
            descricao: "Medicamento Clonazepam atrasou 2 horas por falta na farmácia satélite. Foi administrado posteriormente sem intercorrências clínicas para o paciente."
        }
    },
    {
        type: "N/C",
        data: {
            paciente: "Teste NC 3",
            nome_mae: "Mãe Teste",
            nascimento: "1980-01-01",
            sexo: "Masculino",
            setor: "RECEPÇÃO",
            setor_notificado: "SEGURANÇA",
            periodo: "Tarde",
            data_internacao: "2025-01-01",
            data_evento: "2025-11-26",
            descricao: "Paciente tentou sair correndo pela portaria principal (evasão), mas foi contido verbalmente pelo segurança antes de passar pelo portão."
        }
    },
    {
        type: "EA",
        data: {
            paciente: "Teste EA 1",
            nome_mae: "Mãe Teste",
            nascimento: "1980-01-01",
            sexo: "Masculino",
            setor: "BANHEIRO",
            setor_notificado: "ENFERMARIA",
            periodo: "Manhã",
            data_internacao: "2025-01-01",
            data_evento: "2025-11-26",
            descricao: "Paciente escorregou no banheiro molhado e bateu a cabeça, resultando em corte no supercílio. Necessitou de sutura (3 pontos)."
        }
    },
    {
        type: "EA",
        data: {
            paciente: "Teste EA 2",
            nome_mae: "Mãe Teste",
            nascimento: "1980-01-01",
            sexo: "Masculino",
            setor: "PÁTIO",
            setor_notificado: "ENFERMARIA",
            periodo: "Tarde",
            data_internacao: "2025-01-01",
            data_evento: "2025-11-26",
            descricao: "Paciente João agrediu o paciente José com um soco no rosto durante discussão. José teve sangramento nasal e hematoma."
        }
    }
];

async function runTests() {
    console.log("=== INICIANDO TESTE DE 5 CASOS (3 N/C, 2 EA) ===\n");

    for (const testCase of cases) {
        try {
            console.log(`\n[ENVIANDO] ${testCase.type}: "${testCase.data.descricao}"`);
            const response = await axios.post('http://localhost:3001/api/events', testCase.data);

            if (response.data.success) {
                // Fetch the event details to see the AI classification
                const eventId = response.data.eventId;
                // Wait a bit for async processing if needed (though local mock might be fast, real AI takes time)
                // In the current server implementation, it awaits AI before responding, so we should be good?
                // Actually server/index.js awaits aiService.classifyEvent inside the POST handler? 
                // Let's check. If not, we might need to poll. 
                // Assuming it's synchronous for now based on previous interactions.

                // Wait 2 seconds just in case
                await new Promise(r => setTimeout(r, 2000));

                const eventDetails = await axios.get(`http://localhost:3001/api/events/${eventId}`);
                const evt = eventDetails.data;

                console.log(`   > ID: ${evt.id}`);
                console.log(`   > IA TIPO: ${evt.type_notification}`);
                console.log(`   > IA CLASS: ${evt.classification}`);
                console.log(`   > IA EVENTO: ${evt.event_type}`);
                console.log(`   > IA RECOM: ${evt.recommendations}`);

                // Basic Validation
                let pass = false;
                if (testCase.type === "N/C" && (evt.type_notification === "NÃO CONFORMIDADE" || evt.type_notification === "NAO CONFORMIDADE")) pass = true;
                if (testCase.type === "EA" && evt.type_notification === "EVENTO ADVERSO") pass = true;

                console.log(`   > RESULTADO: ${pass ? "✅ APROVADO" : "❌ REPROVADO"}`);
            } else {
                console.log("   > ERRO NO ENVIO");
            }
        } catch (error) {
            console.error("   > ERRO DE CONEXÃO:", error.message);
        }
    }
}

runTests();
