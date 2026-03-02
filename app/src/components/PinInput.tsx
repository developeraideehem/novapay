import React, { useState, useRef } from 'react';
import {
    View,
    Text,
    TextInput,
    StyleSheet,
    Animated,
} from 'react-native';
import { lightColors } from '../theme/colors';
import { typography } from '../theme/typography';
import { borderRadius } from '../theme/animations';

interface PinInputProps {
    length?: number;
    value: string;
    onChange: (pin: string) => void;
    error?: boolean;
    darkMode?: boolean;
}

/**
 * PinInput - Animated PIN input component
 * 6-digit PIN entry with visual feedback
 */
export const PinInput: React.FC<PinInputProps> = ({
    length = 6,
    value,
    onChange,
    error = false,
    darkMode = false,
}) => {
    const colors = lightColors; // TODO: Use darkColors when darkMode is true
    const [focused, setFocused] = useState(false);
    const shakeAnimation = useRef(new Animated.Value(0)).current;

    // Auto-shake on error
    React.useEffect(() => {
        if (error) {
            Animated.sequence([
                Animated.timing(shakeAnimation, {
                    toValue: 10,
                    duration: 50,
                    useNativeDriver: true,
                }),
                Animated.timing(shakeAnimation, {
                    toValue: -10,
                    duration: 50,
                    useNativeDriver: true,
                }),
                Animated.timing(shakeAnimation, {
                    toValue: 10,
                    duration: 50,
                    useNativeDriver: true,
                }),
                Animated.timing(shakeAnimation, {
                    toValue: 0,
                    duration: 50,
                    useNativeDriver: true,
                }),
            ]).start();
        }
    }, [error, shakeAnimation]);

    const handleChange = (text: string) => {
        // Only allow numbers
        const numericValue = text.replace(/[^0-9]/g, '');
        if (numericValue.length <= length) {
            onChange(numericValue);
        }
    };

    return (
        <View style={styles.container}>
            <Animated.View
                style={[
                    styles.pinContainer,
                    { transform: [{ translateX: shakeAnimation }] },
                ]}
            >
                {Array.from({ length }).map((_, index) => {
                    const filled = index < value.length;
                    return (
                        <View
                            key={index}
                            style={[
                                styles.pinDot,
                                filled && styles.pinDotFilled,
                                error && styles.pinDotError,
                                focused && index === value.length && styles.pinDotActive,
                                {
                                    borderColor: error
                                        ? colors.error.main
                                        : filled
                                            ? colors.primary.main
                                            : colors.border.medium,
                                    backgroundColor: filled
                                        ? colors.primary.main
                                        : 'transparent',
                                },
                            ]}
                        />
                    );
                })}
            </Animated.View>

            {/* Hidden input */}
            <TextInput
                style={styles.hiddenInput}
                value={value}
                onChangeText={handleChange}
                keyboardType="number-pad"
                maxLength={length}
                secureTextEntry
                autoFocus
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        marginVertical: 24,
    },
    pinContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 12,
    },
    pinDot: {
        width: 16,
        height: 16,
        borderRadius: 8,
        borderWidth: 2,
    },
    pinDotFilled: {
        borderWidth: 0,
    },
    pinDotActive: {
        borderColor: lightColors.primary.main,
        borderWidth: 3,
    },
    pinDotError: {
        borderColor: lightColors.error.main,
    },
    hiddenInput: {
        position: 'absolute',
        width: 1,
        height: 1,
        opacity: 0,
    },
});

export default PinInput;
