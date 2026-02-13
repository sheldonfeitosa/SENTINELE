import Groq from 'groq-sdk';
import dotenv from 'dotenv';
import path from 'path';

// Load .env explicitly
const envPath = path.join(__dirname, '.env');
console.log('Loading .env from:', envPath);
dotenv.config({ path: envPath });

const key = process.env.GROQ_API_KEY;
console.log('GROQ_API_KEY length:', key ? key.length : 'MISSING');

async function run() {
    if (!key) {
        console.error("Error: Key missing");
        return;
    }

    const groq = new Groq({ apiKey: key });

    try {
        console.log("Sending request to Groq (llama-3.3-70b-versatile)...");
        const chatCompletion = await groq.chat.completions.create({
            messages: [{ role: 'user', content: 'Say hello' }],
            model: 'llama-3.3-70b-versatile',
        });

        console.log("Response:", chatCompletion.choices[0]?.message?.content);
    } catch (error: any) {
        console.error("Groq API Error:", error.message);
        if (error.response) {
            console.error("Status:", error.status);
            console.error("Data:", JSON.stringify(error.response.data || {}, null, 2));
        }
    }
}

run();
