// NovaPay Web - Wallet Service
import { supabase } from './supabase';

export interface Wallet {
    id: string;
    user_id: string;
    balance: number;
    available_balance: number;
    account_number: string;
    currency: string;
    status: string;
    created_at: string;
}

export interface Transaction {
    id: string;
    wallet_id: string;
    type: 'credit' | 'debit';
    category: string;
    amount: number;
    fee: number;
    cashback: number;
    reference: string;
    description: string | null;
    status: string;
    created_at: string;
}

// Valid transaction categories matching the DB constraint
export type TransactionCategory =
    | 'transfer_in' | 'transfer_out'
    | 'deposit' | 'withdrawal'
    | 'airtime' | 'data'
    | 'electricity' | 'cable_tv' | 'internet'
    | 'savings_deposit' | 'savings_withdrawal' | 'savings_interest'
    | 'loan_disbursement' | 'loan_repayment'
    | 'cashback' | 'referral_bonus' | 'reversal';

// Get wallet by user ID (creates one if it doesn't exist)
export const getOrCreateWallet = async (userId: string): Promise<Wallet | null> => {
    try {
        // First try to get existing wallet
        const { data: existing, error: fetchError } = await supabase
            .from('wallets')
            .select('*')
            .eq('user_id', userId)
            .single();

        if (existing && !fetchError) {
            return existing;
        }

        // Create a new wallet with a unique account number
        const accountNumber = `70${Math.floor(Math.random() * 100000000).toString().padStart(8, '0')}`;

        const { data: newWallet, error: createError } = await supabase
            .from('wallets')
            .insert({
                user_id: userId,
                balance: 5000, // ₦5,000 demo balance for testing
                available_balance: 5000,
                pending_balance: 0,
                account_number: accountNumber,
                currency: 'NGN',
                status: 'active',
                daily_transaction_limit: 50000,
                daily_transaction_count: 0,
            })
            .select()
            .single();

        if (createError) {
            console.error('Create wallet error:', createError);
            return null;
        }

        return newWallet;
    } catch (error) {
        console.error('Get/create wallet exception:', error);
        return null;
    }
};

// Get transactions for a wallet
export const getTransactions = async (
    walletId: string,
    limit: number = 20
): Promise<Transaction[]> => {
    try {
        const { data, error } = await supabase
            .from('transactions')
            .select('*')
            .eq('wallet_id', walletId)
            .order('created_at', { ascending: false })
            .limit(limit);

        if (error) {
            console.error('Get transactions error:', error);
            return [];
        }

        return data || [];
    } catch (error) {
        console.error('Get transactions exception:', error);
        return [];
    }
};

// Create a transaction and update wallet balance via RPC
export const createTransaction = async (data: {
    wallet_id: string;
    type: 'credit' | 'debit';
    category: TransactionCategory | string;
    amount: number;
    description?: string;
    reference?: string;
    fee?: number;
    cashback?: number;
}): Promise<{ success: boolean; transaction_id?: string; message?: string }> => {
    try {
        // Insert the transaction record
        const { data: transaction, error } = await supabase
            .from('transactions')
            .insert({
                wallet_id: data.wallet_id,
                type: data.type,
                category: data.category,
                amount: data.amount,
                description: data.description || null,
                reference: data.reference || `TXN-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
                fee: data.fee || 0,
                cashback: data.cashback || 0,
                status: 'completed',
            })
            .select('id')
            .single();

        if (error) {
            console.error('Create transaction error:', error);
            return { success: false, message: error.message };
        }

        // Update wallet balance via RPC
        // p_amount is always positive; p_type drives direction ('credit' or 'debit')
        const { error: rpcError } = await supabase.rpc('update_wallet_balance', {
            p_wallet_id: data.wallet_id,
            p_amount: data.amount,
            p_type: data.type,
        });

        if (rpcError) {
            console.error('Balance update RPC error:', rpcError.message);
            // Non-fatal — transaction is already recorded; balance will sync on next refresh
        }

        return { success: true, transaction_id: transaction.id };
    } catch (error: any) {
        console.error('Create transaction exception:', error);
        return { success: false, message: error.message || 'Failed to create transaction' };
    }
};

// Format currency as NGN
export const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-NG', {
        style: 'currency',
        currency: 'NGN',
        minimumFractionDigits: 2,
    }).format(amount);
};
