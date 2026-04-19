// NovaPay Backend — Paystack Proxy Routes with Validation
import { Router, Request, Response } from 'express';
import dotenv from 'dotenv';
import {
  InitializePaymentSchema,
  VerifyPaymentSchema,
  ResolveBankSchema,
  CreateRecipientSchema,
  TransferSchema,
} from '../schemas/validation';

dotenv.config();

export const paystackRouter = Router();

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY || '';
const PAYSTACK_BASE_URL = 'https://api.paystack.co';

if (!PAYSTACK_SECRET_KEY) {
  console.warn('⚠️  PAYSTACK_SECRET_KEY is not set. Paystack routes will fail.');
}

const paystackHeaders = {
  Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
  'Content-Type': 'application/json',
};

async function paystackFetch(path: string, options?: RequestInit) {
  const res = await fetch(`${PAYSTACK_BASE_URL}${path}`, {
    ...options,
    headers: {
      ...paystackHeaders,
      ...(options?.headers || {}),
    },
  });
  const data: any = await res.json();
  return { ok: res.ok, data };
}

// ─── POST /api/paystack/initialize ───────────────────────────────────────────
paystackRouter.post('/initialize', async (req: Request, res: Response) => {
  try {
    const validatedData = InitializePaymentSchema.parse(req.body);
    const { email, amount, reference, callback_url } = validatedData;

    const { ok, data } = await paystackFetch('/transaction/initialize', {
      method: 'POST',
      body: JSON.stringify({
        email,
        amount: Math.round(amount * 100),
        reference,
        callback_url: callback_url || '',
        channels: ['card', 'bank', 'ussd', 'bank_transfer'],
      }),
    });

    if (!ok || !data.status) {
      res.status(400).json({ status: 'error', message: data.message || 'Failed to initialize payment' });
      return;
    }

    res.json({
      status: 'success',
      message: 'Payment initialized',
      reference: data.data.reference,
      authorization_url: data.data.authorization_url,
      access_code: data.data.access_code,
    });
  } catch (err: any) {
    if (err.name === 'ZodError') {
      res.status(400).json({
        status: 'error',
        message: 'Validation error',
        errors: err.errors,
      });
    } else {
      console.error('Paystack initialize error:', err.message);
      res.status(500).json({ status: 'error', message: 'Failed to reach Paystack' });
    }
  }
});

// ─── POST /api/paystack/verify ────────────────────────────────────────────────
paystackRouter.post('/verify', async (req: Request, res: Response) => {
  try {
    const validatedData = VerifyPaymentSchema.parse(req.body);
    const { reference } = validatedData;

    const { ok, data } = await paystackFetch(`/transaction/verify/${encodeURIComponent(reference)}`, {
      method: 'GET',
    });

    if (!ok || !data.status || data.data?.status !== 'success') {
      res.status(400).json({ status: 'error', message: data.message || 'Payment verification failed' });
      return;
    }

    res.json({
      status: 'success',
      message: 'Payment verified',
      reference: data.data.reference,
      amount: data.data.amount / 100,
      channel: data.data.channel,
      paid_at: data.data.paid_at,
    });
  } catch (err: any) {
    if (err.name === 'ZodError') {
      res.status(400).json({
        status: 'error',
        message: 'Validation error',
        errors: err.errors,
      });
    } else {
      console.error('Paystack verify error:', err.message);
      res.status(500).json({ status: 'error', message: 'Failed to reach Paystack' });
    }
  }
});

// ─── POST /api/paystack/resolve-bank ─────────────────────────────────────────
paystackRouter.post('/resolve-bank', async (req: Request, res: Response) => {
  try {
    const validatedData = ResolveBankSchema.parse(req.body);
    const { account_number, bank_code } = validatedData;

    const { ok, data } = await paystackFetch(
      `/bank/resolve?account_number=${encodeURIComponent(account_number)}&bank_code=${encodeURIComponent(bank_code)}`,
      { method: 'GET' }
    );

    if (!ok || !data.status) {
      res.status(400).json({ status: 'error', message: data.message || 'Could not resolve account' });
      return;
    }

    res.json({
      status: 'success',
      account_name: data.data.account_name,
      account_number: data.data.account_number,
    });
  } catch (err: any) {
    if (err.name === 'ZodError') {
      res.status(400).json({
        status: 'error',
        message: 'Validation error',
        errors: err.errors,
      });
    } else {
      console.error('Paystack resolve-bank error:', err.message);
      res.status(500).json({ status: 'error', message: 'Failed to reach Paystack' });
    }
  }
});

// ─── POST /api/paystack/create-recipient ─────────────────────────────────────
paystackRouter.post('/create-recipient', async (req: Request, res: Response) => {
  try {
    const validatedData = CreateRecipientSchema.parse(req.body);
    const { name, account_number, bank_code } = validatedData;

    const { ok, data } = await paystackFetch('/transferrecipient', {
      method: 'POST',
      body: JSON.stringify({
        type: 'nuban',
        name,
        account_number,
        bank_code,
        currency: 'NGN',
      }),
    });

    if (!ok || !data.status) {
      res.status(400).json({ status: 'error', message: data.message || 'Failed to create recipient' });
      return;
    }

    res.json({
      status: 'success',
      recipient_code: data.data.recipient_code,
    });
  } catch (err: any) {
    if (err.name === 'ZodError') {
      res.status(400).json({
        status: 'error',
        message: 'Validation error',
        errors: err.errors,
      });
    } else {
      console.error('Paystack create-recipient error:', err.message);
      res.status(500).json({ status: 'error', message: 'Failed to reach Paystack' });
    }
  }
});

// ─── POST /api/paystack/transfer ─────────────────────────────────────────────
paystackRouter.post('/transfer', async (req: Request, res: Response) => {
  try {
    const validatedData = TransferSchema.parse(req.body);
    const { amount, recipient_code, reason } = validatedData;

    const reference = `WD-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;

    const { ok, data } = await paystackFetch('/transfer', {
      method: 'POST',
      body: JSON.stringify({
        source: 'balance',
        amount: Math.round(amount * 100),
        recipient: recipient_code,
        reason: reason || 'NovaPay withdrawal',
        reference,
      }),
    });

    if (!ok || !data.status) {
      res.status(400).json({ status: 'error', message: data.message || 'Transfer failed' });
      return;
    }

    res.json({
      status: 'success',
      message: 'Transfer initiated',
      reference: data.data.reference,
      transfer_code: data.data.transfer_code,
    });
  } catch (err: any) {
    if (err.name === 'ZodError') {
      res.status(400).json({
        status: 'error',
        message: 'Validation error',
        errors: err.errors,
      });
    } else {
      console.error('Paystack transfer error:', err.message);
      res.status(500).json({ status: 'error', message: 'Failed to reach Paystack' });
    }
  }
});
