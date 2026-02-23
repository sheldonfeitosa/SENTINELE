import { AIService } from './src/services/ai.service';

async function run() {
    console.log("Testing Groq Connection...");
    try {
        const service = new AIService();
        const analysis = await service.analyzeIncident("Paciente caiu da cama durante a noite e bateu a cabeça.");
        console.log("Groq Analysis Result:", JSON.stringify(analysis, null, 2));

        if (analysis.riskLevel && analysis.eventType) {
            console.log("\n✅ Groq SUCCESS! The AI is working.");
        } else {
            console.log("\n❌ Groq Response invalid.");
        }

    } catch (e: any) {
        console.error("\n❌ Groq FAILED:", e.message);
    }
}

run();
