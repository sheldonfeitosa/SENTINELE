import { AIService } from './src/services/ai.service';
import dotenv from 'dotenv';
dotenv.config();

async function runGroqTest() {
    console.log("🚀 Testing Groq Connection...");
    try {
        const aiService = new AIService();
        const result = await aiService.analyzeIncident("Paciente tentou evadir da unidade.");
        console.log("✅ Groq Result:", JSON.stringify(result, null, 2));
    } catch (e: any) {
        console.error("❌ Groq Failed:", e.message);
    }
}

runGroqTest();
