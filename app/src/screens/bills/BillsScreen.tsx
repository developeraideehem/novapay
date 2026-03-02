// NovaPay - Bills Screen (Electricity, Cable TV)
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
import { Input, AmountInput, PinInput } from '../../components/Input';
import { ServiceCard, GradientCategoryCard } from '../../components';
import { VerifyPinModal } from '../../modals/VerifyPinModal';
import { useAuthStore } from '../../store/useAuthStore';
import {
    getBillProviders,
    BillProvider,
    payElectricity,
    payBill,
    calculateCashback,
} from '../../services/bills';
import { formatCurrency } from '../../services/wallet';
import { verifyPin } from '../../services/auth';

type BillCategory = 'electricity' | 'cable_tv' | null;
type BillStep = 'categories' | 'providers' | 'form' | 'confirm' | 'pin' | 'success';

export const BillsScreen: React.FC = () => {
    const navigation = useNavigation<any>();
    const { user, wallet, refreshWallet } = useAuthStore();

    const [step, setStep] = useState<BillStep>('categories');
    const [loading, setLoading] = useState(false);
    const [category, setCategory] = useState<BillCategory>(null);
    const [providers, setProviders] = useState<BillProvider[]>([]);

    // Form data
    const [selectedProvider, setSelectedProvider] = useState<BillProvider | null>(null);
    const [meterOrSmartcard, setMeterOrSmartcard] = useState('');
    const [amount, setAmount] = useState('');
    const [pin, setPin] = useState('');
    const [cashbackEarned, setCashbackEarned] = useState(0);
    const [electricityToken, setElectricityToken] = useState<string | null>(null);
    const [showPinModal, setShowPinModal] = useState(false);

    const [error, setError] = useState('');

    // Load providers when category changes
    useEffect(() => {
        if (category) {
            loadProviders(category);
        }
    }, [category]);

    const loadProviders = async (cat: string) => {
        const data = await getBillProviders(cat);
        setProviders(data);
    };

    const getCategoryIcon = (cat: string): string => {
        switch (cat) {
            case 'electricity': return '⚡';
            case 'cable_tv': return '📺';
            case 'internet': return '🌐';
            case 'water': return '💧';
            default: return '📋';
        }
    };

    const handleSelectCategory = (cat: BillCategory) => {
        setCategory(cat);
        setStep('providers');
    };

    const handleSelectProvider = (provider: BillProvider) => {
        setSelectedProvider(provider);
        setStep('form');
    };

    const handleContinue = () => {
        if (!meterOrSmartcard.trim()) {
            setError(category === 'electricity' ? 'Please enter your meter number' : 'Please enter your smartcard number');
            return;
        }

        const amountNum = parseFloat(amount);
        if (!amountNum || amountNum < (selectedProvider?.min_amount || 100)) {
            setError(`Minimum amount is ${formatCurrency(selectedProvider?.min_amount || 100)}`);
            return;
        }

        if (amountNum > (wallet?.available_balance || 0)) {
            setError('Insufficient balance');
            return;
        }

        setError('');
        setStep('confirm');
    };

    const handleConfirm = () => {
        setShowPinModal(true);
    };

    const handlePayment = async (enteredPin: string) => {
        setLoading(true);
        setError('');
        setShowPinModal(false);

        try {
            let result;
            if (category === 'electricity') {
                result = await payElectricity(
                    wallet!.id,
                    selectedProvider!.code,
                    meterOrSmartcard,
                    parseFloat(amount)
                );
                if (result.success && result.token) {
                    setElectricityToken(result.token);
                }
            } else {
                result = await payBill({
                    walletId: wallet!.id,
                    providerCode: selectedProvider!.code,
                    amount: parseFloat(amount),
                    phoneOrAccount: meterOrSmartcard,
                });
            }

            if (!result.success) {
                Alert.alert('Payment Failed', result.message || 'Payment failed. Please try again.');
                setStep('confirm');
                setLoading(false);
                return;
            }

            setCashbackEarned(result.cashback || 0);
            await refreshWallet();
            setStep('success');
        } catch (err: any) {
            Alert.alert('Error', err.message || 'Payment failed');
            setStep('confirm');
        } finally {
            setLoading(false);
        }
    };

    const handleBack = () => {
        if (step === 'providers') {
            setStep('categories');
            setCategory(null);
        } else if (step === 'form') {
            setStep('providers');
            setSelectedProvider(null);
        } else if (step === 'confirm') {
            setStep('form');
        } else if (step === 'pin') {
            setStep('confirm');
            setPin('');
        } else {
            navigation.goBack();
        }
        setError('');
    };

    const handleNewPayment = () => {
        setStep('categories');
        setCategory(null);
        setSelectedProvider(null);
        setMeterOrSmartcard('');
        setAmount('');
        setPin('');
        setCashbackEarned(0);
        setElectricityToken(null);
        setError('');
    };

    const cashback = selectedProvider ? calculateCashback(parseFloat(amount) || 0, selectedProvider) : 0;

    return (
        <SafeAreaView style={styles.container}>
            {step !== 'success' && (
                <View style={styles.header}>
                    <Text style={styles.backButton} onPress={handleBack}>
                        ← Back
                    </Text>
                    <Text style={styles.headerTitle}>Pay Bills</Text>
                    <View style={{ width: 50 }} />
                </View>
            )}

            <ScrollView
                contentContainerStyle={styles.scrollContent}
                keyboardShouldPersistTaps="handled"
            >
                {step === 'categories' && (
                    <View style={styles.stepContent}>
                        <Text style={styles.stepTitle}>Select Bill Type</Text>

                        <GradientCategoryCard
                            icon="⚡"
                            title="Electricity"
                            subtitle="IKEDC, EKEDC, IBEDC, etc."
                            gradientColors={['#F59E0B', '#F97316']}
                            onPress={() => handleSelectCategory('electricity')}
                        />
                        <GradientCategoryCard
                            icon="📺"
                            title="Cable TV"
                            subtitle="DSTV, GOtv, Startimes"
                            gradientColors={['#8B5CF6', '#EC4899']}
                            onPress={() => handleSelectCategory('cable_tv')}
                        />
                        <GradientCategoryCard
                            icon="🌐"
                            title="Internet"
                            subtitle="Coming soon"
                            gradientColors={['#3B82F6', '#6366F1']}
                            onPress={() => Alert.alert('Coming Soon', 'Internet bill payment will be available soon!')}
                            disabled
                        />
                        <GradientCategoryCard
                            icon="💧"
                            title="Water"
                            subtitle="Coming soon"
                            gradientColors={['#10B981', '#059669']}
                            onPress={() => Alert.alert('Coming Soon', 'Water bill payment will be available soon!')}
                            disabled
                        />
                    </View>
                )}

                {step === 'providers' && (
                    <View style={styles.stepContent}>
                        <Text style={styles.stepTitle}>Select Provider</Text>

                        {providers.length === 0 ? (
                            <Text style={styles.emptyText}>No providers available</Text>
                        ) : (
                            providers.map((provider) => (
                                <ServiceCard
                                    key={provider.id}
                                    icon={getCategoryIcon(provider.category)}
                                    title={provider.name}
                                    subtitle={provider.cashback_percentage > 0 ? `${provider.cashback_percentage}% cashback` : undefined}
                                    badge={provider.cashback_percentage > 0 ? 'CASHBACK' : undefined}
                                    onPress={() => handleSelectProvider(provider)}
                                />
                            ))
                        )}
                    </View>
                )}

                {step === 'form' && (
                    <View style={styles.stepContent}>
                        <Text style={styles.stepTitle}>{selectedProvider?.name}</Text>

                        <Input
                            value={meterOrSmartcard}
                            onChangeText={setMeterOrSmartcard}
                            label={category === 'electricity' ? 'Meter Number' : 'Smartcard Number'}
                            placeholder={category === 'electricity' ? 'Enter meter number' : 'Enter smartcard number'}
                            keyboardType="numeric"
                            error={error && error.includes('number') ? error : undefined}
                        />

                        <AmountInput
                            value={amount}
                            onChangeText={(text) => {
                                setAmount(text);
                                setError('');
                            }}
                            label="Amount"
                            error={error && !error.includes('number') ? error : undefined}
                        />

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
                            disabled={!meterOrSmartcard || !amount}
                            fullWidth
                            style={styles.button}
                        />
                    </View>
                )}

                {step === 'confirm' && (
                    <View style={styles.stepContent}>
                        <Text style={styles.stepTitle}>Confirm Payment</Text>

                        <View style={styles.summaryCard}>
                            <View style={styles.summaryRow}>
                                <Text style={styles.summaryLabel}>Provider</Text>
                                <Text style={styles.summaryValue}>{selectedProvider?.name}</Text>
                            </View>
                            <View style={styles.summaryRow}>
                                <Text style={styles.summaryLabel}>{category === 'electricity' ? 'Meter Number' : 'Smartcard'}</Text>
                                <Text style={styles.summaryValue}>{meterOrSmartcard}</Text>
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
                            title="Pay Now"
                            onPress={handleConfirm}
                            fullWidth
                            style={styles.button}
                        />
                    </View>
                )}

                {step === 'pin' && (
                    <View style={styles.stepContent}>
                        <Text style={styles.stepTitle}>Enter PIN</Text>
                        <Text style={styles.stepSubtitle}>
                            Enter your 4-digit PIN to authorize this payment
                        </Text>

                        <View style={styles.pinContainer}>
                            <PinInput
                                value={pin}
                                onChangeText={(value) => {
                                    setPin(value);
                                    setError('');
                                    if (value.length === 4) {
                                        handlePayment(value);
                                    }
                                }}
                                error={error}
                            />
                        </View>

                        {loading && (
                            <Text style={styles.processingText}>Processing payment...</Text>
                        )}
                    </View>
                )}

                {step === 'success' && (
                    <View style={styles.successContent}>
                        <Text style={styles.successIcon}>✅</Text>
                        <Text style={styles.successTitle}>Payment Successful!</Text>
                        <Text style={styles.successAmount}>{formatCurrency(parseFloat(amount))}</Text>
                        <Text style={styles.successSubtitle}>
                            paid to {selectedProvider?.name}
                        </Text>

                        {electricityToken && (
                            <View style={styles.tokenBox}>
                                <Text style={styles.tokenLabel}>Your Electricity Token:</Text>
                                <Text style={styles.tokenValue}>{electricityToken}</Text>
                                <Text style={styles.tokenHint}>Copy and enter on your meter</Text>
                            </View>
                        )}

                        {cashbackEarned > 0 && (
                            <View style={styles.cashbackEarnedBox}>
                                <Text style={styles.cashbackEarnedText}>
                                    🎁 You earned {formatCurrency(cashbackEarned)} cashback!
                                </Text>
                            </View>
                        )}

                        <Button
                            title="Pay Another Bill"
                            onPress={handleNewPayment}
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

            <VerifyPinModal
                visible={showPinModal}
                onClose={() => setShowPinModal(false)}
                onSuccess={async () => {
                    setShowPinModal(false);
                    await handlePayment('');
                }}
                title="Confirm Payment"
                subtitle="Enter your 6-digit PIN to authorize this payment"
            />
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
    stepTitle: {
        ...typography.styles.headlineMedium,
        fontSize: 24,
        fontWeight: '700',
        color: colors.text.primary,
        marginBottom: spacing.lg,
    },
    stepSubtitle: {
        ...typography.styles.bodyMedium,
        color: colors.text.secondary,
        marginBottom: spacing.xl,
    },
    emptyText: {
        ...typography.styles.bodyMedium,
        color: colors.text.secondary,
        textAlign: 'center',
        paddingVertical: spacing.xl,
    },
    button: {
        marginTop: spacing.lg,
        marginBottom: spacing.xl,
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
    summaryCard: {
        backgroundColor: lightColors.background.elevated,
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
    tokenBox: {
        backgroundColor: colors.warning.background,
        borderRadius: spacing.borderRadius.lg,
        padding: spacing.cardPadding,
        marginBottom: spacing.lg,
        alignItems: 'center',
        width: '100%',
    },
    tokenLabel: {
        ...typography.styles.caption,
        color: colors.text.secondary,
        marginBottom: spacing.sm,
    },
    tokenValue: {
        ...typography.styles.headlineMedium,
        color: colors.text.primary,
        fontFamily: 'monospace',
        letterSpacing: 2,
    },
    tokenHint: {
        ...typography.styles.caption,
        color: colors.text.secondary,
        marginTop: spacing.sm,
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

export default BillsScreen;
