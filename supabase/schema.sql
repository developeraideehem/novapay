-- ============================================
-- NovaPay Supabase Database Schema
-- A Nigerian FinTech App (OPay/PalmPay-style)
-- ============================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================
-- USERS TABLE (Extended Profile)
-- ============================================
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    phone_number TEXT UNIQUE NOT NULL,
    email TEXT,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    
    -- Nigerian KYC Fields
    bvn TEXT,                                -- Bank Verification Number (11 digits)
    nin TEXT,                                -- National Identification Number
    date_of_birth DATE,
    gender TEXT CHECK (gender IN ('male', 'female', 'other')),
    
    -- Account Status
    tier_level INTEGER DEFAULT 1 CHECK (tier_level IN (1, 2, 3)),
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended', 'blocked')),
    is_phone_verified BOOLEAN DEFAULT FALSE,
    is_email_verified BOOLEAN DEFAULT FALSE,
    is_bvn_verified BOOLEAN DEFAULT FALSE,
    
    -- Security
    transaction_pin_hash TEXT,
    pin_attempts INTEGER DEFAULT 0,
    pin_locked_until TIMESTAMPTZ,
    
    -- Referral System
    referral_code TEXT UNIQUE,
    referred_by UUID REFERENCES public.users(id),
    referral_bonus_claimed BOOLEAN DEFAULT FALSE,
    
    -- Preferences
    preferred_language TEXT DEFAULT 'en',
    country_code TEXT DEFAULT 'NG',
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    last_login_at TIMESTAMPTZ
);

-- ============================================
-- WALLETS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.wallets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    
    -- Balance
    balance DECIMAL(15,2) DEFAULT 0.00 CHECK (balance >= 0),
    available_balance DECIMAL(15,2) DEFAULT 0.00 CHECK (available_balance >= 0),
    pending_balance DECIMAL(15,2) DEFAULT 0.00,
    
    -- Account Details
    account_number TEXT UNIQUE,              -- Generated 10-digit number
    currency TEXT DEFAULT 'NGN' CHECK (currency IN ('NGN', 'KES', 'GHS', 'USD')),
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'frozen', 'closed')),
    
    -- Limits (based on tier)
    daily_transaction_limit DECIMAL(15,2) DEFAULT 50000.00,
    single_transaction_limit DECIMAL(15,2) DEFAULT 20000.00,
    daily_transaction_count INTEGER DEFAULT 0,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- TRANSACTIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wallet_id UUID NOT NULL REFERENCES public.wallets(id),
    
    -- Transaction Details
    type TEXT NOT NULL CHECK (type IN ('credit', 'debit')),
    category TEXT NOT NULL CHECK (category IN (
        'transfer_in', 'transfer_out', 
        'deposit', 'withdrawal',
        'airtime', 'data', 
        'electricity', 'cable_tv', 'internet',
        'savings_deposit', 'savings_withdrawal', 'savings_interest',
        'loan_disbursement', 'loan_repayment',
        'cashback', 'referral_bonus', 'reversal'
    )),
    
    -- Amount Details
    amount DECIMAL(15,2) NOT NULL CHECK (amount > 0),
    fee DECIMAL(15,2) DEFAULT 0.00,
    cashback DECIMAL(15,2) DEFAULT 0.00,
    
    -- Reference
    reference TEXT UNIQUE NOT NULL,
    description TEXT,
    narration TEXT,
    
    -- Recipient Details (for transfers)
    recipient_wallet_id UUID REFERENCES public.wallets(id),
    recipient_bank_code TEXT,
    recipient_account_number TEXT,
    recipient_name TEXT,
    
    -- Provider Details (for bills)
    provider_code TEXT,                      -- e.g., 'MTN', 'PHED', 'DSTV'
    provider_reference TEXT,
    biller_item_code TEXT,                   -- e.g., data plan code
    
    -- Status
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'reversed')),
    failure_reason TEXT,
    
    -- Balance Tracking
    balance_before DECIMAL(15,2),
    balance_after DECIMAL(15,2),
    
    -- Metadata
    metadata JSONB DEFAULT '{}',
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

