// Input Validation Schemas using Zod
import { z } from 'zod';

// ============================================================================
// PAYMENT SCHEMAS
// ============================================================================

export const InitializePaymentSchema = z.object({
  email: z.string().email('Invalid email address'),
  amount: z.number().min(100, 'Minimum amount is ₦100').max(1000000, 'Maximum amount is ₦1,000,000'),
  reference: z.string().min(5, 'Reference must be at least 5 characters'),
  callback_url: z.string().url('Invalid callback URL').optional(),
});

export type InitializePaymentRequest = z.infer<typeof InitializePaymentSchema>;

export const VerifyPaymentSchema = z.object({
  reference: z.string().min(5, 'Invalid reference'),
});

export type VerifyPaymentRequest = z.infer<typeof VerifyPaymentSchema>;

export const ResolveBankSchema = z.object({
  account_number: z.string().regex(/^\d{10}$/, 'Account number must be 10 digits'),
  bank_code: z.string().min(1, 'Bank code is required'),
});

export type ResolveBankRequest = z.infer<typeof ResolveBankSchema>;

export const CreateRecipientSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(255, 'Name too long'),
  account_number: z.string().regex(/^\d{10}$/, 'Account number must be 10 digits'),
  bank_code: z.string().min(1, 'Bank code is required'),
});

export type CreateRecipientRequest = z.infer<typeof CreateRecipientSchema>;

export const TransferSchema = z.object({
  amount: z.number().min(100, 'Minimum transfer amount is ₦100').max(5000000, 'Maximum transfer amount is ₦5,000,000'),
  recipient_code: z.string().min(1, 'Recipient code is required'),
  reason: z.string().max(500, 'Reason too long').optional(),
});

export type TransferRequest = z.infer<typeof TransferSchema>;

// ============================================================================
// TRANSACTION SCHEMAS
// ============================================================================

export const CreateTransactionSchema = z.object({
  wallet_id: z.string().uuid('Invalid wallet ID'),
  type: z.enum(['credit', 'debit'], {
    errorMap: () => ({ message: 'Type must be either credit or debit' }),
  }),
  category: z.enum(['deposit', 'withdrawal', 'transfer', 'payment', 'airtime', 'data', 'bills'], {
    errorMap: () => ({ message: 'Invalid transaction category' }),
  }),
  amount: z.number().positive('Amount must be greater than 0'),
  description: z.string().max(500, 'Description too long').optional(),
  reference: z.string().min(5, 'Invalid reference').optional(),
  fee: z.number().nonnegative('Fee cannot be negative').optional(),
});

export type CreateTransactionRequest = z.infer<typeof CreateTransactionSchema>;

// ============================================================================
// TRANSFER RECIPIENT SCHEMAS
// ============================================================================

export const CreateTransferRecipientSchema = z.object({
  wallet_id: z.string().uuid('Invalid wallet ID'),
  recipient_name: z.string().min(2, 'Name must be at least 2 characters').max(255, 'Name too long'),
  bank_code: z.string().min(1, 'Bank code is required'),
  account_number: z.string().regex(/^\d{10}$/, 'Account number must be 10 digits'),
  account_name: z.string().max(255, 'Account name too long').optional(),
  is_default: z.boolean().optional(),
});

export type CreateTransferRecipientRequest = z.infer<typeof CreateTransferRecipientSchema>;

// ============================================================================
// BILLS PAYMENT SCHEMAS
// ============================================================================

export const CreateBillPaymentSchema = z.object({
  wallet_id: z.string().uuid('Invalid wallet ID'),
  bill_type: z.enum(['electricity', 'cable_tv', 'internet', 'water'], {
    errorMap: () => ({ message: 'Invalid bill type' }),
  }),
  provider: z.string().min(1, 'Provider is required'),
  customer_reference: z.string().min(1, 'Customer reference is required'),
  amount: z.number().positive('Amount must be greater than 0'),
});

export type CreateBillPaymentRequest = z.infer<typeof CreateBillPaymentSchema>;

// ============================================================================
// AIRTIME & DATA SCHEMAS
// ============================================================================

export const CreateAirtimeDataPurchaseSchema = z.object({
  wallet_id: z.string().uuid('Invalid wallet ID'),
  purchase_type: z.enum(['airtime', 'data'], {
    errorMap: () => ({ message: 'Purchase type must be airtime or data' }),
  }),
  provider: z.enum(['MTN', 'Airtel', 'Glo', '9mobile'], {
    errorMap: () => ({ message: 'Invalid provider' }),
  }),
  phone_number: z.string().regex(/^\d{10,11}$/, 'Invalid phone number'),
  amount: z.number().positive('Amount must be greater than 0'),
  data_plan: z.string().optional(), // For data purchases
});

export type CreateAirtimeDataPurchaseRequest = z.infer<typeof CreateAirtimeDataPurchaseSchema>;

// ============================================================================
// SAVINGS SCHEMAS
// ============================================================================

export const CreateSavingsAccountSchema = z.object({
  wallet_id: z.string().uuid('Invalid wallet ID'),
  savings_name: z.string().min(2, 'Name must be at least 2 characters').max(255, 'Name too long'),
  target_amount: z.number().positive('Target amount must be greater than 0').optional(),
  interest_rate: z.number().min(0, 'Interest rate cannot be negative').max(100, 'Interest rate too high').optional(),
  frequency: z.enum(['daily', 'weekly', 'monthly', 'custom']).optional(),
  auto_save_amount: z.number().positive('Auto-save amount must be greater than 0').optional(),
});

export type CreateSavingsAccountRequest = z.infer<typeof CreateSavingsAccountSchema>;

// ============================================================================
// LOAN SCHEMAS
// ============================================================================

export const CreateLoanSchema = z.object({
  wallet_id: z.string().uuid('Invalid wallet ID'),
  loan_amount: z.number().positive('Loan amount must be greater than 0'),
  interest_rate: z.number().min(0, 'Interest rate cannot be negative').max(100, 'Interest rate too high'),
  loan_term_months: z.number().int('Loan term must be in whole months').min(1, 'Loan term must be at least 1 month'),
});

export type CreateLoanRequest = z.infer<typeof CreateLoanSchema>;

// ============================================================================
// UTILITY FUNCTION
// ============================================================================

/**
 * Validate request body against a schema
 * Returns parsed data or throws validation error
 */
export const validateRequest = async <T>(schema: z.ZodSchema, data: unknown): Promise<T> => {
  try {
    return schema.parse(data) as T;
  } catch (err) {
    if (err instanceof z.ZodError) {
      const formattedErrors = err.errors.map((e) => ({
        field: e.path.join('.'),
        message: e.message,
      }));
      throw new Error(JSON.stringify(formattedErrors));
    }
    throw err;
  }
};
