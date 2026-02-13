const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'sentinela.db');
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
    db.run("ALTER TABLE events ADD COLUMN deadline_alert_sent INTEGER DEFAULT 0", (err) => {
        if (err) {
            if (err.message.includes('duplicate column name')) {
                console.log("Coluna 'deadline_alert_sent' já existe.");
            } else {
                console.error("Erro ao adicionar coluna:", err.message);
            }
        } else {
            console.log("Coluna 'deadline_alert_sent' adicionada com sucesso.");
        }
    });
});

db.close();
