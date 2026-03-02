// NovaPay - Login Screen
import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing } from '../../theme/spacing';
import { Button } from '../../components/Button';
import { PhoneInput, Input } from '../../components/Input';
import { sendOtp, formatPhoneNumber } from '../../services/auth';

export const LoginScreen: React.FC = () => {
    const navigation = useNavigation<any>();

    const [phoneNumber, setPhoneNumber] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const validatePhone = (phone: string): boolean => {
        const cleaned = phone.replace(/\D/g, '');
        return cleaned.length >= 10 && cleaned.length <= 11;
    };

    const handleContinue = async () => {
        setError('');

        if (!validatePhone(phoneNumber)) {
            setError('Please enter a valid Nigerian phone number');
            return;
        }

        setLoading(true);

        try {
            const result = await sendOtp(phoneNumber);

            if (result.success) {
                navigation.navigate('OTP', {
                    phoneNumber: formatPhoneNumber(phoneNumber),
                    isNewUser: false,
                });
            } else {
                setError(result.message);
            }
        } catch (err: any) {
            setError(err.message || 'Failed to send OTP');
        } finally {
            setLoading(false);
        }
    };

    return (
        <LinearGradient
            colors={['#6366F1', '#8B5CF6']}
            style={styles.gradientContainer}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
        >
            <SafeAreaView style={styles.container} edges={['top']}>
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={styles.keyboardView}
                >
                    <ScrollView
                        contentContainerStyle={styles.scrollContent}
                        keyboardShouldPersistTaps="handled"
                        showsVerticalScrollIndicator={false}
                    >
                        {/* Modern Logo Section */}
                        <View style={styles.logoContainer}>
                            <View style={styles.logoIconContainer}>
                                <Text style={styles.logoIcon}>💎</Text>
                            </View>
                            <Text style={styles.logoText}>NovaPay</Text>
                            <View style={styles.securityBadge}>
                                <Text style={styles.badgeIcon}>🛡️</Text>
                                <Text style={styles.badgeText}>Secure & Verified</Text>
                            </View>
                        </View>

                        {/* White Card with Form */}
                        <View style={styles.card}>
                            <Text style={styles.title}>Welcome Back</Text>
                            <Text style={styles.subtitle}>
                                Enter your phone number to continue
                            </Text>

                            <PhoneInput
                                value={phoneNumber}
                                onChangeText={setPhoneNumber}
                                label="Phone Number"
                                error={error}
                                placeholder="801 234 5678"
                            />

                            <Button
                                title="Continue"
                                onPress={handleContinue}
                                loading={loading}
                                disabled={!phoneNumber || loading}
                                fullWidth
                                style={styles.button}
                            />

                            <View style={styles.registerContainer}>
                                <Text style={styles.registerText}>Don't have an account? </Text>
                                <Text
                                    style={styles.registerLink}
                                    onPress={() => navigation.navigate('Register')}
                                >
                                    Sign Up
                                </Text>
                            </View>
                        </View>

                        {/* Footer */}
                        <View style={styles.footer}>
                            <Text style={styles.footerText}>
                                By continuing, you agree to our{' '}
                                <Text style={styles.link}>Terms of Service</Text> and{' '}
                                <Text style={styles.link}>Privacy Policy</Text>
                            </Text>
                        </View>
                    </ScrollView>
                </KeyboardAvoidingView>
            </SafeAreaView>
        </LinearGradient>
    );
};

