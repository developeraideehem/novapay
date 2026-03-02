// NovaPay - Transfer Screen
import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    Alert,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing } from '../../theme/spacing';
import { Button } from '../../components/Button';
import { Input, AmountInput, PinInput } from '../../components/Input';
import { useAuthStore } from '../../store/useAuthStore';
import {
    findWalletByIdentifier,
    transferMoney,
    calculateTransferFee,
    formatCurrency,
} from '../../services/wallet';
import { verifyPin } from '../../services/auth';

type TransferStep = 'recipient' | 'amount' | 'confirm' | 'pin' | 'success';

export const TransferScreen: React.FC = () => {
    const navigation = useNavigation<any>();
    const { user, wallet, refreshWallet } = useAuthStore();

    const [step, setStep] = useState<TransferStep>('recipient');
    const [loading, setLoading] = useState(false);

    // Form data
    const [recipientId, setRecipientId] = useState('');
    const [recipientInfo, setRecipientInfo] = useState<{
        wallet_id: string;
        account_number: string;
        user_name: string;
    } | null>(null);
    const [amount, setAmount] = useState('');
    const [description, setDescription] = useState('');
    const [pin, setPin] = useState('');
    const [transactionId, setTransactionId] = useState<string | null>(null);

    const [error, setError] = useState('');

    // Calculate fee
    const fee = calculateTransferFee(parseFloat(amount) || 0, 'wallet');
    const totalAmount = (parseFloat(amount) || 0) + fee;

    // Look up recipient
    const handleLookupRecipient = async () => {
        if (!recipientId.trim()) {
            setError('Please enter account number or phone number');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const result = await findWalletByIdentifier(recipientId.trim());

            if (!result) {
                setError('Account not found. Please check the details.');
                setLoading(false);
                return;
            }

            // Check if sending to self
            if (result.wallet_id === wallet?.id) {
                setError("You can't transfer to yourself");
                setLoading(false);
                return;
            }

            setRecipientInfo(result);
            setStep('amount');
        } catch (err: any) {
            setError(err.message || 'Failed to find recipient');
        } finally {
            setLoading(false);
        }
    };

    // Validate amount and proceed
    const handleProceedToConfirm = () => {
        const amountNum = parseFloat(amount);

        if (!amountNum || amountNum <= 0) {
            setError('Please enter a valid amount');
            return;
        }

        if (amountNum < 100) {
            setError('Minimum transfer amount is ₦100');
            return;
        }

        if (totalAmount > (wallet?.available_balance || 0)) {
            setError('Insufficient balance');
            return;
        }

        if (amountNum > (wallet?.daily_transaction_limit || 50000)) {
            setError(`Amount exceeds your daily limit of ${formatCurrency(wallet?.daily_transaction_limit || 50000)}`);
            return;
        }

        setError('');
        setStep('confirm');
    };

    // Proceed to PIN
    const handleConfirm = () => {
        setStep('pin');
        setPin('');
    };

    // Verify PIN and transfer
    const handleTransfer = async (enteredPin: string) => {
        if (enteredPin.length !== 4) return;

        setLoading(true);
        setError('');

        try {
            // Verify PIN
            const pinResult = await verifyPin(user!.id, enteredPin);

            if (!pinResult.success) {
                setError(pinResult.message);
                setPin('');
                setLoading(false);
                return;
            }

            // Process transfer
            const result = await transferMoney(
                wallet!.id,
                recipientInfo!.wallet_id,
                parseFloat(amount),
                description || undefined,
                fee
            );

            if (!result.success) {
                Alert.alert('Transfer Failed', result.message);
                setStep('confirm');
                setLoading(false);
                return;
            }

            setTransactionId(result.transactionId || null);
            await refreshWallet();
            setStep('success');
        } catch (err: any) {
            Alert.alert('Error', err.message || 'Transfer failed');
            setStep('confirm');
        } finally {
            setLoading(false);
        }
    };

    // Reset and go back
    const handleBack = () => {
        if (step === 'amount') {
            setStep('recipient');
            setRecipientInfo(null);
        } else if (step === 'confirm') {
            setStep('amount');
        } else if (step === 'pin') {
            setStep('confirm');
            setPin('');
        } else {
            navigation.goBack();
        }
        setError('');
    };

    // New transfer
    const handleNewTransfer = () => {
        setStep('recipient');
        setRecipientId('');
        setRecipientInfo(null);
        setAmount('');
        setDescription('');
        setPin('');
        setTransactionId(null);
        setError('');
    };

    const renderStep = () => {
        switch (step) {
            case 'recipient':
                return (
                    <View style={styles.stepContent}>
                        <Text style={styles.stepTitle}>Send Money</Text>
                        <Text style={styles.stepSubtitle}>
                            Enter recipient's account number or phone number
                        </Text>

                        <Input
                            value={recipientId}
                            onChangeText={setRecipientId}
                            label="Account Number / Phone"
                            placeholder="e.g., 1234567890 or 08012345678"
                            keyboardType="numeric"
                            error={error}
                        />

                        <Button
                            title="Continue"
                            onPress={handleLookupRecipient}
                            loading={loading}
                            disabled={!recipientId.trim() || loading}
                            fullWidth
                            style={styles.button}
                        />
                    </View>
                );

            case 'amount':
                return (
                    <View style={styles.stepContent}>
                        <View style={styles.recipientCard}>
                            <Text style={styles.recipientLabel}>Sending to:</Text>
                            <Text style={styles.recipientName}>{recipientInfo?.user_name}</Text>
                            <Text style={styles.recipientAccount}>{recipientInfo?.account_number}</Text>
                        </View>

                        <AmountInput
                            value={amount}
                            onChangeText={setAmount}
                            label="Amount"
                            error={error}
                        />

                        <Input
                            value={description}
                            onChangeText={setDescription}
                            label="Description (Optional)"
                            placeholder="e.g., For lunch"
                        />

                        <View style={styles.balanceInfo}>
                            <Text style={styles.balanceLabel}>Available Balance:</Text>
                            <Text style={styles.balanceValue}>
                                {formatCurrency(wallet?.available_balance || 0)}
                            </Text>
                        </View>

                        <Button
                            title="Continue"
                            onPress={handleProceedToConfirm}
                            disabled={!amount || loading}
                            fullWidth
                            style={styles.button}
                        />
                    </View>
                );

            case 'confirm':
                return (
                    <View style={styles.stepContent}>
                        <Text style={styles.stepTitle}>Confirm Transfer</Text>

                        <View style={styles.summaryCard}>
                            <View style={styles.summaryRow}>
                                <Text style={styles.summaryLabel}>Recipient</Text>
                                <Text style={styles.summaryValue}>{recipientInfo?.user_name}</Text>
                            </View>
                            <View style={styles.summaryRow}>
                                <Text style={styles.summaryLabel}>Account</Text>
                                <Text style={styles.summaryValue}>{recipientInfo?.account_number}</Text>
                            </View>
                            <View style={styles.summaryRow}>
                                <Text style={styles.summaryLabel}>Amount</Text>
                                <Text style={styles.summaryValue}>{formatCurrency(parseFloat(amount))}</Text>
                            </View>
                            <View style={styles.summaryRow}>
                                <Text style={styles.summaryLabel}>Fee</Text>
                                <Text style={[styles.summaryValue, styles.freeText]}>
                                    {fee === 0 ? 'FREE 🎉' : formatCurrency(fee)}
                                </Text>
                            </View>
                            <View style={styles.divider} />
                            <View style={styles.summaryRow}>
                                <Text style={styles.totalLabel}>Total</Text>
                                <Text style={styles.totalValue}>{formatCurrency(totalAmount)}</Text>
                            </View>
                        </View>

                        {description && (
                            <View style={styles.descriptionBox}>
                                <Text style={styles.descriptionLabel}>Note:</Text>
                                <Text style={styles.descriptionText}>{description}</Text>
                            </View>
                        )}

                        <Button
                            title="Send Money"
                            onPress={handleConfirm}
                            fullWidth
                            style={styles.button}
                        />
                    </View>
                );

            case 'pin':
                return (
                    <View style={styles.stepContent}>
                        <Text style={styles.stepTitle}>Enter PIN</Text>
                        <Text style={styles.stepSubtitle}>
                            Enter your 4-digit PIN to authorize this transfer
                        </Text>

                        <View style={styles.pinContainer}>
                            <PinInput
                                value={pin}
                                onChangeText={(value) => {
                                    setPin(value);
                                    setError('');
                                    if (value.length === 4) {
                                        handleTransfer(value);
                                    }
                                }}
                                error={error}
                            />
                        </View>

                        {loading && (
                            <Text style={styles.processingText}>Processing transfer...</Text>
                        )}
                    </View>
                );

            case 'success':
                return (
                    <View style={styles.successContent}>
                        <Text style={styles.successIcon}>✅</Text>
                        <Text style={styles.successTitle}>Transfer Successful!</Text>
                        <Text style={styles.successAmount}>{formatCurrency(parseFloat(amount))}</Text>
                        <Text style={styles.successSubtitle}>
                            sent to {recipientInfo?.user_name}
                        </Text>

                        <Button
                            title="Send Another"
                            onPress={handleNewTransfer}
                            fullWidth
                            style={styles.button}
                        />
                        <Button
                            title="Back to Home"
                            onPress={() => navigation.navigate('Dashboard')}
                            variant="ghost"
                            fullWidth
                        />
                    </View>
                );
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.keyboardView}
            >
                {/* Header */}
                {step !== 'success' && (
                    <View style={styles.header}>
                        <Text style={styles.backButton} onPress={handleBack}>
                            ← Back
                        </Text>
                        <Text style={styles.headerTitle}>Transfer</Text>
                        <View style={{ width: 50 }} />
                    </View>
                )}

                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    keyboardShouldPersistTaps="handled"
                >
                    {renderStep()}
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background.default,
    },
    keyboardView: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: spacing.screenHorizontal,
        paddingVertical: spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: colors.border.light,
    },
    backButton: {
        ...typography.styles.labelMedium,
        color: colors.primary.main,
    },
    headerTitle: {
        ...typography.styles.titleMedium,
        color: colors.text.primary,
    },
    scrollContent: {
        flexGrow: 1,
        paddingHorizontal: spacing.screenHorizontal,
    },
    stepContent: {
        paddingTop: spacing.xl,
    },
    stepTitle: {
        ...typography.styles.headlineMedium,
        color: colors.text.primary,
        marginBottom: spacing.xs,
    },
    stepSubtitle: {
        ...typography.styles.bodyMedium,
        color: colors.text.secondary,
        marginBottom: spacing.xl,
    },
    button: {
        marginTop: spacing.lg,
    },
    recipientCard: {
        backgroundColor: colors.success.background,
        borderRadius: spacing.borderRadius.lg,
        padding: spacing.cardPadding,
        marginBottom: spacing.xl,
        alignItems: 'center',
    },
    recipientLabel: {
        ...typography.styles.caption,
        color: colors.text.secondary,
    },
    recipientName: {
        ...typography.styles.titleLarge,
        color: colors.text.primary,
        marginTop: spacing.xs,
    },
    recipientAccount: {
        ...typography.styles.bodyMedium,
        color: colors.text.secondary,
        marginTop: 2,
    },
    balanceInfo: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        backgroundColor: colors.surface.secondary,
        borderRadius: spacing.borderRadius.md,
        padding: spacing.md,
        marginTop: spacing.md,
    },
    balanceLabel: {
        ...typography.styles.bodyMedium,
        color: colors.text.secondary,
    },
    balanceValue: {
        ...typography.styles.labelMedium,
        color: colors.text.primary,
    },
    summaryCard: {
        backgroundColor: colors.background.elevated,
        borderRadius: spacing.borderRadius.lg,
        padding: spacing.cardPadding,
        marginBottom: spacing.lg,
    },
    summaryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: spacing.sm,
    },
    summaryLabel: {
        ...typography.styles.bodyMedium,
        color: colors.text.secondary,
    },
    summaryValue: {
        ...typography.styles.labelMedium,
        color: colors.text.primary,
    },
    freeText: {
        color: colors.success.main,
    },
    divider: {
        height: 1,
        backgroundColor: colors.border.light,
        marginVertical: spacing.sm,
    },
    totalLabel: {
        ...typography.styles.titleMedium,
        color: colors.text.primary,
    },
    totalValue: {
        ...typography.styles.titleLarge,
        color: colors.primary.main,
    },
    descriptionBox: {
        backgroundColor: colors.surface.secondary,
        borderRadius: spacing.borderRadius.md,
        padding: spacing.md,
        marginBottom: spacing.md,
    },
    descriptionLabel: {
        ...typography.styles.caption,
        color: colors.text.secondary,
    },
    descriptionText: {
        ...typography.styles.bodyMedium,
        color: colors.text.primary,
        marginTop: 2,
    },
    pinContainer: {
        alignItems: 'center',
        marginTop: spacing.xl,
    },
    processingText: {
        ...typography.styles.bodyMedium,
        color: colors.text.secondary,
        textAlign: 'center',
        marginTop: spacing.xl,
    },
    successContent: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: spacing['3xl'],
    },
    successIcon: {
        fontSize: 80,
        marginBottom: spacing.lg,
    },
    successTitle: {
        ...typography.styles.headlineLarge,
        color: colors.success.main,
        marginBottom: spacing.sm,
    },
    successAmount: {
        ...typography.styles.displayMedium,
        color: colors.text.primary,
    },
    successSubtitle: {
        ...typography.styles.bodyLarge,
        color: colors.text.secondary,
        marginBottom: spacing['2xl'],
    },
});

export default TransferScreen;
