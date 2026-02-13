const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'sentinela.db');
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
    // Criar tabela settings
    db.run(`
        CREATE TABLE IF NOT EXISTS settings (
            key TEXT PRIMARY KEY,
            value TEXT
        )
    `, (err) => {
        if (err) {
            console.error("Erro ao criar tabela settings:", err.message);
        } else {
            console.log("Tabela 'settings' verificada/criada.");
        }
    });

    // Inserir valor padrão se não existir
    const defaultEmail = "sheldonfeitosa@gmail.com";
    db.run(`
        INSERT OR IGNORE INTO settings (key, value) VALUES ('risk_manager_email', ?)
    `, [defaultEmail], function (err) {
        if (err) {
            console.error("Erro ao inserir email padrão:", err.message);
        } else {
            console.log(`Configuração padrão 'risk_manager_email' definida como: ${defaultEmail}`);
        }
    });
});

db.close(() => {
    console.log("Conexão com banco de dados fechada.");
});
