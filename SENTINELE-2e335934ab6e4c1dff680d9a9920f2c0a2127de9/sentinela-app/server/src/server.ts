import dotenv from 'dotenv';
import path from 'path';

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

app.use(helmet({
    frameguard: {
        action: 'deny',
    },
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
            imgSrc: ["'self'", "data:", "https:"],
            connectSrc: ["'self'", "https://api.sentinelaai.com.br", "http://localhost:3001"],
            fontSrc: ["'self'", "https://fonts.gstatic.com"],
            objectSrc: ["'none'"],
            upgradeInsecureRequests: [],
        },
    },
    hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true
    }
}));

app.use(cors({
    origin: [
        'http://localhost:5173',
        'http://localhost:3000',
        'http://localhost', // Capacitor / Tauri
        'https://sentinelaai.com.br',
        'https://www.sentinelaai.com.br',
        'https://api.sentinelaai.com.br',
        'https://sentinela-app.vercel.app'
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

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

app.use(express.json());

const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 100, // limite de 100 requisições por IP
    message: 'Muitas requisições deste IP, tente novamente após 15 minutos.'
});

const authLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hora
    max: 10, // limite de 10 tentativas de login
    message: 'Muitas tentativas de login, tente novamente após 1 hora.'
});

// Stable routes
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/notifications', apiLimiter, notificationRoutes);
app.use('/api/sectors', apiLimiter, sectorRoutes);

// Protected routes
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
