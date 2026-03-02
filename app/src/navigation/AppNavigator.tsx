// NovaPay - Navigation Configuration
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text, View, StyleSheet } from 'react-native';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { useAuthStore } from '../store/useAuthStore';

// Auth Screens
import { LoginScreen, RegisterScreen } from '../screens/auth/LoginScreen';
import OtpScreen from '../screens/auth/OtpScreen';
import PinSetupScreen from '../screens/auth/PinSetupScreen';

// Main Screens
import DashboardScreen from '../screens/dashboard/DashboardScreen';
import TransferScreen from '../screens/transfer/TransferScreen';
import AirtimeScreen from '../screens/bills/AirtimeScreen';
import DataScreen from '../screens/bills/DataScreen';
import BillsScreen from '../screens/bills/BillsScreen';
import SavingsScreen from '../screens/savings/SavingsScreen';
import LoansScreen from '../screens/loans/LoansScreen';

// Placeholder screens for remaining features
const PlaceholderScreen: React.FC<{ title: string; icon: string }> = ({ title, icon }) => (
    <View style={styles.placeholder}>
        <Text style={styles.placeholderEmoji}>{icon}</Text>
        <Text style={styles.placeholderTitle}>{title}</Text>
        <Text style={styles.placeholderText}>Coming Soon</Text>
    </View>
);

const WalletScreen = () => <PlaceholderScreen title="Wallet" icon="💳" />;
const TransactionHistoryScreen = () => <PlaceholderScreen title="Transaction History" icon="📋" />;
const TransactionDetailScreen = () => <PlaceholderScreen title="Transaction Detail" icon="📄" />;
const ProfileScreen = () => <PlaceholderScreen title="Profile" icon="👤" />;
const SettingsScreen = () => <PlaceholderScreen title="Settings" icon="⚙️" />;

// Stack Navigator Types
export type AuthStackParamList = {
    Login: undefined;
    Register: undefined;
    OTP: {
        phoneNumber: string;
        isNewUser: boolean;
        registrationData?: {
            firstName: string;
            lastName: string;
            email?: string;
            referralCode?: string;
        };
    };
    PinSetup: {
        userId: string;
        isNewUser: boolean;
    };
};

export type MainStackParamList = {
    Main: undefined;
    Transfer: undefined;
    Airtime: undefined;
    Data: undefined;
    Bills: undefined;
    Savings: undefined;
    Loans: undefined;
    Wallet: undefined;
    TransactionHistory: undefined;
    TransactionDetail: { id: string };
    Settings: undefined;
};

export type TabParamList = {
    Dashboard: undefined;
    Wallet: undefined;
    Profile: undefined;
};

// Create navigators
const AuthStack = createNativeStackNavigator<AuthStackParamList>();
const MainStack = createNativeStackNavigator<MainStackParamList>();
const Tab = createBottomTabNavigator<TabParamList>();

// Tab Navigator
const TabNavigator: React.FC = () => {
    return (
        <Tab.Navigator
            screenOptions={{
                headerShown: false,
                tabBarStyle: styles.tabBar,
                tabBarActiveTintColor: colors.primary.main,
                tabBarInactiveTintColor: colors.text.tertiary,
                tabBarLabelStyle: styles.tabLabel,
            }}
        >
            <Tab.Screen
                name="Dashboard"
                component={DashboardScreen}
                options={{
                    tabBarIcon: ({ color }) => (
                        <Text style={[styles.tabIcon, { color }]}>🏠</Text>
                    ),
                    tabBarLabel: 'Home',
                }}
            />
            <Tab.Screen
                name="Wallet"
                component={WalletScreen}
                options={{
                    tabBarIcon: ({ color }) => (
                        <Text style={[styles.tabIcon, { color }]}>💳</Text>
                    ),
                    tabBarLabel: 'Wallet',
                }}
            />
            <Tab.Screen
                name="Profile"
                component={ProfileScreen}
                options={{
                    tabBarIcon: ({ color }) => (
                        <Text style={[styles.tabIcon, { color }]}>👤</Text>
                    ),
                    tabBarLabel: 'Profile',
                }}
            />
        </Tab.Navigator>
    );
};

// Auth Navigator
const AuthNavigator: React.FC = () => {
    return (
        <AuthStack.Navigator
            screenOptions={{
                headerShown: false,
                animation: 'slide_from_right',
            }}
        >
            <AuthStack.Screen name="Login" component={LoginScreen} />
            <AuthStack.Screen name="Register" component={RegisterScreen} />
            <AuthStack.Screen name="OTP" component={OtpScreen} />
            <AuthStack.Screen name="PinSetup" component={PinSetupScreen} />
        </AuthStack.Navigator>
    );
};

// Main App Navigator
const MainNavigator: React.FC = () => {
    return (
        <MainStack.Navigator
            screenOptions={{
                headerShown: false,
                animation: 'slide_from_right',
            }}
        >
            <MainStack.Screen name="Main" component={TabNavigator} />
            <MainStack.Screen name="Transfer" component={TransferScreen} />
            <MainStack.Screen name="Airtime" component={AirtimeScreen} />
            <MainStack.Screen name="Data" component={DataScreen} />
            <MainStack.Screen name="Bills" component={BillsScreen} />
            <MainStack.Screen name="Savings" component={SavingsScreen} />
            <MainStack.Screen name="Loans" component={LoansScreen} />
            <MainStack.Screen name="Wallet" component={WalletScreen} />
            <MainStack.Screen name="TransactionHistory" component={TransactionHistoryScreen} />
            <MainStack.Screen name="TransactionDetail" component={TransactionDetailScreen} />
            <MainStack.Screen name="Settings" component={SettingsScreen} />
        </MainStack.Navigator>
    );
};

// Root Navigator
export const AppNavigator: React.FC = () => {
    const { isLoading, isAuthenticated, hasPin } = useAuthStore();

    // Show loading screen
    if (isLoading) {
        return (
            <View style={styles.loadingContainer}>
                <Text style={styles.loadingEmoji}>🚀</Text>
                <Text style={styles.loadingText}>NovaPay</Text>
                <Text style={styles.loadingSubtext}>Your money, your way</Text>
            </View>
        );
    }

    return (
        <NavigationContainer>
            {isAuthenticated && hasPin ? <MainNavigator /> : <AuthNavigator />}
        </NavigationContainer>
    );
};

const styles = StyleSheet.create({
    tabBar: {
        backgroundColor: colors.background.elevated,
        borderTopWidth: 1,
        borderTopColor: colors.border.light,
        paddingTop: 8,
        paddingBottom: 8,
        height: 70,
    },
    tabIcon: {
        fontSize: 24,
    },
    tabLabel: {
        ...typography.styles.caption,
        marginTop: 2,
    },
    placeholder: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: colors.background.default,
    },
    placeholderEmoji: {
        fontSize: 64,
        marginBottom: 16,
    },
    placeholderTitle: {
        ...typography.styles.headlineMedium,
        color: colors.text.primary,
        marginBottom: 8,
    },
    placeholderText: {
        ...typography.styles.bodyMedium,
        color: colors.text.secondary,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: colors.primary.main,
    },
    loadingEmoji: {
        fontSize: 80,
        marginBottom: 16,
    },
    loadingText: {
        ...typography.styles.displayMedium,
        color: colors.primary.contrast,
    },
    loadingSubtext: {
        ...typography.styles.bodyMedium,
        color: colors.primary.contrast,
        opacity: 0.8,
        marginTop: 8,
    },
});

export default AppNavigator;
