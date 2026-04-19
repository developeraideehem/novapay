// Authentication Routes
import { Router, Request, Response } from 'express';
import { generateToken } from '../middleware/auth';
import { createClient } from '@supabase/supabase-js';

const router = Router();

const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_KEY || ''
);

// ─── POST /api/auth/register ────────────────────────────────────────────────
// Register new user
router.post('/register', async (req: Request, res: Response) => {
  try {
    const { email, phone_number, first_name, last_name, pin } = req.body;

    if (!email || !phone_number || !pin) {
      res.status(400).json({ error: 'Email, phone number, and PIN are required' });
      return;
    }

    // Check if user exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single();

    if (existingUser) {
      res.status(400).json({ error: 'User already exists' });
      return;
    }

    // Create user
    const { data: user, error: userError } = await supabase
      .from('users')
      .insert([
        {
          email,
          phone_number,
          first_name,
          last_name,
          pin_hash: pin, // In production, hash this with bcrypt
        },
      ])
      .select()
      .single();

    if (userError) {
      res.status(500).json({ error: userError.message });
      return;
    }

    // Create wallet for user
    const accountNumber = `NP${Date.now().toString().slice(-10)}`;
    const { data: wallet, error: walletError } = await supabase
      .from('wallets')
      .insert([
        {
          user_id: user.id,
          account_number: accountNumber,
          account_name: `${first_name} ${last_name}`,
          balance: 0,
          available_balance: 0,
        },
      ])
      .select()
      .single();

    if (walletError) {
      res.status(500).json({ error: walletError.message });
      return;
    }

    // Generate token
    const token = generateToken(user.id, user.email);

    res.status(201).json({
      status: 'success',
      message: 'User registered successfully',
      data: {
        user: {
          id: user.id,
          email: user.email,
          phone_number: user.phone_number,
          first_name: user.first_name,
          last_name: user.last_name,
        },
        wallet: {
          id: wallet.id,
          account_number: wallet.account_number,
        },
        token,
      },
    });
  } catch (err: any) {
    console.error('Register error:', err.message);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// ─── POST /api/auth/login ───────────────────────────────────────────────────
// Login user
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, pin } = req.body;

    if (!email || !pin) {
      res.status(400).json({ error: 'Email and PIN are required' });
      return;
    }

    // Find user
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (error || !user) {
      res.status(401).json({ error: 'Invalid email or PIN' });
      return;
    }

    // Verify PIN (in production, use bcrypt.compare)
    if (user.pin_hash !== pin) {
      res.status(401).json({ error: 'Invalid email or PIN' });
      return;
    }

    // Get wallet
    const { data: wallet } = await supabase
      .from('wallets')
      .select('*')
      .eq('user_id', user.id)
      .single();

    // Generate token
    const token = generateToken(user.id, user.email);

    // Update last login
    await supabase
      .from('users')
      .update({ last_login: new Date().toISOString() })
      .eq('id', user.id);

    res.json({
      status: 'success',
      message: 'Login successful',
      data: {
        user: {
          id: user.id,
          email: user.email,
          phone_number: user.phone_number,
          first_name: user.first_name,
          last_name: user.last_name,
        },
        wallet: wallet ? {
          id: wallet.id,
          account_number: wallet.account_number,
          balance: wallet.balance / 100, // Convert from kobo
        } : null,
        token,
      },
    });
  } catch (err: any) {
    console.error('Login error:', err.message);
    res.status(500).json({ error: 'Login failed' });
  }
});

// ─── POST /api/auth/verify-pin ──────────────────────────────────────────────
// Verify PIN (for sensitive operations)
router.post('/verify-pin', async (req: Request, res: Response) => {
  try {
    const { email, pin } = req.body;

    if (!email || !pin) {
      res.status(400).json({ error: 'Email and PIN are required' });
      return;
    }

    const { data: user, error } = await supabase
      .from('users')
      .select('pin_hash')
      .eq('email', email)
      .single();

    if (error || !user) {
      res.status(401).json({ error: 'User not found' });
      return;
    }

    if (user.pin_hash !== pin) {
      res.status(401).json({ error: 'Invalid PIN' });
      return;
    }

    res.json({
      status: 'success',
      message: 'PIN verified',
    });
  } catch (err: any) {
    console.error('Verify PIN error:', err.message);
    res.status(500).json({ error: 'PIN verification failed' });
  }
});

export const authRouter = router;
