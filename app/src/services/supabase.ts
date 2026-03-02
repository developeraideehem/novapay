// NovaPay - Supabase Client Configuration
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';
import { Database } from '../types/database';

/**
 * Supabase configuration
 * 
 * SECURITY: Credentials MUST be stored in .env file
 * Get your credentials from: https://supabase.com/dashboard/project/_/settings/api
 */

function getRequiredEnv(key: string): string {
    const value = process.env[key];
    if (!value) {
        throw new Error(
            `Missing required environment variable: ${key}\n` +
            `Please add it to your .env file`
        );
    }
    return value;
}

const SUPABASE_URL = getRequiredEnv('EXPO_PUBLIC_SUPABASE_URL');
const SUPABASE_ANON_KEY = getRequiredEnv('EXPO_PUBLIC_SUPABASE_ANON_KEY');

// Platform-aware storage adapter
// Uses localStorage for web, SecureStore for native
const isWeb = typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';

const StorageAdapter = {
    getItem: async (key: string): Promise<string | null> => {
        try {
            if (isWeb) {
                return window.localStorage.getItem(key);
            }
            return await SecureStore.getItemAsync(key);
        } catch (error) {
            console.error('Storage getItem error:', error);
            return null;
        }
    },
    setItem: async (key: string, value: string): Promise<void> => {
        try {
            if (isWeb) {
                window.localStorage.setItem(key, value);
                return;
            }
            await SecureStore.setItemAsync(key, value);
        } catch (error) {
            console.error('Storage setItem error:', error);
        }
    },
    removeItem: async (key: string): Promise<void> => {
        try {
            if (isWeb) {
                window.localStorage.removeItem(key);
                return;
            }
            await SecureStore.deleteItemAsync(key);
        } catch (error) {
            console.error('Storage removeItem error:', error);
        }
    },
};

// Create Supabase client with platform-aware storage
export const supabase: SupabaseClient<Database> = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
        storage: StorageAdapter,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
    },
});

// Helper function to check if Supabase is configured
export const isSupabaseConfigured = (): boolean => {
    // Credentials are now configured for the NovaPay project
    return true;
};

export default supabase;
