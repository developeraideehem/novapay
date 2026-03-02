/**
 * Paystack Payment Gateway Implementation
 * 
 * Integrates with Paystack API for payments, transfers, and account verification
 * Documentation: https://paystack.com/docs/api/
 */

import {
    PaymentGateway,
    PaymentInitializationRequest,
    PaymentInitializationResponse,
    PaymentVerificationResponse,
    TransferRequest,
    TransferResponse,
    BankAccountVerification,
    WebhookPayload,
} from './gateway.interface';
import { paymentConfig, fromKobo, toKobo } from '../../config/payment';

const PAYSTACK_BASE_URL = 'https://api.paystack.co';

export class PaystackGateway implements PaymentGateway {
    private secretKey: string;

    constructor(secretKey?: string) {
        this.secretKey = secretKey || paymentConfig.paystack.secretKey;
    }

    /**
     * Make authenticated request to Paystack API
     */
    private async request<T>(
        endpoint: string,
        method: 'GET' | 'POST' = 'GET',
        body?: any
    ): Promise<T> {
        const url = `${PAYSTACK_BASE_URL}${endpoint}`;

        const response = await fetch(url, {
            method,
            headers: {
                'Authorization': `Bearer ${this.secretKey}`,
                'Content-Type': 'application/json',
            },
            body: body ? JSON.stringify(body) : undefined,
        });

        const data = await response.json();

        if (!response.ok || !data.status) {
            throw new Error(data.message || 'Payment gateway error');
        }

        return data.data as T;
    }

    /**
     * Initialize a payment transaction
     */
    async initializePayment(
        request: PaymentInitializationRequest
    ): Promise<PaymentInitializationResponse> {
        try {
            const response = await this.request<{
                authorization_url: string;
                access_code: string;
                reference: string;
            }>('/transaction/initialize', 'POST', {
                email: request.email,
                amount: toKobo(request.amount), // Convert to kobo
                reference: request.reference,
                currency: request.currency || 'NGN',
                channels: request.channels || paymentConfig.paystack.channels,
                metadata: {
                    ...request.metadata,
                    custom_fields: [
                        {
                            display_name: 'NovaPay Transaction',
                            variable_name: 'novapay_reference',
                            value: request.reference,
                        },
                    ],
                },
            });

            return {
                success: true,
                authorization_url: response.authorization_url,
                access_code: response.access_code,
                reference: response.reference,
            };
        } catch (error: any) {
            console.error('Payment initialization failed:', error);
            return {
                success: false,
                reference: request.reference,
                message: error.message || 'Failed to initialize payment',
            };
        }
    }

    /**
     * Verify a payment transaction
     */
    async verifyPayment(reference: string): Promise<PaymentVerificationResponse> {
        try {
            const response = await this.request<{
                reference: string;
                amount: number;
                currency: string;
                status: string;
                paid_at: string;
                channel: string;
                fees: number;
                customer: {
                    email: string;
                    phone: string;
                };
                metadata: any;
            }>(`/transaction/verify/${reference}`);

            return {
                success: response.status === 'success',
                reference: response.reference,
                amount: fromKobo(response.amount), // Convert from kobo
                currency: response.currency,
                status: response.status === 'success' ? 'success' : 'failed',
                paid_at: response.paid_at,
                channel: response.channel,
                fees: fromKobo(response.fees || 0),
                customer: {
                    email: response.customer.email,
                    phone: response.customer.phone,
                },
                metadata: response.metadata,
            };
        } catch (error: any) {
            console.error('Payment verification failed:', error);
            return {
                success: false,
                reference,
                amount: 0,
                currency: 'NGN',
                status: 'failed',
                message: error.message || 'Failed to verify payment',
            };
        }
    }

