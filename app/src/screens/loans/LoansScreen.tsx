// NovaPay - Loans Screen
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
import { AmountInput } from '../../components/Input';
import { useAuthStore } from '../../store/useAuthStore';
import { formatCurrency } from '../../services/wallet';
import { supabase } from '../../services/supabase';

type LoanView = 'list' | 'calculator' | 'apply';

interface LoanSchedule {
    monthly_payment: number;
    total_interest: number;
    total_repayment: number;
    schedule: Array<{
        month: number;
        principal: number;
        interest: number;
        payment: number;
        remaining: number;
    }>;
}

interface Loan {
    id: string;
    user_id: string;
    wallet_id: string;
    amount: number;
    tenure_months: number;
    interest_rate: number;
    total_repayment: number;
    total_interest: number;
    repaid_amount: number; // defaulted to 0 in DB
    status: 'pending' | 'approved' | 'rejected' | 'active' | 'completed' | 'overdue';
    disbursed_at: string | null;
    due_date: string | null;
    created_at: string;
    updated_at: string;
    principal_amount?: number; // legacy/alias support if needed, but better to use amount
    monthly_payment?: number;
    amount_paid?: number; // alias for repaid_amount
    amount_remaining?: number;
    next_payment_date?: string;
}

// Loan limits by tier
const LOAN_LIMITS = {
    1: 10000,
    2: 50000,
    3: 200000,
};

const TENURE_OPTIONS = [1, 3, 6, 9, 12];

