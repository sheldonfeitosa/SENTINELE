import dotenv from 'dotenv';
// Load environment variables as early as possible
dotenv.config();

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

import { notificationRoutes } from './routes/notification.routes';
import sectorRoutes from './routes/sector.routes';
import { authRoutes } from './routes/auth.routes';
import { authenticate } from './middlewares/auth.middleware';
import { prisma } from './lib/prisma';

/*
import riskManagerRoutes from './routes/risk-manager.routes';
import dashboardRoutes from './routes/dashboard.routes';
import webhookRoutes from './routes/webhook.routes';
import subscriptionRoutes from './routes/subscription.routes';
import articleRoutes from './routes/article.routes';
import linkedinRoutes from './routes/linkedin.routes';
*/

console.log('--- Initializing Sentinela AI Server ---');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(helmet());
app.use(cors());
app.use(express.json());

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
        version: '2.0.8-stable-rollback',
        db_status: dbStatus,
        node_env: process.env.NODE_ENV,
        timestamp: new Date().toISOString()
    });
});

// Re-enabled stable routes
app.use('/api/auth', authRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/sectors', sectorRoutes);

app.get('/', (req, res) => {
    res.send('Sentinela AI API is running - STABLE-RESTORE');
});

export default app;

if (require.main === module) {
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}
