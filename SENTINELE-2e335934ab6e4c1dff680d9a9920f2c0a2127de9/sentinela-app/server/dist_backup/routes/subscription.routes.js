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
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const stripe_1 = require("../lib/stripe");
const prisma_1 = require("../lib/prisma");
const router = (0, express_1.Router)();
const YOUR_DOMAIN = process.env.APP_URL || 'https://sentinelaai.com.br';
router.post('/create-checkout-session', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        console.log('[Subscription] Request received');
        // Prioritize ID from auth token (secure), fallback to body (testing)
        const userId = ((_a = req.user) === null || _a === void 0 ? void 0 : _a.userId) || req.body.userId;
        console.log(`[Subscription] Target User ID: ${userId}`);
        if (!userId) {
            console.error('[Subscription] No User ID provided');
            return res.status(401).json({ error: 'Unauthorized: No user ID found' });
        }
        // Ensure ID is a number
        const id = Number(userId);
        const user = yield prisma_1.prisma.user.findUnique({ where: { id: id } });
        if (!user) {
            console.error(`[Subscription] User ${id} not found in database`);
            return res.status(404).json({ error: `User with ID ${id} not found` });
        }
        const priceId = process.env.STRIPE_PRICE_ID;
        // MOCK MODE FOR TESTING WITHOUT KEYS
        if (!process.env.STRIPE_SECRET_KEY || process.env.STRIPE_SECRET_KEY.includes('placeholder')) {
            console.log('Using Mock Payment Mode');
            return res.json({ url: `${YOUR_DOMAIN}/success?session_id=mock_session_123` });
        }
        if (!priceId) {
            return res.status(500).json({ error: 'Stripe configuration error' });
        }
        const session = yield stripe_1.stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [
                {
                    price: priceId,
                    quantity: 1,
                },
            ],
            mode: 'subscription',
            success_url: `${YOUR_DOMAIN}/success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${YOUR_DOMAIN}/planos`,
            customer_email: user.email,
            client_reference_id: userId.toString(),
            metadata: {
                userId: userId.toString(),
            }
        });
        res.json({ url: session.url });
    }
    catch (error) {
        console.error('Stripe Checkout Error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}));
exports.default = router;
liste;
todas;
os;
mail;
que;
