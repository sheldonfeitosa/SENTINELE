import fs from 'fs';

function parseCSV(content) {
    const records = [];
    let currentField = '';
    let currentRecord = [];
    let inQuotes = false;

    for (let i = 0; i < content.length; i++) {
        const char = content[i];
        const nextChar = content[i + 1];

        if (inQuotes) {
            if (char === '"' && nextChar === '"') {
                currentField += '"';
                i++; // skip next quote
            } else if (char === '"') {
                inQuotes = false;
            } else {
                currentField += char;
            }
        } else {
            if (char === '"') {
                inQuotes = true;
            } else if (char === ',') {
                currentRecord.push(currentField);
                currentField = '';
            } else if (char === '\n' || char === '\r') {
                currentRecord.push(currentField);
                if (currentRecord.length > 1 || currentRecord[0] !== '') {
                    records.push(currentRecord);
                }
                currentRecord = [];
                currentField = '';
                if (char === '\r' && nextChar === '\n') i++; // skip \n
            } else {
                currentField += char;
            }
        }
    }
    if (currentRecord.length > 0 || currentField !== '') {
        currentRecord.push(currentField);
        records.push(currentRecord);
    }
    return records;
}

const csvPath = 'c:/Users/sheld/SENTINELE-2e335934ab6e4c1dff680d9a9920f2c0a2127de9/BK_Sistema antigo 25 e 26/BK_NIT_25_26.csv';
const content = fs.readFileSync(csvPath, 'utf8');
const allRecords = parseCSV(content);

console.log(`Total records parsed (including header): ${allRecords.length}`);

let janFebCount = 0;
const janFebRecords = [];

for (let i = 1; i < allRecords.length; i++) {
    const row = allRecords[i];
    const carimbo = row[1]; // Carimbo de data/hora

    if (carimbo && (carimbo.includes('/01/2026') || carimbo.includes('/02/2026'))) {
        janFebCount++;
        janFebRecords.push({ id: row[0], carimbo: row[1], patient: row[2] });
    }
}

console.log(`\nRecords found for Jan/Feb 2026: ${janFebCount}`);
if (janFebRecords.length > 0) {
    console.log('Sample found:');
    console.log(JSON.stringify(janFebRecords.slice(0, 5), null, 2));
}
