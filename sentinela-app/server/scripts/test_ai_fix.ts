
import aiService from './src/services/ai.service';

async function testAI() {
    const testCases = [
        "O computador da recepção está travando muito e não consigo acessar o sistema.",
        "Ar condicionado do quarto 205 está pingando em cima da cama.",
        "Paciente caiu da cama durante a noite.",
        "Administrado dipirona em paciente alérgico."
    ];

    for (const text of testCases) {
        console.log(`\nTesting: "${text}"`);
        try {
            const result = await aiService.analyzeIncident(text);
            console.log("Result:", JSON.stringify(result, null, 2));
        } catch (error) {
            console.error("Error:", error);
        }
    }
}

testAI();
