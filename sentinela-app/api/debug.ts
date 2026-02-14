export default function handler(req: any, res: any) {
    res.status(200).json({
        message: 'Debug endpoint works',
        env_present: {
            DATABASE_URL: !!process.env.DATABASE_URL,
            RESEND_API_KEY: !!process.env.RESEND_API_KEY,
            JWT_SECRET: !!process.env.JWT_SECRET,
            STRIPE_SECRET_KEY: !!process.env.STRIPE_SECRET_KEY,
            STRIPE_WEBHOOK_SECRET: !!process.env.STRIPE_WEBHOOK_SECRET,
            STRIPE_PRICE_ID: !!process.env.STRIPE_PRICE_ID
        },
        timestamp: new Date().toISOString()
    });
}
