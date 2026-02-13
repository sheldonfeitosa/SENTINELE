const db = require('./database');

db.run("ALTER TABLE events ADD COLUMN analysis_conclusion TEXT", (err) => {
    if (err) {
        if (err.message.includes('duplicate column name')) {
            console.log("Coluna 'analysis_conclusion' já existe.");
        } else {
            console.error("Erro ao adicionar coluna:", err);
        }
    } else {
        console.log("Coluna 'analysis_conclusion' adicionada com sucesso!");
    }
});
