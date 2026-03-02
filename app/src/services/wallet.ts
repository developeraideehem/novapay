// NovaPay - Wallet Service
import { supabase } from './supabase';

// Types
export interface Wallet {
    id: string;
    user_id: string;
    balance: number;
    available_balance: number;
    pending_balance: number;
    account_number: string;
    currency: string;
    status: 'active' | 'frozen' | 'closed' | 'inactive' | 'suspended';
    daily_transaction_limit: number;
    daily_transaction_count: number;
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
    recipient_name: string | null;
    status: 'pending' | 'processing' | 'completed' | 'failed' | 'reversed' | 'success' | 'cancelled';
    balance_before: number | null;
    balance_after: number | null;
    created_at: string;
}

export interface TransferRequest {
    recipientIdentifier: string; // Account number or phone
    amount: number;
    description?: string;
}

// Get user's wallet
export const getWallet = async (userId: string): Promise<Wallet | null> => {
    try {
        const { data, error } = await supabase
            .from('wallets')
            .select('*')
            .eq('user_id', userId)
            .single();

        if (error) {
            console.error('Get wallet error:', error);
            return null;
        }

        return data;
    } catch (error) {
        console.error('Get wallet exception:', error);
        return null;
    }
};

// Get wallet by account number (for transfers)
export const findWalletByIdentifier = async (
    identifier: string
): Promise<{ wallet_id: string; account_number: string; user_name: string } | null> => {
    try {
        const { data, error } = await supabase
            .rpc('find_wallet_by_identifier', { p_identifier: identifier });

        if (error || !data || data.length === 0) {
            return null;
        }

        const result = data[0];
        return {
            wallet_id: result.id, // Assuming id returned by RPC is wallet_id
            account_number: identifier, // Return the identifier used for search
            user_name: `${result.first_name} ${result.last_name}`.trim(),
        };
    } catch (error) {
        console.error('Find wallet error:', error);
        return null;
    }
};

// Get transaction history
export const getTransactions = async (
    walletId: string,
    limit: number = 20,
    offset: number = 0
): Promise<Transaction[]> => {
    try {
        const { data, error } = await supabase
            .from('transactions')
            .select('*')
            .eq('wallet_id', walletId)
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1);

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

// Create a transaction record (for bill payments, airtime, etc.)
export const createTransaction = async (data: {
    wallet_id: string;
    type: 'credit' | 'debit';
    category: string;
    amount: number;
    description?: string;
    recipient_name?: string;
    reference?: string;
    fee?: number;
    cashback?: number;
    metadata?: any;
}): Promise<{ success: boolean; transaction_id?: string; message?: string }> => {
    try {
        const { data: transaction, error } = await supabase
            .from('transactions')
            .insert({
                wallet_id: data.wallet_id,
                type: data.type,
                category: data.category,
                amount: data.amount,
                description: data.description || null,
                recipient_name: data.recipient_name || null,
                reference: data.reference || `TXN-${Date.now()}`,
                fee: data.fee || 0,
                cashback: data.cashback || 0,
                status: 'completed',
                metadata: data.metadata || null,
            })
            .select('id')
            .single();

        if (error) {
            console.error('Create transaction error:', error);
            return { success: false, message: error.message };
        }

        return { success: true, transaction_id: transaction.id };
    } catch (error: any) {
        console.error('Create transaction exception:', error);
        return { success: false, message: error.message || 'Failed to create transaction' };
    }
};

// Transfer money
export const transferMoney = async (
    fromWalletId: string,
    toWalletId: string,
    amount: number,
    description?: string,
    fee: number = 0
): Promise<{ success: boolean; message: string; transactionId?: string }> => {
    try {
        const { data, error } = await supabase
            .rpc('transfer_funds', {
                p_from_wallet_id: fromWalletId,
                p_to_wallet_id: toWalletId,
                p_amount: amount,
                p_description: description || null,
                p_fee: fee,
            });

        if (error) {
            return { success: false, message: error.message };
        }

        if (!data || !data.success) {
            return { success: false, message: data?.message || 'Transfer failed' };
        }

        return {
            success: true,
            message: 'Transfer successful',
            transactionId: data.debit_transaction_id || undefined,
        };
    } catch (error: any) {
        return { success: false, message: error.message || 'Transfer failed' };
    }
};

// Calculate transfer fee (free for NovaPay to NovaPay)
export const calculateTransferFee = (
    amount: number,
    transferType: 'wallet' | 'bank'
): number => {
    if (transferType === 'wallet') {
        return 0; // Free transfers between NovaPay users
    }

    // Bank transfers have fees (typical Nigerian bank charges)
    if (amount <= 5000) return 10.75;
    if (amount <= 50000) return 26.88;
    return 53.75;
};

// Format currency (Nigerian Naira)
export const formatCurrency = (
    amount: number,
    currency: string = 'NGN'
): string => {
    return new Intl.NumberFormat('en-NG', {
        style: 'currency',
        currency: currency,
        minimumFractionDigits: 2,
    }).format(amount);
};

// Subscribe to wallet balance changes (real-time)
export const subscribeToWallet = (
    walletId: string,
    callback: (wallet: Wallet) => void
) => {
    return supabase
        .channel(`wallet:${walletId}`)
        .on(
            'postgres_changes',
            {
                event: 'UPDATE',
                schema: 'public',
                table: 'wallets',
                filter: `id=eq.${walletId}`,
            },
            (payload) => {
                callback(payload.new as Wallet);
            }
        )
        .subscribe();
};

// Subscribe to new transactions (real-time)
export const subscribeToTransactions = (
    walletId: string,
    callback: (transaction: Transaction) => void
) => {
    return supabase
        .channel(`transactions:${walletId}`)
        .on(
            'postgres_changes',
            {
                event: 'INSERT',
                schema: 'public',
                table: 'transactions',
                filter: `wallet_id=eq.${walletId}`,
            },
            (payload) => {
                callback(payload.new as Transaction);
            }
        )
        .subscribe();
};
