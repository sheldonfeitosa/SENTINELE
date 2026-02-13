const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./sentinela.db');

db.serialize(() => {
    console.log("--- EVENT 23 ---");
    db.get("SELECT * FROM events WHERE id = 23", (err, event) => {
        if (err) {
            console.error("Error fetching event:", err);
            return;
        }
        if (!event) {
            console.log("Event 23 not found.");
            return;
        }

        console.log("Event ID:", event.id);
        console.log("Sector Notified:", event.sector_notified);

        console.log("\n--- RESPONSIBLE MANAGER ---");
        db.get(
            "SELECT m.* FROM managers m JOIN manager_sectors ms ON m.id = ms.manager_id WHERE ms.sector = ?",
            [event.sector_notified],
            (err, manager) => {
                if (err) console.error("Error fetching manager:", err);
                console.log(manager);
                db.close();
            }
        );
    });
});
