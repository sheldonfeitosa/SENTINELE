import { Router } from 'express';
import { stripe } from '../lib/stripe';
import { prisma } from '../lib/prisma';

const router = Router();

const YOUR_DOMAIN = 'http://localhost:5173'; // Make this dynamic based on env

router.post('/create-checkout-session', async (req: any, res) => {
    try {
        console.log('[Subscription] Request received');

        // Strictly use ID from auth token (secure)
        const userId = req.user?.userId;

        console.log(`[Subscription] Target User ID: ${userId}`);

        if (!userId) {
            console.error('[Subscription] No User ID provided');
            return res.status(401).json({ error: 'Unauthorized: No user ID found' });
        }

        // Ensure ID is a number
        const id = Number(userId);

        const user = await prisma.user.findUnique({ where: { id: id } });

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

        const session = await stripe.checkout.sessions.create({
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
    } catch (error) {
        console.error('Stripe Checkout Error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

export default router;
