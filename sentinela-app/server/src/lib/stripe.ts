import Stripe from 'stripe';

let stripeInstance: Stripe | null = null;

export function getStripe() {
    if (!stripeInstance) {
        if (!process.env.STRIPE_SECRET_KEY) {
            console.warn('STRIPE_SECRET_KEY is missing from environment variables');
        }
        stripeInstance = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
            apiVersion: '2023-10-16' as any,
            typescript: true,
        });
    }
    return stripeInstance;
}

// Keep the export for compatibility but it might still cause issues if imported as 'stripe'
// Better to update consumers to use getStripe()
export const stripe = new Proxy({} as Stripe, {
    get: (target, prop) => {
        const instance = getStripe();
        return (instance as any)[prop];
    }
});
