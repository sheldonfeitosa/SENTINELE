export default async function handler(req: any, res: any) {
    try {
        const start = Date.now();
        const response = await fetch('https://api.groq.com/openai/v1/models', {
            headers: {
                'Authorization': `Bearer ${process.env.GROQ_API_KEY}`
            }
        });
        const duration = Date.now() - start;
        const body = await response.json();

        res.status(200).json({
            success: response.ok,
            status: response.status,
            duration_ms: duration,
            models_count: body.data?.length,
            first_model: body.data?.[0]?.id,
            timestamp: new Date().toISOString()
        });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            error: error.message,
            stack: error.stack
        });
    }
}
