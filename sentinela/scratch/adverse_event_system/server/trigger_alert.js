const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'sentinela.db');
const db = new sqlite3.Database(dbPath);

const TEST_SECTOR = 'Setor de Teste Alerta';
const TEST_EMAIL = 'sheldonfeitosa@gmail.com'; // Usar o email do usuário para ele ver o resultado

db.serialize(() => {
    // 1. Garantir que existe um gestor para o setor de teste
    db.run("INSERT OR IGNORE INTO managers (name, email) VALUES (?, ?)", ['Gestor Teste', TEST_EMAIL], function (err) {
        if (err) console.error(err);
        const managerId = this.lastID || 1; // Fallback ID se já existir (não é perfeito mas serve para teste rápido)

        // Se já existia, precisamos pegar o ID correto.
        db.get("SELECT id FROM managers WHERE email = ?", [TEST_EMAIL], (err, row) => {
            const realId = row.id;
            db.run("INSERT OR IGNORE INTO manager_sectors (manager_id, sector) VALUES (?, ?)", [realId, TEST_SECTOR]);

            // 2. Inserir evento atrasado
            const pastDate = new Date();
            pastDate.setDate(pastDate.getDate() - 20); // 20 dias atrás
            const pastDateStr = pastDate.toISOString().split('T')[0];

            db.run(`
                INSERT INTO events (
                    patient_name, sector_notified, description, 
                    status, deadline, created_at, deadline_alert_sent
                ) VALUES (?, ?, ?, ?, ?, ?, 0)
            `, ['Paciente Teste Alerta', TEST_SECTOR, 'Evento de teste para verificar alerta de prazo.', 'Aguardando Tratativa', pastDateStr, pastDateStr], function (err) {
                if (err) console.error(err);
                else console.log(`Evento de teste criado com ID ${this.lastID}. Prazo: ${pastDateStr}. Aguarde o CRON.`);
            });
        });
    });
});
