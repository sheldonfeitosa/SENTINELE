const axios = require('axios');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'sentinela.db');
const db = new sqlite3.Database(dbPath);

const API_URL = 'http://localhost:3001/api';

async function runTest() {
    try {
        console.log("1. Configurando Email da Presidência...");
        await axios.post(`${API_URL}/settings`, {
            key: 'presidency_email',
            value: 'sheldonfeitosa@gmail.com' // Usando seu email para teste
        });
        console.log("✅ Email da Presidência configurado.");

        console.log("2. Criando Evento de Teste para Escalonamento...");
        const eventId = await createTestEvent();
        console.log(`✅ Evento criado com ID: ${eventId}`);

        console.log("3. Disparando Escalonamento Manual...");
        const res = await axios.post(`${API_URL}/events/${eventId}/escalate`);
        console.log("✅ Resposta da API:", res.data);

        console.log("4. Verificando Banco de Dados...");
        checkDatabase(eventId);

    } catch (error) {
        console.error("❌ Erro no teste:", error.response ? error.response.data : error.message);
    }
}

function createTestEvent() {
    return new Promise((resolve, reject) => {
        const deadline = new Date();
        deadline.setDate(deadline.getDate() - 5); // 5 dias atrasado

        db.run(`INSERT INTO events (
            patient_name, sector_notified, description, deadline, status, 
            deadline_alert_sent, deadline_alert_date
        ) VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
            ['Paciente Teste Escalonamento', 'Setor Crítico', 'Falha grave não tratada', deadline.toISOString(), 'Aguardando Tratativa', 1],
            function (err) {
                if (err) reject(err);
                else resolve(this.lastID);
            });
    });
}

function checkDatabase(id) {
    db.get("SELECT escalation_alert_sent FROM events WHERE id = ?", [id], (err, row) => {
        if (err) console.error(err);
        else {
            if (row.escalation_alert_sent === 1) {
                console.log("✅ SUCESSO: Flag 'escalation_alert_sent' atualizada para 1.");
            } else {
                console.error("❌ FALHA: Flag 'escalation_alert_sent' NÃO foi atualizada.");
            }
        }
    });
}

runTest();
