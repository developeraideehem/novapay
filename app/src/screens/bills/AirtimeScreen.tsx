// NovaPay - Airtime Screen with Live Flutterwave Integration
import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { colors, lightColors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing, shadows } from '../../theme/spacing';
import { Button } from '../../components/Button';
import { PhoneInput, AmountInput } from '../../components/Input';
import { GradientCategoryCard } from '../../components';
import { VerifyPinModal } from '../../modals/VerifyPinModal';
import { useAuthStore } from '../../store/useAuthStore';
import { buyAirtime } from '../../services/flutterwave-bills';
import { formatCurrency } from '../../services/wallet';
import { createTransaction } from '../../services/wallet';

type AirtimeStep = 'form' | 'confirm' | 'success';

// Quick amount options
const QUICK_AMOUNTS = [100, 200, 500, 1000, 2000, 5000];

// Supported networks
const NETWORKS = [
    { id: 'mtn', name: 'MTN', icon: '📱', code: 'mtn', cashback: 1.5, gradientColors: ['#FFCC00', '#FF9500'] },
    { id: 'glo', name: 'Glo', icon: '📞', code: 'glo', cashback: 1.2, gradientColors: ['#00A859', '#34C759'] },
    { id: 'airtel', name: 'Airtel', icon: '📲', code: 'airtel', cashback: 1.0, gradientColors: ['#DC143C', '#FF6347'] },
    { id: '9mobile', name: '9mobile', icon: '☎️', code: '9mobile', cashback: 1.0, gradientColors: ['#006838', '#009B4D'] },
];

