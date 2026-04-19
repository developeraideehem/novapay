-- NovaPay Database Schema
-- This migration creates the core tables for the wallet, transactions, and user management

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- USERS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  phone_number VARCHAR(20) UNIQUE NOT NULL,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  pin_hash VARCHAR(255), -- Hashed PIN for authentication
  kyc_verified BOOLEAN DEFAULT FALSE,
  kyc_level INTEGER DEFAULT 0, -- 0: Unverified, 1: Basic, 2: Full
  bvn VARCHAR(11), -- Bank Verification Number (Nigeria)
  account_status VARCHAR(50) DEFAULT 'active', -- active, suspended, closed
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_login TIMESTAMP
);

-- ============================================================================
-- WALLETS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS wallets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  account_number VARCHAR(20) UNIQUE NOT NULL,
  account_name VARCHAR(255),
  balance BIGINT DEFAULT 0, -- Amount in kobo (₦1 = 100 kobo)
  available_balance BIGINT DEFAULT 0, -- Balance available for withdrawal
  reserved_balance BIGINT DEFAULT 0, -- Balance reserved for pending transactions
  currency VARCHAR(3) DEFAULT 'NGN',
  wallet_status VARCHAR(50) DEFAULT 'active', -- active, frozen, closed
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id) -- One wallet per user
);

-- ============================================================================
-- TRANSACTIONS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  wallet_id UUID NOT NULL REFERENCES wallets(id) ON DELETE CASCADE,
  type VARCHAR(20) NOT NULL, -- credit, debit
  category VARCHAR(50) NOT NULL, -- deposit, withdrawal, transfer, payment, airtime, data, bills
  amount BIGINT NOT NULL, -- Amount in kobo
  fee BIGINT DEFAULT 0, -- Transaction fee in kobo
  description VARCHAR(500),
  reference VARCHAR(255) UNIQUE, -- External reference (Paystack ref, etc.)
  status VARCHAR(50) DEFAULT 'pending', -- pending, completed, failed, reversed
  metadata JSONB, -- Additional data (bank details, recipient info, etc.)
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP,
  CONSTRAINT valid_amount CHECK (amount > 0)
);

-- ============================================================================
-- TRANSFER RECIPIENTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS transfer_recipients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  wallet_id UUID NOT NULL REFERENCES wallets(id) ON DELETE CASCADE,
  recipient_name VARCHAR(255) NOT NULL,
  bank_code VARCHAR(10) NOT NULL,
  account_number VARCHAR(20) NOT NULL,
  account_name VARCHAR(255),
  recipient_code VARCHAR(255), -- Paystack recipient code
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(wallet_id, account_number, bank_code)
);

-- ============================================================================
-- BILLS PAYMENTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS bills_payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  wallet_id UUID NOT NULL REFERENCES wallets(id) ON DELETE CASCADE,
  bill_type VARCHAR(50) NOT NULL, -- electricity, cable_tv, internet, water
  provider VARCHAR(100) NOT NULL, -- e.g., EKEDC, DSTV, Smile
  customer_reference VARCHAR(255), -- Customer ID/Account number with provider
  amount BIGINT NOT NULL, -- Amount in kobo
  status VARCHAR(50) DEFAULT 'pending', -- pending, completed, failed
  transaction_reference VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP
);

-- ============================================================================
-- AIRTIME & DATA PURCHASES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS airtime_data_purchases (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  wallet_id UUID NOT NULL REFERENCES wallets(id) ON DELETE CASCADE,
  purchase_type VARCHAR(20) NOT NULL, -- airtime, data
  provider VARCHAR(50) NOT NULL, -- MTN, Airtel, Glo, 9mobile
  phone_number VARCHAR(20) NOT NULL,
  amount BIGINT NOT NULL, -- Amount in kobo
  data_plan VARCHAR(100), -- For data purchases (e.g., "1GB", "500MB")
  status VARCHAR(50) DEFAULT 'pending', -- pending, completed, failed
  transaction_reference VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP
);

