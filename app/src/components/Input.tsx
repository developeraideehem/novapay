// NovaPay - Input Component
import React, { useState } from 'react';
import {
    View,
    TextInput,
    Text,
    StyleSheet,
    TouchableOpacity,
    ViewStyle,
} from 'react-native';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { spacing, shadows } from '../theme/spacing';

interface InputProps {
    value: string;
    onChangeText: (text: string) => void;
    placeholder?: string;
    label?: string;
    error?: string;
    helper?: string;
    secureTextEntry?: boolean;
    keyboardType?: 'default' | 'numeric' | 'phone-pad' | 'email-address';
    autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
    maxLength?: number;
    editable?: boolean;
    leftIcon?: React.ReactNode;
    rightIcon?: React.ReactNode;
    onRightIconPress?: () => void;
    style?: ViewStyle;
    multiline?: boolean;
    numberOfLines?: number;
}

export const Input: React.FC<InputProps> = ({
    value,
    onChangeText,
    placeholder,
    label,
    error,
    helper,
    secureTextEntry = false,
    keyboardType = 'default',
    autoCapitalize = 'sentences',
    maxLength,
    editable = true,
    leftIcon,
    rightIcon,
    onRightIconPress,
    style,
    multiline = false,
    numberOfLines = 1,
}) => {
    const [isFocused, setIsFocused] = useState(false);
    const [isSecure, setIsSecure] = useState(secureTextEntry);

    const getBorderColor = () => {
        if (error) return colors.error.main;
        if (isFocused) return colors.primary.main;
        return colors.border.medium;
    };

    return (
        <View style={[styles.container, style]}>
            {label && <Text style={styles.label}>{label}</Text>}

            <View
                style={[
                    styles.inputContainer,
                    { borderColor: getBorderColor() },
                    isFocused && styles.inputFocused,
                    error && styles.inputError,
                    !editable && styles.inputDisabled,
                ]}
            >
                {leftIcon && <View style={styles.leftIcon}>{leftIcon}</View>}

                <TextInput
                    value={value}
                    onChangeText={onChangeText}
                    placeholder={placeholder}
                    placeholderTextColor={colors.text.tertiary}
                    secureTextEntry={isSecure}
                    keyboardType={keyboardType}
                    autoCapitalize={autoCapitalize}
                    maxLength={maxLength}
                    editable={editable}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                    style={[
                        styles.input,
                        !!leftIcon && styles.inputWithLeftIcon,
                        (!!rightIcon || secureTextEntry) && styles.inputWithRightIcon,
                        multiline && styles.multilineInput,
                    ]}
                    multiline={multiline}
                    numberOfLines={numberOfLines}
                />

                {secureTextEntry && (
                    <TouchableOpacity
                        style={styles.rightIcon}
                        onPress={() => setIsSecure(!isSecure)}
                    >
                        <Text style={styles.toggleText}>{isSecure ? '👁️' : '🙈'}</Text>
                    </TouchableOpacity>
                )}

                {rightIcon && !secureTextEntry && (
                    <TouchableOpacity
                        style={styles.rightIcon}
                        onPress={onRightIconPress}
                        disabled={!onRightIconPress}
                    >
                        {rightIcon}
                    </TouchableOpacity>
                )}
            </View>

            {(error || helper) && (
                <Text style={[styles.helper, error && styles.errorText]}>
                    {error || helper}
                </Text>
            )}
        </View>
    );
};

// Phone Input with Nigerian format
interface PhoneInputProps extends Omit<InputProps, 'keyboardType' | 'maxLength'> {
    countryCode?: string;
}

export const PhoneInput: React.FC<PhoneInputProps> = ({
    value,
    onChangeText,
    countryCode = '+234',
    ...props
}) => {
    return (
        <Input
            {...props}
            value={value}
            onChangeText={onChangeText}
            keyboardType="phone-pad"
            maxLength={11}
            leftIcon={
                <View style={styles.countryCode}>
                    <Text style={styles.countryCodeText}>🇳🇬 {countryCode}</Text>
                </View>
            }
            placeholder="801 234 5678"
        />
    );
};

// Amount Input with currency symbol
interface AmountInputProps extends Omit<InputProps, 'keyboardType'> {
    currency?: string;
}

