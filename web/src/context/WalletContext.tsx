// NovaPay Web — Wallet Context
// Uses Supabase auth session when available; falls back to an anonymous demo wallet.
import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import type { Wallet, Transaction } from '../services/wallet';
import { getOrCreateWallet, getTransactions } from '../services/wallet';

interface WalletContextType {
    wallet: Wallet | null;
    transactions: Transaction[];
    loading: boolean;
    userId: string | null;
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

// Demo user ID — used only when no authenticated Supabase session exists.
// Remove this once you wire up real auth flows on the web app.
const DEMO_USER_ID = '00000000-0000-0000-0000-000000000001';

export const WalletProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [wallet, setWallet] = useState<Wallet | null>(null);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [userId, setUserId] = useState<string | null>(null);

    // ─── Resolve user ID from Supabase session ───────────────────────────────
    useEffect(() => {
        // Check current session on mount
        supabase.auth.getSession().then(({ data: { session } }) => {
            setUserId(session?.user.id ?? DEMO_USER_ID);
        });

        // Listen for auth state changes (login / logout)
        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
            setUserId(session?.user.id ?? DEMO_USER_ID);
        });

        return () => subscription.unsubscribe();
    }, []);

    // ─── Load wallet whenever userId changes ─────────────────────────────────
    const refreshWallet = async () => {
        if (!userId) return;
        try {
            setLoading(true);
            const walletData = await getOrCreateWallet(userId);
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

    useEffect(() => {
        if (userId) {
            refreshWallet();
        }
    }, [userId]);

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
                userId,
                refreshWallet,
                refreshTransactions,
            }}
        >
            {children}
        </WalletContext.Provider>
    );
};
