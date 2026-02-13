import { AIService } from './src/services/ai.service';

async function run() {
    console.log("Testing AIService Fallback...");
    const service = new AIService();

    // Test 1: Fallback with "queda"
    console.log("\n--- Test 1: Queda ---");
    const result1 = await service.generateRootCauseAnalysis("Paciente sofreu queda do leito durante a noite", "Queda");
    console.log("Conclusion:", result1.rootCauseConclusion);
    console.log("Ishikawa Env:", result1.ishikawa.meio_ambiente);

    // Test 2: Fallback with "medicamento"
    console.log("\n--- Test 2: Medicamento ---");
    const result2 = await service.generateRootCauseAnalysis("Erro na dose do medicamento administrado", "Erro de Medicação");
    console.log("Conclusion:", result2.rootCauseConclusion);
    console.log("Ishikawa Material:", result2.ishikawa.material);
}

run();
