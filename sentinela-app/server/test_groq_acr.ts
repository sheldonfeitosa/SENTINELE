import { AIService } from './src/services/ai.service';
import dotenv from 'dotenv';
import path from 'path';

// Load .env explicitly
const envPath = path.join(__dirname, '.env');
dotenv.config({ path: envPath });

async function run() {
    console.log("Testing Groq ACR Generation...");
    const service = new AIService();
    // Incident description simulating a real case
    const description = "Paciente idoso tentou levantar da cama sem auxílio, escorregou e caiu, batendo o quadril.";
    const eventType = "Queda";

    try {
        console.log("Sending request to generate Root Cause Analysis...");
        const analysis = await service.generateRootCauseAnalysis(description, eventType);
        console.log("\nFull Response Result:", JSON.stringify(analysis, null, 2));

        // Validation Logic
        const hasRootCause = !!analysis.rootCauseConclusion;
        const hasIshikawa = !!analysis.ishikawa;
        const hasActionPlan = Array.isArray(analysis.actionPlan) && analysis.actionPlan.length > 0;

        if (hasRootCause && hasIshikawa && hasActionPlan) {
            console.log("\n✅ ACR Structure VALIDATED successfully!");
            console.log(`- Root Cause: ${analysis.rootCauseConclusion.substring(0, 50)}...`);
            console.log(`- Action Plan Items: ${analysis.actionPlan.length}`);
        } else {
            console.log("\n❌ ACR Structure INCOMPLETE.");
            console.log("Missing fields:",
                !hasRootCause ? "rootCauseConclusion" : "",
                !hasIshikawa ? "ishikawa" : "",
                !hasActionPlan ? "actionPlan" : ""
            );
        }

    } catch (e: any) {
        console.error("\n❌ GROQ ACR FAILED:", e.message);
    }
}

run();
