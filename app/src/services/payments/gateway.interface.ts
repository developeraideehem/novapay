/**
 * Payment Gateway Interface
 * 
 * Defines the contract for payment gateway implementations
 * (Paystack, Flutterwave, etc.)
 */

export interface PaymentInitializationRequest {
    amount: number;
    email: string;
    reference: string;
    currency?: string;
    channels?: ('card' | 'bank' | 'ussd' | 'qr' | 'mobile_money')[];
    metadata?: Record<string, any>;
}

export interface PaymentInitializationResponse {
    success: boolean;
    authorization_url?: string;
    access_code?: string;
    reference: string;
    message?: string;
}

export interface PaymentVerificationResponse {
    success: boolean;
    reference: string;
    amount: number;
    currency: string;
    status: 'success' | 'failed' | 'pending' | 'abandoned';
    paid_at?: string;
    channel?: string;
    fees?: number;
    customer?: {
        email: string;
        phone?: string;
    };
    metadata?: Record<string, any>;
    message?: string;
}

export interface TransferRequest {
    amount: number;
    recipient_code: string;
    reason?: string;
    reference: string;
}

export interface TransferResponse {
    success: boolean;
    transfer_code?: string;
    reference: string;
    status: 'pending' | 'success' | 'failed';
    message?: string;
}

export interface BankAccountVerification {
    success: boolean;
    account_number: string;
    account_name?: string;
    bank_code: string;
    message?: string;
}

/**
 * Payment Gateway Interface
 * All payment gateways must implement this interface
 */
export interface PaymentGateway {
    /**
     * Initialize a payment transaction
     */
    initializePayment(request: PaymentInitializationRequest): Promise<PaymentInitializationResponse>;

    /**
     * Verify a payment transaction
     */
    verifyPayment(reference: string): Promise<PaymentVerificationResponse>;

    /**
     * Initiate a transfer to a bank account
     */
    initiateTransfer(request: TransferRequest): Promise<TransferResponse>;

    /**
     * Verify bank account details
     */
    verifyBankAccount(accountNumber: string, bankCode: string): Promise<BankAccountVerification>;

    /**
     * Handle incoming webhook from payment provider
     */
    handleWebhook(payload: any, signature: string): Promise<void>;
}

/**
 * Webhook Event Types
 */
export type WebhookEvent =
    | 'charge.success'
    | 'charge.failed'
    | 'transfer.success'
    | 'transfer.failed'
    | 'transfer.reversed';

export interface WebhookPayload {
    event: WebhookEvent;
    data: {
        reference: string;
        amount: number;
        currency: string;
        status: string;
        paid_at?: string;
        customer?: {
            email: string;
            phone?: string;
        };
        metadata?: Record<string, any>;
    };
}
