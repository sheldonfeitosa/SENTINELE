import { AIService } from '../server/src/services/ai.service';

export default async function handler(req: any, res: any) {
    const aiService = new AIService();
    const testDescription = "Paciente caiu do leito durante a madrugada.";

    try {
        console.log('--- AI Debug Trace Start ---');
        const result = await aiService.analyzeIncident(testDescription);
        console.log('--- AI Debug Trace End ---');

        res.status(200).json({
            success: true,
            description: testDescription,
            result: result,
            env_check: !!process.env.GROQ_API_KEY,
            timestamp: new Date().toISOString()
        });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            error: error.message,
            stack: error.stack,
            env_check: !!process.env.GROQ_API_KEY
        });
    }
}
