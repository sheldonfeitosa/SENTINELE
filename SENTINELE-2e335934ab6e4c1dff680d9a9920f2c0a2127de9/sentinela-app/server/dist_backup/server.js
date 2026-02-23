"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
// Load environment variables as early as possible
dotenv_1.default.config();
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const notification_routes_1 = require("./routes/notification.routes");
const sector_routes_1 = __importDefault(require("./routes/sector.routes"));
const auth_routes_1 = require("./routes/auth.routes");
const auth_middleware_1 = require("./middlewares/auth.middleware");
const prisma_1 = require("./lib/prisma");
const risk_manager_routes_1 = __importDefault(require("./routes/risk-manager.routes"));
const dashboard_routes_1 = __importDefault(require("./routes/dashboard.routes"));
const article_routes_1 = __importDefault(require("./routes/article.routes"));
const linkedin_routes_1 = __importDefault(require("./routes/linkedin.routes"));
const webhook_routes_1 = __importDefault(require("./routes/webhook.routes"));
const subscription_routes_1 = __importDefault(require("./routes/subscription.routes"));
const admin_routes_1 = __importDefault(require("./routes/admin.routes"));
console.log('--- Initializing Sentinela AI Server ---');
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3001;
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)({
    origin: [
        'http://localhost:5173',
        'http://localhost:3000',
        'https://sentinelaai.com.br',
        'https://www.sentinelaai.com.br',
        'https://api.sentinelaai.com.br',
        'https://sentinela-app.vercel.app'
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express_1.default.json());
const apiLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 100, // limite de 100 requisições por IP
    message: 'Muitas requisições deste IP, tente novamente após 15 minutos.'
});
const authLimiter = (0, express_rate_limit_1.default)({
    windowMs: 60 * 60 * 1000, // 1 hora
    max: 10, // limite de 10 tentativas de login
    message: 'Muitas tentativas de login, tente novamente após 1 hora.'
});
// Stable Health Check (with DB status)
app.get('/api/health', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    let dbStatus = 'waiting';
    try {
        yield prisma_1.prisma.$queryRaw `SELECT 1`;
        dbStatus = 'connected';
    }
    catch (e) {
        dbStatus = `error: ${e.message}`;
    }
    res.status(200).json({
        status: 'ok',
        version: '2.2.0-full',
        db_status: dbStatus,
        node_env: process.env.NODE_ENV,
        timestamp: new Date().toISOString()
    });
}));
// Webhook must be before express.json()
app.use('/api', webhook_routes_1.default);
// Re-enabled stable routes
app.use('/api/auth', authLimiter, auth_routes_1.authRoutes);
app.use('/api/notifications', apiLimiter, notification_routes_1.notificationRoutes);
app.use('/api/sectors', apiLimiter, sector_routes_1.default);
// Re-enabling protected routes
app.use('/api/managers', auth_middleware_1.authenticate, risk_manager_routes_1.default);
app.use('/api/dashboard', auth_middleware_1.authenticate, dashboard_routes_1.default);
app.use('/api/articles', article_routes_1.default);
app.use('/api/linkedin', linkedin_routes_1.default);
console.log('Mounting /api/subscription routes...');
app.use('/api/subscription', auth_middleware_1.authenticate, subscription_routes_1.default);
console.log('Mounted /api/subscription routes.');
app.use('/api/admin', admin_routes_1.default);
app.get('/', (req, res) => {
    res.send('Sentinela AI API is running - STABLE-RESTORE');
});
exports.default = app;
if (require.main === module) {
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}
