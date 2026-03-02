/**
 * NovaPay - Development Configuration
 * 
 * Toggle features for development/testing
 */

export const devConfig = {
    // Skip login and go straight to app (ENABLE FOR TESTING)
    SKIP_AUTH: true,

    // Mock user data for testing
    MOCK_USER: {
        id: 'dev-user-001',
        phone_number: '+2348012345678',
        first_name: 'Test',
        last_name: 'User',
        email: 'test@novapay.com',
        tier_level: 1,
        referral_code: 'TEST123',
        is_phone_verified: true,
        country_code: 'NG',
        created_at: new Date().toISOString(),
    },

    // Mock wallet data
    MOCK_WALLET: {
        id: 'dev-wallet-001',
        user_id: 'dev-user-001',
        account_number: '8012345678',
        balance: 50000, // ₦50,000
        available_balance: 48500,
        pending_balance: 1500,
        currency: 'NGN',
        status: 'active' as const,
        daily_transaction_limit: 500000,
        daily_transaction_count: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
    },
};

// How to re-enable authentication later:
// 1. Set SKIP_AUTH to false
// 2. Restart the app
// 3. Login flow will work normally
