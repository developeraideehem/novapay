// Bills Payment Routes
import { Router, Response } from 'express';
import { AuthRequest, authMiddleware } from '../middleware/auth';
import { CreateBillPaymentSchema, CreateAirtimeDataPurchaseSchema } from '../schemas/validation';
import { createClient } from '@supabase/supabase-js';

const router = Router();

const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_KEY || ''
);

// ─── POST /api/bills/electricity ────────────────────────────────────────────
// Pay electricity bill
router.post('/electricity', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const validatedData = CreateBillPaymentSchema.parse({
      ...req.body,
      bill_type: 'electricity',
    });

    // Get wallet
    const { data: wallet } = await supabase
      .from('wallets')
      .select('*')
      .eq('user_id', req.user.id)
      .single();

    if (!wallet) {
      res.status(404).json({ error: 'Wallet not found' });
      return;
    }

    const amountInKobo = Math.round(validatedData.amount * 100);

    // Check balance
    if (wallet.available_balance < amountInKobo) {
      res.status(400).json({ error: 'Insufficient balance' });
      return;
    }

    // Deduct from wallet
    await supabase
      .from('wallets')
      .update({
        balance: wallet.balance - amountInKobo,
        available_balance: wallet.available_balance - amountInKobo,
      })
      .eq('id', wallet.id);

    // Record bill payment
    const { data: billPayment, error } = await supabase
      .from('bills_payments')
      .insert([
        {
          wallet_id: wallet.id,
          bill_type: 'electricity',
          provider: validatedData.provider,
          customer_reference: validatedData.customer_reference,
          amount: amountInKobo,
          status: 'completed',
        },
      ])
      .select()
      .single();

    if (error) {
      res.status(500).json({ error: error.message });
      return;
    }

    // Record transaction
    await supabase.from('transactions').insert([
      {
        wallet_id: wallet.id,
        type: 'debit',
        category: 'bills',
        amount: amountInKobo,
        description: `Electricity payment to ${validatedData.provider}`,
        status: 'completed',
      },
    ]);

    res.json({
      status: 'success',
      message: 'Electricity bill paid successfully',
      data: billPayment,
    });
  } catch (err: any) {
    if (err.name === 'ZodError') {
      res.status(400).json({ error: 'Validation error', details: err.errors });
    } else {
      console.error('Electricity payment error:', err.message);
      res.status(500).json({ error: 'Failed to process payment' });
    }
  }
});

// ─── POST /api/bills/cable-tv ───────────────────────────────────────────────
// Pay cable TV bill
router.post('/cable-tv', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const validatedData = CreateBillPaymentSchema.parse({
      ...req.body,
      bill_type: 'cable_tv',
    });

    const { data: wallet } = await supabase
      .from('wallets')
      .select('*')
      .eq('user_id', req.user.id)
      .single();

    if (!wallet) {
      res.status(404).json({ error: 'Wallet not found' });
      return;
    }

    const amountInKobo = Math.round(validatedData.amount * 100);

    if (wallet.available_balance < amountInKobo) {
      res.status(400).json({ error: 'Insufficient balance' });
      return;
    }

    await supabase
      .from('wallets')
      .update({
        balance: wallet.balance - amountInKobo,
        available_balance: wallet.available_balance - amountInKobo,
      })
      .eq('id', wallet.id);

    const { data: billPayment, error } = await supabase
      .from('bills_payments')
      .insert([
        {
          wallet_id: wallet.id,
          bill_type: 'cable_tv',
          provider: validatedData.provider,
          customer_reference: validatedData.customer_reference,
          amount: amountInKobo,
          status: 'completed',
        },
      ])
      .select()
      .single();

    if (error) {
      res.status(500).json({ error: error.message });
      return;
    }

    await supabase.from('transactions').insert([
      {
        wallet_id: wallet.id,
        type: 'debit',
        category: 'bills',
        amount: amountInKobo,
        description: `Cable TV payment to ${validatedData.provider}`,
        status: 'completed',
      },
    ]);

    res.json({
      status: 'success',
      message: 'Cable TV bill paid successfully',
      data: billPayment,
    });
  } catch (err: any) {
    if (err.name === 'ZodError') {
      res.status(400).json({ error: 'Validation error', details: err.errors });
    } else {
      console.error('Cable TV payment error:', err.message);
      res.status(500).json({ error: 'Failed to process payment' });
    }
  }
});

