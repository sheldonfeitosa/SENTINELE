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
const express_1 = require("express");
const stripe_1 = require("../lib/stripe");
const prisma_1 = require("../lib/prisma");
const express_2 = __importDefault(require("express"));
const router = (0, express_1.Router)();
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;
router.post('/webhook', express_2.default.raw({ type: 'application/json' }), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const sig = req.headers['stripe-signature'];
    let event;
    try {
        if (!sig || !endpointSecret)
            throw new Error('Missing Stripe signature or secret');
        // req.body must be raw Buffer here. 
        // Ensure this route is mounted BEFORE generic express.json() middleware 
        // OR use the express.raw() middleware specifically on this route as shown above.
        event = stripe_1.stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
    }
    catch (err) {
        console.error(`Webhook Error: ${err.message}`);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }
    // Handle the event
    try {
        switch (event.type) {
            case 'checkout.session.completed': {
                const session = event.data.object;
                // Retrieve the user from metadata or client_reference_id
                const userId = session.client_reference_id ? parseInt(session.client_reference_id) : null;
                if (userId && session.subscription) {
                    yield prisma_1.prisma.user.update({
                        where: { id: userId },
                        data: {
                            stripeCustomerId: session.customer,
                            subscriptionId: session.subscription,
                            subscriptionStatus: 'active', // You might want to query the subscription status for accuracy
                        }
                    });
                }
                break;
            }
            case 'customer.subscription.updated': {
                const subscription = event.data.object;
                const customerId = subscription.customer;
                yield prisma_1.prisma.user.updateMany({
                    where: { stripeCustomerId: customerId },
                    data: {
                        subscriptionStatus: subscription.status,
                        currentPeriodEnd: new Date(subscription.current_period_end * 1000)
                    }
                });
                break;
            }
            case 'customer.subscription.deleted': {
                const subscription = event.data.object;
                const customerId = subscription.customer;
                yield prisma_1.prisma.user.updateMany({
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
    }
    catch (error) {
        console.error("Error processing webhook:", error);
        return res.status(500).send("Internal Server Error");
    }
    res.send();
}));
exports.default = router;
