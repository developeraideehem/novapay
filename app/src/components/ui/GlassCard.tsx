import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { lightColors, darkColors } from '../../theme/colors';
import { borderRadius } from '../../theme/animations';

interface GlassCardProps {
    children: React.ReactNode;
    style?: ViewStyle;
    darkMode?: boolean;
    variant?: 'default' | 'elevated' | 'outlined';
}

/**
 * GlassCard - Glassmorphism card component for modern UI
 * Perfect for balance displays, featured cards, and premium content
 */
export const GlassCard: React.FC<GlassCardProps> = ({
    children,
    style,
    darkMode = false,
    variant = 'default',
}) => {
    const colors = darkMode ? darkColors : lightColors;

    if (variant === 'elevated') {
        return (
            <View style={[styles.container, styles.elevated, style]}>
                <LinearGradient
                    colors={colors.gradients.card}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.gradient}
                >
                    {children}
                </LinearGradient>
            </View>
        );
    }

    if (variant === 'outlined') {
        return (
            <View
                style={[
                    styles.container,
                    styles.outlined,
                    { borderColor: colors.border.default },
                    style,
                ]}
            >
                {children}
            </View>
        );
    }

    // Default glass variant
    return (
        <View style={[styles.container, styles.glass, style]}>
            <View
                style={[
                    styles.glassOverlay,
                    {
                        backgroundColor: darkMode
                            ? 'rgba(30, 41, 59, 0.7)'
                            : 'rgba(255, 255, 255, 0.8)',
                    },
                ]}
            >
                {children}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        borderRadius: borderRadius.card,
        overflow: 'hidden',
    },
    glass: {
        // Glassmorphism effect
    },
    glassOverlay: {
        padding: 20,
        borderRadius: borderRadius.card,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.2)',
        // iOS shadow for depth
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        // Android shadow
        elevation: 4,
    },
    elevated: {
        // Elevated card with gradient
        shadowColor: '#6366F1',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.15,
        shadowRadius: 16,
        elevation: 8,
    },
    gradient: {
        padding: 20,
        borderRadius: borderRadius.card,
    },
    outlined: {
        backgroundColor: 'transparent',
        borderWidth: 1.5,
        padding: 20,
    },
});

export default GlassCard;
