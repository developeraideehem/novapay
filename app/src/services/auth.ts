// NovaPay - Authentication Service
import { supabase } from './supabase';
import * as SecureStore from 'expo-secure-store';
import * as Crypto from 'expo-crypto';

// Types
export interface RegisterData {
    phoneNumber: string;
    firstName: string;
    lastName: string;
    email?: string;
    referralCode?: string;
}

export interface LoginData {
    phoneNumber: string;
}

export interface UserProfile {
    id: string;
    phone_number: string;
    email: string | null;
    first_name: string;
    last_name: string;
    tier_level: number;
    is_phone_verified: boolean;
    referral_code: string | null;
    country_code: string;
    created_at: string;
}

// Helper to format Nigerian phone numbers
export const formatPhoneNumber = (phone: string): string => {
    // Remove all non-digits
    let cleaned = phone.replace(/\D/g, '');

    // Handle Nigerian numbers
    if (cleaned.startsWith('0')) {
        cleaned = '234' + cleaned.slice(1);
    }
    if (!cleaned.startsWith('234') && cleaned.length === 10) {
        cleaned = '234' + cleaned;
    }

    return '+' + cleaned;
};

// Send OTP to phone number
export const sendOtp = async (phoneNumber: string): Promise<{ success: boolean; message: string }> => {
    try {
        const formattedPhone = formatPhoneNumber(phoneNumber);

        const { error } = await supabase.auth.signInWithOtp({
            phone: formattedPhone,
        });

        if (error) {
            return { success: false, message: error.message };
        }

        return { success: true, message: 'OTP sent successfully' };
    } catch (error: any) {
        return { success: false, message: error.message || 'Failed to send OTP' };
    }
};

// Verify OTP
export const verifyOtp = async (
    phoneNumber: string,
    otp: string
): Promise<{ success: boolean; message: string; userId?: string }> => {
    try {
        const formattedPhone = formatPhoneNumber(phoneNumber);

        const { data, error } = await supabase.auth.verifyOtp({
            phone: formattedPhone,
            token: otp,
            type: 'sms',
        });

        if (error) {
            return { success: false, message: error.message };
        }

        return {
            success: true,
            message: 'Phone verified successfully',
            userId: data.user?.id,
        };
    } catch (error: any) {
        return { success: false, message: error.message || 'Failed to verify OTP' };
    }
};

// Create user profile after verification
export const createUserProfile = async (
    userId: string,
    data: RegisterData
): Promise<{ success: boolean; message: string; profile?: UserProfile }> => {
    try {
        const formattedPhone = formatPhoneNumber(data.phoneNumber);

        // Check if referred by someone
        let referredBy: string | null = null;
        if (data.referralCode) {
            const { data: referrer } = await supabase
                .from('users')
                .select('id')
                .eq('referral_code', data.referralCode.toUpperCase())
                .single();

            if (referrer) {
                referredBy = referrer.id;
            }
        }

        const { data: profile, error } = await supabase
            .from('users')
            .insert({
                id: userId,
                phone_number: formattedPhone,
                first_name: data.firstName,
                last_name: data.lastName,
                email: data.email || null,
                referred_by: referredBy,
                is_phone_verified: true,
                country_code: 'NG',
            })
            .select()
            .single();

        if (error) {
            return { success: false, message: error.message };
        }

        return { success: true, message: 'Profile created', profile };
    } catch (error: any) {
        return { success: false, message: error.message || 'Failed to create profile' };
    }
};

// Set transaction PIN
export const setTransactionPin = async (
    userId: string,
    pin: string
): Promise<{ success: boolean; message: string }> => {
    try {
        // Hash the PIN
        const pinHash = await Crypto.digestStringAsync(
            Crypto.CryptoDigestAlgorithm.SHA256,
            pin + userId // Salt with userId
        );

        const { error } = await supabase
            .from('users')
            .update({ transaction_pin_hash: pinHash })
            .eq('id', userId);

        if (error) {
            return { success: false, message: error.message };
        }

        // Store locally that PIN is set
        await SecureStore.setItemAsync('has_pin', 'true');

        return { success: true, message: 'PIN set successfully' };
    } catch (error: any) {
        return { success: false, message: error.message || 'Failed to set PIN' };
    }
};

// Verify transaction PIN
export const verifyPin = async (
    userId: string,
    pin: string
): Promise<{ success: boolean; message: string }> => {
    try {
        const pinHash = await Crypto.digestStringAsync(
            Crypto.CryptoDigestAlgorithm.SHA256,
            pin + userId
        );

        const { data, error } = await supabase
            .from('users')
            .select('transaction_pin_hash, pin_attempts, pin_locked_until')
            .eq('id', userId)
            .single();

        if (error || !data) {
            return { success: false, message: 'User not found' };
        }

        // Check if PIN is locked
        if (data.pin_locked_until && new Date(data.pin_locked_until) > new Date()) {
            const minutes = Math.ceil(
                (new Date(data.pin_locked_until).getTime() - Date.now()) / 60000
            );
            return { success: false, message: `PIN locked. Try again in ${minutes} minutes.` };
        }

        if (data.transaction_pin_hash !== pinHash) {
            // Increment failed attempts
            const attempts = (data.pin_attempts || 0) + 1;
            const lockUntil = attempts >= 5
                ? new Date(Date.now() + 30 * 60 * 1000).toISOString() // Lock for 30 mins
                : null;

            await supabase
                .from('users')
                .update({
                    pin_attempts: attempts,
                    pin_locked_until: lockUntil,
                })
                .eq('id', userId);

            return {
                success: false,
                message: attempts >= 5
                    ? 'Too many attempts. PIN locked for 30 minutes.'
                    : `Incorrect PIN. ${5 - attempts} attempts remaining.`
            };
        }

        // Reset attempts on success
        await supabase
            .from('users')
            .update({ pin_attempts: 0, pin_locked_until: null })
            .eq('id', userId);

        return { success: true, message: 'PIN verified' };
    } catch (error: any) {
        return { success: false, message: error.message || 'Failed to verify PIN' };
    }
};

// Get current user profile
export const getCurrentUser = async (): Promise<UserProfile | null> => {
    try {
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) return null;

        const { data: profile } = await supabase
            .from('users')
            .select('*')
            .eq('id', user.id)
            .single();

        return profile;
    } catch (error) {
        console.error('Get current user error:', error);
        return null;
    }
};

// Sign out
export const signOut = async (): Promise<void> => {
    await supabase.auth.signOut();
    await SecureStore.deleteItemAsync('has_pin');
};

// Check if user has PIN set
export const hasPinSet = async (): Promise<boolean> => {
    try {
        const hasPin = await SecureStore.getItemAsync('has_pin');
        return hasPin === 'true';
    } catch {
        return false;
    }
};
