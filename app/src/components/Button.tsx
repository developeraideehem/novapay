// NovaPay - Button Component
import React from 'react';
import {
    TouchableOpacity,
    Text,
    StyleSheet,
    ActivityIndicator,
    ViewStyle,
    TextStyle,
} from 'react-native';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { spacing, shadows } from '../theme/spacing';

interface ButtonProps {
    title: string;
    onPress: () => void;
    variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
    size?: 'small' | 'medium' | 'large';
    disabled?: boolean;
    loading?: boolean;
    icon?: React.ReactNode;
    fullWidth?: boolean;
    style?: ViewStyle;
    textStyle?: TextStyle;
}

export const Button: React.FC<ButtonProps> = ({
    title,
    onPress,
    variant = 'primary',
    size = 'medium',
    disabled = false,
    loading = false,
    icon,
    fullWidth = false,
    style,
    textStyle,
}) => {
    const getVariantStyles = () => {
        switch (variant) {
            case 'primary':
                return {
                    container: styles.primaryContainer,
                    text: styles.primaryText,
                };
            case 'secondary':
                return {
                    container: styles.secondaryContainer,
                    text: styles.secondaryText,
                };
            case 'outline':
                return {
                    container: styles.outlineContainer,
                    text: styles.outlineText,
                };
            case 'ghost':
                return {
                    container: styles.ghostContainer,
                    text: styles.ghostText,
                };
            case 'danger':
                return {
                    container: styles.dangerContainer,
                    text: styles.dangerText,
                };
            default:
                return {
                    container: styles.primaryContainer,
                    text: styles.primaryText,
                };
        }
    };

    const getSizeStyles = () => {
        switch (size) {
            case 'small':
                return styles.smallSize;
            case 'large':
                return styles.largeSize;
            default:
                return styles.mediumSize;
        }
    };

    const variantStyles = getVariantStyles();
    const sizeStyles = getSizeStyles();

    return (
        <TouchableOpacity
            style={[
                styles.container,
                variantStyles.container,
                sizeStyles,
                fullWidth && styles.fullWidth,
                disabled && styles.disabled,
                style,
            ]}
            onPress={onPress}
            disabled={disabled || loading}
            activeOpacity={0.8}
        >
            {loading ? (
                <ActivityIndicator
                    color={variant === 'outline' || variant === 'ghost' ? colors.primary.main : colors.primary.contrast}
                    size="small"
                />
            ) : (
                <>
                    {icon}
                    <Text
                        style={[
                            styles.text,
                            variantStyles.text,
                            !!icon && styles.textWithIcon,
                            textStyle,
                        ]}
                    >
                        {title}
                    </Text>
                </>
            )}
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: spacing.borderRadius.lg,
        ...shadows.sm,
    },
    text: {
        ...typography.styles.labelLarge,
    },
    textWithIcon: {
        marginLeft: spacing.sm,
    },

    // Variants
    primaryContainer: {
        backgroundColor: colors.primary.main,
    },
    primaryText: {
        color: colors.primary.contrast,
    },
    secondaryContainer: {
        backgroundColor: colors.secondary.main,
    },
    secondaryText: {
        color: colors.secondary.contrast,
    },
    outlineContainer: {
        backgroundColor: 'transparent',
        borderWidth: 2,
        borderColor: colors.primary.main,
    },
    outlineText: {
        color: colors.primary.main,
    },
    ghostContainer: {
        backgroundColor: 'transparent',
    },
    ghostText: {
        color: colors.primary.main,
    },
    dangerContainer: {
        backgroundColor: colors.error.main,
    },
    dangerText: {
        color: colors.primary.contrast,
    },

    // Sizes
    smallSize: {
        paddingVertical: spacing.sm,
        paddingHorizontal: spacing.md,
    },
    mediumSize: {
        paddingVertical: spacing.buttonPaddingVertical,
        paddingHorizontal: spacing.buttonPaddingHorizontal,
    },
    largeSize: {
        paddingVertical: spacing.lg,
        paddingHorizontal: spacing['2xl'],
    },

    // States
    disabled: {
        opacity: 0.5,
    },
    fullWidth: {
        width: '100%',
    },
});

export default Button;