// ─── POST /api/bills/airtime ───────────────────────────────────────────────
// Buy airtime
router.post('/airtime', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const validatedData = CreateAirtimeDataPurchaseSchema.parse({
      ...req.body,
      purchase_type: 'airtime',
    });

    const { data: wallet } = await supabase
      .from('wallets')
      .select('*')
      .eq('user_id', req.user.id)
      .single();

    if (!wallet) {
      res.status(404).json({ error: 'Wallet not found' });
      return;
    }

    const amountInKobo = Math.round(validatedData.amount * 100);

    if (wallet.available_balance < amountInKobo) {
      res.status(400).json({ error: 'Insufficient balance' });
      return;
    }

    await supabase
      .from('wallets')
      .update({
        balance: wallet.balance - amountInKobo,
        available_balance: wallet.available_balance - amountInKobo,
      })
      .eq('id', wallet.id);

    const { data: airtimePurchase, error } = await supabase
      .from('airtime_data_purchases')
      .insert([
        {
          wallet_id: wallet.id,
          purchase_type: 'airtime',
          provider: validatedData.provider,
          phone_number: validatedData.phone_number,
          amount: amountInKobo,
          status: 'completed',
        },
      ])
      .select()
      .single();

    if (error) {
      res.status(500).json({ error: error.message });
      return;
    }

    await supabase.from('transactions').insert([
      {
        wallet_id: wallet.id,
        type: 'debit',
        category: 'airtime',
        amount: amountInKobo,
        description: `${validatedData.provider} airtime for ${validatedData.phone_number}`,
        status: 'completed',
      },
    ]);

    res.json({
      status: 'success',
      message: 'Airtime purchased successfully',
      data: airtimePurchase,
    });
  } catch (err: any) {
    if (err.name === 'ZodError') {
      res.status(400).json({ error: 'Validation error', details: err.errors });
    } else {
      console.error('Airtime purchase error:', err.message);
      res.status(500).json({ error: 'Failed to process purchase' });
    }
  }
});

// ─── POST /api/bills/data ───────────────────────────────────────────────────
// Buy data bundle
router.post('/data', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const validatedData = CreateAirtimeDataPurchaseSchema.parse({
      ...req.body,
      purchase_type: 'data',
    });

    const { data: wallet } = await supabase
      .from('wallets')
      .select('*')
      .eq('user_id', req.user.id)
      .single();

    if (!wallet) {
      res.status(404).json({ error: 'Wallet not found' });
      return;
    }

    const amountInKobo = Math.round(validatedData.amount * 100);

    if (wallet.available_balance < amountInKobo) {
      res.status(400).json({ error: 'Insufficient balance' });
      return;
    }

    await supabase
      .from('wallets')
      .update({
        balance: wallet.balance - amountInKobo,
        available_balance: wallet.available_balance - amountInKobo,
      })
      .eq('id', wallet.id);

    const { data: dataPurchase, error } = await supabase
      .from('airtime_data_purchases')
      .insert([
        {
          wallet_id: wallet.id,
          purchase_type: 'data',
          provider: validatedData.provider,
          phone_number: validatedData.phone_number,
          amount: amountInKobo,
          data_plan: validatedData.data_plan,
          status: 'completed',
        },
      ])
      .select()
      .single();

    if (error) {
      res.status(500).json({ error: error.message });
      return;
    }

    await supabase.from('transactions').insert([
      {
        wallet_id: wallet.id,
        type: 'debit',
        category: 'data',
        amount: amountInKobo,
        description: `${validatedData.provider} data (${validatedData.data_plan}) for ${validatedData.phone_number}`,
        status: 'completed',
      },
    ]);

    res.json({
      status: 'success',
      message: 'Data purchased successfully',
      data: dataPurchase,
    });
  } catch (err: any) {
    if (err.name === 'ZodError') {
      res.status(400).json({ error: 'Validation error', details: err.errors });
    } else {
      console.error('Data purchase error:', err.message);
      res.status(500).json({ error: 'Failed to process purchase' });
    }
  }
});

export const billsRouter = router;
