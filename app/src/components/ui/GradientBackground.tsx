import React from 'react';
import { StyleSheet, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { lightColors, darkColors } from '../../theme/colors';

interface GradientBackgroundProps {
    children: React.ReactNode;
    style?: ViewStyle;
    darkMode?: boolean;
    variant?: 'primary' | 'secondary' | 'accent' | 'hero' | 'success';
}

/**
 * GradientBackground - Modern gradient background component
 * Used for headers, hero sections, and feature highlights
 */
export const GradientBackground: React.FC<GradientBackgroundProps> = ({
    children,
    style,
    darkMode = false,
    variant = 'primary',
}) => {
    const colors = darkMode ? darkColors : lightColors;

    const gradientColors = colors.gradients[variant] || colors.gradients.primary;

    return (
        <LinearGradient
            colors={gradientColors}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.container, style]}
        >
            {children}
        </LinearGradient>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
});

export default GradientBackground;