    /**
     * Initiate a transfer to a bank account
     */
    async initiateTransfer(request: TransferRequest): Promise<TransferResponse> {
        try {
            const response = await this.request<{
                transfer_code: string;
                reference: string;
                status: string;
            }>('/transfer', 'POST', {
                source: 'balance',
                amount: toKobo(request.amount),
                recipient: request.recipient_code,
                reason: request.reason || 'NovaPay withdrawal',
                reference: request.reference,
            });

            return {
                success: true,
                transfer_code: response.transfer_code,
                reference: response.reference,
                status: response.status as 'pending' | 'success' | 'failed',
            };
        } catch (error: any) {
            console.error('Transfer initiation failed:', error);
            return {
                success: false,
                reference: request.reference,
                status: 'failed',
                message: error.message || 'Failed to initiate transfer',
            };
        }
    }

    /**
     * Verify bank account details
     */
    async verifyBankAccount(
        accountNumber: string,
        bankCode: string
    ): Promise<BankAccountVerification> {
        try {
            const response = await this.request<{
                account_number: string;
                account_name: string;
                bank_id: number;
            }>(`/bank/resolve?account_number=${accountNumber}&bank_code=${bankCode}`);

            return {
                success: true,
                account_number: response.account_number,
                account_name: response.account_name,
                bank_code: bankCode,
            };
        } catch (error: any) {
            console.error('Account verification failed:', error);
            return {
                success: false,
                account_number: accountNumber,
                bank_code: bankCode,
                message: error.message || 'Failed to verify account',
            };
        }
    }

    /**
     * Handle incoming webhook from Paystack
     */
    async handleWebhook(payload: any, signature: string): Promise<void> {
        // Verify webhook signature
        const crypto = require('crypto');
        const hash = crypto
            .createHmac('sha512', this.secretKey)
            .update(JSON.stringify(payload))
            .digest('hex');

        if (hash !== signature) {
            throw new Error('Invalid webhook signature');
        }

        const webhookPayload = payload as WebhookPayload;

        // Process webhook event
        switch (webhookPayload.event) {
            case 'charge.success':
                await this.handleChargeSuccess(webhookPayload);
                break;

            case 'charge.failed':
                await this.handleChargeFailed(webhookPayload);
                break;

            case 'transfer.success':
                await this.handleTransferSuccess(webhookPayload);
                break;

            case 'transfer.failed':
                await this.handleTransferFailed(webhookPayload);
                break;

            case 'transfer.reversed':
                await this.handleTransferReversed(webhookPayload);
                break;

            default:
                console.log('Unhandled webhook event:', webhookPayload.event);
        }
    }

    /**
     * Handle successful charge webhook
     */
    private async handleChargeSuccess(payload: WebhookPayload): Promise<void> {
        console.log('✅ Payment successful:', payload.data.reference);
        // TODO: Credit user wallet in database
        // TODO: Send SMS notification
        // TODO: Update transaction status
    }

    /**
     * Handle failed charge webhook
     */
    private async handleChargeFailed(payload: WebhookPayload): Promise<void> {
        console.log('❌ Payment failed:', payload.data.reference);
        // TODO: Update transaction status
        // TODO: Notify user of failure
    }

    /**
     * Handle successful transfer webhook
     */
    private async handleTransferSuccess(payload: WebhookPayload): Promise<void> {
        console.log('✅ Transfer successful:', payload.data.reference);
        // TODO: Update transaction status
        // TODO: Send SMS confirmation
    }

    /**
     * Handle failed transfer webhook
     */
    private async handleTransferFailed(payload: WebhookPayload): Promise<void> {
        console.log('❌ Transfer failed:', payload.data.reference);
        // TODO: Refund user wallet
        // TODO: Update transaction status
        // TODO: Notify user
    }

    /**
     * Handle reversed transfer webhook
     */
    private async handleTransferReversed(payload: WebhookPayload): Promise<void> {
        console.log('🔄 Transfer reversed:', payload.data.reference);
        // TODO: Credit back to user wallet
        // TODO: Update transaction status
        // TODO: Notify user
    }
}

// Export singleton instance
export const paystackGateway = new PaystackGateway();
