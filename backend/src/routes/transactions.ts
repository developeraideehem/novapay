// Transaction Routes
import { Router, Response } from 'express';
import { AuthRequest, authMiddleware } from '../middleware/auth';
import { CreateTransactionSchema } from '../schemas/validation';
import { createClient } from '@supabase/supabase-js';

const router = Router();

const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_KEY || ''
);

// ─── GET /api/transactions ────────────────────────────────────────────────────
// Get all transactions for authenticated user's wallet
router.get('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    // Get user's wallet
    const { data: wallet, error: walletError } = await supabase
      .from('wallets')
      .select('id')
      .eq('user_id', req.user.id)
      .single();

    if (walletError || !wallet) {
      res.status(404).json({ error: 'Wallet not found' });
      return;
    }

    // Get transactions
    const { data: transactions, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('wallet_id', wallet.id)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      res.status(500).json({ error: error.message });
      return;
    }

    res.json({
      status: 'success',
      data: transactions,
    });
  } catch (err: any) {
    console.error('Get transactions error:', err.message);
    res.status(500).json({ error: 'Failed to fetch transactions' });
  }
});

// ─── GET /api/transactions/:id ────────────────────────────────────────────────
// Get single transaction
router.get('/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { data: transaction, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (error || !transaction) {
      res.status(404).json({ error: 'Transaction not found' });
      return;
    }

    // Verify ownership
    const { data: wallet } = await supabase
      .from('wallets')
      .select('user_id')
      .eq('id', transaction.wallet_id)
      .single();

    if (wallet?.user_id !== req.user.id) {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }

    res.json({
      status: 'success',
      data: transaction,
    });
  } catch (err: any) {
    console.error('Get transaction error:', err.message);
    res.status(500).json({ error: 'Failed to fetch transaction' });
  }
});

// ─── POST /api/transactions ──────────────────────────────────────────────────
// Create new transaction
router.post('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const validatedData = CreateTransactionSchema.parse(req.body);

    // Verify wallet ownership
    const { data: wallet } = await supabase
      .from('wallets')
      .select('user_id')
      .eq('id', validatedData.wallet_id)
      .single();

    if (wallet?.user_id !== req.user.id) {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }

    // Create transaction
    const { data: transaction, error } = await supabase
      .from('transactions')
      .insert([
        {
          wallet_id: validatedData.wallet_id,
          type: validatedData.type,
          category: validatedData.category,
          amount: validatedData.amount,
          fee: validatedData.fee || 0,
          description: validatedData.description,
          reference: validatedData.reference,
          status: 'completed',
        },
      ])
      .select()
      .single();

    if (error) {
      res.status(500).json({ error: error.message });
      return;
    }

    res.status(201).json({
      status: 'success',
      data: transaction,
    });
  } catch (err: any) {
    if (err.name === 'ZodError') {
      res.status(400).json({
        status: 'error',
        message: 'Validation error',
        errors: err.errors,
      });
    } else {
      console.error('Create transaction error:', err.message);
      res.status(500).json({ error: 'Failed to create transaction' });
    }
  }
});

export const transactionsRouter = router;