// Register Screen
export const RegisterScreen: React.FC = () => {
    const navigation = useNavigation<any>();

    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        phoneNumber: '',
        email: '',
        referralCode: '',
    });
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    const validateForm = (): boolean => {
        const newErrors: Record<string, string> = {};

        // First Name validation - text only, no numbers
        if (!formData.firstName.trim()) {
            newErrors.firstName = 'First name is required';
        } else if (!/^[a-zA-Z\s]+$/.test(formData.firstName)) {
            newErrors.firstName = 'First name should contain only letters';
        }

        // Last Name validation - text only, no numbers
        if (!formData.lastName.trim()) {
            newErrors.lastName = 'Last name is required';
        } else if (!/^[a-zA-Z\s]+$/.test(formData.lastName)) {
            newErrors.lastName = 'Last name should contain only letters';
        }

        // Phone validation - numbers only
        const cleanedPhone = formData.phoneNumber.replace(/\D/g, '');
        if (!cleanedPhone) {
            newErrors.phoneNumber = 'Phone number is required';
        } else if (cleanedPhone.length < 10) {
            newErrors.phoneNumber = 'Phone number must be at least 10 digits';
        } else if (!/^\d+$/.test(cleanedPhone)) {
            newErrors.phoneNumber = 'Phone number should contain only numbers';
        }

        // Email validation - proper email format
        if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            newErrors.email = 'Please enter a valid email address';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleContinue = async () => {
        if (!validateForm()) return;

        setLoading(true);

        try {
            const result = await sendOtp(formData.phoneNumber);

            if (result.success) {
                navigation.navigate('OTP', {
                    phoneNumber: formatPhoneNumber(formData.phoneNumber),
                    isNewUser: true,
                    registrationData: {
                        firstName: formData.firstName,
                        lastName: formData.lastName,
                        email: formData.email || undefined,
                        referralCode: formData.referralCode || undefined,
                    },
                });
            } else {
                Alert.alert('Error', result.message);
            }
        } catch (err: any) {
            Alert.alert('Error', err.message || 'Failed to send OTP');
        } finally {
            setLoading(false);
        }
    };

    return (
        <LinearGradient
            colors={['#6366F1', '#8B5CF6']}
            style={styles.gradientContainer}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
        >
            <SafeAreaView style={styles.container} edges={['top']}>
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={styles.keyboardView}
                >
                    <ScrollView
                        contentContainerStyle={styles.scrollContent}
                        keyboardShouldPersistTaps="handled"
                        showsVerticalScrollIndicator={false}
                    >
                        {/* Modern Logo Section */}
                        <View style={styles.logoContainer}>
                            <View style={styles.logoIconContainer}>
                                <Text style={styles.logoIcon}>💎</Text>
                            </View>
                            <Text style={styles.logoText}>NovaPay</Text>
                        </View>

                        {/* White Card with Form */}
                        <View style={styles.card}>
                            <Text style={styles.title}>Create Account</Text>
                            <Text style={styles.subtitle}>
                                Join millions of Nigerians using NovaPay
                            </Text>

                            <View style={styles.row}>
                                <View style={styles.halfInput}>
                                    <Input
                                        value={formData.firstName}
                                        onChangeText={(text) => setFormData({ ...formData, firstName: text })}
                                        label="First Name"
                                        error={errors.firstName}
                                        placeholder="John"
                                        keyboardType="default"
                                        autoCapitalize="words"
                                    />
                                </View>
                                <View style={styles.halfInput}>
                                    <Input
                                        value={formData.lastName}
                                        onChangeText={(text) => setFormData({ ...formData, lastName: text })}
                                        label="Last Name"
                                        error={errors.lastName}
                                        placeholder="Doe"
                                        keyboardType="default"
                                        autoCapitalize="words"
                                    />
                                </View>
                            </View>

                            <PhoneInput
                                value={formData.phoneNumber}
                                onChangeText={(text) => setFormData({ ...formData, phoneNumber: text })}
                                label="Phone Number"
                                error={errors.phoneNumber}
                            />

                            <Input
                                value={formData.email}
                                onChangeText={(text) => setFormData({ ...formData, email: text })}
                                label="Email (Optional)"
                                error={errors.email}
                                placeholder="john@example.com"
                                keyboardType="email-address"
                                autoCapitalize="none"
                            />

                            <Input
                                value={formData.referralCode}
                                onChangeText={(text) => setFormData({ ...formData, referralCode: text.toUpperCase() })}
                                label="Referral Code (Optional)"
                                placeholder="REFER123"
                                keyboardType="default"
                                autoCapitalize="characters"
                                maxLength={10}
                            />

                            <Button
                                title="Continue"
                                onPress={handleContinue}
                                loading={loading}
                                fullWidth
                                style={styles.button}
                            />

                            <View style={styles.registerContainer}>
                                <Text style={styles.registerText}>Already have an account? </Text>
                                <Text
                                    style={styles.registerLink}
                                    onPress={() => navigation.navigate('Login')}
                                >
                                    Sign In
                                </Text>
                            </View>
                        </View>
                    </ScrollView>
                </KeyboardAvoidingView>
            </SafeAreaView>
        </LinearGradient>
    );
};

