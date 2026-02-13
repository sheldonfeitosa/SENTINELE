import aiService from './src/services/ai.service';

async function testRCA() {
    console.log("Testing RCA Generation...");
    const description = "Paciente tentou evadir da unidade pulando o muro durante o banho de sol.";
    const eventType = "Evasão";

    try {
        const result = await aiService.generateRootCauseAnalysis(description, eventType);
        console.log("RCA Result:");
        console.log(JSON.stringify(result, null, 2));
    } catch (error) {
        console.error("Error testing RCA:", error);
    }
}

testRCA();
