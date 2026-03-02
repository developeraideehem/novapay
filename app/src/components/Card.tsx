// NovaPay - Card Components
import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ViewStyle,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, lightColors } from '../theme/colors';
import { typography } from '../theme/typography';
import { spacing, shadows } from '../theme/spacing';
import { borderRadius } from '../theme/animations';
import { formatCurrency } from '../services/wallet';

// Base Card
interface CardProps {
    children: React.ReactNode;
    style?: ViewStyle;
    onPress?: () => void;
}

export const Card: React.FC<CardProps> = ({ children, style, onPress }) => {
    if (onPress) {
        return (
            <TouchableOpacity style={[styles.card, style]} onPress={onPress} activeOpacity={0.7}>
                {children}
            </TouchableOpacity>
        );
    }
    return <View style={[styles.card, style]}>{children}</View>;
};

// Balance Card (Dashboard)
interface BalanceCardProps {
    balance: number;
    availableBalance?: number;
    currency?: string;
    accountNumber?: string;
    userName?: string;
    tierLevel?: number;
    onPress?: () => void;
}

export const BalanceCard: React.FC<BalanceCardProps> = ({
    balance,
    availableBalance,
    currency = 'NGN',
    accountNumber,
    userName,
    tierLevel = 1,
    onPress,
}) => {
    const getTierName = (tier: number) => {
        switch (tier) {
            case 1: return 'Basic';
            case 2: return 'Standard';
            case 3: return 'Premium';
            default: return 'Basic';
        }
    };

    const getTierColor = (tier: number) => {
        return tier >= 2 ? colors.accent.main : colors.secondary.main;
    };

    return (
        <TouchableOpacity onPress={onPress} activeOpacity={0.9}>
            <LinearGradient
                colors={lightColors.gradients.primary as any}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.balanceCard}
            >
                <View style={styles.balanceHeader}>
                    <View>
                        <Text style={styles.balanceLabel}>Available Balance</Text>
                        <Text style={styles.balanceAmount}>
                            {formatCurrency(balance, currency)}
                        </Text>
                    </View>
                    <View style={[styles.tierBadge, { backgroundColor: getTierColor(tierLevel) }]}>
                        <Text style={styles.tierText}>{getTierName(tierLevel)}</Text>
                    </View>
                </View>

                {accountNumber && (
                    <View style={styles.accountInfo}>
                        <Text style={styles.accountLabel}>Account Number</Text>
                        <Text style={styles.accountNumber}>{accountNumber}</Text>
                    </View>
                )}

                {userName && (
                    <Text style={styles.userName}>{userName}</Text>
                )}
            </LinearGradient>
        </TouchableOpacity>
    );
};

// Transaction Item
interface TransactionItemProps {
    type: 'credit' | 'debit';
    category: string;
    amount: number;
    description?: string | null;
    recipientName?: string | null;
    status: string;
    date: string;
    cashback?: number;
    onPress?: () => void;
}

const getCategoryIcon = (category: string): string => {
    const icons: Record<string, string> = {
        'transfer_in': '📥',
        'transfer_out': '📤',
        'airtime': '📱',
        'data': '📶',
        'electricity': '⚡',
        'cable_tv': '📺',
        'fund_wallet': '💰',
        'withdrawal': '🏧',
        'savings': '🏦',
        'loan': '💳',
    };
    return icons[category] || '💵';
};

const formatCategory = (category: string): string => {
    return category.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
};

const formatDate = (dateStr: string): string => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    const day = date.getDate();
    const month = date.toLocaleString('default', { month: 'short' });
    return `${day} ${month}`;
};

export const TransactionItem: React.FC<TransactionItemProps> = ({
    type,
    category,
    amount,
    description,
    recipientName,
    status,
    date,
    cashback,
    onPress,
}) => {
    return (
        <TouchableOpacity style={styles.transactionItem} onPress={onPress} activeOpacity={0.7}>
            <View style={styles.transactionIcon}>
                <Text style={styles.transactionEmoji}>{getCategoryIcon(category)}</Text>
            </View>
            <View style={styles.transactionDetails}>
                <Text style={styles.transactionTitle}>
                    {description || recipientName || formatCategory(category)}
                </Text>
                <Text style={styles.transactionSubtitle}>
                    {formatCategory(category)} • {formatDate(date)}
                </Text>
            </View>
            <View style={styles.transactionAmount}>
                <Text style={[
                    styles.amountText,
                    { color: type === 'credit' ? colors.success.main : colors.text.primary }
                ]}>
                    {type === 'credit' ? '+' : '-'}{formatCurrency(amount)}
                </Text>
                {cashback && cashback > 0 && (
                    <Text style={styles.cashbackText}>+{formatCurrency(cashback)} cashback</Text>
                )}
            </View>
        </TouchableOpacity>
    );
};

