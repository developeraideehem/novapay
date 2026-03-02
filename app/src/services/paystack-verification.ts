// NovaPay - Paystack Bank Account Verification Service
// https://paystack.com/docs/identity-verification/verify-account-number/

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY || 'sk_test_31bbb50ef17d15a8eb5f70a8f466546d4fb4b2cd';
const PAYSTACK_BASE_URL = 'https://api.paystack.co';

export interface BankAccountVerification {
    account_number: string;
    account_name: string;
    bank_id: number;
}

export interface VerificationError {
    success: false;
    message: string;
}

export type VerificationResult = BankAccountVerification | VerificationError;

/**
 * Verify a Nigerian bank account number and get the account name
 * 
 * @param accountNumber - 10-digit bank account number
 * @param bankCode - Bank code (e.g., '058' for GTBank)
 * @returns Account details or error
 */
export const verifyBankAccount = async (
    accountNumber: string,
    bankCode: string
): Promise<VerificationResult> => {
    try {
        // Validate inputs
        if (!accountNumber || !bankCode) {
            return {
                success: false,
                message: 'Account number and bank code are required',
            };
        }

        if (!/^\d{10}$/.test(accountNumber)) {
            return {
                success: false,
                message: 'Account number must be exactly 10 digits',
            };
        }

        // Call Paystack API
        const response = await fetch(
            `${PAYSTACK_BASE_URL}/bank/resolve?account_number=${accountNumber}&bank_code=${bankCode}`,
            {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${PAYSTACK_SECRET_KEY}`,
                    'Content-Type': 'application/json',
                },
            }
        );

        const data = await response.json();

        if (!response.ok || !data.status) {
            return {
                success: false,
                message: data.message || 'Could not verify account. Please check the account number and try again.',
            };
        }

        // Return verified account details
        return {
            account_number: data.data.account_number,
            account_name: data.data.account_name,
            bank_id: data.data.bank_id,
        };
    } catch (error: any) {
        console.error('Bank verification error:', error);
        return {
            success: false,
            message: 'Network error. Please check your connection and try again.',
        };
    }
};

/**
 * Get list of supported banks from Paystack
 */
export const getSupportedBanks = async (): Promise<any[]> => {
    try {
        const response = await fetch(`${PAYSTACK_BASE_URL}/bank?country=nigeria`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${PAYSTACK_SECRET_KEY}`,
                'Content-Type': 'application/json',
            },
        });

        const data = await response.json();

        if (data.status && data.data) {
            return data.data;
        }

        return [];
    } catch (error) {
        console.error('Error fetching banks:', error);
        return [];
    }
};

export default {
    verifyBankAccount,
    getSupportedBanks,
};
