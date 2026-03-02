// NovaPay - Dashboard Screen
import React, { useEffect, useState, useCallback } from 'react';
import {
    View,
    Text,
    ScrollView,
    StyleSheet,
    RefreshControl,
    StatusBar,
    TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing } from '../../theme/spacing';
import { BalanceCard, GradientActionCard, TransactionItem, ServiceCard } from '../../components/Card';
import { useAuthStore } from '../../store/useAuthStore';
import { getTransactions, Transaction, subscribeToWallet, subscribeToTransactions } from '../../services/wallet';

export const DashboardScreen: React.FC = () => {
    const navigation = useNavigation<any>();
    const { user, wallet, refreshWallet } = useAuthStore();

    const [refreshing, setRefreshing] = useState(false);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [balanceHidden, setBalanceHidden] = useState(false);

    // Load transactions
    const loadTransactions = useCallback(async () => {
        if (wallet?.id) {
            const txns = await getTransactions(wallet.id, 5);
            setTransactions(txns);
        }
        setLoading(false);
    }, [wallet?.id]);

    // Initial load
    useEffect(() => {
        loadTransactions();
    }, [loadTransactions]);

    // Real-time subscriptions
    useEffect(() => {
        if (!wallet?.id) return;

        // Subscribe to wallet changes
        const walletChannel = subscribeToWallet(wallet.id, (updatedWallet) => {
            useAuthStore.getState().setWallet(updatedWallet);
        });

        // Subscribe to new transactions
        const txnChannel = subscribeToTransactions(wallet.id, (newTxn) => {
            setTransactions(prev => [newTxn, ...prev.slice(0, 4)]);
        });

        return () => {
            walletChannel.unsubscribe();
            txnChannel.unsubscribe();
        };
    }, [wallet?.id]);

    // Pull to refresh
    const onRefresh = async () => {
        setRefreshing(true);
        await refreshWallet();
        await loadTransactions();
        setRefreshing(false);
    };

    // Modern gradient quick actions
    const quickActions = [
        {
            icon: '🏦',
            label: 'Transfer',
            onPress: () => navigation.navigate('Transfer'),
            gradientColors: ['#3B82F6', '#6366F1'] // Blue to Indigo
        },
        {
            icon: '⚡',
            label: 'Bills',
            onPress: () => navigation.navigate('Bills'),
            gradientColors: ['#F59E0B', '#FB923C'] // Amber to Orange
        },
        {
            icon: '📱',
            label: 'Data',
            onPress: () => navigation.navigate('Data'),
            gradientColors: ['#8B5CF6', '#EC4899'] // Purple to Pink
        },
        {
            icon: '🐷',
            label: 'Savings',
            onPress: () => navigation.navigate('Savings'),
            gradientColors: ['#10B981', '#059669'] // Green to Emerald
        },
    ];

    // Services
    const services = [
        { icon: '📊', title: 'Transaction History', subtitle: 'View all transactions', onPress: () => navigation.navigate('TransactionHistory') },
        { icon: '🏦', title: 'Loans', subtitle: 'Quick loans up to ₦500,000', onPress: () => navigation.navigate('Loans') },
    ];

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <StatusBar barStyle="light-content" backgroundColor="#6366F1" />

            {/* Modern Header */}
            <LinearGradient
                colors={['#6366F1', '#8B5CF6']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.header}
            >
                <View>
                    <Text style={styles.greeting}>Hi, {user?.first_name || 'User'}! 👋</Text>
                    <Text style={styles.subtitle}>Welcome back to NovaPay</Text>
                </View>
                <TouchableOpacity style={styles.notificationButton}>
                    <Text style={styles.notification}>🔔</Text>
                </TouchableOpacity>
            </LinearGradient>

            <ScrollView
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        colors={[colors.primary.main]}
                        tintColor={colors.primary.main}
                    />
                }
            >
                {/* Balance Card */}
                <BalanceCard
                    balance={wallet?.balance || 0}
                    availableBalance={wallet?.available_balance || 0}
                    accountNumber={wallet?.account_number}
                    userName={user ? `${user.first_name} ${user.last_name}` : undefined}
                    tierLevel={user?.tier_level || 1}
                    onPress={() => navigation.navigate('Wallet')}
                />

                {/* Modern 2x2 Quick Actions Grid */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Quick Actions</Text>
                    <View style={styles.quickActionsGrid}>
                        {quickActions.map((action, index) => (
                            <GradientActionCard
                                key={index}
                                icon={action.icon}
                                label={action.label}
                                onPress={action.onPress}
                                gradientColors={action.gradientColors}
                            />
                        ))}
                    </View>
                </View>

                {/* Services */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Services</Text>
                    {services.map((service, index) => (
                        <ServiceCard
                            key={index}
                            icon={service.icon}
                            title={service.title}
                            subtitle={service.subtitle}
                            onPress={service.onPress}
                            badge={service.badge}
                        />
                    ))}
                </View>

                {/* Recent Transactions */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Recent Transactions</Text>
                        <Text
                            style={styles.seeAll}
                            onPress={() => navigation.navigate('TransactionHistory')}
                        >
                            See All
                        </Text>
                    </View>

                    <View style={styles.transactionsList}>
                        {loading ? (
                            <Text style={styles.emptyText}>Loading...</Text>
                        ) : transactions.length === 0 ? (
                            <Text style={styles.emptyText}>No transactions yet</Text>
                        ) : (
                            transactions.map((txn) => (
                                <TransactionItem
                                    key={txn.id}
                                    type={txn.type}
                                    category={txn.category}
                                    amount={txn.amount}
                                    description={txn.description}
                                    recipientName={txn.recipient_name}
                                    status={txn.status}
                                    date={txn.created_at}
                                    cashback={txn.cashback}
                                    onPress={() => navigation.navigate('TransactionDetail', { id: txn.id })}
                                />
                            ))
                        )}
                    </View>
                </View>

                {/* Bottom spacing */}
                <View style={{ height: 100 }} />
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background.default,
    },
    // Modern Gradient Header
    header: {
        paddingHorizontal: spacing.screenHorizontal,
        paddingVertical: spacing.lg,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    greeting: {
        ...typography.styles.headlineMedium,
        fontSize: 24,
        color: '#FFFFFF',
        fontWeight: '700',
        marginBottom: 4,
    },
    subtitle: {
        ...typography.styles.bodyMedium,
        fontSize: 14,
        color: 'rgba(255, 255, 255, 0.8)',
    },
    notificationButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    notification: {
        fontSize: 20,
    },
    // Sections
    section: {
        backgroundColor: colors.background.default,
        paddingHorizontal: spacing.screenHorizontal,
        paddingTop: spacing.lg,
        paddingBottom: spacing.md,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.md,
    },
    sectionTitle: {
        ...typography.styles.titleLarge,
        fontSize: 20,
        color: colors.text.primary,
        fontWeight: '700',
        marginBottom: spacing.md,
    },
    seeAll: {
        ...typography.styles.labelLarge,
        color: colors.primary.main,
        fontWeight: '600',
    },
    // Modern 2x2 Grid for Quick Actions
    quickActionsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        gap: spacing.md,
    },
    transactionsList: {
        backgroundColor: colors.background.elevated,
        borderRadius: spacing.borderRadius.lg,
        overflow: 'hidden',
    },
    emptyText: {
        ...typography.styles.bodyMedium,
        color: colors.text.secondary,
        textAlign: 'center',
        paddingVertical: spacing.xl,
    },
});

export default DashboardScreen;