-- ============================================
-- SAVINGS PLANS TABLE (OWealth-style)
-- ============================================
CREATE TABLE IF NOT EXISTS public.savings_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    wallet_id UUID NOT NULL REFERENCES public.wallets(id),
    
    -- Plan Details
    name TEXT NOT NULL,                      -- e.g., "Emergency Fund"
    plan_type TEXT NOT NULL CHECK (plan_type IN ('flexible', 'fixed', 'target')),
    
    -- Amounts
    target_amount DECIMAL(15,2),             -- For target savings
    current_amount DECIMAL(15,2) DEFAULT 0.00 CHECK (current_amount >= 0),
    interest_rate DECIMAL(6,4) DEFAULT 0.1000, -- 10% default annual rate
    accrued_interest DECIMAL(15,2) DEFAULT 0.00,
    
    -- Duration
    start_date DATE DEFAULT CURRENT_DATE,
    maturity_date DATE,                      -- For fixed savings
    lock_period_days INTEGER DEFAULT 0,      -- Minimum days before withdrawal
    
    -- Auto-save Settings
    auto_save_enabled BOOLEAN DEFAULT FALSE,
    auto_save_amount DECIMAL(15,2),
    auto_save_frequency TEXT CHECK (auto_save_frequency IN ('daily', 'weekly', 'monthly')),
    auto_save_day INTEGER,                   -- Day of week/month for auto-save
    
    -- Status
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'paused', 'matured', 'withdrawn', 'closed')),
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    last_interest_calculated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- LOANS TABLE (NCC Compliant)
-- ============================================
CREATE TABLE IF NOT EXISTS public.loans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    wallet_id UUID NOT NULL REFERENCES public.wallets(id),
    
    -- Loan Details
    principal_amount DECIMAL(15,2) NOT NULL CHECK (principal_amount > 0),
    interest_rate DECIMAL(6,4) NOT NULL,     -- Annual rate (max 15% per NCC)
    tenure_months INTEGER NOT NULL CHECK (tenure_months > 0 AND tenure_months <= 36),
    
    -- Calculated Values
    monthly_payment DECIMAL(15,2) NOT NULL,
    total_interest DECIMAL(15,2) NOT NULL,
    total_repayment DECIMAL(15,2) NOT NULL,
    
    -- Repayment Tracking
    amount_paid DECIMAL(15,2) DEFAULT 0.00,
    amount_outstanding DECIMAL(15,2),
    next_payment_date DATE,
    payments_made INTEGER DEFAULT 0,
    
    -- Status
    status TEXT DEFAULT 'pending' CHECK (status IN (
        'pending', 'approved', 'disbursed', 'active', 
        'completed', 'defaulted', 'rejected'
    )),
    
    -- Approval Details
    applied_at TIMESTAMPTZ DEFAULT NOW(),
    approved_at TIMESTAMPTZ,
    disbursed_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    
    -- Eligibility Check
    eligibility_score INTEGER,
    rejection_reason TEXT,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- LOAN REPAYMENTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.loan_repayments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    loan_id UUID NOT NULL REFERENCES public.loans(id) ON DELETE CASCADE,
    transaction_id UUID REFERENCES public.transactions(id),
    
    -- Payment Details
    payment_number INTEGER NOT NULL,
    amount DECIMAL(15,2) NOT NULL,
    principal_portion DECIMAL(15,2) NOT NULL,
    interest_portion DECIMAL(15,2) NOT NULL,
    
    -- Schedule
    due_date DATE NOT NULL,
    paid_date DATE,
    
    -- Status
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'overdue', 'waived')),
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- BENEFICIARIES TABLE (Saved Recipients)
-- ============================================
CREATE TABLE IF NOT EXISTS public.beneficiaries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    
    -- Recipient Details
    name TEXT NOT NULL,
    beneficiary_type TEXT NOT NULL CHECK (beneficiary_type IN ('wallet', 'bank', 'mobile_money')),
    
    -- For Wallet Recipients
    recipient_wallet_id UUID REFERENCES public.wallets(id),
    recipient_phone TEXT,
    
    -- For Bank Recipients
    bank_code TEXT,
    bank_name TEXT,
    account_number TEXT,
    
    -- Usage Tracking
    is_favorite BOOLEAN DEFAULT FALSE,
    last_used_at TIMESTAMPTZ,
    usage_count INTEGER DEFAULT 0,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- BILL PROVIDERS TABLE (Reference Data)
-- ============================================
CREATE TABLE IF NOT EXISTS public.bill_providers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Provider Details
    code TEXT UNIQUE NOT NULL,               -- e.g., 'MTN', 'PHED', 'DSTV'
    name TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('airtime', 'data', 'electricity', 'cable_tv', 'internet', 'water')),
    
    -- Pricing
    min_amount DECIMAL(15,2),
    max_amount DECIMAL(15,2),
    cashback_percentage DECIMAL(5,2) DEFAULT 0.00, -- e.g., 6.00 for 6%
    
    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    logo_url TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================
CREATE INDEX IF NOT EXISTS idx_users_phone ON public.users(phone_number);
CREATE INDEX IF NOT EXISTS idx_users_referral_code ON public.users(referral_code);
CREATE INDEX IF NOT EXISTS idx_wallets_user ON public.wallets(user_id);
CREATE INDEX IF NOT EXISTS idx_wallets_account_number ON public.wallets(account_number);
CREATE INDEX IF NOT EXISTS idx_transactions_wallet ON public.transactions(wallet_id);
CREATE INDEX IF NOT EXISTS idx_transactions_reference ON public.transactions(reference);
CREATE INDEX IF NOT EXISTS idx_transactions_created ON public.transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_category ON public.transactions(category);
CREATE INDEX IF NOT EXISTS idx_savings_user ON public.savings_plans(user_id);
CREATE INDEX IF NOT EXISTS idx_loans_user ON public.loans(user_id);
CREATE INDEX IF NOT EXISTS idx_beneficiaries_user ON public.beneficiaries(user_id);

