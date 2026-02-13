
import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
import path from 'path';

// Load .env from current directory
dotenv.config({ path: path.join(__dirname, '.env') });

const key = process.env.GEMINI_API_KEY;
console.log('API Key present:', !!key);
console.log('API Key length:', key ? key.length : 0);

if (!key) {
    console.error('ERROR: GEMINI_API_KEY not found in environment.');
    process.exit(1);
}

async function testConnection() {
    const models = ["gemini-1.5-flash", "gemini-2.0-flash", "gemini-pro"];

    for (const modelName of models) {
        console.log(`\n--- Testing model: ${modelName} ---`);
        try {
            const genAI = new GoogleGenerativeAI(key as string);
            const model = genAI.getGenerativeModel({ model: modelName });

            console.log('Sending prompt...');
            const result = await model.generateContent("Hello?");
            const response = await result.response;
            const text = response.text();

            console.log(`SUCCESS with ${modelName}! Result: ${text.substring(0, 50)}...`);
            return; // Exit on first success
        } catch (error: any) {
            console.error(`FAILED with ${modelName}:`, error.message?.substring(0, 100));
            if (error.status) console.error(`Status: ${error.status} ${error.statusText}`);
        }
    }
}

testConnection();
