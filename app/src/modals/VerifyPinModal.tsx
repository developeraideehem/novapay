import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Modal,
    TouchableOpacity,
    ActivityIndicator,
} from 'react-native';
import { lightColors } from '../theme/colors';
import { typography } from '../theme/typography';
import { borderRadius } from '../theme/animations';
import { PinInput } from '../components/PinInput';
import { verifyTransactionPin } from '../services/pin';

interface VerifyPinModalProps {
    visible: boolean;
    onClose: () => void;
    onSuccess: () => void;
    title?: string;
    subtitle?: string;
}

/**
 * VerifyPinModal - Transaction PIN verification modal
 * Shows before any financial transaction
 */
export const VerifyPinModal: React.FC<VerifyPinModalProps> = ({
    visible,
    onClose,
    onSuccess,
    title = 'Enter Transaction PIN',
    subtitle = 'Enter your 6-digit PIN to confirm this transaction',
}) => {
    const colors = lightColors;
    const [pin, setPin] = useState('');
    const [error, setError] = useState(false);
    const [loading, setLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');

    const handlePinChange = async (newPin: string) => {
        setPin(newPin);
        setError(false);
        setErrorMessage('');

        // Auto-verify when 6 digits entered
        if (newPin.length === 6) {
            setLoading(true);

            try {
                const isValid = await verifyTransactionPin(newPin);

                if (isValid) {
                    onSuccess();
                    setPin('');
                } else {
                    setError(true);
                    setErrorMessage('Incorrect PIN. Please try again.');
                    setPin('');
                }
            } catch (err: any) {
                setError(true);
                setErrorMessage(err.message || 'Verification failed');
                setPin('');
            } finally {
                setLoading(false);
            }
        }
    };

    const handleClose = () => {
        setPin('');
        setError(false);
        setErrorMessage('');
        onClose();
    };

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={handleClose}
        >
            <View style={styles.overlay}>
                <View style={styles.modal}>
                    {/* Header */}
                    <View style={styles.header}>
                        <View style={styles.lockIcon}>
                            <Text style={styles.lockEmoji}>🔒</Text>
                        </View>
                        <Text style={styles.title}>{title}</Text>
                        <Text style={styles.subtitle}>{subtitle}</Text>
                    </View>

                    {/* PIN Input */}
                    <PinInput
                        value={pin}
                        onChange={handlePinChange}
                        error={error}
                    />

                    {/* Error Message */}
                    {errorMessage && (
                        <Text style={styles.errorText}>{errorMessage}</Text>
                    )}

                    {/* Loading */}
                    {loading && (
                        <View style={styles.loadingContainer}>
                            <ActivityIndicator color={colors.primary.main} />
                            <Text style={styles.loadingText}>Verifying...</Text>
                        </View>
                    )}

                    {/* Forgot PIN */}
                    <TouchableOpacity style={styles.forgotButton}>
                        <Text style={styles.forgotText}>Forgot PIN?</Text>
                    </TouchableOpacity>

                    {/* Cancel Button */}
                    <TouchableOpacity
                        style={styles.cancelButton}
                        onPress={handleClose}
                    >
                        <Text style={styles.cancelText}>Cancel</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    modal: {
        backgroundColor: '#FFFFFF',
        borderRadius: borderRadius.xl,
        padding: 24,
        width: '100%',
        maxWidth: 400,
        alignItems: 'center',
    },
    header: {
        alignItems: 'center',
        marginBottom: 8,
    },
    lockIcon: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: lightColors.primary.light + '20',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
    },
    lockEmoji: {
        fontSize: 32,
    },
    title: {
        ...typography.styles.titleLarge,
        color: lightColors.text.primary,
        marginBottom: 8,
    },
    subtitle: {
        ...typography.styles.bodyMedium,
        color: lightColors.text.secondary,
        textAlign: 'center',
    },
    errorText: {
        ...typography.styles.bodySmall,
        color: lightColors.error.main,
        marginTop: 8,
        textAlign: 'center',
    },
    loadingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 16,
    },
    loadingText: {
        ...typography.styles.bodyMedium,
        color: lightColors.text.secondary,
        marginLeft: 8,
    },
    forgotButton: {
        marginTop: 24,
    },
    forgotText: {
        ...typography.styles.bodyMedium,
        color: lightColors.primary.main,
        fontWeight: '600',
    },
    cancelButton: {
        marginTop: 16,
        padding: 12,
    },
    cancelText: {
        ...typography.styles.bodyMedium,
        color: lightColors.text.secondary,
    },
});

export default VerifyPinModal;
