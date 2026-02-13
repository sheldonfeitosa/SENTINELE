const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./sentinela.db');

db.serialize(() => {
    console.log("Creating manager_sectors table...");
    db.run(`CREATE TABLE IF NOT EXISTS manager_sectors (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        manager_id INTEGER,
        sector TEXT,
        FOREIGN KEY(manager_id) REFERENCES managers(id),
        UNIQUE(manager_id, sector)
    )`, (err) => {
        if (err) {
            console.error("Error creating table:", err);
        } else {
            console.log("Table created successfully.");
        }
    });
});

db.close();
