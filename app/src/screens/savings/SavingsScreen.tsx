// NovaPay - Savings Screen (OWealth-style)
import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Alert,
    RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing, shadows } from '../../theme/spacing';
import { Button } from '../../components/Button';
import { Input, AmountInput, PinInput } from '../../components/Input';
import { Card } from '../../components/Card';
import { useAuthStore } from '../../store/useAuthStore';
import {
    SavingsPlan,
    getSavingsPlans,
    createSavingsPlan,
    depositToSavings,
    getSavingsSummary,
    INTEREST_RATES,
    calculateProjectedEarnings,
} from '../../services/savings';
import { formatCurrency } from '../../services/wallet';
import { verifyPin } from '../../services/auth';

type SavingsView = 'list' | 'create' | 'detail' | 'deposit' | 'pin';

export const SavingsScreen: React.FC = () => {
    const navigation = useNavigation<any>();
    const { user, wallet, refreshWallet } = useAuthStore();

    const [view, setView] = useState<SavingsView>('list');
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [plans, setPlans] = useState<SavingsPlan[]>([]);
    const [summary, setSummary] = useState({ totalSaved: 0, totalInterest: 0, activePlans: 0 });

    // Selected plan for detail view
    const [selectedPlan, setSelectedPlan] = useState<SavingsPlan | null>(null);

    // Create form
    const [planName, setPlanName] = useState('');
    const [planType, setPlanType] = useState<'flexible' | 'fixed' | 'target'>('flexible');
    const [targetAmount, setTargetAmount] = useState('');

    // Deposit form
    const [depositAmount, setDepositAmount] = useState('');
    const [pin, setPin] = useState('');
    const [pendingAction, setPendingAction] = useState<'create' | 'deposit' | null>(null);

    const [error, setError] = useState('');

    const loadData = useCallback(async () => {
        if (!user) return;

        const [plansData, summaryData] = await Promise.all([
            getSavingsPlans(user.id),
            getSavingsSummary(user.id),
        ]);

        setPlans(plansData);
        setSummary(summaryData);
        setLoading(false);
    }, [user]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const onRefresh = async () => {
        setRefreshing(true);
        await loadData();
        setRefreshing(false);
    };

    const getPlanTypeInfo = (type: 'flexible' | 'fixed' | 'target') => {
        switch (type) {
            case 'flexible':
                return {
                    title: 'Flexible Savings',
                    description: 'Withdraw anytime',
                    rate: INTEREST_RATES.flexible * 100,
                    icon: '💰',
                };
            case 'fixed':
                return {
                    title: 'Fixed Deposit',
                    description: 'Higher interest, locked',
                    rate: INTEREST_RATES.fixed * 100,
                    icon: '🔒',
                };
            case 'target':
                return {
                    title: 'Target Savings',
                    description: 'Save towards a goal',
                    rate: INTEREST_RATES.target * 100,
                    icon: '🎯',
                };
        }
    };

    const handleCreatePlan = () => {
        if (!planName.trim()) {
            setError('Please enter a name for your savings plan');
            return;
        }
        if (planType === 'target' && (!targetAmount || parseFloat(targetAmount) < 1000)) {
            setError('Target amount must be at least ₦1,000');
            return;
        }

        setPendingAction('create');
        setView('pin');
        setPin('');
        setError('');
    };

    const handleDeposit = () => {
        const amount = parseFloat(depositAmount);
        if (!amount || amount < 100) {
            setError('Minimum deposit is ₦100');
            return;
        }
        if (amount > (wallet?.available_balance || 0)) {
            setError('Insufficient balance');
            return;
        }

        setPendingAction('deposit');
        setView('pin');
        setPin('');
        setError('');
    };

    const handlePinVerify = async (enteredPin: string) => {
        if (enteredPin.length !== 4) return;

        setLoading(true);
        setError('');

        try {
            const pinResult = await verifyPin(user!.id, enteredPin);

            if (!pinResult.success) {
                setError(pinResult.message);
                setPin('');
                setLoading(false);
                return;
            }

            if (pendingAction === 'create') {
                const result = await createSavingsPlan({
                    userId: user!.id,
                    walletId: wallet!.id,
                    name: planName,
                    planType,
                    targetAmount: planType === 'target' ? parseFloat(targetAmount) : undefined,
                });

                if (!result.success) {
                    Alert.alert('Error', result.message);
                    setView('create');
                } else {
                    Alert.alert('Success', 'Savings plan created!');
                    await loadData();
                    setView('list');
                    resetForms();
                }
            } else if (pendingAction === 'deposit' && selectedPlan) {
                const result = await depositToSavings(selectedPlan.id, parseFloat(depositAmount));

                if (!result.success) {
                    Alert.alert('Error', result.message);
                    setView('deposit');
                } else {
                    Alert.alert('Success', `₦${depositAmount} deposited successfully!`);
                    await refreshWallet();
                    await loadData();
                    setView('list');
                    resetForms();
                }
            }
        } catch (err: any) {
            Alert.alert('Error', err.message || 'Operation failed');
        } finally {
            setLoading(false);
        }
    };

    const resetForms = () => {
        setPlanName('');
        setPlanType('flexible');
        setTargetAmount('');
        setDepositAmount('');
        setPin('');
        setSelectedPlan(null);
        setPendingAction(null);
        setError('');
    };

    const handleBack = () => {
        if (view === 'create' || view === 'detail') {
            setView('list');
            resetForms();
        } else if (view === 'deposit') {
            setView('detail');
            setDepositAmount('');
        } else if (view === 'pin') {
            setView(pendingAction === 'create' ? 'create' : 'deposit');
            setPin('');
        } else {
            navigation.goBack();
        }
        setError('');
    };

    const renderPlanCard = (plan: SavingsPlan) => {
        const info = getPlanTypeInfo(plan.plan_type);
        const total = plan.current_amount + plan.accrued_interest;
        const progress = plan.target_amount ? (plan.current_amount / plan.target_amount) * 100 : 0;

        return (
            <TouchableOpacity
                key={plan.id}
                style={styles.planCard}
                onPress={() => {
                    setSelectedPlan(plan);
                    setView('detail');
                }}
            >
                <View style={styles.planHeader}>
                    <Text style={styles.planIcon}>{info.icon}</Text>
                    <View style={styles.planInfo}>
                        <Text style={styles.planName}>{plan.name}</Text>
                        <Text style={styles.planType}>{info.title} • {info.rate}% p.a.</Text>
                    </View>
                </View>

                <View style={styles.planBalances}>
                    <View>
                        <Text style={styles.balanceLabel}>Saved</Text>
                        <Text style={styles.balanceValue}>{formatCurrency(plan.current_amount)}</Text>
                    </View>
                    <View style={styles.interestBox}>
                        <Text style={styles.interestLabel}>Interest Earned</Text>
                        <Text style={styles.interestValue}>+{formatCurrency(plan.accrued_interest)}</Text>
                    </View>
                </View>

                {plan.target_amount && (
                    <View style={styles.progressContainer}>
                        <View style={styles.progressBar}>
                            <View style={[styles.progressFill, { width: `${Math.min(progress, 100)}%` }]} />
                        </View>
                        <Text style={styles.progressText}>{progress.toFixed(0)}% of {formatCurrency(plan.target_amount)}</Text>
                    </View>
                )}
            </TouchableOpacity>
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.backButton} onPress={handleBack}>
                    ← Back
                </Text>
                <Text style={styles.headerTitle}>Savings</Text>
                <View style={{ width: 50 }} />
            </View>

            <ScrollView
                contentContainerStyle={styles.scrollContent}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary.main]} />
                }
            >
                {view === 'list' && (
                    <>
                        {/* Summary Card */}
                        <View style={styles.summaryCard}>
                            <Text style={styles.summaryTitle}>💰 Total Savings</Text>
                            <Text style={styles.summaryAmount}>{formatCurrency(summary.totalSaved)}</Text>
                            <View style={styles.summaryRow}>
                                <View>
                                    <Text style={styles.summaryLabel}>Interest Earned</Text>
                                    <Text style={styles.summaryInterest}>+{formatCurrency(summary.totalInterest)}</Text>
                                </View>
                                <View>
                                    <Text style={styles.summaryLabel}>Active Plans</Text>
                                    <Text style={styles.summaryPlans}>{summary.activePlans}</Text>
                                </View>
                            </View>
                        </View>

                        {/* Create New Button */}
                        <Button
                            title="+ Create New Savings Plan"
                            onPress={() => setView('create')}
                            variant="outline"
                            fullWidth
                            style={styles.createButton}
                        />

                        {/* Plans List */}
                        <Text style={styles.sectionTitle}>Your Savings Plans</Text>
                        {plans.length === 0 ? (
                            <Text style={styles.emptyText}>No savings plans yet. Create one to start earning interest!</Text>
                        ) : (
                            plans.map(renderPlanCard)
                        )}
                    </>
                )}

                {view === 'create' && (
                    <View style={styles.formContainer}>
                        <Text style={styles.formTitle}>Create Savings Plan</Text>

                        <Input
                            value={planName}
                            onChangeText={setPlanName}
                            label="Plan Name"
                            placeholder="e.g., Emergency Fund, Vacation"
                            error={error && error.includes('name') ? error : undefined}
                        />

                        <Text style={styles.label}>Plan Type</Text>
                        <View style={styles.typeSelector}>
                            {(['flexible', 'fixed', 'target'] as const).map((type) => {
                                const info = getPlanTypeInfo(type);
                                return (
                                    <TouchableOpacity
                                        key={type}
                                        style={[styles.typeCard, planType === type && styles.typeCardSelected]}
                                        onPress={() => setPlanType(type)}
                                    >
                                        <Text style={styles.typeIcon}>{info.icon}</Text>
                                        <Text style={styles.typeTitle}>{info.title.split(' ')[0]}</Text>
                                        <Text style={styles.typeRate}>{info.rate}% p.a.</Text>
                                        <Text style={styles.typeDesc}>{info.description}</Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>

                        {planType === 'target' && (
                            <AmountInput
                                value={targetAmount}
                                onChangeText={setTargetAmount}
                                label="Target Amount"
                                error={error && error.includes('Target') ? error : undefined}
                            />
                        )}

                        <Button
                            title="Create Plan"
                            onPress={handleCreatePlan}
                            disabled={!planName.trim()}
                            fullWidth
                            style={styles.button}
                        />
                    </View>
                )}

                {view === 'detail' && selectedPlan && (
                    <View style={styles.detailContainer}>
                        {renderPlanCard(selectedPlan)}

                        <View style={styles.projectionCard}>
                            <Text style={styles.projectionTitle}>📈 Projected Earnings</Text>
                            <View style={styles.projectionRow}>
                                <Text style={styles.projectionLabel}>In 6 months:</Text>
                                <Text style={styles.projectionValue}>
                                    {formatCurrency(calculateProjectedEarnings(
                                        selectedPlan.current_amount,
                                        selectedPlan.interest_rate,
                                        6
                                    ).total)}
                                </Text>
                            </View>
                            <View style={styles.projectionRow}>
                                <Text style={styles.projectionLabel}>In 1 year:</Text>
                                <Text style={styles.projectionValue}>
                                    {formatCurrency(calculateProjectedEarnings(
                                        selectedPlan.current_amount,
                                        selectedPlan.interest_rate,
                                        12
                                    ).total)}
                                </Text>
                            </View>
                        </View>

                        <Button
                            title="Add Money"
                            onPress={() => setView('deposit')}
                            fullWidth
                            style={styles.button}
                        />
                    </View>
                )}

                {view === 'deposit' && selectedPlan && (
                    <View style={styles.formContainer}>
                        <Text style={styles.formTitle}>Deposit to {selectedPlan.name}</Text>

                        <AmountInput
                            value={depositAmount}
                            onChangeText={setDepositAmount}
                            label="Amount to Deposit"
                            error={error}
                        />

                        <View style={styles.balanceInfo}>
                            <Text style={styles.balanceInfoLabel}>Available Balance:</Text>
                            <Text style={styles.balanceInfoValue}>{formatCurrency(wallet?.available_balance || 0)}</Text>
                        </View>

                        <Button
                            title="Deposit"
                            onPress={handleDeposit}
                            disabled={!depositAmount}
                            fullWidth
                            style={styles.button}
                        />
                    </View>
                )}

                {view === 'pin' && (
                    <View style={styles.pinContainer}>
                        <Text style={styles.formTitle}>Enter PIN</Text>
                        <Text style={styles.formSubtitle}>Enter your PIN to confirm</Text>

                        <PinInput
                            value={pin}
                            onChangeText={(value) => {
                                setPin(value);
                                setError('');
                                if (value.length === 4) {
                                    handlePinVerify(value);
                                }
                            }}
                            error={error}
                        />

                        {loading && <Text style={styles.processingText}>Processing...</Text>}
                    </View>
                )}
            </ScrollView>
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
        paddingTop: spacing.lg,
        paddingBottom: spacing['3xl'],
    },
    summaryCard: {
        backgroundColor: colors.secondary.main,
        borderRadius: spacing.borderRadius.xl,
        padding: spacing.cardPaddingLarge,
        marginBottom: spacing.lg,
    },
    summaryTitle: {
        ...typography.styles.labelMedium,
        color: colors.secondary.contrast,
        opacity: 0.9,
        marginBottom: spacing.xs,
    },
    summaryAmount: {
        ...typography.styles.displayMedium,
        color: colors.secondary.contrast,
        marginBottom: spacing.lg,
    },
    summaryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    summaryLabel: {
        ...typography.styles.caption,
        color: colors.secondary.contrast,
        opacity: 0.8,
    },
    summaryInterest: {
        ...typography.styles.titleMedium,
        color: colors.secondary.contrast,
    },
    summaryPlans: {
        ...typography.styles.titleMedium,
        color: colors.secondary.contrast,
        textAlign: 'right',
    },
    createButton: {
        marginBottom: spacing.xl,
    },
    sectionTitle: {
        ...typography.styles.titleMedium,
        color: colors.text.primary,
        marginBottom: spacing.md,
    },
    emptyText: {
        ...typography.styles.bodyMedium,
        color: colors.text.secondary,
        textAlign: 'center',
        paddingVertical: spacing.xl,
    },
    planCard: {
        backgroundColor: colors.background.elevated,
        borderRadius: spacing.borderRadius.lg,
        padding: spacing.cardPadding,
        marginBottom: spacing.md,
        ...shadows.sm,
    },
    planHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: spacing.md,
    },
    planIcon: {
        fontSize: 32,
        marginRight: spacing.md,
    },
    planInfo: {
        flex: 1,
    },
    planName: {
        ...typography.styles.titleMedium,
        color: colors.text.primary,
    },
    planType: {
        ...typography.styles.caption,
        color: colors.text.secondary,
    },
    planBalances: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
    },
    balanceLabel: {
        ...typography.styles.caption,
        color: colors.text.secondary,
    },
    balanceValue: {
        ...typography.styles.headlineMedium,
        color: colors.text.primary,
    },
    interestBox: {
        alignItems: 'flex-end',
    },
    interestLabel: {
        ...typography.styles.caption,
        color: colors.text.secondary,
    },
    interestValue: {
        ...typography.styles.titleMedium,
        color: colors.success.main,
    },
    progressContainer: {
        marginTop: spacing.md,
    },
    progressBar: {
        height: 8,
        backgroundColor: colors.border.light,
        borderRadius: 4,
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        backgroundColor: colors.success.main,
        borderRadius: 4,
    },
    progressText: {
        ...typography.styles.caption,
        color: colors.text.secondary,
        marginTop: spacing.xs,
    },
    formContainer: {
        paddingTop: spacing.md,
    },
    formTitle: {
        ...typography.styles.headlineMedium,
        color: colors.text.primary,
        marginBottom: spacing.lg,
    },
    formSubtitle: {
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
    typeSelector: {
        flexDirection: 'row',
        gap: spacing.sm,
        marginBottom: spacing.lg,
    },
    typeCard: {
        flex: 1,
        backgroundColor: colors.background.elevated,
        borderRadius: spacing.borderRadius.lg,
        padding: spacing.md,
        alignItems: 'center',
        borderWidth: 2,
        borderColor: 'transparent',
    },
    typeCardSelected: {
        borderColor: colors.primary.main,
        backgroundColor: colors.primary.main + '10',
    },
    typeIcon: {
        fontSize: 24,
        marginBottom: spacing.xs,
    },
    typeTitle: {
        ...typography.styles.labelSmall,
        color: colors.text.primary,
    },
    typeRate: {
        ...typography.styles.caption,
        color: colors.success.main,
    },
    typeDesc: {
        ...typography.styles.caption,
        color: colors.text.secondary,
        textAlign: 'center',
        marginTop: 2,
    },
    button: {
        marginTop: spacing.lg,
    },
    detailContainer: {
        paddingTop: spacing.md,
    },
    projectionCard: {
        backgroundColor: colors.primary.main + '10',
        borderRadius: spacing.borderRadius.lg,
        padding: spacing.cardPadding,
        marginTop: spacing.md,
    },
    projectionTitle: {
        ...typography.styles.labelMedium,
        color: colors.text.primary,
        marginBottom: spacing.md,
    },
    projectionRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: spacing.xs,
    },
    projectionLabel: {
        ...typography.styles.bodyMedium,
        color: colors.text.secondary,
    },
    projectionValue: {
        ...typography.styles.labelMedium,
        color: colors.primary.main,
    },
    balanceInfo: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        backgroundColor: colors.surface.secondary,
        borderRadius: spacing.borderRadius.md,
        padding: spacing.md,
        marginTop: spacing.md,
    },
    balanceInfoLabel: {
        ...typography.styles.bodyMedium,
        color: colors.text.secondary,
    },
    balanceInfoValue: {
        ...typography.styles.labelMedium,
        color: colors.text.primary,
    },
    pinContainer: {
        alignItems: 'center',
        paddingTop: spacing['2xl'],
    },
    processingText: {
        ...typography.styles.bodyMedium,
        color: colors.text.secondary,
        marginTop: spacing.xl,
    },
});

export default SavingsScreen;