// Gradient Action Card (Modern 2x2 Grid)
interface GradientActionCardProps {
    icon: string;
    label: string;
    onPress: () => void;
    gradientColors: string[];
}

export const GradientActionCard: React.FC<GradientActionCardProps> = ({
    icon,
    label,
    onPress,
    gradientColors,
}) => {
    return (
        <TouchableOpacity onPress={onPress} activeOpacity={0.8} style={styles.gradientActionCardContainer}>
            <LinearGradient
                colors={gradientColors as any}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.gradientActionCard}
            >
                <Text style={styles.gradientActionIcon}>{icon}</Text>
                <Text style={styles.gradientActionLabel}>{label}</Text>
            </LinearGradient>
        </TouchableOpacity>
    );
};

// Quick Action (Legacy - keep for compatibility)
interface QuickActionProps {
    icon: string;
    label: string;
    onPress: () => void;
    color?: string;
}

export const QuickAction: React.FC<QuickActionProps> = ({
    icon,
    label,
    onPress,
    color = colors.primary.main,
}) => {
    return (
        <TouchableOpacity style={styles.quickAction} onPress={onPress} activeOpacity={0.7}>
            <View style={[styles.quickActionIcon, { backgroundColor: color + '20' }]}>
                <Text style={styles.quickActionEmoji}>{icon}</Text>
            </View>
            <Text style={styles.quickActionLabel}>{label}</Text>
        </TouchableOpacity>
    );
};

// Service Card (for bills, savings, etc.)
interface ServiceCardProps {
    icon: string;
    title: string;
    subtitle?: string;
    onPress: () => void;
    badge?: string;
}

export const ServiceCard: React.FC<ServiceCardProps> = ({
    icon,
    title,
    subtitle,
    onPress,
    badge,
}) => {
    return (
        <TouchableOpacity style={styles.serviceCard} onPress={onPress} activeOpacity={0.7}>
            <View style={styles.serviceIcon}>
                <Text style={styles.serviceEmoji}>{icon}</Text>
            </View>
            <View style={styles.serviceContent}>
                <Text style={styles.serviceTitle}>{title}</Text>
                {subtitle && <Text style={styles.serviceSubtitle}>{subtitle}</Text>}
            </View>
            {badge && (
                <View style={styles.badge}>
                    <Text style={styles.badgeText}>{badge}</Text>
                </View>
            )}
            <Text style={styles.chevron}>›</Text>
        </TouchableOpacity>
    );
};

// Gradient Category Card (Modern Bills/Services)
interface GradientCategoryCardProps {
    icon: string;
    title: string;
    subtitle?: string;
    onPress: () => void;
    gradientColors: string[];
    disabled?: boolean;
}

