
import aiService from './src/services/ai.service';
import dotenv from 'dotenv';

dotenv.config();

async function testClassification() {
    const testCases = [
        "A dieta do paciente atrasou uma hora e as colaboradoras não souberam explicar.",
        "Paciente tentou pular o muro da unidade.",
        "Enfermeiro administrou dose errada de medicamento.",
        "Paciente agrediu outro paciente no pátio.",
        "Porta da unidade estava destrancada durante a noite."
    ];

    console.log("Iniciando testes de classificação de IA (Auditor Sênior)...\n");

    for (const description of testCases) {
        console.log(`--------------------------------------------------`);
        console.log(`Input: "${description}"`);
        try {
            const result = await aiService.analyzeIncident(description);
            console.log(`Output:`, JSON.stringify(result, null, 2));
        } catch (error) {
            console.error("Erro:", error);
        }
    }
}

testClassification();
