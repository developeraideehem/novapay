/**
 * Payment Configuration
 * 
 * Environment-based payment gateway settings
 * 
 * SECURITY: All sensitive keys MUST be stored in .env file
 * NEVER hardcode API keys, secrets, or tokens in code
 */

/**
 * Get required environment variable or throw error
 */
function getRequiredEnv(key: string): string {
    const value = process.env[key];
    if (!value) {
        throw new Error(
            `Missing required environment variable: ${key}\n` +
            `Please add it to your .env file`
        );
    }
    return value;
}

/**
 * Get optional environment variable with default
 */
function getOptionalEnv(key: string, defaultValue: string): string {
    return process.env[key] || defaultValue;
}

export const paymentConfig = {
    // Paystack Configuration
    paystack: {
        // SECURITY: These MUST be set in .env file
        // Get from: https://dashboard.paystack.com/#/settings/developer
        publicKey: getRequiredEnv('EXPO_PUBLIC_PAYSTACK_PUBLIC_KEY'),
        secretKey: getRequiredEnv('PAYSTACK_SECRET_KEY'),

        // Webhook endpoint (set after deployment)
        webhookUrl: getOptionalEnv(
            'PAYSTACK_WEBHOOK_URL',
            'https://your-backend.com/webhooks/paystack'
        ),

        // Supported payment channels
        channels: ['card', 'bank', 'ussd', 'qr'] as const,

        // Default currency
        currency: 'NGN',

        // Test mode flag
        isTestMode: process.env.NODE_ENV !== 'production',
    },

    // Flutterwave Configuration (for future)
    flutterwave: {
        publicKey: getOptionalEnv('EXPO_PUBLIC_FLW_PUBLIC_KEY', ''),
        secretKey: getOptionalEnv('FLW_SECRET_KEY', ''),
        encryptionKey: getOptionalEnv('FLW_ENCRYPTION_KEY', ''),
        isTestMode: process.env.NODE_ENV !== 'production',
    },

    // General Payment Settings
    settings: {
        // Minimum amount (in kobo/cents)
        minAmount: 10000, // ₦100

        // Maximum amount (in kobo/cents)
        maxAmount: 1000000000, // ₦10,000,000

        // Transaction fees
        fees: {
            local: {
                percentage: 1.5, // 1.5%
                cap: 200000, // ₦2,000 cap
                flatFee: 10000, // ₦100 flat fee
            },
            international: {
                percentage: 3.9,
                flatFee: 10000,
                cap: undefined, // No cap for international transactions
            },
        },
    },
};

/**
 * Get Paystack public key for client-side use
 */
export function getPaystackPublicKey(): string {
    return paymentConfig.paystack.publicKey;
}

/**
 * Calculate transaction fees
 */
export function calculateTransactionFees(amount: number, isInternational: boolean = false): number {
    const config = isInternational
        ? paymentConfig.settings.fees.international
        : paymentConfig.settings.fees.local;

    const percentageFee = (amount * config.percentage) / 100;
    const totalFee = percentageFee + config.flatFee;

    // Apply cap for local transactions
    if (!isInternational && config.cap && totalFee > config.cap) {
        return config.cap;
    }

    return Math.round(totalFee);
}

/**
 * Format amount to kobo (smallest currency unit)
 */
export function toKobo(naira: number): number {
    return Math.round(naira * 100);
}

/**
 * Format amount from kobo to naira
 */
export function fromKobo(kobo: number): number {
    return kobo / 100;
}