-- ============================================================================
-- SAVINGS ACCOUNTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS savings_accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  wallet_id UUID NOT NULL REFERENCES wallets(id) ON DELETE CASCADE,
  savings_name VARCHAR(255) NOT NULL,
  target_amount BIGINT, -- Target amount in kobo
  current_amount BIGINT DEFAULT 0,
  interest_rate DECIMAL(5, 2) DEFAULT 0, -- Annual interest rate (%)
  frequency VARCHAR(50), -- daily, weekly, monthly, custom
  auto_save_amount BIGINT, -- Amount to auto-save in kobo
  status VARCHAR(50) DEFAULT 'active', -- active, paused, completed
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- LOANS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS loans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  wallet_id UUID NOT NULL REFERENCES wallets(id) ON DELETE CASCADE,
  loan_amount BIGINT NOT NULL, -- Amount in kobo
  interest_rate DECIMAL(5, 2) NOT NULL, -- Annual interest rate (%)
  loan_term_months INTEGER NOT NULL,
  monthly_payment BIGINT NOT NULL, -- Monthly payment in kobo
  status VARCHAR(50) DEFAULT 'pending', -- pending, approved, active, completed, defaulted
  disbursement_date TIMESTAMP,
  maturity_date TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- LOAN REPAYMENTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS loan_repayments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  loan_id UUID NOT NULL REFERENCES loans(id) ON DELETE CASCADE,
  payment_amount BIGINT NOT NULL, -- Amount in kobo
  payment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  status VARCHAR(50) DEFAULT 'completed', -- completed, pending, failed
  transaction_reference VARCHAR(255)
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_phone ON users(phone_number);
CREATE INDEX idx_wallets_user_id ON wallets(user_id);
CREATE INDEX idx_transactions_wallet_id ON transactions(wallet_id);
CREATE INDEX idx_transactions_status ON transactions(status);
CREATE INDEX idx_transactions_created_at ON transactions(created_at);
CREATE INDEX idx_transactions_reference ON transactions(reference);
CREATE INDEX idx_transfer_recipients_wallet_id ON transfer_recipients(wallet_id);
CREATE INDEX idx_bills_wallet_id ON bills_payments(wallet_id);
CREATE INDEX idx_airtime_wallet_id ON airtime_data_purchases(wallet_id);
CREATE INDEX idx_savings_wallet_id ON savings_accounts(wallet_id);
CREATE INDEX idx_loans_wallet_id ON loans(wallet_id);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================
-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE transfer_recipients ENABLE ROW LEVEL SECURITY;
ALTER TABLE bills_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE airtime_data_purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE savings_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE loans ENABLE ROW LEVEL SECURITY;
ALTER TABLE loan_repayments ENABLE ROW LEVEL SECURITY;

-- Users can only view/edit their own data
CREATE POLICY "Users can view their own profile" ON users
  FOR SELECT USING (auth.uid()::text = id::text);

CREATE POLICY "Users can update their own profile" ON users
  FOR UPDATE USING (auth.uid()::text = id::text);

-- Wallets: Users can only access their own wallet
CREATE POLICY "Users can view their own wallet" ON wallets
  FOR SELECT USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can update their own wallet" ON wallets
  FOR UPDATE USING (auth.uid()::text = user_id::text);

-- Transactions: Users can only view their own transactions
CREATE POLICY "Users can view their own transactions" ON transactions
  FOR SELECT USING (
    wallet_id IN (
      SELECT id FROM wallets WHERE user_id::text = auth.uid()::text
    )
  );

-- Transfer Recipients: Users can only manage their own recipients
CREATE POLICY "Users can view their transfer recipients" ON transfer_recipients
  FOR SELECT USING (
    wallet_id IN (
      SELECT id FROM wallets WHERE user_id::text = auth.uid()::text
    )
  );

CREATE POLICY "Users can manage their transfer recipients" ON transfer_recipients
  FOR ALL USING (
    wallet_id IN (
      SELECT id FROM wallets WHERE user_id::text = auth.uid()::text
    )
  );

-- Bills: Users can only view their own bills
CREATE POLICY "Users can view their bills" ON bills_payments
  FOR SELECT USING (
    wallet_id IN (
      SELECT id FROM wallets WHERE user_id::text = auth.uid()::text
    )
  );

-- Airtime/Data: Users can only view their own purchases
CREATE POLICY "Users can view their airtime/data purchases" ON airtime_data_purchases
  FOR SELECT USING (
    wallet_id IN (
      SELECT id FROM wallets WHERE user_id::text = auth.uid()::text
    )
  );

-- Savings: Users can only manage their own savings
CREATE POLICY "Users can view their savings" ON savings_accounts
  FOR SELECT USING (
    wallet_id IN (
      SELECT id FROM wallets WHERE user_id::text = auth.uid()::text
    )
  );

-- Loans: Users can only view their own loans
CREATE POLICY "Users can view their loans" ON loans
  FOR SELECT USING (
    wallet_id IN (
      SELECT id FROM wallets WHERE user_id::text = auth.uid()::text
    )
  );

-- ============================================================================
-- FUNCTIONS FOR AUTOMATIC TIMESTAMP UPDATES
-- ============================================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at columns
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_wallets_updated_at BEFORE UPDATE ON wallets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_savings_updated_at BEFORE UPDATE ON savings_accounts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_loans_updated_at BEFORE UPDATE ON loans
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
