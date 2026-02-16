/** Deployment trigger: Environment variables synchronized **/
import 'dotenv/config';
// Load environment variables as early as possible


import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

import { notificationRoutes } from './routes/notification.routes';
import sectorRoutes from './routes/sector.routes';
import { authRoutes } from './routes/auth.routes';
import { authenticate } from './middlewares/auth.middleware';
import { prisma } from './lib/prisma';

import riskManagerRoutes from './routes/risk-manager.routes';
import dashboardRoutes from './routes/dashboard.routes';
import articleRoutes from './routes/article.routes';
import linkedinRoutes from './routes/linkedin.routes';
import webhookRoutes from './routes/webhook.routes';
import subscriptionRoutes from './routes/subscription.routes';
import adminRoutes from './routes/admin.routes';

console.log('--- Initializing Sentinela AI Server ---');

const app = express();
const PORT = process.env.PORT || 3001;

// --- Security Middleware ---
app.use(helmet());

// CORS configuration: Restrict to allowed origins
const allowedOrigins = [
    'https://sentinela-app.vercel.app',
    'https://sentinela-app-git-main-sheldonfeitosas-projects.vercel.app',
    'http://localhost:5173',
    'http://localhost:3000'
];

app.use(cors({
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('Origin not allowed by CORS'));
        }
    },
    credentials: true
}));

app.use(express.json());
app.use(cookieParser());

// Global Rate Limiting: 100 requests per 15 minutes
const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 100,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: { error: 'Muitas requisições. Tente novamente em 15 minutos.' }
});
app.use(globalLimiter);

// Specific Rate Limiting for Login: 5 attempts per 15 minutes
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 5,
    message: { error: 'Muitas tentativas de login. Tente novamente em 15 minutos.' }
});
app.use('/api/auth/login', loginLimiter);

// Stable Health Check (with DB status)
app.get('/api/health', async (req, res) => {
    let dbStatus = 'waiting';
    try {
        await prisma.$queryRaw`SELECT 1`;
        dbStatus = 'connected';
    } catch (e: any) {
        dbStatus = `error: ${e.message}`;
    }

    res.status(200).json({
        status: 'ok',
        version: '2.2.0-full',
        db_status: dbStatus,
        node_env: process.env.NODE_ENV,
        timestamp: new Date().toISOString()
    });
});

// Webhook must be before express.json()
app.use('/api', webhookRoutes);

// Re-enabled stable routes
app.use('/api/auth', authRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/sectors', sectorRoutes);

// Re-enabling protected routes
app.use('/api/managers', authenticate, riskManagerRoutes);
app.use('/api/dashboard', authenticate, dashboardRoutes);

app.use('/api/articles', articleRoutes);
app.use('/api/linkedin', linkedinRoutes);

console.log('Mounting /api/subscription routes...');
app.use('/api/subscription', authenticate, subscriptionRoutes);
console.log('Mounted /api/subscription routes.');

app.use('/api/admin', adminRoutes);

app.get('/', (req, res) => {
    res.send('Sentinela AI API is running - STABLE-RESTORE');
});

export default app;

if (require.main === module) {
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}