const styles = StyleSheet.create({
    gradientContainer: {
        flex: 1,
    },
    container: {
        flex: 1,
        backgroundColor: 'transparent',
    },
    keyboardView: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
        paddingHorizontal: spacing.screenHorizontal,
        paddingBottom: spacing.xl,
    },
    // Modern Logo Styles
    logoContainer: {
        alignItems: 'center',
        marginTop: spacing['3xl'],
        marginBottom: spacing['2xl'],
    },
    logoIconContainer: {
        width: 96,
        height: 96,
        borderRadius: 48,
        backgroundColor: 'rgba(255, 255, 255, 0.25)',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: spacing.lg,
        ...Platform.select({
            ios: {
                shadowColor: 'rgba(255, 255, 255, 0.5)',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 12,
            },
            android: {
                elevation: 8,
            },
        }),
    },
    logoIcon: {
        fontSize: 56,
    },
    logoText: {
        ...typography.styles.displayMedium,
        fontSize: 36,
        color: '#FFFFFF',
        fontWeight: '800',
        letterSpacing: -0.5,
        marginBottom: spacing.sm,
        textShadowColor: 'rgba(0, 0, 0, 0.2)',
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 8,
    },
    securityBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.sm,
        borderRadius: 24,
        gap: spacing.xs,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.3)',
    },
    badgeIcon: {
        fontSize: 18,
    },
    badgeText: {
        ...typography.styles.labelMedium,
        fontSize: 14,
        color: '#FFFFFF',
        fontWeight: '700',
        letterSpacing: 0.3,
    },
    // Premium White Card
    card: {
        backgroundColor: '#FFFFFF',
        borderRadius: 28,
        padding: spacing['2xl'],
        marginHorizontal: spacing.xs,
        ...Platform.select({
            ios: {
                shadowColor: '#000000',
                shadowOffset: { width: 0, height: 8 },
                shadowOpacity: 0.15,
                shadowRadius: 20,
            },
            android: {
                elevation: 12,
            },
        }),
    },
    title: {
        ...typography.styles.headlineLarge,
        fontSize: 28,
        color: colors.text.primary,
        fontWeight: '800',
        marginBottom: spacing.xs,
        letterSpacing: -0.5,
    },
    subtitle: {
        ...typography.styles.bodyLarge,
        fontSize: 16,
        color: colors.text.secondary,
        marginBottom: spacing['2xl'],
        lineHeight: 24,
    },
    button: {
        marginTop: spacing.lg,
        borderRadius: 16,
    },
    row: {
        flexDirection: 'row',
        gap: spacing.md,
    },
    halfInput: {
        flex: 1,
    },
    registerContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: spacing.xl,
    },
    registerText: {
        ...typography.styles.bodyMedium,
        fontSize: 15,
        color: colors.text.secondary,
    },
    registerLink: {
        ...typography.styles.labelLarge,
        fontSize: 15,
        color: colors.primary.main,
        fontWeight: '700',
    },
    footer: {
        paddingVertical: spacing['2xl'],
        marginTop: 'auto',
    },
    footerText: {
        ...typography.styles.caption,
        fontSize: 13,
        color: 'rgba(255, 255, 255, 0.8)',
        textAlign: 'center',
        lineHeight: 20,
    },
    link: {
        color: '#FFFFFF',
        fontWeight: '600',
        textDecorationLine: 'underline',
    },
});

// Exports are handled at declaration