-- ============================================
-- UPDATED_AT TRIGGER FUNCTION
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to relevant tables
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON public.users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_wallets_updated_at
    BEFORE UPDATE ON public.wallets
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_savings_updated_at
    BEFORE UPDATE ON public.savings_plans
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_loans_updated_at
    BEFORE UPDATE ON public.loans
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- GENERATE ACCOUNT NUMBER FUNCTION
-- ============================================
CREATE OR REPLACE FUNCTION generate_account_number()
RETURNS TEXT AS $$
DECLARE
    new_number TEXT;
    exists_check BOOLEAN;
BEGIN
    LOOP
        -- Generate a 10-digit number starting with 70 (common for mobile wallets in Nigeria)
        new_number := '70' || LPAD(FLOOR(RANDOM() * 100000000)::TEXT, 8, '0');
        
        -- Check if it already exists
        SELECT EXISTS(SELECT 1 FROM public.wallets WHERE account_number = new_number) INTO exists_check;
        
        EXIT WHEN NOT exists_check;
    END LOOP;
    
    RETURN new_number;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- GENERATE REFERRAL CODE FUNCTION
-- ============================================
CREATE OR REPLACE FUNCTION generate_referral_code()
RETURNS TEXT AS $$
DECLARE
    chars TEXT := 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    code TEXT := 'NP';  -- NovaPay prefix
    i INTEGER;
BEGIN
    FOR i IN 1..6 LOOP
        code := code || SUBSTR(chars, FLOOR(RANDOM() * LENGTH(chars) + 1)::INTEGER, 1);
    END LOOP;
    RETURN code;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- AUTO-CREATE WALLET ON USER INSERT
-- ============================================
CREATE OR REPLACE FUNCTION create_wallet_for_new_user()
RETURNS TRIGGER AS $$
DECLARE
    daily_limit DECIMAL(15,2);
BEGIN
    -- Set daily limit based on tier
    CASE NEW.tier_level
        WHEN 1 THEN daily_limit := 50000.00;
        WHEN 2 THEN daily_limit := 1000000.00;
        WHEN 3 THEN daily_limit := 5000000.00;
        ELSE daily_limit := 50000.00;
    END CASE;
    
    -- Create wallet
    INSERT INTO public.wallets (user_id, account_number, daily_transaction_limit)
    VALUES (NEW.id, generate_account_number(), daily_limit);
    
    -- Generate referral code if not set
    IF NEW.referral_code IS NULL THEN
        UPDATE public.users SET referral_code = generate_referral_code() WHERE id = NEW.id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_user_created
    AFTER INSERT ON public.users
    FOR EACH ROW EXECUTE FUNCTION create_wallet_for_new_user();

-- ============================================
-- SEED BILL PROVIDERS
-- ============================================
INSERT INTO public.bill_providers (code, name, category, min_amount, max_amount, cashback_percentage) VALUES
-- Airtime Providers
('MTN', 'MTN Nigeria', 'airtime', 50, 50000, 6.00),
('AIRTEL', 'Airtel Nigeria', 'airtime', 50, 50000, 5.00),
('GLO', 'Glo Nigeria', 'airtime', 50, 50000, 5.00),
('9MOBILE', '9mobile', 'airtime', 50, 50000, 4.00),

-- Data Providers
('MTN_DATA', 'MTN Data', 'data', 100, 100000, 3.00),
('AIRTEL_DATA', 'Airtel Data', 'data', 100, 100000, 3.00),
('GLO_DATA', 'Glo Data', 'data', 100, 100000, 3.00),

-- Electricity
('PHED', 'Port Harcourt Electricity', 'electricity', 1000, 500000, 0.50),
('EKEDC', 'Eko Electricity', 'electricity', 1000, 500000, 0.50),
('IKEDC', 'Ikeja Electric', 'electricity', 1000, 500000, 0.50),
('AEDC', 'Abuja Electricity', 'electricity', 1000, 500000, 0.50),
('KEDCO', 'Kano Electricity', 'electricity', 1000, 500000, 0.50),

-- Cable TV
('DSTV', 'DStv', 'cable_tv', 1850, 37000, 1.00),
('GOTV', 'GOtv', 'cable_tv', 1575, 7600, 1.00),
('STARTIMES', 'StarTimes', 'cable_tv', 900, 6500, 1.00)

ON CONFLICT (code) DO NOTHING;

-- ============================================
-- GRANT PERMISSIONS
-- ============================================
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
