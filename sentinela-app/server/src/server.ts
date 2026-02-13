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
console.log('Database URL status:', process.env.DATABASE_URL ? 'Present' : 'Missing');

// Catch unhandled errors during startup
process.on('uncaughtException', (err) => {
    console.error('UNCAUGHT EXCEPTION:', err);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('UNHANDLED REJECTION:', reason);
});

const app = express();
const PORT = process.env.PORT || 3001;

// Security Middleware
app.use(helmet()); // Security Headers
app.use(cors({
    origin: '*', // Allow all origins for mobile testing
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// Webhook must be before express.json()
app.use('/api', webhookRoutes);

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

app.use(express.json());

// Version Check Middleware
app.use((req, res, next) => {
    res.setHeader('X-Backend-Version', '2.0.0-fixed');
    next();
});

// Simple Health Check (with DB status)
app.get('/api/health', async (req, res) => {
    const dbUrl = process.env.DATABASE_URL || '';
    const maskedUrl = dbUrl.replace(/:([^@]+)@/, ':****@').split('@')[1] || 'NOT_FOUND';

    let dbStatus = 'waiting';
    try {
        await prisma.$queryRaw`SELECT 1`;
        dbStatus = 'connected';
    } catch (e: any) {
        dbStatus = `error: ${e.message}`;
    }

    res.status(200).json({
        status: 'ok',
        version: '2.0.1-prod',
        db_target: maskedUrl,
        db_status: dbStatus,
        node_env: process.env.NODE_ENV,
        timestamp: new Date().toISOString()
    });
});

// Public Routes
app.use('/api/auth', authRoutes);
app.use('/api/notifications', notificationRoutes); // Reporting is public
app.use('/api/sectors', sectorRoutes); // Listing sectors implies public or minimal auth

// Protected Routes
app.use('/api/managers', authenticate, riskManagerRoutes);
app.use('/api/dashboard', authenticate, dashboardRoutes);

console.log('Mounting /api/subscription routes...');
app.use('/api/subscription', authenticate, subscriptionRoutes);
console.log('Mounted /api/subscription routes.');

app.use('/api/articles', articleRoutes);
app.use('/api/linkedin', linkedinRoutes);

app.get('/', (req, res) => {
    res.send('Sentinela AI API is running - SAAS-AUTH-ACTIVE');
});

// Export app for Vercel
export default app;

// Only listen if run directly (not imported as a module for Vercel)
if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
        console.log('Server updated at', new Date().toISOString());
    });
}
