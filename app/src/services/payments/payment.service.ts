/**
 * Payment Service
 * 
 * High-level payment operations for the NovaPay app
 */

import { paystackGateway } from './paystack.gateway';
import { supabase } from '../supabase';
import { v4 as uuidv4 } from 'uuid';
import { fromKobo, toKobo } from '../../config/payment';

export interface FundWalletRequest {
    walletId: string;
    amount: number;
    email: string;
    phone?: string;
}

export interface FundWalletResponse {
    success: boolean;
    authorizationUrl?: string;
    reference: string;
    message?: string;
}

export interface WithdrawToBankRequest {
    walletId: string;
    amount: number;
    accountNumber: string;
    bankCode: string;
    narration?: string;
}

export interface WithdrawToBankResponse {
    success: boolean;
    reference: string;
    status: 'pending' | 'success' | 'failed';
    message?: string;
}

/**
 * Fund user wallet via card payment
 */
export async function fundWallet(request: FundWalletRequest): Promise<FundWalletResponse> {
    try {
        // Generate unique reference
        const reference = `NVP_FND_${Date.now()}_${uuidv4().substring(0, 8)}`;

        // Initialize payment with Paystack
        const paymentResponse = await paystackGateway.initializePayment({
            amount: request.amount,
            email: request.email,
            reference,
            currency: 'NGN',
            channels: ['card', 'bank', 'ussd'],
        });

        if (!paymentResponse.success) {
            return {
                success: false,
                reference,
                message: paymentResponse.message || 'Failed to initialize payment',
            };
        }

        // Record transaction in database (pending status)
        const { data: insertedTx, error: insertError } = await supabase.from('transactions').insert({
            wallet_id: request.walletId,
            type: 'credit',
            category: 'wallet_funding',
            amount: request.amount,
            fee: 0,
            cashback: 0,
            status: 'pending',
            reference,
            description: 'Wallet funding via card',
            recipient_name: null,
        }).select().single();

        if (insertError) {
            console.error('Failed to record transaction:', insertError);
        }

        return {
            success: true,
            authorizationUrl: paymentResponse.authorization_url,
            reference,
        };
    } catch (error: any) {
        console.error('Fund wallet error:', error);
        return {
            success: false,
            reference: '',
            message: error.message || 'An error occurred',
        };
    }
}

/**
 * Verify and complete a payment transaction
 */
export async function verifyPaymentAndCreditWallet(reference: string): Promise<boolean> {
    try {
        // Verify payment with Paystack
        const verification = await paystackGateway.verifyPayment(reference);

        if (!verification.success || verification.status !== 'success') {
            // Update transaction as failed
            await supabase
                .from('transactions')
                .update({
                    status: 'failed',
                })
                .eq('reference', reference);

            return false;
        }

        // Get transaction from database
        const { data: transaction, error: txError } = await supabase
            .from('transactions')
            .select('*, wallet_id')
            .eq('reference', reference)
            .single();

        if (txError || !transaction) {
            console.error('Transaction not found:', reference);
            return false;
        }

        // Credit user wallet
        const { data: wallet, error: walletError } = await supabase
            .from('wallets')
            .select('id, balance')
            .eq('id', transaction.wallet_id)
            .single();

        if (walletError || !wallet) {
            console.error('Wallet not found:', transaction.wallet_id);
            return false;
        }

        const newBalance = wallet.balance + verification.amount;

        // Update wallet balance
        await supabase
            .from('wallets')
            .update({
                balance: newBalance,
                updated_at: new Date().toISOString(),
            })
            .eq('id', transaction.wallet_id);

        // Update transaction as completed
        await supabase
            .from('transactions')
            .update({
                status: 'completed',
                balance_before: wallet.balance,
                balance_after: newBalance,
            })
            .eq('reference', reference);

        console.log(`✅ Wallet credited: ${verification.amount} NGN for wallet ${transaction.wallet_id}`);

        // TODO: Send SMS notification

        return true;
    } catch (error) {
        console.error('Payment verification error:', error);
        return false;
    }
}

/**
 * Withdraw funds to bank account
 */
