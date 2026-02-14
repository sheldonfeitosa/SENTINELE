import { AIService } from '../server/src/services/ai.service';

export default async function handler(req: any, res: any) {
    const ai = new AIService();
    const trace: string[] = [];

    // Add logging to trace
    const originalConsoleError = console.error;
    console.error = (...args: any[]) => {
        trace.push(`Error: ${args.join(' ')}`);
        originalConsoleError(...args);
    };

    try {
        trace.push("Testing Chat Completion...");
        const result = await ai.chatWithContext("Olá, como você pode me ajudar?", {
            notification: { id: 1, description: "Teste de depuração" }
        });

        res.status(200).json({
            success: true,
            result,
            trace,
            env: {
                hasKey: !!process.env.GROQ_API_KEY,
                keyLength: process.env.GROQ_API_KEY?.length
            }
        });
    } catch (e: any) {
        res.status(500).json({
            success: false,
            error: e.message,
            trace
        });
    } finally {
        console.error = originalConsoleError;
    }
}