export const AirtimeScreen: React.FC = () => {
    const navigation = useNavigation<any>();
    const { user, wallet, refreshWallet } = useAuthStore();

    const [step, setStep] = useState<AirtimeStep>('form');
    const [loading, setLoading] = useState(false);
    const [showPinModal, setShowPinModal] = useState(false);

    // Form data
    const [selectedNetwork, setSelectedNetwork] = useState<typeof NETWORKS[0] | null>(null);
    const [phoneNumber, setPhoneNumber] = useState('');
    const [amount, setAmount] = useState('');
    const [transactionRef, setTransactionRef] = useState('');

    const [error, setError] = useState('');

    // Auto-detect network from phone number prefix
    useEffect(() => {
        if (phoneNumber.length >= 4) {
            const prefix = phoneNumber.substring(0, 4);
            // MTN: 0803, 0806, 0810, 0813, 0814, 0816, 0903, 0906, 0913
            // Glo: 0805, 0807, 0811, 0815, 0905
            // Airtel: 0802, 0808, 0812, 0901, 0902, 0907, 0912
            // 9mobile: 0809, 0817, 0818, 0908, 0909

            if (['0803', '0806', '0810', '0813', '0814', '0816', '0903', '0906', '0913'].includes(prefix)) {
                setSelectedNetwork(NETWORKS[0]); // MTN
            } else if (['0805', '0807', '0811', '0815', '0905'].includes(prefix)) {
                setSelectedNetwork(NETWORKS[1]); // Glo
            } else if (['0802', '0808', '0812', '0901', '0902', '0907', '0912'].includes(prefix)) {
                setSelectedNetwork(NETWORKS[2]); // Airtel
            } else if (['0809', '0817', '0818', '0908', '0909'].includes(prefix)) {
                setSelectedNetwork(NETWORKS[3]); // 9mobile
            }
        }
    }, [phoneNumber]);

    const handleSelectAmount = (value: number) => {
        setAmount(value.toString());
        setError('');
    };

    const isValidNigerianPhone = (phone: string): boolean => {
        // Nigerian phone: 11 digits starting with 0, or 10 digits without 0
        const cleaned = phone.replace(/\s/g, '');
        return /^0\d{10}$/.test(cleaned) || /^\d{10}$/.test(cleaned);
    };

    const handleContinue = () => {
        // Validate
        if (!selectedNetwork) {
            setError('Please select a network');
            return;
        }
        if (!isValidNigerianPhone(phoneNumber)) {
            setError('Please enter a valid Nigerian phone number');
            return;
        }
        const amountNum = parseFloat(amount);
        if (!amountNum || amountNum < 50) {
            setError('Minimum amount is ₦50');
            return;
        }
        if (amountNum > (wallet?.balance || 0)) {
            setError('Insufficient balance');
            return;
        }

        setError('');
        setStep('confirm');
    };

    const handleConfirm = () => {
        setShowPinModal(true);
    };

    const handlePurchase = async () => {
        setLoading(true);
        setShowPinModal(false);

        try {
            // Buy airtime via Flutterwave
            const result = await buyAirtime(
                phoneNumber,
                parseFloat(amount),
                selectedNetwork!.code as 'mtn' | 'glo' | 'airtel' | '9mobile'
            );

            if (result.status === 'error') {
                Alert.alert('Purchase Failed', result.message);
                setStep('confirm');
                return;
            }

            // Record transaction in Supabase
            await createTransaction({
                wallet_id: wallet!.id,
                type: 'debit',
                category: 'airtime',
                amount: parseFloat(amount),
                description: `${selectedNetwork!.name} Airtime - ${phoneNumber}`,
                recipient_name: phoneNumber,
                reference: result.reference,
                metadata: {
                    transaction_id: result.transaction_id,
                    network: selectedNetwork!.code,
                    phone: phoneNumber,
                },
            });

            setTransactionRef(result.reference || '');
            await refreshWallet();
            setStep('success');
        } catch (err: any) {
            Alert.alert('Error', err.message || 'Purchase failed');
            setStep('confirm');
        } finally {
            setLoading(false);
        }
    };

    const handleBack = () => {
        if (step === 'confirm') {
            setStep('form');
        } else {
            navigation.goBack();
        }
        setError('');
    };

    const handleNewPurchase = () => {
        setStep('form');
        setPhoneNumber('');
        setAmount('');
        setSelectedNetwork(null);
        setTransactionRef('');
        setError('');
    };

    const cashback = selectedNetwork && amount ? (parseFloat(amount) * selectedNetwork.cashback / 100) : 0;

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            {step !== 'success' && (
                <View style={styles.header}>
                    <Text style={styles.backButton} onPress={handleBack}>
                        ← Back
                    </Text>
                    <Text style={styles.headerTitle}>Buy Airtime</Text>
                    <View style={{ width: 50 }} />
                </View>
            )}

            <ScrollView
                contentContainerStyle={styles.scrollContent}
                keyboardShouldPersistTaps="handled"
            >
                {step === 'form' && (
                    <View style={styles.stepContent}>
                        {/* Network Selection */}
                        <Text style={styles.sectionTitle}>Select Network</Text>

                        {NETWORKS.map((network) => (
                            <GradientCategoryCard
                                key={network.id}
                                icon={network.icon}
                                title={network.name}
                                subtitle={network.cashback > 0 ? `Earn ${network.cashback}% cashback on every recharge` : undefined}
                                gradientColors={network.gradientColors}
                                onPress={() => setSelectedNetwork(network)}
                            />
                        ))}

                        {/* Phone Number */}
                        <PhoneInput
                            value={phoneNumber}
                            onChangeText={setPhoneNumber}
                            label="Phone Number"
                            error={error && error.includes('phone') ? error : undefined}
                        />

                        {/* Quick Amounts */}
                        <Text style={styles.label}>Select Amount</Text>
                        <View style={styles.amountGrid}>
                            {QUICK_AMOUNTS.map((value) => (
                                <TouchableOpacity
                                    key={value}
                                    style={[
                                        styles.amountCard,
                                        amount === value.toString() && styles.amountCardSelected,
                                    ]}
                                    onPress={() => handleSelectAmount(value)}
                                >
                                    <Text style={[
                                        styles.amountText,
                                        amount === value.toString() && styles.amountTextSelected,
                                    ]}>
                                        ₦{value.toLocaleString()}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        {/* Custom Amount */}
                        <AmountInput
                            value={amount}
                            onChangeText={(text) => {
                                setAmount(text);
                                setError('');
                            }}
                            label="Or Enter Amount"
                            error={error && !error.includes('phone') ? error : undefined}
                        />

                        {/* Cashback Info */}
                        {cashback > 0 && (
                            <View style={styles.cashbackInfo}>
                                <Text style={styles.cashbackInfoText}>
                                    🎁 You'll earn <Text style={styles.cashbackAmount}>{formatCurrency(cashback)}</Text> cashback!
                                </Text>
                            </View>
                        )}

                        <Button
                            title="Continue"
                            onPress={handleContinue}
                            disabled={!selectedNetwork || !phoneNumber || !amount}
                            fullWidth
                            style={styles.button}
                        />
                    </View>
                )}

                {step === 'confirm' && (
                    <View style={styles.stepContent}>
                        <Text style={styles.stepTitle}>Confirm Purchase</Text>

                        <View style={styles.summaryCard}>
                            <View style={styles.summaryRow}>
                                <Text style={styles.summaryLabel}>Network</Text>
                                <Text style={styles.summaryValue}>{selectedNetwork?.name}</Text>
                            </View>
                            <View style={styles.summaryRow}>
                                <Text style={styles.summaryLabel}>Phone Number</Text>
                                <Text style={styles.summaryValue}>{phoneNumber}</Text>
                            </View>
                            <View style={styles.summaryRow}>
                                <Text style={styles.summaryLabel}>Amount</Text>
                                <Text style={styles.summaryValue}>{formatCurrency(parseFloat(amount))}</Text>
                            </View>
                            {cashback > 0 && (
                                <View style={styles.summaryRow}>
                                    <Text style={styles.summaryLabel}>Cashback</Text>
                                    <Text style={[styles.summaryValue, styles.cashbackText]}>
                                        +{formatCurrency(cashback)} 🎁
                                    </Text>
                                </View>
                            )}
                        </View>

                        <Button
                            title="Buy Airtime"
                            onPress={handleConfirm}
                            fullWidth
                            style={styles.button}
                        />
                    </View>
                )}

                {/* PIN Verification Modal */}
                <VerifyPinModal
                    visible={showPinModal}
                    onClose={() => setShowPinModal(false)}
                    onSuccess={handlePurchase}
                    title="Confirm Purchase"
                    subtitle={`Buy ₦${amount} ${selectedNetwork?.name} airtime for ${phoneNumber}`}
                />

                {step === 'success' && (
                    <View style={styles.successContent}>
                        <Text style={styles.successIcon}>🎉</Text>
                        <Text style={styles.successTitle}>Airtime Sent!</Text>
                        <Text style={styles.successAmount}>{formatCurrency(parseFloat(amount))}</Text>
                        <Text style={styles.successSubtitle}>
                            airtime sent to {phoneNumber}
                        </Text>

                        {transactionRef && (
                            <View style={styles.cashbackEarnedBox}>
                                <Text style={styles.cashbackEarnedText}>
                                    📋 Ref: {transactionRef}
                                </Text>
                            </View>
                        )}

                        <Button
                            title="Buy More Airtime"
                            onPress={handleNewPurchase}
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
                )}
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: lightColors.background.default,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: spacing.screenHorizontal,
        paddingVertical: spacing.lg,
        backgroundColor: lightColors.background.elevated,
        borderBottomWidth: 0,
        ...shadows.sm,
    },
    backButton: {
        ...typography.styles.labelLarge,
        color: colors.primary.main,
        fontWeight: '600',
    },
    headerTitle: {
        ...typography.styles.titleLarge,
        fontSize: 20,
        color: colors.text.primary,
        fontWeight: '700',
    },
    scrollContent: {
        flexGrow: 1,
        paddingHorizontal: spacing.screenHorizontal,
        paddingBottom: spacing.xl,
    },
    stepContent: {
        paddingTop: spacing.xl,
    },
    sectionTitle: {
        ...typography.styles.headlineMedium,
        fontSize: 24,
        fontWeight: '700',
        color: colors.text.primary,
        marginBottom: spacing.lg,
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
    label: {
        ...typography.styles.labelMedium,
        color: colors.text.primary,
        marginBottom: spacing.sm,
        marginTop: spacing.md,
    },
    providerGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: spacing.sm,
        marginBottom: spacing.md,
    },
    providerCard: {
        width: '48%',
        backgroundColor: lightColors.background.paper,
        borderRadius: spacing.borderRadius.lg,
        padding: spacing.md,
        alignItems: 'center',
        borderWidth: 2,
        borderColor: 'transparent',
        ...shadows.sm,
    },
    providerCardSelected: {
        borderColor: colors.primary.main,
        backgroundColor: colors.primary.main + '10',
    },
    providerIcon: {
        fontSize: 32,
        marginBottom: spacing.xs,
    },
    providerName: {
        ...typography.styles.labelMedium,
        color: colors.text.primary,
    },
    cashbackBadge: {
        ...typography.styles.caption,
        color: colors.success.main,
        backgroundColor: colors.success.background,
        paddingHorizontal: spacing.sm,
        paddingVertical: 2,
        borderRadius: spacing.borderRadius.sm,
        marginTop: spacing.xs,
    },
    amountGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: spacing.sm,
        marginBottom: spacing.md,
    },
    amountCard: {
        width: '31%',
        backgroundColor: lightColors.background.paper,
        borderRadius: spacing.borderRadius.md,
        padding: spacing.md,
        alignItems: 'center',
        borderWidth: 2,
        borderColor: lightColors.text.tertiary,
    },
    amountCardSelected: {
        borderColor: colors.primary.main,
        backgroundColor: colors.primary.main + '10',
    },
    amountText: {
        ...typography.styles.labelMedium,
        color: colors.text.primary,
    },
    amountTextSelected: {
        color: colors.primary.main,
    },
    cashbackInfo: {
        backgroundColor: colors.success.background,
        borderRadius: spacing.borderRadius.md,
        padding: spacing.md,
        marginVertical: spacing.md,
    },
    cashbackInfoText: {
        ...typography.styles.bodyMedium,
        color: colors.text.primary,
        textAlign: 'center',
    },
    cashbackAmount: {
        ...typography.styles.labelMedium,
        color: colors.success.main,
    },
    button: {
        marginTop: spacing.lg,
        marginBottom: spacing.xl,
    },
    summaryCard: {
        backgroundColor: lightColors.background.paper,
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
    cashbackText: {
        color: colors.success.main,
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
        marginBottom: spacing.lg,
    },
    cashbackEarnedBox: {
        backgroundColor: colors.success.background,
        borderRadius: spacing.borderRadius.lg,
        padding: spacing.md,
        marginBottom: spacing['2xl'],
    },
    cashbackEarnedText: {
        ...typography.styles.labelMedium,
        color: colors.success.main,
    },
});

export default AirtimeScreen;
