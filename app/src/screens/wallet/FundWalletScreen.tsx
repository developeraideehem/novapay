/**
 * Fund Wallet Screen
 * 
 * Allows users to add money to their NovaPay wallet via:
 * - Card payment (Paystack)
 * - Bank transfer (Paystack)
 * - USSD payment (Paystack)
 */

import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    TextInput,
    Alert,
    Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing } from '../../theme/spacing';
import { Button } from '../../components/Button';
import { fundWallet, verifyPaymentAndCreditWallet } from '../../services/payments/payment.service';
import { useAuthStore } from '../../store/useAuthStore';
import { calculateTransactionFees, fromKobo } from '../../config/payment';

export function FundWalletScreen() {
    const navigation = useNavigation();
    const { user, refreshWallet } = useAuthStore();

    const [amount, setAmount] = useState('');
    const [loading, setLoading] = useState(false);
    const [selectedMethod, setSelectedMethod] = useState<'card' | 'bank' | 'ussd'>('card');

    const paymentMethods = [
        { id: 'card', name: 'Card Payment', icon: '💳', description: 'Pay with debit/credit card' },
        { id: 'bank', name: 'Bank Transfer', icon: '🏦', description: 'Transfer from your bank account' },
        { id: 'ussd', name: 'USSD', icon: '📱', description: 'Dial code to pay' },
    ];

    const quickAmounts = [1000, 2000, 5000, 10000, 20000, 50000];

    const handleFundWallet = async () => {
        const fundAmount = parseFloat(amount);

        if (!fundAmount || fundAmount < 100) {
            Alert.alert('Invalid Amount', 'Minimum funding amount is ₦100');
            return;
        }

        if (fundAmount > 10000000) {
            Alert.alert('Invalid Amount', 'Maximum funding amount is ₦10,000,000');
            return;
        }

        if (!user?.email) {
            Alert.alert('Error', 'User email not found');
            return;
        }

        setLoading(true);

        try {
            const response = await fundWallet({
                userId: user.id,
                amount: fundAmount,
                email: user.email,
                phone: user.phone_number,
            });

            if (!response.success) {
                Alert.alert('Payment Failed', response.message || 'Unable to initialize payment');
                setLoading(false);
                return;
            }

            // Open Paystack payment page
            if (response.authorizationUrl) {
                await Linking.openURL(response.authorizationUrl);

                // In a real app, you would handle the callback here
                // For now, show a message
                Alert.alert(
                    'Payment Initiated',
                    'Complete the payment in your browser. Once done, come back to verify.',
                    [
                        {
                            text: 'Verify Payment',
                            onPress: async () => {
                                const verified = await verifyPaymentAndCreditWallet(response.reference);

                                if (verified) {
                                    await refreshWallet();
                                    Alert.alert(
                                        'Success! 🎉',
                                        `Your wallet has been funded with ₦${fundAmount.toLocaleString()}`,
                                        [{ text: 'OK', onPress: () => navigation.goBack() }]
                                    );
                                } else {
                                    Alert.alert('Payment Not Confirmed', 'Please try again or contact support');
                                }

                                setLoading(false);
                            },
                        },
                        {
                            text: 'Cancel',
                            style: 'cancel',
                            onPress: () => setLoading(false),
                        },
                    ]
                );
            }
        } catch (error: any) {
            Alert.alert('Error', error.message || 'An error occurred');
            setLoading(false);
        }
    };

    const fees = amount ? calculateTransactionFees(parseFloat(amount) * 100) / 100 : 0;
    const total = amount ? parseFloat(amount) + fees : 0;

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()}>
                        <Text style={styles.backButton}>←</Text>
                    </TouchableOpacity>
                    <Text style={styles.title}>Fund Wallet</Text>
                    <View style={{ width: 40 }} />
                </View>

                {/* Amount Input */}
                <View style={styles.amountSection}>
                    <Text style={styles.label}>Enter Amount</Text>
                    <View style={styles.amountInputContainer}>
                        <Text style={styles.currencySymbol}>₦</Text>
                        <TextInput
                            style={styles.amountInput}
                            value={amount}
                            onChangeText={setAmount}
                            keyboardType="numeric"
                            placeholder="0"
                            placeholderTextColor={colors.text.tertiary}
                        />
                    </View>

                    {/* Quick Amount Buttons */}
                    <View style={styles.quickAmounts}>
                        {quickAmounts.map((quickAmount) => (
                            <TouchableOpacity
                                key={quickAmount}
                                style={styles.quickAmountButton}
                                onPress={() => setAmount(quickAmount.toString())}
                            >
                                <Text style={styles.quickAmountText}>₦{(quickAmount / 1000).toFixed(0)}k</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {/* Payment Method */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Payment Method</Text>
                    {paymentMethods.map((method) => (
                        <TouchableOpacity
                            key={method.id}
                            style={[
                                styles.methodCard,
                                selectedMethod === method.id && styles.methodCardSelected,
                            ]}
                            onPress={() => setSelectedMethod(method.id as any)}
                        >
                            <View style={styles.methodLeft}>
                                <Text style={styles.methodIcon}>{method.icon}</Text>
                                <View>
                                    <Text style={styles.methodName}>{method.name}</Text>
                                    <Text style={styles.methodDescription}>{method.description}</Text>
                                </View>
                            </View>
                            <View style={selectedMethod === method.id && styles.selectedIndicator} />
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Fee Summary */}
                {amount && parseFloat(amount) > 0 && (
                    <View style={styles.feeCard}>
                        <View style={styles.feeRow}>
                            <Text style={styles.feeLabel}>Amount</Text>
                            <Text style={styles.feeValue}>₦{parseFloat(amount).toLocaleString()}</Text>
                        </View>
                        <View style={styles.feeRow}>
                            <Text style={styles.feeLabel}>Processing Fee</Text>
                            <Text style={styles.feeValue}>₦{fees.toFixed(2)}</Text>
                        </View>
                        <View style={[styles.feeRow, styles.totalRow]}>
                            <Text style={styles.totalLabel}>Total to Pay</Text>
                            <Text style={styles.totalValue}>₦{total.toLocaleString()}</Text>
                        </View>
                    </View>
                )}

                {/* Info Card */}
                <View style={styles.infoCard}>
                    <Text style={styles.infoIcon}>ℹ️</Text>
                    <View style={styles.infoContent}>
                        <Text style={styles.infoTitle}>Secure Payment</Text>
                        <Text style={styles.infoText}>
                            Your payment is processed securely by Paystack. We don't store your card details.
                        </Text>
                    </View>
                </View>
            </ScrollView>

            {/* Continue Button */}
            <View style={styles.buttonContainer}>
                <Button
                    title={loading ? 'Processing...' : 'Continue to Payment'}
                    onPress={handleFundWallet}
                    disabled={!amount || parseFloat(amount) < 100 || loading}
                />
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background.default,
    },
    content: {
        padding: spacing.lg,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: spacing.xl,
    },
    backButton: {
        fontSize: 28,
        color: colors.text.primary,
    },
    title: {
        ...typography.styles.headlineMedium,
        color: colors.text.primary,
    },
    amountSection: {
        marginBottom: spacing.xl,
    },
    label: {
        ...typography.styles.bodyMedium,
        color: colors.text.secondary,
        marginBottom: spacing.sm,
    },
    amountInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.background.default,
        borderRadius: 16,
        padding: spacing.lg,
        marginBottom: spacing.md,
    },
    currencySymbol: {
        ...typography.styles.headlineLarge,
        color: colors.text.primary,
        marginRight: spacing.sm,
    },
    amountInput: {
        ...typography.styles.headlineLarge,
        color: colors.text.primary,
        flex: 1,
    },
    quickAmounts: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: spacing.sm,
    },
    quickAmountButton: {
        backgroundColor: colors.background.default,
        paddingVertical: spacing.sm,
        paddingHorizontal: spacing.md,
        borderRadius: 12,
    },
    quickAmountText: {
        ...typography.styles.caption,
        color: colors.text.primary,
        fontWeight: '600',
    },
    section: {
        marginBottom: spacing.xl,
    },
    sectionTitle: {
        ...typography.styles.headlineSmall,
        color: colors.text.primary,
        marginBottom: spacing.md,
    },
    methodCard: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: colors.background.default,
        borderRadius: 16,
        padding: spacing.md,
        marginBottom: spacing.sm,
    },
    methodCardSelected: {
        borderWidth: 2,
        borderColor: colors.primary,
    },
    methodLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.md,
    },
    methodIcon: {
        fontSize: 32,
    },
    methodName: {
        ...typography.styles.bodyMedium,
        fontWeight: '600',
        color: colors.text.primary,
    },
    methodDescription: {
        ...typography.styles.caption,
        color: colors.text.secondary,
    },
    selectedIndicator: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: colors.primary,
    },
    feeCard: {
        backgroundColor: colors.surface.secondary,
        borderRadius: 16,
        padding: spacing.md,
        marginBottom: spacing.lg,
    },
    feeRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: spacing.xs,
    },
    feeLabel: {
        ...typography.styles.bodyMedium,
        color: colors.text.secondary,
    },
    feeValue: {
        ...typography.styles.bodyMedium,
        color: colors.text.primary,
        fontWeight: '600',
    },
    totalRow: {
        marginTop: spacing.sm,
        paddingTop: spacing.sm,
        borderTopWidth: 1,
        borderTopColor: colors.border.default,
    },
    totalLabel: {
        ...typography.styles.bodyMedium,
        fontWeight: '700',
        color: colors.text.primary,
    },
    totalValue: {
        ...typography.styles.headlineSmall,
        color: colors.primary,
    },
    infoCard: {
        flexDirection: 'row',
        backgroundColor: `${colors.primary}10`,
        borderRadius: 12,
        padding: spacing.md,
    },
    infoIcon: {
        fontSize: 24,
        marginRight: spacing.sm,
    },
    infoContent: {
        flex: 1,
    },
    infoTitle: {
        ...typography.styles.bodyMedium,
        fontWeight: '600',
        color: colors.text.primary,
        marginBottom: 4,
    },
    infoText: {
        ...typography.styles.caption,
        color: colors.text.secondary,
    },
    buttonContainer: {
        padding: spacing.lg,
        borderTopWidth: 1,
        borderTopColor: colors.border.default,
    },
});
