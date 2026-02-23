import aiService from './src/services/ai.service';

async function testClassification() {
    console.log("Testing AI Classification...");

    // Test case for LEVE risk (Escape without injury)
    const description = "Paciente conseguiu sair da unidade pelo portão lateral, mas foi encontrado na calçada imediatamente e retornou sem nenhuma lesão.";

    try {
        console.log(`Analyzing incident: "${description}"`);
        const result = await aiService.analyzeIncident(description);
        console.log("Classification Result:");
        console.log(JSON.stringify(result, null, 2));

        if (result.riskLevel === 'LEVE') {
            console.log("SUCCESS: Correctly classified as LEVE.");
        } else {
            console.error(`FAILURE: Expected LEVE, got ${result.riskLevel}`);
        }
    } catch (error) {
        console.error("Error testing classification:", error);
    }
}

testClassification();
