const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'sentinela.db');
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
    // Add deadline_alert_date
    db.run("ALTER TABLE events ADD COLUMN deadline_alert_date DATETIME", (err) => {
        if (err && !err.message.includes('duplicate column')) console.error("Erro ao adicionar deadline_alert_date:", err);
        else console.log("Coluna 'deadline_alert_date' verificada/adicionada.");
    });

    // Add escalation_alert_sent
    db.run("ALTER TABLE events ADD COLUMN escalation_alert_sent INTEGER DEFAULT 0", (err) => {
        if (err && !err.message.includes('duplicate column')) console.error("Erro ao adicionar escalation_alert_sent:", err);
        else console.log("Coluna 'escalation_alert_sent' verificada/adicionada.");
    });
});

db.close();
