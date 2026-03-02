// NovaPay - App Entry Point
import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppNavigator } from './src/navigation/AppNavigator';
import { useAuthStore } from './src/store/useAuthStore';
import { isSupabaseConfigured } from './src/services/supabase';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from './src/theme/colors';
import { typography } from './src/theme/typography';

// Configuration warning screen
const ConfigWarning: React.FC = () => (
    <View style={styles.warningContainer}>
        <Text style={styles.warningEmoji}>⚠️</Text>
        <Text style={styles.warningTitle}>Supabase Not Configured</Text>
        <Text style={styles.warningText}>
            Please update your Supabase credentials in{'\n'}
            <Text style={styles.codeText}>src/services/supabase.ts</Text>
        </Text>
        <Text style={styles.warningInstructions}>
            1. Create a project at supabase.com{'\n'}
            2. Copy your Project URL and anon key{'\n'}
            3. Update SUPABASE_URL and SUPABASE_ANON_KEY{'\n'}
            4. Apply the schema.sql to your database
        </Text>
    </View>
);

export default function App() {
    const { initialize } = useAuthStore();

    // Initialize auth on app start
    useEffect(() => {
        initialize();
    }, []);

    // Check if Supabase is configured
    if (!isSupabaseConfigured()) {
        return (
            <SafeAreaProvider>
                <StatusBar style="dark" />
                <ConfigWarning />
            </SafeAreaProvider>
        );
    }

    return (
        <SafeAreaProvider>
            <StatusBar style="auto" />
            <AppNavigator />
        </SafeAreaProvider>
    );
}

const styles = StyleSheet.create({
    warningContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: colors.background.default,
        padding: 24,
    },
    warningEmoji: {
        fontSize: 64,
        marginBottom: 16,
    },
    warningTitle: {
        ...typography.styles.headlineLarge,
        color: colors.warning.main,
        marginBottom: 16,
        textAlign: 'center',
    },
    warningText: {
        ...typography.styles.bodyLarge,
        color: colors.text.primary,
        textAlign: 'center',
        marginBottom: 24,
    },
    codeText: {
        fontFamily: 'monospace',
        backgroundColor: colors.border.medium,
        paddingHorizontal: 8,
    },
    warningInstructions: {
        ...typography.styles.bodyMedium,
        color: colors.text.secondary,
        textAlign: 'left',
        lineHeight: 28,
        backgroundColor: colors.border.light,
        padding: 16,
        borderRadius: 12,
    },
});
