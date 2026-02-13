import { AIService } from './src/services/ai.service';
import dotenv from 'dotenv';

dotenv.config();

const aiService = new AIService();

const testCases = [
    {
        category: 'COMPORTAMENTAL (Suicídio)',
        description: 'Paciente encontrado no banheiro com lençol amarrado no pescoço, consciente.'
    },
    {
        category: 'MEDICAMENTOSO (Impregnação)',
        description: 'Paciente apresenta rigidez na nuca, sialorreia e tremores finos após administração de Haloperidol.'
    },
    {
        category: 'PROCEDIMENTO (Contenção)',
        description: 'Paciente apresenta escoriações e edema nos punhos após período de contenção mecânica.'
    },
    {
        category: 'GERAL (Queda)',
        description: 'Paciente escorregou no piso molhado do banheiro e caiu, batendo o ombro.'
    }
];

async function runTests() {
    console.log('Iniciando testes de taxonomia IA...\n');

    for (const test of testCases) {
        console.log(`--- Testando: ${test.category} ---`);
        console.log(`Descrição: "${test.description}"`);
        try {
            const result = await aiService.analyzeIncident(test.description);
            console.log('Resultado IA:', JSON.stringify(result, null, 2));
        } catch (error) {
            console.error('Erro:', error);
        }
        console.log('\n');
    }
}

runTests();
