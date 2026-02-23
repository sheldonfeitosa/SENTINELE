import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
dotenv.config();

const key = process.env.GEMINI_API_KEY;
console.log('Key available:', !!key);

async function run() {
    const genAI = new GoogleGenerativeAI(key || '');
    // Try gemini-1.5-flash first
    try {
        console.log('Testing gemini-1.5-flash...');
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const result = await model.generateContent("Test");
        const response = await result.response;
        console.log('gemini-1.5-flash SUCCESS:', response.text());
    } catch (e: any) {
        console.log('gemini-1.5-flash FAILED:', e.message);
    }

    // Try gemini-pro
    try {
        console.log('Testing gemini-pro...');
        const model = genAI.getGenerativeModel({ model: "gemini-pro" });
        const result = await model.generateContent("Test");
        const response = await result.response;
        console.log('gemini-pro SUCCESS:', response.text());
    } catch (e: any) {
        console.log('gemini-pro FAILED:', e.message);
    }

    // Try gemini-2.0-flash-exp (newer)
    try {
        console.log('Testing gemini-2.0-flash-exp...');
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });
        const result = await model.generateContent("Test");
        const response = await result.response;
        console.log('gemini-2.0-flash-exp SUCCESS:', response.text());
    } catch (e: any) {
        console.log('gemini-2.0-flash-exp FAILED:', e.message);
    }
}
run();
