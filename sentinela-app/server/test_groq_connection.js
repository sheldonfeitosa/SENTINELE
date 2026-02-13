const Groq = require('groq-sdk');
require('dotenv').config();

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

async function run() {
    console.log("Testing Groq Connection (JS)...");
    try {
        const chatCompletion = await groq.chat.completions.create({
            messages: [{ role: 'user', content: 'Analise este incidente: Paciente caiu.' }],
            model: 'llama-3.3-70b-versatile',
        });

        console.log("Result:", chatCompletion.choices[0].message.content.substring(0, 100));
        console.log("\n✅ Groq SUCCESS!");
    } catch (e) {
        console.error("\n❌ Groq FAILED:", e.message);
    }
}

run();
