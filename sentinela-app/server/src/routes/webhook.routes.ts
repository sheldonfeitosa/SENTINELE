import { Router, Request, Response } from 'express';
import { stripe } from '../lib/stripe';
import { PrismaClient } from '@prisma/client';
import Stripe from 'stripe';
import express from 'express';

const router = Router();
const prisma = new PrismaClient();

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

router.post('/webhook', express.raw({ type: 'application/json' }), async (req: Request, res: Response) => {
    const sig = req.headers['stripe-signature'];

    let event: Stripe.Event;

    try {
        if (!sig || !endpointSecret) throw new Error('Missing Stripe signature or secret');

        // req.body must be raw Buffer here. 
        // Ensure this route is mounted BEFORE generic express.json() middleware 
        // OR use the express.raw() middleware specifically on this route as shown above.
        event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
    } catch (err: any) {
        console.error(`Webhook Error: ${err.message}`);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Handle the event
    try {
        switch (event.type) {
            case 'checkout.session.completed': {
                const session = event.data.object as Stripe.Checkout.Session;
                // Retrieve the user from metadata or client_reference_id
                const userId = session.client_reference_id ? parseInt(session.client_reference_id) : null;

                if (userId && session.subscription) {
                    await prisma.user.update({
                        where: { id: userId },
                        data: {
                            stripeCustomerId: session.customer as string,
                            subscriptionId: session.subscription as string,
                            subscriptionStatus: 'active', // You might want to query the subscription status for accuracy
                        }
                    });
                }
                break;
            }

            case 'customer.subscription.updated': {
                const subscription = event.data.object as Stripe.Subscription;
                const customerId = subscription.customer as string;

                await prisma.user.updateMany({
                    where: { stripeCustomerId: customerId },
                    data: {
                        subscriptionStatus: subscription.status,
                        currentPeriodEnd: new Date((subscription as any).current_period_end * 1000)
                    }
                });
                break;
            }

            case 'customer.subscription.deleted': {
                const subscription = event.data.object as Stripe.Subscription;
                const customerId = subscription.customer as string;

                await prisma.user.updateMany({
                    where: { stripeCustomerId: customerId },
                    data: {
                        subscriptionStatus: 'canceled',
                    }
                });
                break;
            }

            default:
            // console.log(`Unhandled event type ${event.type}`);
        }
    } catch (error) {
        console.error("Error processing webhook:", error);
        return res.status(500).send("Internal Server Error");
    }

    res.send();
});

export default router;
