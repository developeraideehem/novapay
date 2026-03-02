// NovaPay - Transaction PIN Service
// Handles PIN creation, hashing, and verification

import { supabase } from './supabase';
import { useAuthStore } from '../store/useAuthStore';

/**
 * Simple bcrypt-like hashing (for demo - use actual bcrypt in production)
 * In production, use a proper library like 'react-native-bcrypt'
 */
const hashPin = async (pin: string): Promise<string> => {
    // For now, using a simple hash
    // TODO: Replace with actual bcrypt implementation
    const encoder = new TextEncoder();
    const data = encoder.encode(pin + 'NOVAPAY_SALT');
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return hashHex;
};

/**
 * Verify if a PIN matches the stored hash
 */
const verifyPinHash = async (pin: string, hash: string): Promise<boolean> => {
    const inputHash = await hashPin(pin);
    return inputHash === hash;
};

/**
 * Create a new transaction PIN for the user
 */
export const createTransactionPin = async (pin: string): Promise<{ success: boolean; error?: string }> => {
    try {
        // Validate PIN format
        if (!/^\d{6}$/.test(pin)) {
            return {
                success: false,
                error: 'PIN must be exactly 6 digits',
            };
        }

        const { user } = useAuthStore.getState();
        if (!user) {
            return {
                success: false,
                error: 'User not authenticated',
            };
        }

        // Hash the PIN
        const pinHash = await hashPin(pin);

        // Update user record
        const { error } = await supabase
            .from('users')
            .update({
                transaction_pin_hash: pinHash,
                pin_attempts: 0,
                pin_locked_until: null,
            })
            .eq('id', user.id);

        if (error) {
            console.error('Error creating PIN:', error);
            return {
                success: false,
                error: 'Failed to create PIN',
            };
        }

        // Update local user state
        useAuthStore.getState().setUser({
            ...user,
            transaction_pin_hash: pinHash,
        });

        return { success: true };
    } catch (error) {
        console.error('Error in createTransactionPin:', error);
        return {
            success: false,
            error: 'An unexpected error occurred',
        };
    }
};

/**
 * Verify the user's transaction PIN
 */
export const verifyTransactionPin = async (pin: string): Promise<boolean> => {
    try {
        const { user } = useAuthStore.getState();
        if (!user) {
            throw new Error('User not authenticated');
        }

        // Check if PIN is locked
        if (user.pin_locked_until) {
            const lockTime = new Date(user.pin_locked_until);
            if (lockTime > new Date()) {
                const minutesLeft = Math.ceil((lockTime.getTime() - Date.now()) / 60000);
                throw new Error(`PIN locked. Try again in ${minutesLeft} minutes.`);
            }
        }

        // Get current user data
        const { data: userData, error: fetchError } = await supabase
            .from('users')
            .select('transaction_pin_hash, pin_attempts')
            .eq('id', user.id)
            .single();

        if (fetchError || !userData) {
            throw new Error('Failed to fetch user data');
        }

        if (!userData.transaction_pin_hash) {
            throw new Error('No PIN set. Please create a PIN first.');
        }

        // Verify PIN
        const isValid = await verifyPinHash(pin, userData.transaction_pin_hash);

        if (isValid) {
            // Reset attempts on success
            await supabase
                .from('users')
                .update({ pin_attempts: 0 })
                .eq('id', user.id);

            return true;
        } else {
            // Increment failed attempts
            const newAttempts = (userData.pin_attempts || 0) + 1;
            const updates: any = { pin_attempts: newAttempts };

            // Lock PIN after 3 failed attempts (15 minutes)
            if (newAttempts >= 3) {
                const lockUntil = new Date();
                lockUntil.setMinutes(lockUntil.getMinutes() + 15);
                updates.pin_locked_until = lockUntil.toISOString();
            }

            await supabase
                .from('users')
                .update(updates)
                .eq('id', user.id);

            if (newAttempts >= 3) {
                throw new Error('Too many attempts. PIN locked for 15 minutes.');
            } else {
                throw new Error(`Incorrect PIN. ${3 - newAttempts} attempts remaining.`);
            }
        }
    } catch (error: any) {
        throw error;
    }
};

/**
 * Check if user has a PIN set
 */
export const hasTransactionPin = (): boolean => {
    const { user } = useAuthStore.getState();
    return !!user?.transaction_pin_hash;
};

/**
 * Reset PIN (requires OTP verification - to be implemented)
 */
export const resetTransactionPin = async (newPin: string, otpCode: string): Promise<{ success: boolean; error?: string }> => {
    // TODO: Implement OTP verification
    // For now, just create a new PIN
    return createTransactionPin(newPin);
};

export default {
    createTransactionPin,
    verifyTransactionPin,
    hasTransactionPin,
    resetTransactionPin,
};
