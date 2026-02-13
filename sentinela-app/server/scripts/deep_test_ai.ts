import { AIService } from './src/services/ai.service';
import dotenv from 'dotenv';
dotenv.config();

async function runDeepTest() {
    console.log("🚀 Starting Deep AI Functionality Test...\n");
    const aiService = new AIService();

    // 1. Test Incident Analysis (Quick Classification)
    console.log("1️⃣ Testing Incident Analysis...");
    try {
        const result = await aiService.analyzeIncident("Paciente tentou fugir da unidade e foi contido verbalmente.");
        console.log("   ✅ Result:", JSON.stringify(result, null, 2));
        if (!result.riskLevel) throw new Error("Missing riskLevel");
    } catch (error: any) {
        console.error("   ❌ Failed:", error.message);
    }

    // 2. Test Root Cause Analysis (Complex Reasoning)
    console.log("\n2️⃣ Testing Root Cause Analysis (Groq)...");
    try {
        const result = await aiService.generateRootCauseAnalysis(
            "Erro de medicação: Paciente recebeu dose dobrada de Diazepam.",
            "Erro de Medicação"
        );
        console.log("   ✅ Result Conclusion:", result.rootCauseConclusion);
        console.log("   ✅ Ishikawa Method:", result.ishikawa?.metodo);

        if (result.rootCauseConclusion.includes("OFFLINE")) {
            console.log("   ⚠️ WARNING: Fallback mode triggered instead of Groq.");
        }
    } catch (error: any) {
        console.error("   ❌ Failed:", error.message);
    }

    // 3. Test Chat Context
    console.log("\n3️⃣ Testing Chat with Context...");
    try {
        const response = await aiService.chatWithContext(
            "O que devo fazer para evitar isso?",
            { eventType: "Erro de Medicação", riskLevel: "GRAVE" }
        );
        console.log("   ✅ Chat Response:", response.substring(0, 100) + "...");
    } catch (error: any) {
        console.error("   ❌ Failed:", error.message);
    }
}

runDeepTest();