export const GradientCategoryCard: React.FC<GradientCategoryCardProps> = ({
    icon,
    title,
    subtitle,
    onPress,
    gradientColors,
    disabled = false,
}) => {
    return (
        <TouchableOpacity
            onPress={onPress}
            activeOpacity={0.85}
            disabled={disabled}
            style={[styles.gradientCategoryCard, disabled && styles.gradientCategoryCardDisabled]}
        >
            <LinearGradient
                colors={gradientColors as any}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.gradientCategoryGradient}
            >
                <View style={styles.gradientCategoryIconContainer}>
                    <Text style={styles.gradientCategoryIcon}>{icon}</Text>
                </View>
                <View style={styles.gradientCategoryContent}>
                    <Text style={styles.gradientCategoryTitle}>{title}</Text>
                    {subtitle && <Text style={styles.gradientCategorySubtitle}>{subtitle}</Text>}
                </View>
                {!disabled && <Text style={styles.gradientCategoryChevron}>›</Text>}
                {disabled && (
                    <View style={styles.comingSoonBadge}>
                        <Text style={styles.comingSoonText}>Soon</Text>
                    </View>
                )}
            </LinearGradient>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    // Base Card
    card: {
        backgroundColor: lightColors.background.elevated,
        borderRadius: borderRadius.lg,
        padding: spacing.md,
        ...shadows.sm,
    },

    // Balance Card
    balanceCard: {
        borderRadius: borderRadius.xl,
        padding: spacing.lg,
        marginHorizontal: spacing.screenHorizontal,
        marginVertical: spacing.md,
    },
    balanceHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    balanceLabel: {
        ...typography.styles.bodySmall,
        color: 'rgba(255,255,255,0.8)',
    },
    balanceAmount: {
        ...typography.styles.displaySmall,
        color: '#FFFFFF',
        fontWeight: '700',
        marginTop: 4,
    },
    tierBadge: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: borderRadius.full,
    },
    tierText: {
        ...typography.styles.labelSmall,
        color: '#FFFFFF',
        fontWeight: '600',
    },
    accountInfo: {
        marginTop: spacing.lg,
    },
    accountLabel: {
        ...typography.styles.bodySmall,
        color: 'rgba(255,255,255,0.7)',
    },
    accountNumber: {
        ...typography.styles.bodyLarge,
        color: '#FFFFFF',
        fontWeight: '600',
        letterSpacing: 2,
    },
    userName: {
        ...typography.styles.bodyMedium,
        color: 'rgba(255,255,255,0.9)',
        marginTop: spacing.sm,
    },

    // Transaction Item
    transactionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: spacing.sm,
        paddingHorizontal: spacing.md,
        backgroundColor: lightColors.background.default,
        borderBottomWidth: 1,
        borderBottomColor: lightColors.border.light,
    },
    transactionIcon: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: lightColors.primary.light + '20',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: spacing.md,
    },
    transactionEmoji: {
        fontSize: 20,
    },
    transactionDetails: {
        flex: 1,
    },
    transactionTitle: {
        ...typography.styles.bodyMedium,
        color: lightColors.text.primary,
        fontWeight: '500',
    },
    transactionSubtitle: {
        ...typography.styles.bodySmall,
        color: lightColors.text.secondary,
        marginTop: 2,
    },
    transactionAmount: {
        alignItems: 'flex-end',
    },
    amountText: {
        ...typography.styles.bodyMedium,
        fontWeight: '600',
    },
    cashbackText: {
        ...typography.styles.caption,
        color: colors.success.main,
        marginTop: 2,
    },

    // Quick Action
    quickAction: {
        alignItems: 'center',
        width: 72,
    },
    quickActionIcon: {
        width: 52,
        height: 52,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: spacing.xs,
    },
    quickActionEmoji: {
        fontSize: 24,
    },
    quickActionLabel: {
        ...typography.styles.labelSmall,
        color: lightColors.text.primary,
        textAlign: 'center',
    },

    // Gradient Action Card (Modern 2x2 Grid)
    gradientActionCardContainer: {
        flex: 1,
        minWidth: '47%',
        maxWidth: '48%',
        aspectRatio: 1,
        marginBottom: spacing.md,
    },
    gradientActionCard: {
        flex: 1,
        borderRadius: 20,
        padding: spacing.lg,
        justifyContent: 'center',
        alignItems: 'center',
        gap: spacing.sm,
        ...shadows.md,
    },
    gradientActionIcon: {
        fontSize: 42,
    },
    gradientActionLabel: {
        ...typography.styles.labelLarge,
        fontSize: 15,
        color: '#FFFFFF',
        fontWeight: '700',
        textAlign: 'center',
    },

    // Service Card
    serviceCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: lightColors.background.elevated,
        borderRadius: borderRadius.lg,
        padding: spacing.md,
        marginBottom: spacing.sm,
        ...shadows.sm,
    },
    serviceIcon: {
        width: 48,
        height: 48,
        borderRadius: 12,
        backgroundColor: lightColors.primary.light + '20',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: spacing.md,
    },
    serviceEmoji: {
        fontSize: 24,
    },
    serviceContent: {
        flex: 1,
    },
    serviceTitle: {
        ...typography.styles.bodyMedium,
        color: lightColors.text.primary,
        fontWeight: '600',
    },
    serviceSubtitle: {
        ...typography.styles.bodySmall,
        color: lightColors.text.secondary,
        marginTop: 2,
    },
    badge: {
        backgroundColor: colors.success.light + '30',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: borderRadius.sm,
        marginRight: spacing.sm,
    },
    badgeText: {
        ...typography.styles.caption,
        color: colors.success.main,
        fontWeight: '600',
    },
    chevron: {
        fontSize: 24,
        color: lightColors.text.tertiary,
    },

    // Gradient Category Card
    gradientCategoryCard: {
        marginBottom: spacing.md,
        borderRadius: 20,
        overflow: 'hidden',
        ...shadows.md,
    },
    gradientCategoryCardDisabled: {
        opacity: 0.7,
    },
    gradientCategoryGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: spacing.lg,
        minHeight: 90,
    },
    gradientCategoryIconContainer: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: 'rgba(255, 255, 255, 0.3)',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: spacing.md,
    },
    gradientCategoryIcon: {
        fontSize: 32,
    },
    gradientCategoryContent: {
        flex: 1,
    },
    gradientCategoryTitle: {
        ...typography.styles.titleMedium,
        fontSize: 18,
        color: '#FFFFFF',
        fontWeight: '700',
        marginBottom: 4,
    },
    gradientCategorySubtitle: {
        ...typography.styles.bodySmall,
        color: 'rgba(255, 255, 255, 0.9)',
        fontSize: 13,
    },
    gradientCategoryChevron: {
        fontSize: 32,
        color: 'rgba(255, 255, 255, 0.8)',
        fontWeight: '300',
    },
    comingSoonBadge: {
        backgroundColor: 'rgba(255, 255, 255, 0.3)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
    },
    comingSoonText: {
        ...typography.styles.caption,
        color: '#FFFFFF',
        fontWeight: '700',
        fontSize: 11,
    },
});

export default Card;
