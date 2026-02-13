import { AIService } from './src/services/ai.service';

const aiService = new AIService();

async function testRCA() {
    console.log("--- Testando RCA Melhorada (Mock: Queda) ---");
    const description = "Paciente idoso encontrado no chão do quarto às 03h da manhã. Grades estavam baixas e luz apagada.";
    const eventType = "Queda";

    try {
        const result = await aiService.generateRootCauseAnalysis(description, eventType);
        console.log(JSON.stringify(result, null, 2));
    } catch (error) {
        console.error("Erro:", error);
    }
}

testRCA();
