import dotenv from 'dotenv';
// Load environment variables as early as possible
dotenv.config();

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

import { notificationRoutes } from './routes/notification.routes';
import riskManagerRoutes from './routes/risk-manager.routes';
import sectorRoutes from './routes/sector.routes';
import dashboardRoutes from './routes/dashboard.routes';
import webhookRoutes from './routes/webhook.routes';
import subscriptionRoutes from './routes/subscription.routes';
import articleRoutes from './routes/article.routes';
import linkedinRoutes from './routes/linkedin.routes';

import { authRoutes } from './routes/auth.routes';
import { authenticate } from './middlewares/auth.middleware';
import { prisma } from './lib/prisma';

console.log('--- Initializing Sentinela AI Server ---');
console.log('Environment:', process.env.NODE_ENV);

const app = express();
const PORT = process.env.PORT || 3001;

// Security Middleware
app.use(helmet());
app.use(cors());

// Webhook must be before express.json()
app.use('/api', webhookRoutes);

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100
});
app.use(limiter);

app.use(express.json());

// Simple Health Check (with DB status)
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
        version: '2.0.7-full-restore-final',
        db_status: dbStatus,
        node_env: process.env.NODE_ENV,
        timestamp: new Date().toISOString()
    });
});

// All routes
app.use('/api/auth', authRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/sectors', sectorRoutes);
app.use('/api/managers', authenticate, riskManagerRoutes);
app.use('/api/dashboard', authenticate, dashboardRoutes);
app.use('/api/subscription', authenticate, subscriptionRoutes);
app.use('/api/articles', articleRoutes);
app.use('/api/linkedin', linkedinRoutes);

app.get('/', (req, res) => {
    res.send('Sentinela AI API is running - FINAL-RESTORE');
});

export default app;

if (require.main === module) {
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}
