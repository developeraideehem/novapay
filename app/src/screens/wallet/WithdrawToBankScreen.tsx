/**
 * Withdraw to Bank Screen
 * 
 * Allows users to withdraw funds to their bank account
 */

import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    TextInput,
    Alert,
    FlatList,
    Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing } from '../../theme/spacing';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { withdrawToBank, getNigerianBanks } from '../../services/payments/payment.service';
import { paystackGateway } from '../../services/payments/paystack.gateway';
import { useAuthStore } from '../../store/useAuthStore';

export function WithdrawToBankScreen() {
    const navigation = useNavigation();
    const { user, wallet, refreshWallet } = useAuthStore();

    const [amount, setAmount] = useState('');
    const [accountNumber, setAccountNumber] = useState('');
    const [selectedBank, setSelectedBank] = useState<any>(null);
    const [accountName, setAccountName] = useState('');
    const [loading, setLoading] = useState(false);
    const [verifying, setVerifying] = useState(false);
    const [showBankPicker, setShowBankPicker] = useState(false);
    const [banks, setBanks] = useState<any[]>([]);

    useEffect(() => {
        loadBanks();
    }, []);

    const loadBanks = async () => {
        const nigerianBanks = await getNigerianBanks();
        setBanks(nigerianBanks);
    };

    const verifyAccount = async () => {
        if (!accountNumber || accountNumber.length !== 10) {
            Alert.alert('Invalid Account', 'Please enter a valid 10-digit account number');
            return;
        }

        if (!selectedBank) {
            Alert.alert('Select Bank', 'Please select your bank');
            return;
        }

        setVerifying(true);

        try {
            const verification = await paystackGateway.verifyBankAccount(
                accountNumber,
                selectedBank.code
            );

            if (verification.success && verification.account_name) {
                setAccountName(verification.account_name);
                Alert.alert('Account Verified ✅', `Account Name: ${verification.account_name}`);
            } else {
                Alert.alert('Verification Failed', 'Could not verify account details');
                setAccountName('');
            }
        } catch (error: any) {
            Alert.alert('Error', error.message || 'Failed to verify account');
            setAccountName('');
        } finally {
            setVerifying(false);
        }
    };

    const handleWithdraw = async () => {
        const withdrawAmount = parseFloat(amount);

        if (!withdrawAmount || withdrawAmount < 100) {
            Alert.alert('Invalid Amount', 'Minimum withdrawal amount is ₦100');
            return;
        }

        if (!wallet || withdrawAmount > wallet.available_balance) {
            Alert.alert('Insufficient Balance', 'You dont have enough funds');
            return;
        }

        if (!accountName) {
            Alert.alert('Verify Account', 'Please verify your account details first');
            return;
        }

        setLoading(true);

        try {
            const response = await withdrawToBank({
                userId: user!.id,
                amount: withdrawAmount,
                accountNumber,
                bankCode: selectedBank.code,
            });

            if (response.success) {
                await refreshWallet();
                Alert.alert(
                    'Withdrawal Initiated! 🚀',
                    `₦${withdrawAmount.toLocaleString()} will be sent to ${accountName}. This usually takes 5-10 minutes.`,
                    [{ text: 'OK', onPress: () => navigation.goBack() }]
                );
            } else {
                Alert.alert('Withdrawal Failed', response.message || 'Please try again');
            }
        } catch (error: any) {
            Alert.alert('Error', error.message || 'An error occurred');
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()}>
                        <Text style={styles.backButton}>←</Text>
                    </TouchableOpacity>
                    <Text style={styles.title}>Withdraw to Bank</Text>
                    <View style={{ width: 40 }} />
                </View>

                {/* Available Balance */}
                <View style={styles.balanceCard}>
                    <Text style={styles.balanceLabel}>Available Balance</Text>
                    <Text style={styles.balanceAmount}>
                        ₦{wallet?.available_balance.toLocaleString() || '0'}
                    </Text>
                </View>

                {/* Amount Input */}
                <View style={styles.section}>
                    <Text style={styles.label}>Withdrawal Amount</Text>
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
                </View>

                {/* Bank Selection */}
                <View style={styles.section}>
                    <Text style={styles.label}>Select Bank</Text>
                    <TouchableOpacity
                        style={styles.bankSelector}
                        onPress={() => setShowBankPicker(true)}
                    >
                        <Text style={selectedBank ? styles.bankSelected : styles.bankPlaceholder}>
                            {selectedBank ? `${selectedBank.logo} ${selectedBank.name}` : 'Choose your bank'}
                        </Text>
                        <Text style={styles.chevron}>›</Text>
                    </TouchableOpacity>
                </View>

                {/* Account Number */}
                <View style={styles.section}>
                    <Text style={styles.label}>Account Number</Text>
                    <Input
                        value={accountNumber}
                        onChangeText={setAccountNumber}
                        placeholder="0123456789"
                        keyboardType="numeric"
                        maxLength={10}
                    />
                    {accountNumber.length === 10 && selectedBank && (
                        <Button
                            title={verifying ? 'Verifying...' : 'Verify Account'}
                            onPress={verifyAccount}
                            variant="secondary"
                            size="sm"
                            style={{ marginTop: spacing.sm }}
                            disabled={verifying}
                        />
                    )}
                </View>

                {/* Account Name (after verification) */}
                {accountName && (
                    <View style={styles.verifiedCard}>
                        <Text style={styles.verifiedIcon}>✅</Text>
                        <View>
                            <Text style={styles.verifiedLabel}>Account Name</Text>
                            <Text style={styles.verifiedName}>{accountName}</Text>
                        </View>
                    </View>
                )}

                {/* Info */}
                <View style={styles.infoCard}>
                    <Text style={styles.infoText}>
                        • Transfers usually complete in 5-10 minutes{'\n'}
                        • No fees for withdrawals above ₦1,000{'\n'}
                        • Available 24/7
                    </Text>
                </View>
            </ScrollView>

            {/* Withdraw Button */}
            <View style={styles.buttonContainer}>
                <Button
                    title={loading ? 'Processing...' : `Withdraw ₦${parseFloat(amount || '0').toLocaleString()}`}
                    onPress={handleWithdraw}
                    disabled={!amount || !accountName || loading}
                />
            </View>

            {/* Bank Picker Modal */}
            <Modal
                visible={showBankPicker}
                animationType="slide"
                presentationStyle="pageSheet"
            >
                <SafeAreaView style={styles.modalContainer}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>Select Bank</Text>
                        <TouchableOpacity onPress={() => setShowBankPicker(false)}>
                            <Text style={styles.modalClose}>✕</Text>
                        </TouchableOpacity>
                    </View>
                    <FlatList
                        data={banks}
                        keyExtractor={(item) => item.code}
                        renderItem={({ item }) => (
                            <TouchableOpacity
                                style={styles.bankItem}
                                onPress={() => {
                                    setSelectedBank(item);
                                    setShowBankPicker(false);
                                    setAccountName(''); // Reset verification
                                }}
                            >
                                <Text style={styles.bankLogo}>{item.logo}</Text>
                                <Text style={styles.bankName}>{item.name}</Text>
                            </TouchableOpacity>
                        )}
                    />
                </SafeAreaView>
            </Modal>
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
    balanceCard: {
        backgroundColor: colors.primary,
        borderRadius: 16,
        padding: spacing.lg,
        marginBottom: spacing.xl,
        alignItems: 'center',
    },
    balanceLabel: {
        ...typography.styles.caption,
        color: 'rgba(255,255,255,0.8)',
        marginBottom: 4,
    },
    balanceAmount: {
        ...typography.styles.headlineLarge,
        color: '#fff',
    },
    section: {
        marginBottom: spacing.lg,
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
    },
    currencySymbol: {
        ...typography.styles.headlineMedium,
        color: colors.text.primary,
        marginRight: spacing.sm,
    },
    amountInput: {
        ...typography.styles.headlineMedium,
        color: colors.text.primary,
        flex: 1,
    },
    bankSelector: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: colors.background.default,
        borderRadius: 16,
        padding: spacing.md,
    },
    bankPlaceholder: {
        ...typography.styles.bodyMedium,
        color: colors.text.tertiary,
    },
    bankSelected: {
        ...typography.styles.bodyMedium,
        color: colors.text.primary,
        fontWeight: '600',
    },
    chevron: {
        fontSize: 24,
        color: colors.text.secondary,
    },
    verifiedCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: `${colors.success}20`,
        borderRadius: 12,
        padding: spacing.md,
        marginBottom: spacing.lg,
    },
    verifiedIcon: {
        fontSize: 24,
        marginRight: spacing.sm,
    },
    verifiedLabel: {
        ...typography.styles.caption,
        color: colors.text.secondary,
    },
    verifiedName: {
        ...typography.styles.bodyMedium,
        fontWeight: '700',
        color: colors.text.primary,
    },
    infoCard: {
        backgroundColor: colors.surface.secondary,
        borderRadius: 12,
        padding: spacing.md,
    },
    infoText: {
        ...typography.styles.caption,
        color: colors.text.secondary,
        lineHeight: 20,
    },
    buttonContainer: {
        padding: spacing.lg,
        borderTopWidth: 1,
        borderTopColor: colors.border.default,
    },
    modalContainer: {
        flex: 1,
        backgroundColor: colors.background.default,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: spacing.lg,
        borderBottomWidth: 1,
        borderBottomColor: colors.border.default,
    },
    modalTitle: {
        ...typography.styles.headlineMedium,
        color: colors.text.primary,
    },
    modalClose: {
        fontSize: 24,
        color: colors.text.secondary,
    },
    bankItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: colors.border.default,
    },
    bankLogo: {
        fontSize: 32,
        marginRight: spacing.md,
    },
    bankName: {
        ...typography.styles.bodyMedium,
        color: colors.text.primary,
    },
});
