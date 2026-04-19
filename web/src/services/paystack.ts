// NovaPay Web — Paystack Service
// ⚠️  All secret-key calls are proxied through the backend (http://localhost:3001)
//     Only the PUBLIC key is used in the browser (safe to expose).

const PAYSTACK_PUBLIC_KEY =
    import.meta.env.VITE_PAYSTACK_PUBLIC_KEY || 'pk_test_b8fbbd09ebcf934b94bdfcf3c903e76f459d1d88';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export const PAYSTACK_PUBLIC = PAYSTACK_PUBLIC_KEY;

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PaystackResponse {
    status: 'success' | 'error';
    message: string;
    reference?: string;
    amount?: number;
    authorization_url?: string;
    data?: unknown;
}

export interface BankAccount {
    account_number: string;
    account_name: string;
    bank_code: string;
    bank_name: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function backendPost<T = unknown>(path: string, body: Record<string, unknown>): Promise<T> {
    const res = await fetch(`${API_BASE}${path}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Backend request failed');
    return data as T;
}

// ─── Initialize payment via backend proxy ─────────────────────────────────────
export const initializePayment = async (
    email: string,
    amount: number, // Naira
    reference: string,
    callback_url?: string
): Promise<PaystackResponse> => {
    try {
        const data = await backendPost<PaystackResponse>('/api/paystack/initialize', {
            email,
            amount,
            reference,
            callback_url: callback_url || window.location.origin,
        });
        return data;
    } catch (err: any) {
        console.error('initializePayment error:', err.message);
        return { status: 'error', message: err.message || 'Payment initialization failed' };
    }
};

// ─── Verify payment via backend proxy ────────────────────────────────────────
export const verifyPayment = async (reference: string): Promise<PaystackResponse> => {
    try {
        const data = await backendPost<PaystackResponse>('/api/paystack/verify', { reference });
        return data;
    } catch (err: any) {
        console.error('verifyPayment error:', err.message);
        return { status: 'error', message: err.message || 'Verification failed' };
    }
};

// ─── Resolve bank account via backend proxy ───────────────────────────────────
export const resolveBankAccount = async (
    accountNumber: string,
    bankCode: string
): Promise<{ success: boolean; account_name?: string; message?: string }> => {
    try {
        const data = await backendPost<{ status: string; account_name?: string; message?: string }>(
            '/api/paystack/resolve-bank',
            { account_number: accountNumber, bank_code: bankCode }
        );
        return { success: data.status === 'success', account_name: data.account_name };
    } catch (err: any) {
        return { success: false, message: err.message || 'Could not resolve account' };
    }
};

// ─── Create transfer recipient via backend proxy ──────────────────────────────
export const createTransferRecipient = async (
    name: string,
    accountNumber: string,
    bankCode: string
): Promise<{ success: boolean; recipient_code?: string; message?: string }> => {
    try {
        const data = await backendPost<{ status: string; recipient_code?: string; message?: string }>(
            '/api/paystack/create-recipient',
            { name, account_number: accountNumber, bank_code: bankCode }
        );
        return { success: data.status === 'success', recipient_code: data.recipient_code };
    } catch (err: any) {
        return { success: false, message: err.message || 'Failed to create recipient' };
    }
};

// ─── Initiate bank withdrawal via backend proxy ───────────────────────────────
export const initiateTransfer = async (
    amount: number, // Naira
    recipient_code: string,
    reason: string
): Promise<PaystackResponse> => {
    try {
        const data = await backendPost<PaystackResponse>('/api/paystack/transfer', {
            amount,
            recipient_code,
            reason,
        });
        return data;
    } catch (err: any) {
        console.error('initiateTransfer error:', err.message);
        return { status: 'error', message: err.message || 'Transfer failed' };
    }
};

// ─── Nigerian Banks list ──────────────────────────────────────────────────────
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