export async function withdrawToBank(request: WithdrawToBankRequest): Promise<WithdrawToBankResponse> {
    try {
        // Verify account details first
        const accountVerification = await paystackGateway.verifyBankAccount(
            request.accountNumber,
            request.bankCode
        );

        if (!accountVerification.success) {
            return {
                success: false,
                reference: '',
                status: 'failed',
                message: 'Invalid account details',
            };
        }

        // Check if user has sufficient balance
        const { data: wallet } = await supabase
            .from('wallets')
            .select('id, balance')
            .eq('id', request.walletId)
            .single();

        if (!wallet || wallet.balance < request.amount) {
            return {
                success: false,
                reference: '',
                status: 'failed',
                message: 'Insufficient balance',
            };
        }

        // Generate reference
        const reference = `NVP_WTH_${Date.now()}_${uuidv4().substring(0, 8)}`;

        // Create transfer recipient (or use existing)
        // Note: In production, cache recipient codes to avoid recreating
        const recipientCode = await createTransferRecipient(
            accountVerification.account_name!,
            request.accountNumber,
            request.bankCode
        );

        if (!recipientCode) {
            return {
                success: false,
                reference,
                status: 'failed',
                message: 'Failed to create transfer recipient',
            };
        }

        // Initiate transfer
        const transferResponse = await paystackGateway.initiateTransfer({
            amount: request.amount,
            recipient_code: recipientCode,
            reason: request.narration || 'NovaPay withdrawal',
            reference,
        });

        if (!transferResponse.success) {
            return {
                success: false,
                reference,
                status: 'failed',
                message: transferResponse.message || 'Transfer failed',
            };
        }

        // Deduct from wallet (mark as pending)
        const newBalance = wallet.balance - request.amount;

        await supabase
            .from('wallets')
            .update({
                balance: newBalance,
                updated_at: new Date().toISOString(),
            })
            .eq('id', request.walletId);

        // Record transaction
        await supabase.from('transactions').insert({
            wallet_id: request.walletId,
            type: 'debit',
            category: 'withdrawal',
            amount: request.amount,
            fee: 0,
            cashback: 0,
            status: 'pending',
            reference,
            description: `Withdrawal to ${accountVerification.account_name}`,
            recipient_name: accountVerification.account_name || null,
        });

        return {
            success: true,
            reference,
            status: transferResponse.status,
        };
    } catch (error: any) {
        console.error('Withdraw to bank error:', error);
        return {
            success: false,
            reference: '',
            status: 'failed',
            message: error.message || 'An error occurred',
        };
    }
}

/**
 * Create a transfer recipient in Paystack
 */
async function createTransferRecipient(
    name: string,
    accountNumber: string,
    bankCode: string
): Promise<string | null> {
    try {
        // This would be an API call to Paystack
        // For now, returning a mock recipient code
        // TODO: Implement actual Paystack recipient creation
        return `RCP_${uuidv4().substring(0, 16)}`;
    } catch (error) {
        console.error('Failed to create recipient:', error);
        return null;
    }
}

/**
 * Get list of Nigerian banks
 */
export async function getNigerianBanks() {
    // In production, fetch from Paystack: GET /bank
    return [
        { name: 'Access Bank', code: '044', logo: '💳' },
        { name: 'Citibank', code: '023', logo: '💳' },
        { name: 'Diamond Bank', code: '063', logo: '💎' },
        { name: 'Ecobank Nigeria', code: '050', logo: '🏦' },
        { name: 'Fidelity Bank', code: '070', logo: '💳' },
        { name: 'First Bank of Nigeria', code: '011', logo: '1️⃣' },
        { name: 'First City Monument Bank', code: '214', logo: '💳' },
        { name: 'Guaranty Trust Bank', code: '058', logo: '💳' },
        { name: 'Heritage Bank', code: '030', logo: '💳' },
        { name: 'Keystone Bank', code: '082', logo: '🔑' },
        { name: 'Polaris Bank', code: '076', logo: '⭐' },
        { name: 'Providus Bank', code: '101', logo: '💳' },
        { name: 'Stanbic IBTC Bank', code: '221', logo: '💳' },
        { name: 'Standard Chartered Bank', code: '068', logo: '💳' },
        { name: 'Sterling Bank', code: '232', logo: '💷' },
        { name: 'Union Bank of Nigeria', code: '032', logo: '🤝' },
        { name: 'United Bank for Africa', code: '033', logo: '🦁' },
        { name: 'Unity Bank', code: '215', logo: '💳' },
        { name: 'Wema Bank', code: '035', logo: '💳' },
        { name: 'Zenith Bank', code: '057', logo: '⚡' },
        { name: 'Kuda Bank', code: '090267', logo: '💜' },
        { name: 'OPay', code: '100004', logo: '💚' },
        { name: 'PalmPay', code: '100033', logo: '🌴' },
        { name: 'Moniepoint', code: '50515', logo: '📱' },
    ];
}
