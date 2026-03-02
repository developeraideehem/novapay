// NovaPay - PIN Setup Screen
import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing } from '../../theme/spacing';
import { Button } from '../../components/Button';
import { PinInput } from '../../components/Input';
import { setTransactionPin } from '../../services/auth';
import { useAuthStore } from '../../store/useAuthStore';

interface RouteParams {
    userId: string;
    isNewUser: boolean;
}

export const PinSetupScreen: React.FC = () => {
    const navigation = useNavigation<any>();
    const route = useRoute();
    const params = route.params as RouteParams;
    const { initialize } = useAuthStore();

    const [step, setStep] = useState<'create' | 'confirm'>('create');
    const [pin, setPin] = useState('');
    const [confirmPin, setConfirmPin] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handlePinChange = (value: string) => {
        setError('');

        if (step === 'create') {
            setPin(value);
            if (value.length === 4) {
                // Move to confirm step
                setTimeout(() => {
                    setStep('confirm');
                }, 300);
            }
        } else {
            setConfirmPin(value);
            if (value.length === 4) {
                // Validate and submit
                validateAndSubmit(value);
            }
        }
    };

    const validateAndSubmit = async (confirmValue: string) => {
        if (pin !== confirmValue) {
            setError('PINs do not match. Please try again.');
            setConfirmPin('');
            return;
        }

        // Check for weak PINs
        const weakPins = ['0000', '1111', '1234', '4321', '2222', '3333', '4444', '5555', '6666', '7777', '8888', '9999'];
        if (weakPins.includes(pin)) {
            setError('Please choose a stronger PIN');
            setPin('');
            setConfirmPin('');
            setStep('create');
            return;
        }

        setLoading(true);

        try {
            const result = await setTransactionPin(params.userId, pin);

            if (result.success) {
                // Reinitialize auth state
                await initialize();

                // Navigate to main app
                navigation.reset({
                    index: 0,
                    routes: [{ name: 'Main' }],
                });
            } else {
                Alert.alert('Error', result.message);
            }
        } catch (err: any) {
            Alert.alert('Error', err.message || 'Failed to set PIN');
        } finally {
            setLoading(false);
        }
    };

    const handleBack = () => {
        if (step === 'confirm') {
            setStep('create');
            setPin('');
            setConfirmPin('');
            setError('');
        } else {
            navigation.goBack();
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.content}>
                {/* Header */}
                <View style={styles.header}>
                    <Text style={styles.icon}>🔒</Text>
                    <Text style={styles.title}>
                        {step === 'create' ? 'Create Your PIN' : 'Confirm Your PIN'}
                    </Text>
                    <Text style={styles.subtitle}>
                        {step === 'create'
                            ? 'This PIN will be used to authorize your transactions'
                            : 'Re-enter your PIN to confirm'}
                    </Text>
                </View>

                {/* PIN Input */}
                <View style={styles.pinContainer}>
                    <PinInput
                        value={step === 'create' ? pin : confirmPin}
                        onChangeText={handlePinChange}
                        length={4}
                        error={error}
                    />
                </View>

                {/* Tips */}
                {step === 'create' && (
                    <View style={styles.tips}>
                        <Text style={styles.tipTitle}>PIN Tips:</Text>
                        <Text style={styles.tipText}>• Use 4 digits you can remember</Text>
                        <Text style={styles.tipText}>• Avoid obvious patterns (1234, 0000)</Text>
                        <Text style={styles.tipText}>• Don't share your PIN with anyone</Text>
                    </View>
                )}

                {/* Error */}
                {error && (
                    <Text style={styles.errorText}>{error}</Text>
                )}

                {/* Loading indicator */}
                {loading && (
                    <View style={styles.loadingContainer}>
                        <Text style={styles.loadingText}>Setting up your account...</Text>
                    </View>
                )}
            </View>

            {/* Footer */}
            <View style={styles.footer}>
                {step === 'confirm' && (
                    <Button
                        title="Go Back"
                        onPress={handleBack}
                        variant="ghost"
                        fullWidth
                    />
                )}
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background.default,
    },
    content: {
        flex: 1,
        paddingHorizontal: spacing.screenHorizontal,
        paddingTop: spacing['3xl'],
    },
    header: {
        alignItems: 'center',
        marginBottom: spacing['2xl'],
    },
    icon: {
        fontSize: 64,
        marginBottom: spacing.md,
    },
    title: {
        ...typography.styles.headlineLarge,
        color: colors.text.primary,
        marginBottom: spacing.sm,
        textAlign: 'center',
    },
    subtitle: {
        ...typography.styles.bodyMedium,
        color: colors.text.secondary,
        textAlign: 'center',
        paddingHorizontal: spacing.xl,
    },
    pinContainer: {
        alignItems: 'center',
        marginBottom: spacing.xl,
    },
    tips: {
        backgroundColor: colors.primary.main + '10',
        borderRadius: spacing.borderRadius.lg,
        padding: spacing.cardPadding,
        marginTop: spacing.lg,
    },
    tipTitle: {
        ...typography.styles.labelMedium,
        color: colors.text.primary,
        marginBottom: spacing.sm,
    },
    tipText: {
        ...typography.styles.bodySmall,
        color: colors.text.secondary,
        marginBottom: 4,
    },
    errorText: {
        ...typography.styles.bodySmall,
        color: colors.error.main,
        textAlign: 'center',
        marginTop: spacing.md,
    },
    loadingContainer: {
        alignItems: 'center',
        marginTop: spacing.xl,
    },
    loadingText: {
        ...typography.styles.bodyMedium,
        color: colors.text.secondary,
    },
    footer: {
        paddingHorizontal: spacing.screenHorizontal,
        paddingBottom: spacing.xl,
    },
});

export default PinSetupScreen;
