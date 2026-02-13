
import OpenAI from 'openai';
import dotenv from 'dotenv';
import path from 'path';

// Load .env
dotenv.config({ path: path.join(__dirname, '.env') });

const key = process.env.DEEPSEEK_API_KEY;

if (!key) {
    console.error('ERROR: DEEPSEEK_API_KEY not found in environment.');
    process.exit(1);
}

const openai = new OpenAI({
    baseURL: 'https://api.deepseek.com',
    apiKey: key
});

async function testConnection() {
    console.log('Testing DeepSeek connection...');
    try {
        const completion = await openai.chat.completions.create({
            messages: [{ role: "system", content: "You are a helpful assistant." }, { role: "user", content: "Hello!" }],
            model: "deepseek-chat",
        });

        console.log('SUCCESS!');
        console.log('Response:', completion.choices[0].message.content);
    } catch (error: any) {
        console.error('CONNECTION FAILED:', error.message);
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Data:', error.response.data);
        }
    }
}

testConnection();
