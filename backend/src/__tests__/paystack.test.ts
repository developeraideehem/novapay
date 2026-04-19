// Paystack Routes Tests
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { InitializePaymentSchema, VerifyPaymentSchema, ResolveBankSchema } from '../schemas/validation';

describe('Paystack Validation Schemas', () => {
  describe('InitializePaymentSchema', () => {
    it('should validate correct payment initialization data', () => {
      const validData = {
        email: 'user@example.com',
        amount: 5000,
        reference: 'REF-12345',
      };
      const result = InitializePaymentSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject invalid email', () => {
      const invalidData = {
        email: 'not-an-email',
        amount: 5000,
        reference: 'REF-12345',
      };
      const result = InitializePaymentSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject amount below minimum', () => {
      const invalidData = {
        email: 'user@example.com',
        amount: 50,
        reference: 'REF-12345',
      };
      const result = InitializePaymentSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject amount above maximum', () => {
      const invalidData = {
        email: 'user@example.com',
        amount: 2000000,
        reference: 'REF-12345',
      };
      const result = InitializePaymentSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should accept optional callback_url', () => {
      const validData = {
        email: 'user@example.com',
        amount: 5000,
        reference: 'REF-12345',
        callback_url: 'https://example.com/callback',
      };
      const result = InitializePaymentSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });
  });

  describe('VerifyPaymentSchema', () => {
    it('should validate correct reference', () => {
      const validData = {
        reference: 'REF-12345',
      };
      const result = VerifyPaymentSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject short reference', () => {
      const invalidData = {
        reference: 'REF',
      };
      const result = VerifyPaymentSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe('ResolveBankSchema', () => {
    it('should validate correct bank resolution data', () => {
      const validData = {
        account_number: '1234567890',
        bank_code: '044',
      };
      const result = ResolveBankSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject invalid account number (not 10 digits)', () => {
      const invalidData = {
        account_number: '123456789',
        bank_code: '044',
      };
      const result = ResolveBankSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject missing bank code', () => {
      const invalidData = {
        account_number: '1234567890',
        bank_code: '',
      };
      const result = ResolveBankSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });
});

describe('Authentication', () => {
  it('should generate valid JWT token', () => {
    const { generateToken, verifyToken } = require('../middleware/auth');
    const token = generateToken('user-123', 'user@example.com', '1h');
    expect(token).toBeTruthy();

    const decoded = verifyToken(token);
    expect(decoded.id).toBe('user-123');
    expect(decoded.email).toBe('user@example.com');
  });

  it('should reject expired token', () => {
    const { generateToken, verifyToken } = require('../middleware/auth');
    // Create token that expires immediately
    const token = generateToken('user-123', 'user@example.com', '0s');

    // Wait a bit to ensure expiration
    setTimeout(() => {
      expect(() => verifyToken(token)).toThrow();
    }, 100);
  });
});

describe('Rate Limiting', () => {
  it('should track requests per IP', () => {
    const { createRateLimiter } = require('../middleware/rateLimiter');
    const limiter = createRateLimiter(1000, 3); // 3 requests per second

    const mockReq = { ip: '127.0.0.1' };
    const mockRes = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
      set: vi.fn(),
    };
    const mockNext = vi.fn();

    // First 3 requests should pass
    limiter(mockReq, mockRes, mockNext);
    expect(mockNext).toHaveBeenCalled();

    limiter(mockReq, mockRes, mockNext);
    expect(mockNext).toHaveBeenCalledTimes(2);

    limiter(mockReq, mockRes, mockNext);
    expect(mockNext).toHaveBeenCalledTimes(3);

    // 4th request should be rejected
    limiter(mockReq, mockRes, mockNext);
    expect(mockRes.status).toHaveBeenCalledWith(429);
  });
});

describe('Input Validation', () => {
  it('should validate transaction data', () => {
    const { CreateTransactionSchema } = require('../schemas/validation');
    const validData = {
      wallet_id: '550e8400-e29b-41d4-a716-446655440000',
      type: 'credit',
      category: 'deposit',
      amount: 5000,
      description: 'Wallet top-up',
    };
    const result = CreateTransactionSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it('should reject invalid transaction type', () => {
    const { CreateTransactionSchema } = require('../schemas/validation');
    const invalidData = {
      wallet_id: '550e8400-e29b-41d4-a716-446655440000',
      type: 'invalid',
      category: 'deposit',
      amount: 5000,
    };
    const result = CreateTransactionSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
  });

  it('should validate airtime purchase data', () => {
    const { CreateAirtimeDataPurchaseSchema } = require('../schemas/validation');
    const validData = {
      wallet_id: '550e8400-e29b-41d4-a716-446655440000',
      purchase_type: 'airtime',
      provider: 'MTN',
      phone_number: '08012345678',
      amount: 1000,
    };
    const result = CreateAirtimeDataPurchaseSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it('should reject invalid phone number', () => {
    const { CreateAirtimeDataPurchaseSchema } = require('../schemas/validation');
    const invalidData = {
      wallet_id: '550e8400-e29b-41d4-a716-446655440000',
      purchase_type: 'airtime',
      provider: 'MTN',
      phone_number: '123', // Too short
      amount: 1000,
    };
    const result = CreateAirtimeDataPurchaseSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
  });
});
