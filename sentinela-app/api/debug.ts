export default function handler(req: any, res: any) {
    res.status(200).json({
        message: 'AI Debug endpoint',
        env_present: {
            DATABASE_URL: !!process.env.DATABASE_URL,
            GROQ_API_KEY: !!process.env.GROQ_API_KEY,
            RESEND_API_KEY: !!process.env.RESEND_API_KEY
        },
        timestamp: new Date().toISOString()
    });
}
