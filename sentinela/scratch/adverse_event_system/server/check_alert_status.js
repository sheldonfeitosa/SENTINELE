const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'sentinela.db');
const db = new sqlite3.Database(dbPath);

db.get("SELECT id, deadline_alert_sent FROM events WHERE id = 29", (err, row) => {
    if (err) console.error(err);
    else console.log('Evento 29:', row);
});
