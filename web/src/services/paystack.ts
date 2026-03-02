// NovaPay Web - Paystack Service
// https://paystack.com/docs/api/

const PAYSTACK_PUBLIC_KEY = import.meta.env.VITE_PAYSTACK_PUBLIC_KEY || 'pk_test_b8fbbd09ebcf934b94bdfcf3c903e76f459d1d88';
const PAYSTACK_SECRET_KEY = import.meta.env.VITE_PAYSTACK_SECRET_KEY || 'sk_test_31bbb50ef17d15a8eb5f70a8f466546d4fb4b2cd';
const PAYSTACK_BASE_URL = 'https://api.paystack.co';

export interface PaystackResponse {
    status: 'success' | 'error';
    message: string;
    reference?: string;
    amount?: number;
    data?: any;
}

export interface BankAccount {
    account_number: string;
    account_name: string;
    bank_id: number;
    bank_name: string;
}

export const PAYSTACK_PUBLIC = PAYSTACK_PUBLIC_KEY;

/**
 * Initialize a Paystack payment (returns URL or reference for SDK)
 */
export const initializePayment = async (
    email: string,
    amount: number, // in Naira
    reference: string,
    callback_url?: string
): Promise<PaystackResponse> => {
    try {
        const response = await fetch(`${PAYSTACK_BASE_URL}/transaction/initialize`, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                email,
                amount: amount * 100, // Paystack uses kobo
                reference,
                callback_url: callback_url || window.location.origin,
                channels: ['card', 'bank', 'ussd', 'bank_transfer'],
            }),
        });

        const data = await response.json();

        if (!response.ok || !data.status) {
            return {
                status: 'error',
                message: data.message || 'Failed to initialize payment.',
            };
        }

        return {
            status: 'success',
            message: 'Payment initialized',
            reference: data.data.reference,
            data: data.data,
        };
    } catch (error: any) {
        console.error('Paystack initialize error:', error);
        return {
            status: 'error',
            message: 'Network error. Please try again.',
        };
    }
};

/**
 * Verify a Paystack transaction
 */
export const verifyPayment = async (reference: string): Promise<PaystackResponse> => {
    try {
        const response = await fetch(`${PAYSTACK_BASE_URL}/transaction/verify/${reference}`, {
            headers: {
                Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
            },
        });

        const data = await response.json();

        if (!response.ok || !data.status || data.data?.status !== 'success') {
            return {
                status: 'error',
                message: data.message || 'Payment verification failed.',
            };
        }

        return {
            status: 'success',
            message: 'Payment verified successfully!',
            reference: data.data.reference,
            amount: data.data.amount / 100, // Convert kobo back to Naira
            data: data.data,
        };
    } catch (error: any) {
        console.error('Paystack verify error:', error);
        return {
            status: 'error',
            message: 'Network error during verification.',
        };
    }
};

/**
 * Resolve a bank account number
 */
export const resolveBankAccount = async (
    accountNumber: string,
    bankCode: string
): Promise<{ success: boolean; account_name?: string; message?: string }> => {
    try {
        const response = await fetch(
            `${PAYSTACK_BASE_URL}/bank/resolve?account_number=${accountNumber}&bank_code=${bankCode}`,
            {
                headers: {
                    Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
                },
            }
        );

        const data = await response.json();

        if (!response.ok || !data.status) {
            return { success: false, message: data.message || 'Invalid account number.' };
        }

        return { success: true, account_name: data.data.account_name };
    } catch (error: any) {
        return { success: false, message: 'Could not resolve account. Please check details.' };
    }
};

/**
 * Create a transfer recipient (for bank withdrawals)
 */
export const createTransferRecipient = async (
    name: string,
    accountNumber: string,
    bankCode: string
): Promise<{ success: boolean; recipient_code?: string; message?: string }> => {
    try {
        const response = await fetch(`${PAYSTACK_BASE_URL}/transferrecipient`, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                type: 'nuban',
                name,
                account_number: accountNumber,
                bank_code: bankCode,
                currency: 'NGN',
            }),
        });

        const data = await response.json();

        if (!response.ok || !data.status) {
            return { success: false, message: data.message || 'Failed to create recipient.' };
        }

        return { success: true, recipient_code: data.data.recipient_code };
    } catch (error: any) {
        return { success: false, message: 'Network error. Please try again.' };
    }
};

/**
 * Initiate bank transfer (withdrawal)
 */
export const initiateTransfer = async (
    amount: number,
    recipient_code: string,
    reason: string
): Promise<PaystackResponse> => {
    try {
        const reference = `WD-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;

        const response = await fetch(`${PAYSTACK_BASE_URL}/transfer`, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                source: 'balance',
                amount: amount * 100, // kobo
                recipient: recipient_code,
                reason,
                reference,
            }),
        });

        const data = await response.json();

        if (!response.ok || !data.status) {
            return { status: 'error', message: data.message || 'Transfer failed.' };
        }

        return {
            status: 'success',
            message: 'Transfer initiated successfully!',
            reference: data.data.reference,
            data: data.data,
        };
    } catch (error: any) {
        return { status: 'error', message: 'Network error. Please try again.' };
    }
};

// Nigerian Banks list
export const NIGERIAN_BANKS = [
    { name: 'Access Bank', code: '044' },
    { name: 'Citibank Nigeria', code: '023' },
    { name: 'Ecobank Nigeria', code: '050' },
    { name: 'Fidelity Bank', code: '070' },
    { name: 'First Bank of Nigeria', code: '011' },
    { name: 'First City Monument Bank', code: '214' },
    { name: 'Guaranty Trust Bank', code: '058' },
    { name: 'Heritage Bank', code: '030' },
    { name: 'Keystone Bank', code: '082' },
    { name: 'Kuda Bank', code: '090267' },
    { name: 'OPay', code: '999992' },
    { name: 'PalmPay', code: '999991' },
    { name: 'Polaris Bank', code: '076' },
    { name: 'Providus Bank', code: '101' },
    { name: 'Stanbic IBTC Bank', code: '039' },
    { name: 'Standard Chartered Bank', code: '068' },
    { name: 'Sterling Bank', code: '232' },
    { name: 'SunTrust Bank', code: '100' },
    { name: 'Union Bank of Nigeria', code: '032' },
    { name: 'United Bank for Africa', code: '033' },
    { name: 'Unity Bank', code: '215' },
    { name: 'VFD Micro Finance Bank', code: '566' },
    { name: 'Wema Bank', code: '035' },
    { name: 'Zenith Bank', code: '057' },
];

export default {
    initializePayment,
    verifyPayment,
    resolveBankAccount,
    createTransferRecipient,
    initiateTransfer,
    NIGERIAN_BANKS,
};
