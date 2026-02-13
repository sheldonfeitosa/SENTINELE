const aiService = require('./services/aiService');

async function testACR() {
    const description = "Paciente escorregou no banheiro molhado e bateu a cabeça, resultando em corte no supercílio. Necessitou de sutura (3 pontos).";
    console.log("Testando ACR para:", description);

    try {
        const result = await aiService.generateACR(description);
        console.log("Resultado ACR:", JSON.stringify(result, null, 2));
    } catch (error) {
        console.error("Erro no teste:", error);
    }
}

testACR();
