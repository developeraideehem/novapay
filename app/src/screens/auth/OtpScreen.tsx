// NovaPay - OTP Verification Screen
import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    Alert,
    TouchableOpacity,
    Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation, useRoute } from '@react-navigation/native';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing } from '../../theme/spacing';
import { Button } from '../../components/Button';
import { verifyOtp, createUserProfile, sendOtp } from '../../services/auth';
import { useAuthStore } from '../../store/useAuthStore';

interface RouteParams {
    phoneNumber: string;
    isNewUser: boolean;
    registrationData?: {
        firstName: string;
        lastName: string;
        email?: string;
        referralCode?: string;
    };
}

export const OtpScreen: React.FC = () => {
    const navigation = useNavigation<any>();
    const route = useRoute();
    const params = route.params as RouteParams;

    const [otp, setOtp] = useState(['', '', '', '']); // Changed to 4 digits
    const [loading, setLoading] = useState(false);
    const [resendTimer, setResendTimer] = useState(60);
    const [error, setError] = useState('');

    const inputRefs = useRef<(TextInput | null)[]>([]);

    // Countdown timer for resend
    useEffect(() => {
        if (resendTimer > 0) {
            const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
            return () => clearTimeout(timer);
        }
    }, [resendTimer]);

    // Auto-verify when OTP is complete
    useEffect(() => {
        const otpValue = otp.join('');
        if (otpValue.length === 4) { // Changed to 4 digits
            handleVerify();
        }
    }, [otp]);

    const handleOtpChange = (value: string, index: number) => {
        if (value.length > 1) {
            // Handle paste
            const digits = value.replace(/\D/g, '').split('').slice(0, 4); // Changed to 4
            const newOtp = [...otp];
            digits.forEach((digit, i) => {
                if (index + i < 4) { // Changed to 4
                    newOtp[index + i] = digit;
                }
            });
            setOtp(newOtp);

            // Focus last filled or next empty
            const nextIndex = Math.min(index + digits.length, 3); // Changed to 3
            inputRefs.current[nextIndex]?.focus();
        } else {
            // Single character
            const newOtp = [...otp];
            newOtp[index] = value;
            setOtp(newOtp);

            // Auto-focus next input
            if (value && index < 3) { // Changed to 3
                inputRefs.current[index + 1]?.focus();
            }
        }
        setError('');
    };

    const handleKeyPress = (key: string, index: number) => {
        if (key === 'Backspace' && !otp[index] && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
    };

    const handleVerify = async () => {
        const otpValue = otp.join('');

        if (otpValue.length !== 4) { // Changed to 4
            setError('Please enter the complete OTP');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const result = await verifyOtp(params.phoneNumber, otpValue);

            if (!result.success) {
                setError(result.message);
                setOtp(['', '', '', '']); // Changed to 4
                inputRefs.current[0]?.focus();
                setLoading(false);
                return;
            }

            // If new user, create profile
            if (params.isNewUser && params.registrationData && result.userId) {
                const profileResult = await createUserProfile(result.userId, {
                    phoneNumber: params.phoneNumber,
                    ...params.registrationData,
                });

                if (!profileResult.success) {
                    Alert.alert('Error', profileResult.message);
                    setLoading(false);
                    return;
                }
            }

            // Navigate to PIN setup
            navigation.replace('PinSetup', {
                userId: result.userId,
                isNewUser: params.isNewUser,
            });
        } catch (err: any) {
            setError(err.message || 'Verification failed');
            setOtp(['', '', '', '']); // Changed to 4
        } finally {
            setLoading(false);
        }
    };

    const handleResend = async () => {
        if (resendTimer > 0) return;

        setResendTimer(60);
        setError('');

        const result = await sendOtp(params.phoneNumber);

        if (result.success) {
            Alert.alert('Success', 'New OTP sent to your phone');
        } else {
            Alert.alert('Error', result.message);
        }
    };

    const formatPhone = (phone: string) => {
        return phone.replace(/(\+234)(\d{3})(\d{3})(\d{4})/, '$1 $2 $3 $4');
    };

    return (
        <LinearGradient
            colors={['#6366F1', '#8B5CF6']}
            style={styles.gradientContainer}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
        >
            <SafeAreaView style={styles.container}>
                {/* Back Button */}
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => navigation.goBack()}
                >
                    <Text style={styles.backButtonText}>←</Text>
                </TouchableOpacity>

                {/* Logo Section */}
                <View style={styles.logoSection}>
                    <View style={styles.logoIconContainer}>
                        <Text style={styles.logoIcon}>📱</Text>
                    </View>
                    <Text style={styles.logoText}>Verify Code</Text>
                    <Text style={styles.logoSubtitle}>
                        Enter the 4-digit code sent to{'\n'}
                        <Text style={styles.phoneNumber}>{formatPhone(params.phoneNumber)}</Text>
                    </Text>
                </View>

                {/* White Card */}
                <View style={styles.card}>
                    {/* OTP Input */}
                    <View style={styles.otpContainer}>
                        {otp.map((digit, index) => (
                            <TextInput
                                key={index}
                                ref={(ref) => (inputRefs.current[index] = ref)}
                                style={[
                                    styles.otpInput,
                                    digit && styles.otpInputFilled,
                                    error && styles.otpInputError,
                                ]}
                                value={digit}
                                onChangeText={(value) => handleOtpChange(value, index)}
                                onKeyPress={({ nativeEvent }) => handleKeyPress(nativeEvent.key, index)}
                                keyboardType="number-pad"
                                maxLength={4}
                                selectTextOnFocus
                                autoFocus={index === 0}
                            />
                        ))}
                    </View>

                    {error && <Text style={styles.errorText}>{error}</Text>}

                    {/* Timer Display */}
                    <View style={styles.timerContainer}>
                        {resendTimer > 0 ? (
                            <>
                                <Text style={styles.timerIcon}>⏱️</Text>
                                <Text style={styles.timerText}>
                                    Code expires in <Text style={styles.timerValue}>{resendTimer}s</Text>
                                </Text>
                            </>
                        ) : (
                            <Text style={styles.expiredText}>Code expired</Text>
                        )}
                    </View>

                    {/* Verify Button */}
                    <Button
                        title="Verify Code"
                        onPress={handleVerify}
                        loading={loading}
                        disabled={otp.join('').length !== 4 || loading}
                        fullWidth
                        style={styles.button}
                    />

                    {/* Resend */}
                    <View style={styles.resendContainer}>
                        <Text style={styles.resendText}>Didn't receive the code? </Text>
                        {resendTimer > 0 ? (
                            <Text style={styles.resendDisabled}>Resend</Text>
                        ) : (
                            <TouchableOpacity onPress={handleResend}>
                                <Text style={styles.resendLink}>Resend Code</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                </View>

                {/* Change Number */}
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Text style={styles.changeNumber}>Change phone number</Text>
                </TouchableOpacity>
            </SafeAreaView>
        </LinearGradient>
    );
};

const styles = StyleSheet.create({
    gradientContainer: {
        flex: 1,
    },
    container: {
        flex: 1,
        paddingHorizontal: spacing.screenHorizontal,
    },
    backButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: spacing.lg,
    },
    backButtonText: {
        fontSize: 24,
        color: '#FFFFFF',
    },
    // Logo Section
    logoSection: {
        alignItems: 'center',
        marginTop: spacing['3xl'],
        marginBottom: spacing['2xl'],
    },
    logoIconContainer: {
        width: 88,
        height: 88,
        borderRadius: 44,
        backgroundColor: 'rgba(255, 255, 255, 0.25)',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: spacing.lg,
        ...Platform.select({
            ios: {
                shadowColor: 'rgba(255, 255, 255, 0.5)',
                shadowOffset: { width: 0, y: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 12,
            },
            android: {
                elevation: 8,
            },
        }),
    },
    logoIcon: {
        fontSize: 44,
    },
    logoText: {
        fontSize: 28,
        fontWeight: '700',
        color: '#FFFFFF',
        marginBottom: spacing.sm,
    },
    logoSubtitle: {
        ...typography.styles.bodyMedium,
        fontSize: 15,
        color: 'rgba(255, 255, 255, 0.9)',
        textAlign: 'center',
        lineHeight: 22,
    },
    phoneNumber: {
        fontWeight: '700',
        color: '#FFFFFF',
    },
    // White Card
    card: {
        backgroundColor: '#FFFFFF',
        borderRadius: 28,
        padding: spacing['2xl'],
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 8 },
                shadowOpacity: 0.15,
                shadowRadius: 24,
            },
            android: {
                elevation: 12,
            },
        }),
    },
    // OTP Input
    otpContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: spacing.md,
        marginBottom: spacing.xl,
    },
    otpInput: {
        width: 64,
        height: 72,
        borderRadius: 16,
        borderWidth: 2,
        borderColor: colors.border.medium,
        backgroundColor: colors.background.default,
        textAlign: 'center',
        fontSize: 32,
        fontWeight: '700',
        color: colors.text.primary,
    },
    otpInputFilled: {
        borderColor: colors.primary.main,
        backgroundColor: colors.primary.main + '08',
    },
    otpInputError: {
        borderColor: colors.error.main,
        backgroundColor: colors.error.main + '08',
    },
    errorText: {
        ...typography.styles.bodySmall,
        color: colors.error.main,
        textAlign: 'center',
        marginBottom: spacing.md,
    },
    // Modern Timer
    timerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.primary.main + '10',
        borderRadius: 12,
        paddingVertical: spacing.sm,
        paddingHorizontal: spacing.md,
        marginBottom: spacing.xl,
    },
    timerIcon: {
        fontSize: 20,
        marginRight: spacing.xs,
    },
    timerText: {
        ...typography.styles.bodyMedium,
        color: colors.text.secondary,
    },
    timerValue: {
        fontWeight: '700',
        color: colors.primary.main,
    },
    expiredText: {
        ...typography.styles.bodyMedium,
        color: colors.error.main,
        fontWeight: '600',
    },
    button: {
        marginBottom: spacing.lg,
    },
    resendContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
    },
    resendText: {
        ...typography.styles.bodyMedium,
        color: colors.text.secondary,
    },
    resendDisabled: {
        ...typography.styles.labelMedium,
        color: colors.text.disabled,
        fontWeight: '600',
    },
    resendLink: {
        ...typography.styles.labelMedium,
        color: colors.primary.main,
        fontWeight: '700',
    },
    changeNumber: {
        ...typography.styles.labelMedium,
        color: '#FFFFFF',
        textAlign: 'center',
        marginTop: spacing.xl,
        fontWeight: '600',
    },
});

export default OtpScreen;
