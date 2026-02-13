const db = require('./database');

db.all("SELECT id, description FROM events", [], (err, rows) => {
    if (err) {
        console.error(err);
        return;
    }
    console.log("Eventos no Banco:", rows);
});
