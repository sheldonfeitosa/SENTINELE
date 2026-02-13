const axios = require('axios');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'sentinela.db');
const db = new sqlite3.Database(dbPath);

const API_URL = 'http://localhost:3001/api';

async function runTest() {
    try {
        console.log("1. Criando Evento de Teste para ACR...");
        const eventId = await createTestEvent();
        console.log(`✅ Evento criado com ID: ${eventId}`);

        // Simulando dados selecionados no Frontend
        const mockSelectedIshikawa = [
            "Mão de Obra: Falta de treinamento",
            "Método: Protocolo desatualizado"
        ].join('\n');

        const mockSelected5W2H = [
            "O QUE: Atualizar protocolo | QUEM: Gestão da Qualidade | QUANDO: Imediato | COMO: Revisão documental",
            "O QUE: Treinar equipe | QUEM: Enfermeiro Chefe | QUANDO: Próxima semana | COMO: Workshop presencial"
        ].join('\n\n');

        console.log("2. Enviando Seleção como Tratativa (Simulando Frontend)...");
        const res = await axios.post(`${API_URL}/events/${eventId}/tratativa`, {
            analise_causa: mockSelectedIshikawa,
            plano_acao: mockSelected5W2H
        });
        console.log("✅ Resposta da API:", res.data);

        console.log("3. Verificando Banco de Dados...");
        checkDatabase(eventId, mockSelectedIshikawa, mockSelected5W2H);

    } catch (error) {
        console.error("❌ Erro no teste:", error.response ? error.response.data : error.message);
    }
}

function createTestEvent() {
    return new Promise((resolve, reject) => {
        db.run(`INSERT INTO events (
            patient_name, sector_notified, description, deadline, status
        ) VALUES (?, ?, ?, ?, ?)`,
            ['Paciente Teste ACR', 'UTI', 'Erro de medicação', new Date().toISOString(), 'Aguardando Tratativa'],
            function (err) {
                if (err) reject(err);
                else resolve(this.lastID);
            });
    });
}

function checkDatabase(id, expectedCausa, expectedAcao) {
    db.get("SELECT analysis_cause, action_plan, status FROM events WHERE id = ?", [id], (err, row) => {
        if (err) console.error(err);
        else {
            let success = true;

            if (row.analysis_cause !== expectedCausa) {
                console.error("❌ FALHA: 'analysis_cause' incorreto.");
                console.error("Esperado:", expectedCausa);
                console.error("Obtido:", row.analysis_cause);
                success = false;
            }

            if (row.action_plan !== expectedAcao) {
                console.error("❌ FALHA: 'action_plan' incorreto.");
                console.error("Esperado:", expectedAcao);
                console.error("Obtido:", row.action_plan);
                success = false;
            }

            if (!row.status.includes('TRATADO')) {
                console.error("❌ FALHA: Status não atualizado para TRATADO.");
                success = false;
            }

            if (success) {
                console.log("✅ SUCESSO: Dados gravados corretamente no banco!");
                console.log("--- Causa Gravada ---\n", row.analysis_cause);
                console.log("--- Plano Gravado ---\n", row.action_plan);
            }
        }
    });
}

runTest();
