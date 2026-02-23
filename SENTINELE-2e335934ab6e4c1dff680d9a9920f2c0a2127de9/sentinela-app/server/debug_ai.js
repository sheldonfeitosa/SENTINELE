const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

const key = process.env.GEMINI_API_KEY;
console.log('Key available:', !!key);
if (key) console.log('Key suffix:', key.slice(-4));

async function run() {
    const genAI = new GoogleGenerativeAI(key || '');

    // Helper function
    async function testModel(modelName) {
        try {
            console.log(`Testing ${modelName}...`);
            const model = genAI.getGenerativeModel({ model: modelName });
            const result = await model.generateContent("Test");

            // Check if response is a promise or object
            let response = result.response;
            if (response instanceof Promise) {
                response = await response;
            }
            const text = typeof response.text === 'function' ? response.text() : await response.text();

            console.log(`${modelName} SUCCESS:`, text.substring(0, 50));
        } catch (e) {
            console.log(`${modelName} FAILED:`, e.message);
        }
    }

    await testModel("gemini-1.5-flash");
    await testModel("gemini-pro");
    await testModel("gemini-2.0-flash-exp");
}
run();
