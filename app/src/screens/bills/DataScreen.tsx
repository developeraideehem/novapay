// NovaPay - Data Screen with Live Flutterwave Integration
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
import { PhoneInput } from '../../components/Input';
import { GradientCategoryCard } from '../../components';
import { VerifyPinModal } from '../../modals/VerifyPinModal';
import { useAuthStore } from '../../store/useAuthStore';
import { buyData } from '../../services/flutterwave-bills';
import { formatCurrency, createTransaction } from '../../services/wallet';

type DataStep = 'form' | 'plans' | 'confirm' | 'success';

// Supported networks for data
const NETWORKS = [
    { id: 'mtn', name: 'MTN', icon: '📱', code: 'mtn-data', cashback: 2.0, gradientColors: ['#FFCC00', '#FF9500'] },
    { id: 'glo', name: 'Glo', icon: '📞', code: 'glo-data', cashback: 1.8, gradientColors: ['#00A859', '#34C759'] },
    { id: 'airtel', name: 'Airtel', icon: '📲', code: 'airtel-data', cashback: 1.5, gradientColors: ['#DC143C', '#FF6347'] },
    { id: '9mobile', name: '9mobile', icon: '☎️', code: '9mobile-data', cashback: 1.5, gradientColors: ['#006838', '#009B4D'] },
];

// Data plan interface
interface DataPlan {
    code: string;
    data_amount: string;
    validity: string;
    price: number;
}

// Static data plans for each network
const DATA_PLANS: Record<string, DataPlan[]> = {
    'mtn-data': [
        { code: 'MTN-500MB-1M', data_amount: '500MB', validity: '30 days', price: 500 },
        { code: 'MTN-1GB-1M', data_amount: '1GB', validity: '30 days', price: 1000 },
        { code: 'MTN-2GB-1M', data_amount: '2GB', validity: '30 days', price: 2000 },
        { code: 'MTN-3GB-1M', data_amount: '3GB', validity: '30 days', price: 3000 },
        { code: 'MTN-5GB-1M', data_amount: '5GB', validity: '30 days', price: 5000 },
        { code: 'MTN-10GB-1M', data_amount: '10GB', validity: '30 days', price: 10000 },
    ],
    'glo-data': [
        { code: 'GLO-500MB-1M', data_amount: '500MB', validity: '30 days', price: 500 },
        { code: 'GLO-1.6GB-1M', data_amount: '1.6GB', validity: '30 days', price: 1000 },
        { code: 'GLO-3.2GB-1M', data_amount: '3.2GB', validity: '30 days', price: 2000 },
        { code: 'GLO-5.8GB-1M', data_amount: '5.8GB', validity: '30 days', price: 3000 },
        { code: 'GLO-10GB-1M', data_amount: '10GB', validity: '30 days', price: 5000 },
    ],
    'airtel-data': [
        { code: 'AIRTEL-750MB-2W', data_amount: '750MB', validity: '14 days', price: 500 },
        { code: 'AIRTEL-1.5GB-1M', data_amount: '1.5GB', validity: '30 days', price: 1000 },
        { code: 'AIRTEL-3GB-1M', data_amount: '3GB', validity: '30 days', price: 2000 },
        { code: 'AIRTEL-6GB-1M', data_amount: '6GB', validity: '30 days', price: 3000 },
        { code: 'AIRTEL-10GB-1M', data_amount: '10GB', validity: '30 days', price: 5000 },
    ],
    '9mobile-data': [
        { code: '9MOB-500MB-1M', data_amount: '500MB', validity: '30 days', price: 500 },
        { code: '9MOB-1.5GB-1M', data_amount: '1.5GB', validity: '30 days', price: 1000 },
        { code: '9MOB-2GB-1M', data_amount: '2GB', validity: '30 days', price: 2000 },
        { code: '9MOB-4.5GB-1M', data_amount: '4.5GB', validity: '30 days', price: 3000 },
        { code: '9MOB-11GB-1M', data_amount: '11GB', validity: '30 days', price: 5000 },
    ],
};

