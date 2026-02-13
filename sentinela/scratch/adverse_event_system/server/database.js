const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'sentinela.db');

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Erro ao conectar ao banco de dados:', err.message);
    } else {
        console.log('Conectado ao banco de dados SQLite.');
    }
});

db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS events (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        patient_name TEXT,
        mother_name TEXT,
        birth_date TEXT,
        sex TEXT,
        sector_reporter TEXT,
        sector_notified TEXT,
        description TEXT,
        event_date TEXT,
        period TEXT,
        admission_date TEXT,
        notification_type TEXT,
        event_type TEXT,
        classification TEXT,
        recommendations TEXT,
        status TEXT DEFAULT 'Aguardando Tratativa',
        deadline TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        analysis_cause TEXT,
        action_plan TEXT,
        closed_at DATETIME
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS managers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT,
        email TEXT,
        sector TEXT UNIQUE
    )`);

    // Migration: Add manager_notified column if it doesn't exist
    db.all("PRAGMA table_info(events)", (err, rows) => {
        if (err) {
            console.error("Erro ao verificar esquema da tabela events:", err);
            return;
        }
        const hasColumn = rows.some(row => row.name === 'manager_notified');
        if (!hasColumn) {
            db.run("ALTER TABLE events ADD COLUMN manager_notified BOOLEAN DEFAULT 0", (err) => {
                if (err) console.error("Erro ao adicionar coluna manager_notified:", err);
                else console.log("Coluna 'manager_notified' adicionada com sucesso.");
            });
        }
    });

    // New Table: manager_sectors (One Manager -> Many Sectors)
    db.run(`CREATE TABLE IF NOT EXISTS manager_sectors (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        manager_id INTEGER,
        sector TEXT,
        FOREIGN KEY(manager_id) REFERENCES managers(id),
        UNIQUE(manager_id, sector)
    )`);

    console.log('Tabelas "events", "managers" e "manager_sectors" verificadas/criadas.');
});

module.exports = db;