export const AmountInput: React.FC<AmountInputProps> = ({
    value,
    onChangeText,
    currency = '₦',
    ...props
}) => {
    const handleChange = (text: string) => {
        // Only allow numbers and decimal point
        const cleaned = text.replace(/[^0-9.]/g, '');
        onChangeText(cleaned);
    };

    return (
        <Input
            {...props}
            value={value}
            onChangeText={handleChange}
            keyboardType="numeric"
            leftIcon={
                <Text style={styles.currencySymbol}>{currency}</Text>
            }
            placeholder="0.00"
        />
    );
};

// PIN Input
interface PinInputProps {
    value: string;
    onChangeText: (text: string) => void;
    length?: number;
    error?: string;
}

export const PinInput: React.FC<PinInputProps> = ({
    value,
    onChangeText,
    length = 4,
    error,
}) => {
    const handleChange = (text: string) => {
        const cleaned = text.replace(/\D/g, '').slice(0, length);
        onChangeText(cleaned);
    };

    return (
        <View style={styles.pinContainer}>
            <View style={styles.pinBoxes}>
                {Array(length)
                    .fill(0)
                    .map((_, index) => (
                        <View
                            key={index}
                            style={[
                                styles.pinBox,
                                value.length > index && styles.pinBoxFilled,
                                error && styles.pinBoxError,
                            ]}
                        >
                            <Text style={styles.pinDot}>
                                {value[index] ? '●' : ''}
                            </Text>
                        </View>
                    ))}
            </View>

            <TextInput
                value={value}
                onChangeText={handleChange}
                keyboardType="numeric"
                maxLength={length}
                secureTextEntry
                style={styles.hiddenInput}
                autoFocus
            />

            {error && <Text style={styles.errorText}>{error}</Text>}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginBottom: spacing.md,
    },
    label: {
        ...typography.styles.labelMedium,
        color: colors.text.primary,
        marginBottom: spacing.xs,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.background.default,
        borderWidth: 1.5,
        borderRadius: spacing.borderRadius.lg,
        overflow: 'hidden',
    },
    inputFocused: {
        ...shadows.sm,
        borderWidth: 2,
    },
    inputError: {
        borderColor: colors.error.main,
    },
    inputDisabled: {
        backgroundColor: colors.surface.secondary,
    },
    input: {
        flex: 1,
        padding: spacing.inputPadding,
        ...typography.styles.bodyLarge,
        color: colors.text.primary,
    },
    inputWithLeftIcon: {
        paddingLeft: 0,
    },
    inputWithRightIcon: {
        paddingRight: 0,
    },
    multilineInput: {
        minHeight: 100,
        textAlignVertical: 'top',
    },
    leftIcon: {
        paddingLeft: spacing.inputPadding,
        paddingRight: spacing.sm,
    },
    rightIcon: {
        paddingRight: spacing.inputPadding,
        paddingLeft: spacing.sm,
    },
    toggleText: {
        fontSize: 18,
    },
    helper: {
        ...typography.styles.caption,
        color: colors.text.secondary,
        marginTop: spacing.xs,
    },
    errorText: {
        color: colors.error.main,
    },

    // Phone input
    countryCode: {
        paddingHorizontal: spacing.sm,
        borderRightWidth: 1,
        borderRightColor: colors.border.light,
    },
    countryCodeText: {
        ...typography.styles.bodyMedium,
        color: colors.text.primary,
    },

    // Amount input
    currencySymbol: {
        ...typography.styles.headlineMedium,
        color: colors.text.primary,
        paddingHorizontal: spacing.sm,
    },

    // PIN input
    pinContainer: {
        alignItems: 'center',
    },
    pinBoxes: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: spacing.md,
    },
    pinBox: {
        width: 50,
        height: 50,
        borderRadius: spacing.borderRadius.md,
        borderWidth: 2,
        borderColor: colors.border.medium,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.background.default,
    },
    pinBoxFilled: {
        borderColor: colors.primary.main,
        backgroundColor: colors.primary.main + '10',
    },
    pinBoxError: {
        borderColor: colors.error.main,
    },
    pinDot: {
        ...typography.styles.headlineLarge,
        color: colors.primary.main,
    },
    hiddenInput: {
        position: 'absolute',
        opacity: 0,
        height: 0,
        width: 0,
    },
});

export default Input;
