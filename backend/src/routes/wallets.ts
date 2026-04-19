// Wallet Routes
import { Router, Response } from 'express';
import { AuthRequest, authMiddleware } from '../middleware/auth';
import { createClient } from '@supabase/supabase-js';

const router = Router();

const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_KEY || ''
);

// ─── GET /api/wallets ────────────────────────────────────────────────────────
// Get user's wallet
router.get('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { data: wallet, error } = await supabase
      .from('wallets')
      .select('*')
      .eq('user_id', req.user.id)
      .single();

    if (error) {
      res.status(404).json({ error: 'Wallet not found' });
      return;
    }

    res.json({
      status: 'success',
      data: wallet,
    });
  } catch (err: any) {
    console.error('Get wallet error:', err.message);
    res.status(500).json({ error: 'Failed to fetch wallet' });
  }
});

// ─── POST /api/wallets/fund ──────────────────────────────────────────────────
// Fund wallet (add money)
router.post('/fund', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { amount } = req.body;

    if (!amount || amount <= 0) {
      res.status(400).json({ error: 'Invalid amount' });
      return;
    }

    // Get wallet
    const { data: wallet, error: walletError } = await supabase
      .from('wallets')
      .select('*')
      .eq('user_id', req.user.id)
      .single();

    if (walletError || !wallet) {
      res.status(404).json({ error: 'Wallet not found' });
      return;
    }

    // Update balance
    const newBalance = wallet.balance + Math.round(amount * 100); // Convert to kobo
    const { data: updated, error: updateError } = await supabase
      .from('wallets')
      .update({ balance: newBalance, available_balance: newBalance })
      .eq('id', wallet.id)
      .select()
      .single();

    if (updateError) {
      res.status(500).json({ error: updateError.message });
      return;
    }

    // Record transaction
    await supabase.from('transactions').insert([
      {
        wallet_id: wallet.id,
        type: 'credit',
        category: 'deposit',
        amount: Math.round(amount * 100),
        description: 'Wallet funding',
        status: 'completed',
      },
    ]);

    res.json({
      status: 'success',
      message: 'Wallet funded successfully',
      data: updated,
    });
  } catch (err: any) {
    console.error('Fund wallet error:', err.message);
    res.status(500).json({ error: 'Failed to fund wallet' });
  }
});

// ─── POST /api/wallets/withdraw ──────────────────────────────────────────────
// Withdraw from wallet
router.post('/withdraw', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { amount } = req.body;

    if (!amount || amount <= 0) {
      res.status(400).json({ error: 'Invalid amount' });
      return;
    }

    // Get wallet
    const { data: wallet, error: walletError } = await supabase
      .from('wallets')
      .select('*')
      .eq('user_id', req.user.id)
      .single();

    if (walletError || !wallet) {
      res.status(404).json({ error: 'Wallet not found' });
      return;
    }

    const amountInKobo = Math.round(amount * 100);

    // Check balance
    if (wallet.available_balance < amountInKobo) {
      res.status(400).json({ error: 'Insufficient balance' });
      return;
    }

    // Update balance
    const newBalance = wallet.balance - amountInKobo;
    const { data: updated, error: updateError } = await supabase
      .from('wallets')
      .update({ balance: newBalance, available_balance: newBalance })
      .eq('id', wallet.id)
      .select()
      .single();

    if (updateError) {
      res.status(500).json({ error: updateError.message });
      return;
    }

    // Record transaction
    await supabase.from('transactions').insert([
      {
        wallet_id: wallet.id,
        type: 'debit',
        category: 'withdrawal',
        amount: amountInKobo,
        description: 'Wallet withdrawal',
        status: 'completed',
      },
    ]);

    res.json({
      status: 'success',
      message: 'Withdrawal successful',
      data: updated,
    });
  } catch (err: any) {
    console.error('Withdraw error:', err.message);
    res.status(500).json({ error: 'Failed to withdraw' });
  }
});

// ─── GET /api/wallets/balance ────────────────────────────────────────────────
// Get wallet balance
router.get('/balance', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { data: wallet, error } = await supabase
      .from('wallets')
      .select('balance, available_balance, reserved_balance')
      .eq('user_id', req.user.id)
      .single();

    if (error) {
      res.status(404).json({ error: 'Wallet not found' });
      return;
    }

    res.json({
      status: 'success',
      data: {
        balance: wallet.balance / 100, // Convert from kobo to Naira
        available_balance: wallet.available_balance / 100,
        reserved_balance: wallet.reserved_balance / 100,
      },
    });
  } catch (err: any) {
    console.error('Get balance error:', err.message);
    res.status(500).json({ error: 'Failed to fetch balance' });
  }
});

export const walletsRouter = router;
