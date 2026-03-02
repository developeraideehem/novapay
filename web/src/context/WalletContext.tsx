// NovaPay Web - Wallet Context
import React, { createContext, useContext, useState, useEffect } from 'react';
import type { Wallet, Transaction } from '../services/wallet';
import { getOrCreateWallet, getTransactions } from '../services/wallet';

interface WalletContextType {
    wallet: Wallet | null;
    transactions: Transaction[];
    loading: boolean;
    refreshWallet: () => Promise<void>;
    refreshTransactions: () => Promise<void>;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export const useWallet = () => {
    const context = useContext(WalletContext);
    if (!context) {
        throw new Error('useWallet must be used within WalletProvider');
    }
    return context;
};

export const WalletProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [wallet, setWallet] = useState<Wallet | null>(null);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);

    // For demo purposes, we'll use a test user ID
    const TEST_USER_ID = 'test-user-001';

    const refreshWallet = async () => {
        try {
            setLoading(true);
            const walletData = await getOrCreateWallet(TEST_USER_ID);
            setWallet(walletData);
        } catch (error) {
            console.error('Error refreshing wallet:', error);
        } finally {
            setLoading(false);
        }
    };

    const refreshTransactions = async () => {
        if (!wallet) return;

        try {
            const txns = await getTransactions(wallet.id);
            setTransactions(txns);
        } catch (error) {
            console.error('Error refreshing transactions:', error);
        }
    };

    // Load wallet on mount
    useEffect(() => {
        refreshWallet();
    }, []);

    // Load transactions when wallet changes
    useEffect(() => {
        if (wallet) {
            refreshTransactions();
        }
    }, [wallet?.id]);

    return (
        <WalletContext.Provider
            value={{
                wallet,
                transactions,
                loading,
                refreshWallet,
                refreshTransactions,
            }}
        >
            {children}
        </WalletContext.Provider>
    );
};