export const DataScreen: React.FC = () => {
    const navigation = useNavigation<any>();
    const { user, wallet, refreshWallet } = useAuthStore();

    const [step, setStep] = useState<DataStep>('form');
    const [loading, setLoading] = useState(false);
    const [showPinModal, setShowPinModal] = useState(false);
    const [plans, setPlans] = useState<DataPlan[]>([]);

    // Form data
    const [selectedNetwork, setSelectedNetwork] = useState<typeof NETWORKS[0] | null>(null);
    const [phoneNumber, setPhoneNumber] = useState('');
    const [selectedPlan, setSelectedPlan] = useState<DataPlan | null>(null);
    const [transactionRef, setTransactionRef] = useState('');

    const [error, setError] = useState('');

    // Auto-detect network from phone number
    useEffect(() => {
        if (phoneNumber.length >= 4) {
            const prefix = phoneNumber.substring(0, 4);
            let networkId = '';

            // MTN prefixes
            if (['0803', '0806', '0703', '0706', '0813', '0816', '0810', '0814', '0903', '0906', '0913', '0916'].includes(prefix)) {
                networkId = 'mtn';
            }
            // Glo prefixes
            else if (['0805', '0705', '0815', '0905'].includes(prefix)) {
                networkId = 'glo';
            }
            // Airtel prefixes
            else if (['0802', '0808', '0708', '0812', '0701', '0902', '0907', '0912'].includes(prefix)) {
                networkId = 'airtel';
            }
            // 9mobile prefixes
            else if (['0809', '0818', '0817', '0909', '0908'].includes(prefix)) {
                networkId = '9mobile';
            }

            if (networkId && !selectedNetwork) {
                const network = NETWORKS.find(n => n.id === networkId);
                if (network) {
                    setSelectedNetwork(network);
                }
            }
        }
    }, [phoneNumber, selectedNetwork]);

    // Load plans when network is selected
    useEffect(() => {
        if (selectedNetwork) {
            const networkPlans = DATA_PLANS[selectedNetwork.code] || [];
            setPlans(networkPlans);
        }
    }, [selectedNetwork]);

    const isValidNigerianPhone = (phone: string): boolean => {
        return /^0[789][01]\d{8}$/.test(phone);
    };

    const handleContinueToPlans = () => {
        if (!selectedNetwork) {
            setError('Please select a network');
            return;
        }
        if (!isValidNigerianPhone(phoneNumber)) {
            setError('Please enter a valid Nigerian phone number');
            return;
        }
        setError('');
        setStep('plans');
    };

    const handleSelectPlan = (plan: DataPlan) => {
        if (plan.price > (wallet?.available_balance || 0)) {
            Alert.alert('Insufficient Balance', 'You do not have enough balance for this plan.');
            return;
        }
        setSelectedPlan(plan);
        setStep('confirm');
    };

    const handleConfirm = () => {
        setShowPinModal(true);
    };

    const handlePurchase = async (enteredPin: string) => {
        if (!selectedPlan || !selectedNetwork) return;

        setLoading(true);
        setError('');
        setShowPinModal(false);

        try {
            // Call Flutterwave to buy data
            const result = await buyData(
                phoneNumber,
                selectedPlan.code,
                selectedPlan.price,
                selectedNetwork.code as 'mtn-data' | 'glo-data' | 'airtel-data' | '9mobile-data'
            );

            if (result.status !== 'success') {
                Alert.alert('Purchase Failed', result.message || 'Failed to purchase data. Please try again.');
                setStep('confirm');
                setLoading(false);
                return;
            }

            // Calculate cashback
            const cashback = (selectedPlan.price * selectedNetwork.cashback) / 100;

            // Record transaction
            await createTransaction({
                wallet_id: wallet!.id,
                type: 'debit',
                category: 'data',
                amount: selectedPlan.price,
                description: `${selectedPlan.data_amount} ${selectedNetwork.name} data for ${phoneNumber}`,
                recipient_name: phoneNumber,
                reference: result.reference,
                fee: result.fee || 0,
                cashback,
                metadata: {
                    network: selectedNetwork.name,
                    plan: selectedPlan.data_amount,
                    phone_number: phoneNumber,
                    transaction_id: result.transaction_id,
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
        if (step === 'plans') {
            setStep('form');
        } else if (step === 'confirm') {
            setStep('plans');
            setSelectedPlan(null);
        } else {
            navigation.goBack();
        }
        setError('');
    };

    const handleNewPurchase = () => {
        setStep('form');
        setPhoneNumber('');
        setSelectedNetwork(null);
        setSelectedPlan(null);
        setTransactionRef('');
        setError('');
    };

    const cashback = selectedNetwork && selectedPlan
        ? (selectedPlan.price * selectedNetwork.cashback) / 100
        : 0;

    return (
        <SafeAreaView style={styles.container}>
            {step !== 'success' && (
                <View style={styles.header}>
                    <Text style={styles.backButton} onPress={handleBack}>
                        ← Back
                    </Text>
                    <Text style={styles.headerTitle}>Buy Data</Text>
                    <View style={{ width: 50 }} />
                </View>
            )}

            <ScrollView
                contentContainerStyle={styles.scrollContent}
                keyboardShouldPersistTaps="handled"
            >
                {step === 'form' && (
                    <View style={styles.stepContent}>
                        <Text style={styles.sectionTitle}>Select Network</Text>

                        {NETWORKS.map((network) => (
                            <GradientCategoryCard
                                key={network.id}
                                icon={network.icon}
                                title={network.name}
                                subtitle={network.cashback > 0 ? `Earn ${network.cashback}% cashback on every purchase` : undefined}
                                gradientColors={network.gradientColors}
                                onPress={() => {
                                    setSelectedNetwork(network);
                                    // Don't auto-advance to preserve selection UX
                                }}
                            />
                        ))}

                        <PhoneInput
                            value={phoneNumber}
                            onChangeText={setPhoneNumber}
                            label="Phone Number"
                            error={error}
                        />

                        <Button
                            title="Continue"
                            onPress={handleContinueToPlans}
                            disabled={!selectedNetwork || !phoneNumber}
                            fullWidth
                            style={styles.button}
                        />
                    </View>
                )}

                {step === 'plans' && (
                    <View style={styles.stepContent}>
                        <Text style={styles.stepTitle}>Select Data Plan</Text>
                        <Text style={styles.stepSubtitle}>
                            {selectedNetwork?.name} • {phoneNumber}
                        </Text>

                        <View style={styles.plansGrid}>
                            {plans.map((plan) => (
                                <TouchableOpacity
                                    key={plan.code}
                                    style={styles.planCard}
                                    onPress={() => handleSelectPlan(plan)}
                                >
                                    <Text style={styles.planData}>{plan.data_amount}</Text>
                                    <Text style={styles.planValidity}>{plan.validity}</Text>
                                    <Text style={styles.planPrice}>{formatCurrency(plan.price)}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>
                )}

                {step === 'confirm' && selectedPlan && (
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
                                <Text style={styles.summaryLabel}>Plan</Text>
                                <Text style={styles.summaryValue}>{selectedPlan.data_amount} ({selectedPlan.validity})</Text>
                            </View>
                            <View style={styles.summaryRow}>
                                <Text style={styles.summaryLabel}>Amount</Text>
                                <Text style={styles.summaryValue}>{formatCurrency(selectedPlan.price)}</Text>
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
                            title="Buy Data"
                            onPress={handleConfirm}
                            fullWidth
                            style={styles.button}
                        />
                    </View>
                )}



                {step === 'success' && selectedPlan && (
                    <View style={styles.successContent}>
                        <Text style={styles.successIcon}>🎉</Text>
                        <Text style={styles.successTitle}>Data Purchased!</Text>
                        <Text style={styles.successAmount}>{selectedPlan.data_amount}</Text>
                        <Text style={styles.successSubtitle}>
                            sent to {phoneNumber}
                        </Text>

                        {transactionRef && (
                            <View style={styles.transactionRefBox}>
                                <Text style={styles.transactionRefLabel}>Transaction Reference:</Text>
                                <Text style={styles.transactionRefValue}>{transactionRef}</Text>
                            </View>
                        )}

                        {cashback > 0 && (
                            <View style={styles.cashbackEarnedBox}>
                                <Text style={styles.cashbackEarnedText}>
                                    🎁 You earned {formatCurrency(cashback)} cashback!
                                </Text>
                            </View>
                        )}

                        <Button
                            title="Buy More Data"
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

            <VerifyPinModal
                visible={showPinModal}
                onClose={() => setShowPinModal(false)}
                onSuccess={handlePurchase}
                title="Confirm Data Purchase"
                subtitle={`Verify your PIN to complete this ${selectedPlan?.data_amount} purchase`}
            />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background.default,
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
        backgroundColor: lightColors.background.elevated,
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
    button: {
        marginTop: spacing.lg,
        marginBottom: spacing.xl,
    },
    plansGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: spacing.sm,
    },
    planCard: {
        width: '48%',
        backgroundColor: lightColors.background.elevated,
        borderRadius: spacing.borderRadius.lg,
        padding: spacing.cardPadding,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: lightColors.border.light,
        ...shadows.sm,
    },
    planData: {
        ...typography.styles.headlineMedium,
        color: colors.primary.main,
        marginBottom: spacing.xs,
    },
    planValidity: {
        ...typography.styles.caption,
        color: colors.text.secondary,
        marginBottom: spacing.sm,
    },
    planPrice: {
        ...typography.styles.titleMedium,
        color: colors.text.primary,
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
    cashbackEarnedBox: {
        backgroundColor: colors.success.background,
        borderRadius: spacing.borderRadius.lg,
        padding: spacing.md,
        marginBottom: spacing['2xl'],
        marginTop: spacing.md,
    },
    cashbackEarnedText: {
        ...typography.styles.labelMedium,
        color: colors.success.main,
    },
    transactionRefBox: {
        backgroundColor: lightColors.background.elevated,
        borderRadius: spacing.borderRadius.md,
        padding: spacing.md,
        marginVertical: spacing.lg,
        borderWidth: 1,
        borderColor: lightColors.border.light,
    },
    transactionRefLabel: {
        ...typography.styles.caption,
        color: colors.text.secondary,
        marginBottom: spacing.xs,
    },
    transactionRefValue: {
        ...typography.styles.labelMedium,
        color: colors.text.primary,
        fontFamily: 'monospace',
    },
});

export default DataScreen;