export const LoansScreen: React.FC = () => {
    const navigation = useNavigation<any>();
    const { user, wallet } = useAuthStore();

    const [view, setView] = useState<LoanView>('list');
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [loans, setLoans] = useState<Loan[]>([]);

    // Calculator state
    const [amount, setAmount] = useState('');
    const [tenure, setTenure] = useState(3);
    const [schedule, setSchedule] = useState<LoanSchedule | null>(null);

    const [error, setError] = useState('');

    const tierLevel = user?.tier_level || 1;
    const maxLoan = LOAN_LIMITS[tierLevel as keyof typeof LOAN_LIMITS] || 10000;

    const loadLoans = useCallback(async () => {
        if (!user) return;

        const { data } = await supabase
            .from('loans')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });

        setLoans(data || []);
        setLoading(false);
    }, [user]);

    useEffect(() => {
        loadLoans();
    }, [loadLoans]);

    const onRefresh = async () => {
        setRefreshing(true);
        await loadLoans();
        setRefreshing(false);
    };

    const calculateLoan = async () => {
        const principal = parseFloat(amount);
        if (isNaN(principal) || principal < 1000) {
            setError('Minimum loan amount is ₦1,000');
            return;
        }

        if (principal > maxLoan) {
            setError(`Your loan limit is ${formatCurrency(maxLoan)}. Upgrade your tier for higher limits.`);
            return;
        }

        setError('');
        setLoading(true);

        try {
            const { data, error: rpcError } = await supabase.rpc('calculate_loan_schedule', {
                p_principal: principal,
                p_tenure_months: tenure,
            });

            if (rpcError) throw rpcError;

            if (data && data.length > 0) {
                // Calculate totals from schedule
                const totalInterest = data.reduce((sum: number, item: { interest_payment: number; }) => sum + item.interest_payment, 0);
                const totalRepayment = data.reduce((sum: number, item: { total_payment: number; }) => sum + item.total_payment, 0);
                const monthlyPayment = data[0].total_payment;

                setSchedule({
                    monthly_payment: monthlyPayment,
                    total_interest: totalInterest,
                    total_repayment: totalRepayment,
                    schedule: data.map((item: { month: number; principal_payment: number; interest_payment: number; total_payment: number; remaining_balance: number; }) => ({
                        month: item.month,
                        principal: item.principal_payment,
                        interest: item.interest_payment,
                        payment: item.total_payment,
                        remaining: item.remaining_balance
                    }))
                });
            }
        } catch (err: any) {
            // Fallback calculation (15% APR per NCC)
            const monthlyRate = 0.15 / 12;
            const n = tenure;
            const monthlyPayment = (principal * monthlyRate * Math.pow(1 + monthlyRate, n)) /
                (Math.pow(1 + monthlyRate, n) - 1);
            const totalRepayment = monthlyPayment * n;
            const totalInterest = totalRepayment - principal;

            setSchedule({
                monthly_payment: monthlyPayment,
                total_interest: totalInterest,
                total_repayment: totalRepayment,
                schedule: [],
            });
        } finally {
            setLoading(false);
        }
    };

    const handleApply = () => {
        // Check for existing active loans
        const activeLoan = loans.find(l => ['pending', 'approved', 'disbursed', 'active'].includes(l.status));
        if (activeLoan) {
            Alert.alert('Active Loan', 'You already have an active loan. Please repay it before applying for a new one.');
            return;
        }

        Alert.alert(
            'Coming Soon',
            'Loan applications will be available soon. Stay tuned!',
            [{ text: 'OK' }]
        );
    };

    const handleBack = () => {
        if (view === 'calculator') {
            setView('list');
            setAmount('');
            setSchedule(null);
        } else {
            navigation.goBack();
        }
        setError('');
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'active': return colors.success.main;
            case 'pending': return colors.warning.main;
            case 'completed': return colors.text.secondary;
            case 'defaulted': return colors.error.main;
            default: return colors.text.secondary;
        }
    };

    const renderLoanCard = (loan: Loan) => {
        const progress = ((loan.repaid_amount / loan.total_repayment) * 100) || 0;

        return (
            <View key={loan.id} style={styles.loanCard}>
                <View style={styles.loanHeader}>
                    <Text style={styles.loanAmount}>{formatCurrency(loan.amount)}</Text>
                    <View style={[styles.statusBadge, { backgroundColor: getStatusColor(loan.status) + '20' }]}>
                        <Text style={[styles.statusText, { color: getStatusColor(loan.status) }]}>
                            {loan.status.toUpperCase()}
                        </Text>
                    </View>
                </View>

                <View style={styles.loanDetails}>
                    <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Monthly Payment</Text>
                        <Text style={styles.detailValue}>{formatCurrency(loan.monthly_payment || 0)}</Text>
                    </View>
                    <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Tenure</Text>
                        <Text style={styles.detailValue}>{loan.tenure_months} months</Text>
                    </View>
                    <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Remaining</Text>
                        <Text style={styles.detailValue}>{formatCurrency(loan.total_repayment - loan.repaid_amount)}</Text>
                    </View>
                </View>

                {loan.status === 'active' && (
                    <View style={styles.progressContainer}>
                        <View style={styles.progressBar}>
                            <View style={[styles.progressFill, { width: `${progress}%` }]} />
                        </View>
                        <Text style={styles.progressText}>{progress.toFixed(0)}% repaid</Text>
                    </View>
                )}
            </View>
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.backButton} onPress={handleBack}>
                    ← Back
                </Text>
                <Text style={styles.headerTitle}>Loans</Text>
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
                        {/* Loan Limit Card */}
                        <View style={styles.limitCard}>
                            <Text style={styles.limitLabel}>Your Loan Limit</Text>
                            <Text style={styles.limitAmount}>{formatCurrency(maxLoan)}</Text>
                            <Text style={styles.tierInfo}>
                                Tier {tierLevel} Account • Up to 15% APR
                            </Text>
                        </View>

                        {/* Action Buttons */}
                        <View style={styles.actionButtons}>
                            <Button
                                title="Loan Calculator"
                                onPress={() => setView('calculator')}
                                variant="outline"
                                style={styles.actionButton}
                            />
                            <Button
                                title="Apply for Loan"
                                onPress={handleApply}
                                style={styles.actionButton}
                            />
                        </View>

                        {/* Loans List */}
                        <Text style={styles.sectionTitle}>Your Loans</Text>
                        {loans.length === 0 ? (
                            <View style={styles.emptyState}>
                                <Text style={styles.emptyIcon}>💵</Text>
                                <Text style={styles.emptyTitle}>No Loans Yet</Text>
                                <Text style={styles.emptyText}>
                                    Use the calculator to see how much your loan would cost.
                                </Text>
                            </View>
                        ) : (
                            loans.map(renderLoanCard)
                        )}

                        {/* Benefits */}
                        <View style={styles.benefitsCard}>
                            <Text style={styles.benefitsTitle}>✨ NovaPay Loan Benefits</Text>
                            <Text style={styles.benefitItem}>✓ Maximum 15% APR (NCC compliant)</Text>
                            <Text style={styles.benefitItem}>✓ No hidden fees</Text>
                            <Text style={styles.benefitItem}>✓ Flexible tenure (1-12 months)</Text>
                            <Text style={styles.benefitItem}>✓ Instant disbursement</Text>
                        </View>
                    </>
                )}

                {view === 'calculator' && (
                    <View style={styles.calculatorContainer}>
                        <Text style={styles.formTitle}>Loan Calculator</Text>
                        <Text style={styles.formSubtitle}>
                            See how much your loan would cost
                        </Text>

                        <AmountInput
                            value={amount}
                            onChangeText={(text) => {
                                setAmount(text);
                                setSchedule(null);
                                setError('');
                            }}
                            label="Loan Amount"
                            error={error}
                        />

                        <Text style={styles.label}>Tenure</Text>
                        <View style={styles.tenureSelector}>
                            {TENURE_OPTIONS.map((months) => (
                                <TouchableOpacity
                                    key={months}
                                    style={[styles.tenureOption, tenure === months && styles.tenureOptionSelected]}
                                    onPress={() => {
                                        setTenure(months);
                                        setSchedule(null);
                                    }}
                                >
                                    <Text style={[styles.tenureText, tenure === months && styles.tenureTextSelected]}>
                                        {months}m
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        <Button
                            title="Calculate"
                            onPress={calculateLoan}
                            loading={loading}
                            disabled={!amount}
                            fullWidth
                            style={styles.button}
                        />

                        {schedule && (
                            <View style={styles.scheduleCard}>
                                <Text style={styles.scheduleTitle}>Loan Breakdown</Text>

                                <View style={styles.scheduleRow}>
                                    <Text style={styles.scheduleLabel}>Principal</Text>
                                    <Text style={styles.scheduleValue}>{formatCurrency(parseFloat(amount))}</Text>
                                </View>
                                <View style={styles.scheduleRow}>
                                    <Text style={styles.scheduleLabel}>Total Interest</Text>
                                    <Text style={styles.scheduleValue}>{formatCurrency(schedule.total_interest)}</Text>
                                </View>
                                <View style={styles.divider} />
                                <View style={styles.scheduleRow}>
                                    <Text style={styles.totalLabel}>Total Repayment</Text>
                                    <Text style={styles.totalValue}>{formatCurrency(schedule.total_repayment)}</Text>
                                </View>
                                <View style={styles.scheduleRow}>
                                    <Text style={styles.monthlyLabel}>Monthly Payment</Text>
                                    <Text style={styles.monthlyValue}>{formatCurrency(schedule.monthly_payment)}</Text>
                                </View>

                                <Button
                                    title="Apply for This Loan"
                                    onPress={handleApply}
                                    fullWidth
                                    style={styles.applyButton}
                                />
                            </View>
                        )}
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
    limitCard: {
        backgroundColor: colors.primary.main,
        borderRadius: spacing.borderRadius.xl,
        padding: spacing.cardPaddingLarge,
        marginBottom: spacing.lg,
        alignItems: 'center',
    },
    limitLabel: {
        ...typography.styles.labelMedium,
        color: colors.primary.contrast,
        opacity: 0.9,
    },
    limitAmount: {
        ...typography.styles.displayLarge,
        color: colors.primary.contrast,
        marginVertical: spacing.xs,
    },
    tierInfo: {
        ...typography.styles.caption,
        color: colors.primary.contrast,
        opacity: 0.8,
    },
    actionButtons: {
        flexDirection: 'row',
        gap: spacing.md,
        marginBottom: spacing.xl,
    },
    actionButton: {
        flex: 1,
    },
    sectionTitle: {
        ...typography.styles.titleMedium,
        color: colors.text.primary,
        marginBottom: spacing.md,
    },
    emptyState: {
        alignItems: 'center',
        paddingVertical: spacing['2xl'],
    },
    emptyIcon: {
        fontSize: 64,
        marginBottom: spacing.md,
    },
    emptyTitle: {
        ...typography.styles.titleLarge,
        color: colors.text.primary,
        marginBottom: spacing.sm,
    },
    emptyText: {
        ...typography.styles.bodyMedium,
        color: colors.text.secondary,
        textAlign: 'center',
    },
    loanCard: {
        backgroundColor: colors.background.elevated,
        borderRadius: spacing.borderRadius.lg,
        padding: spacing.cardPadding,
        marginBottom: spacing.md,
        ...shadows.sm,
    },
    loanHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.md,
    },
    loanAmount: {
        ...typography.styles.headlineMedium,
        color: colors.text.primary,
    },
    statusBadge: {
        paddingHorizontal: spacing.sm,
        paddingVertical: 4,
        borderRadius: spacing.borderRadius.sm,
    },
    statusText: {
        ...typography.styles.caption,
        fontWeight: '600',
    },
    loanDetails: {
        gap: spacing.xs,
    },
    detailRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    detailLabel: {
        ...typography.styles.bodySmall,
        color: colors.text.secondary,
    },
    detailValue: {
        ...typography.styles.labelSmall,
        color: colors.text.primary,
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
    benefitsCard: {
        backgroundColor: colors.success.background,
        borderRadius: spacing.borderRadius.lg,
        padding: spacing.cardPadding,
        marginTop: spacing.xl,
    },
    benefitsTitle: {
        ...typography.styles.labelMedium,
        color: colors.text.primary,
        marginBottom: spacing.sm,
    },
    benefitItem: {
        ...typography.styles.bodySmall,
        color: colors.text.secondary,
        marginBottom: 4,
    },
    calculatorContainer: {
        paddingTop: spacing.md,
    },
    formTitle: {
        ...typography.styles.headlineMedium,
        color: colors.text.primary,
        marginBottom: spacing.xs,
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
    tenureSelector: {
        flexDirection: 'row',
        gap: spacing.sm,
    },
    tenureOption: {
        flex: 1,
        paddingVertical: spacing.md,
        backgroundColor: colors.background.elevated,
        borderRadius: spacing.borderRadius.md,
        alignItems: 'center',
        borderWidth: 2,
        borderColor: colors.border.light,
    },
    tenureOptionSelected: {
        borderColor: colors.primary.main,
        backgroundColor: colors.primary.main + '10',
    },
    tenureText: {
        ...typography.styles.labelMedium,
        color: colors.text.secondary,
    },
    tenureTextSelected: {
        color: colors.primary.main,
    },
    button: {
        marginTop: spacing.xl,
    },
    scheduleCard: {
        backgroundColor: colors.background.elevated,
        borderRadius: spacing.borderRadius.lg,
        padding: spacing.cardPadding,
        marginTop: spacing.xl,
    },
    scheduleTitle: {
        ...typography.styles.titleMedium,
        color: colors.text.primary,
        marginBottom: spacing.md,
    },
    scheduleRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: spacing.xs,
    },
    scheduleLabel: {
        ...typography.styles.bodyMedium,
        color: colors.text.secondary,
    },
    scheduleValue: {
        ...typography.styles.labelMedium,
        color: colors.text.primary,
    },
    divider: {
        height: 1,
        backgroundColor: colors.border.light,
        marginVertical: spacing.md,
    },
    totalLabel: {
        ...typography.styles.titleMedium,
        color: colors.text.primary,
    },
    totalValue: {
        ...typography.styles.titleLarge,
        color: colors.text.primary,
    },
    monthlyLabel: {
        ...typography.styles.bodyMedium,
        color: colors.primary.main,
    },
    monthlyValue: {
        ...typography.styles.headlineMedium,
        color: colors.primary.main,
    },
    applyButton: {
        marginTop: spacing.lg,
    },
});

export default LoansScreen;
