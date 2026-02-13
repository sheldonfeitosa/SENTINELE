const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');

async function testSecurity() {
    const baseUrl = 'http://localhost:3001/api/events';

    // 1. Teste de SQL Injection no ID
    console.log("\n--- Teste 1: SQL Injection no ID ---");
    try {
        const form = new FormData();
        form.append('file', fs.createReadStream('test_acr.js')); // Arquivo qualquer

        await axios.post(`${baseUrl}/1 OR 1=1/upload`, form, {
            headers: form.getHeaders()
        });
    } catch (error) {
        console.log("Resultado Esperado (Erro):", error.response ? error.response.data : error.message);
    }

    // 2. Teste de Tipo de Arquivo Inválido (.js)
    console.log("\n--- Teste 2: Tipo de Arquivo Inválido (.js) ---");
    try {
        const form = new FormData();
        form.append('file', fs.createReadStream('test_acr.js')); // Enviando .js

        await axios.post(`${baseUrl}/1/upload`, form, {
            headers: form.getHeaders()
        });
    } catch (error) {
        console.log("Resultado Esperado (Erro):", error.response ? error.response.data : error.message);
    }

    // 3. Teste de Upload Válido (Simulando TXT)
    console.log("\n--- Teste 3: Upload Válido (TXT) ---");
    try {
        // Criar arquivo txt temporário
        fs.writeFileSync('teste.txt', 'Conteúdo seguro.');

        const form = new FormData();
        form.append('file', fs.createReadStream('teste.txt'));

        const res = await axios.post(`${baseUrl}/1/upload`, form, {
            headers: form.getHeaders()
        });
        console.log("Sucesso:", res.data);

        // Limpar
        fs.unlinkSync('teste.txt');
    } catch (error) {
        console.error("Erro Inesperado:", error.response ? error.response.data : error.message);
    }
}

testSecurity();
