import { create } from 'zustand';
import { supabase } from '../services/supabase';
import { UserProfile, getCurrentUser } from '../services/auth';
import { Wallet, getWallet } from '../services/wallet';
import { devConfig } from '../config/dev';

interface AuthState {
    // State
    isLoading: boolean;
    isAuthenticated: boolean;
    user: UserProfile | null;
    wallet: Wallet | null;
    hasPin: boolean;

    // Actions
    initialize: () => Promise<void>;
    setUser: (user: UserProfile | null) => void;
    setWallet: (wallet: Wallet | null) => void;
    setHasPin: (hasPin: boolean) => void;
    refreshWallet: () => Promise<void>;
    signOut: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
    // Initial state
    isLoading: true,
    isAuthenticated: false,
    user: null,
    wallet: null,
    hasPin: false,

    // Initialize auth state
    initialize: async () => {
        try {
            set({ isLoading: true });

            // DEV MODE: Skip authentication for testing
            if (devConfig.SKIP_AUTH) {
                console.log('🔧 DEV MODE: Skipping authentication, using mock data');

                set({
                    isAuthenticated: true,
                    user: devConfig.MOCK_USER as UserProfile,
                    wallet: devConfig.MOCK_WALLET,
                    hasPin: true, // Pretend we have a PIN set
                    isLoading: false,
                });

                return;
            }

            // PRODUCTION: Normal authentication flow
            // Check current session
            const { data: { session } } = await supabase.auth.getSession();

            if (session?.user) {
                // Get user profile
                const user = await getCurrentUser();

                if (user) {
                    // Get wallet
                    const wallet = await getWallet(user.id);

                    set({
                        isAuthenticated: true,
                        user,
                        wallet,
                        hasPin: !!(user as any).transaction_pin_hash,
                        isLoading: false,
                    });

                    return;
                }
            }

            set({
                isAuthenticated: false,
                user: null,
                wallet: null,
                hasPin: false,
                isLoading: false,
            });
        } catch (error) {
            console.error('Auth initialization error:', error);
            set({
                isAuthenticated: false,
                user: null,
                wallet: null,
                hasPin: false,
                isLoading: false,
            });
        }
    },

    // Set user
    setUser: (user) => {
        set({
            user,
            isAuthenticated: !!user,
            hasPin: !!(user as any)?.transaction_pin_hash,
        });
    },

    // Set wallet
    setWallet: (wallet) => {
        set({ wallet });
    },

    // Set PIN status
    setHasPin: (hasPin) => {
        set({ hasPin });
    },

    // Refresh wallet balance
    refreshWallet: async () => {
        const { user } = get();
        if (user) {
            const wallet = await getWallet(user.id);
            set({ wallet });
        }
    },

    // Sign out
    signOut: async () => {
        await supabase.auth.signOut();
        set({
            isAuthenticated: false,
            user: null,
            wallet: null,
            hasPin: false,
        });
    },
}));

// Subscribe to auth changes
supabase.auth.onAuthStateChange(async (event, session) => {
    const store = useAuthStore.getState();

    if (event === 'SIGNED_IN' && session?.user) {
        const user = await getCurrentUser();
        if (user) {
            const wallet = await getWallet(user.id);
            store.setUser(user);
            store.setWallet(wallet);
        }
    } else if (event === 'SIGNED_OUT') {
        store.setUser(null);
        store.setWallet(null);
    }
});

export default useAuthStore;
