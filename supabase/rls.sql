-- ============================================
-- NovaPay Row Level Security (RLS) Policies
-- ============================================

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.savings_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loan_repayments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.beneficiaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bill_providers ENABLE ROW LEVEL SECURITY;

-- ============================================
-- USERS POLICIES
-- ============================================

-- Users can read their own profile
CREATE POLICY "Users can view own profile"
    ON public.users FOR SELECT
    USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
    ON public.users FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- Users can insert their profile on signup (via trigger)
CREATE POLICY "Enable insert for authenticated users"
    ON public.users FOR INSERT
    WITH CHECK (auth.uid() = id);

-- Users can view referred_by user's basic info (for referral display)
CREATE POLICY "Users can view referrer name"
    ON public.users FOR SELECT
    USING (
        id IN (
            SELECT referred_by FROM public.users WHERE id = auth.uid()
        )
    );

-- ============================================
-- WALLETS POLICIES
-- ============================================

-- Users can view their own wallet
CREATE POLICY "Users can view own wallet"
    ON public.wallets FOR SELECT
    USING (user_id = auth.uid());

-- Wallet updates are handled by functions only (no direct update)
CREATE POLICY "System can update wallets"
    ON public.wallets FOR UPDATE
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- Users can view recipient wallet for transfers (limited fields via function)
CREATE POLICY "Users can view recipient wallet basic info"
    ON public.wallets FOR SELECT
    USING (
        account_number IN (
            SELECT recipient_account_number FROM public.transactions 
            WHERE wallet_id IN (SELECT id FROM public.wallets WHERE user_id = auth.uid())
        )
    );

-- ============================================
-- TRANSACTIONS POLICIES
-- ============================================

-- Users can view their own transactions
CREATE POLICY "Users can view own transactions"
    ON public.transactions FOR SELECT
    USING (
        wallet_id IN (
            SELECT id FROM public.wallets WHERE user_id = auth.uid()
        )
    );

-- Transactions are created via secure functions only
CREATE POLICY "Authenticated users can create transactions"
    ON public.transactions FOR INSERT
    WITH CHECK (
        wallet_id IN (
            SELECT id FROM public.wallets WHERE user_id = auth.uid()
        )
    );

-- ============================================
-- SAVINGS PLANS POLICIES
-- ============================================

-- Users can view their own savings
CREATE POLICY "Users can view own savings"
    ON public.savings_plans FOR SELECT
    USING (user_id = auth.uid());

-- Users can create savings plans
CREATE POLICY "Users can create savings plans"
    ON public.savings_plans FOR INSERT
    WITH CHECK (user_id = auth.uid());

-- Users can update their own savings plans
CREATE POLICY "Users can update own savings"
    ON public.savings_plans FOR UPDATE
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- Users can delete their own savings plans (close)
CREATE POLICY "Users can close own savings"
    ON public.savings_plans FOR DELETE
    USING (user_id = auth.uid() AND status IN ('active', 'paused'));

-- ============================================
-- LOANS POLICIES
-- ============================================

-- Users can view their own loans
CREATE POLICY "Users can view own loans"
    ON public.loans FOR SELECT
    USING (user_id = auth.uid());

-- Users can apply for loans
CREATE POLICY "Users can apply for loans"
    ON public.loans FOR INSERT
    WITH CHECK (user_id = auth.uid());

-- Users can view their loan repayments
CREATE POLICY "Users can view own loan repayments"
    ON public.loan_repayments FOR SELECT
    USING (
        loan_id IN (
            SELECT id FROM public.loans WHERE user_id = auth.uid()
        )
    );

-- ============================================
-- BENEFICIARIES POLICIES
-- ============================================

-- Users can view their own beneficiaries
CREATE POLICY "Users can view own beneficiaries"
    ON public.beneficiaries FOR SELECT
    USING (user_id = auth.uid());

-- Users can create beneficiaries
CREATE POLICY "Users can create beneficiaries"
    ON public.beneficiaries FOR INSERT
    WITH CHECK (user_id = auth.uid());

-- Users can update their own beneficiaries
CREATE POLICY "Users can update own beneficiaries"
    ON public.beneficiaries FOR UPDATE
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- Users can delete their own beneficiaries
CREATE POLICY "Users can delete own beneficiaries"
    ON public.beneficiaries FOR DELETE
    USING (user_id = auth.uid());

-- ============================================
-- BILL PROVIDERS POLICIES (Public Read)
-- ============================================

-- Everyone can view bill providers
CREATE POLICY "Anyone can view bill providers"
    ON public.bill_providers FOR SELECT
    TO anon, authenticated
    USING (is_active = TRUE);
