"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.stripe = void 0;
exports.getStripe = getStripe;
const stripe_1 = __importDefault(require("stripe"));
let stripeInstance = null;
function getStripe() {
    if (!stripeInstance) {
        if (!process.env.STRIPE_SECRET_KEY) {
            console.warn('STRIPE_SECRET_KEY is missing from environment variables');
        }
        stripeInstance = new stripe_1.default(process.env.STRIPE_SECRET_KEY || '', {
            apiVersion: '2023-10-16',
            typescript: true,
        });
    }
    return stripeInstance;
}
// Keep the export for compatibility but it might still cause issues if imported as 'stripe'
// Better to update consumers to use getStripe()
exports.stripe = new Proxy({}, {
    get: (target, prop) => {
        const instance = getStripe();
        return instance[prop];
    }
});
