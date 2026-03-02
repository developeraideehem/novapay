-- ============================================
-- NovaPay Database Functions
-- Core business logic for the FinTech app
-- ============================================

-- ============================================
-- TRANSFER FUNDS FUNCTION
-- Atomic fund transfer between wallets
-- ============================================
CREATE OR REPLACE FUNCTION transfer_funds(
    p_from_wallet_id UUID,
    p_to_wallet_id UUID,
    p_amount DECIMAL(15,2),
    p_description TEXT DEFAULT NULL,
    p_fee DECIMAL(15,2) DEFAULT 0.00
)
RETURNS TABLE (
    success BOOLEAN,
    message TEXT,
    debit_transaction_id UUID,
    credit_transaction_id UUID
) AS $$
DECLARE
    v_from_wallet RECORD;
    v_to_wallet RECORD;
    v_total_amount DECIMAL(15,2);
    v_reference TEXT;
    v_debit_txn_id UUID;
    v_credit_txn_id UUID;
BEGIN
    -- Generate unique reference
    v_reference := 'TRF' || TO_CHAR(NOW(), 'YYYYMMDDHH24MISS') || SUBSTR(MD5(RANDOM()::TEXT), 1, 6);
    v_total_amount := p_amount + p_fee;
    
    -- Lock and get sender wallet
    SELECT * INTO v_from_wallet 
    FROM public.wallets 
    WHERE id = p_from_wallet_id 
    FOR UPDATE;
    
    IF NOT FOUND THEN
        RETURN QUERY SELECT FALSE, 'Sender wallet not found'::TEXT, NULL::UUID, NULL::UUID;
        RETURN;
    END IF;
    
    IF v_from_wallet.status != 'active' THEN
        RETURN QUERY SELECT FALSE, 'Sender wallet is not active'::TEXT, NULL::UUID, NULL::UUID;
        RETURN;
    END IF;
    
    IF v_from_wallet.available_balance < v_total_amount THEN
        RETURN QUERY SELECT FALSE, 'Insufficient funds'::TEXT, NULL::UUID, NULL::UUID;
        RETURN;
    END IF;
    
    -- Lock and get recipient wallet
    SELECT * INTO v_to_wallet 
    FROM public.wallets 
    WHERE id = p_to_wallet_id 
    FOR UPDATE;
    
    IF NOT FOUND THEN
        RETURN QUERY SELECT FALSE, 'Recipient wallet not found'::TEXT, NULL::UUID, NULL::UUID;
        RETURN;
    END IF;
    
    IF v_to_wallet.status != 'active' THEN
        RETURN QUERY SELECT FALSE, 'Recipient wallet is not active'::TEXT, NULL::UUID, NULL::UUID;
        RETURN;
    END IF;
    
    -- Create debit transaction
    INSERT INTO public.transactions (
        wallet_id, type, category, amount, fee, reference, 
        description, recipient_wallet_id, status,
        balance_before, balance_after
    ) VALUES (
        p_from_wallet_id, 'debit', 'transfer_out', p_amount, p_fee, v_reference,
        COALESCE(p_description, 'Transfer to ' || v_to_wallet.account_number),
        p_to_wallet_id, 'completed',
        v_from_wallet.balance, v_from_wallet.balance - v_total_amount
    ) RETURNING id INTO v_debit_txn_id;
    
    -- Create credit transaction
    INSERT INTO public.transactions (
        wallet_id, type, category, amount, fee, reference,
        description, status, balance_before, balance_after
    ) VALUES (
        p_to_wallet_id, 'credit', 'transfer_in', p_amount, 0, v_reference || '-CR',
        COALESCE(p_description, 'Transfer from ' || v_from_wallet.account_number),
        'completed',
        v_to_wallet.balance, v_to_wallet.balance + p_amount
    ) RETURNING id INTO v_credit_txn_id;
    
    -- Update sender wallet
    UPDATE public.wallets 
    SET 
        balance = balance - v_total_amount,
        available_balance = available_balance - v_total_amount,
        daily_transaction_count = daily_transaction_count + 1
    WHERE id = p_from_wallet_id;
    
    -- Update recipient wallet
    UPDATE public.wallets 
    SET 
        balance = balance + p_amount,
        available_balance = available_balance + p_amount
    WHERE id = p_to_wallet_id;
    
    RETURN QUERY SELECT TRUE, 'Transfer successful'::TEXT, v_debit_txn_id, v_credit_txn_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- PROCESS BILL PAYMENT FUNCTION
-- Handle airtime, data, electricity, etc.
-- ============================================
CREATE OR REPLACE FUNCTION process_bill_payment(
    p_wallet_id UUID,
    p_provider_code TEXT,
    p_amount DECIMAL(15,2),
    p_phone_or_account TEXT,
    p_biller_item_code TEXT DEFAULT NULL
)
RETURNS TABLE (
    success BOOLEAN,
    message TEXT,
    transaction_id UUID,
    cashback_amount DECIMAL(15,2)
) AS $$
DECLARE
    v_wallet RECORD;
    v_provider RECORD;
    v_cashback DECIMAL(15,2) := 0;
    v_reference TEXT;
    v_txn_id UUID;
    v_category TEXT;
BEGIN
    -- Get provider and cashback rate
    SELECT * INTO v_provider 
    FROM public.bill_providers 
    WHERE code = p_provider_code AND is_active = TRUE;
    
    IF NOT FOUND THEN
        RETURN QUERY SELECT FALSE, 'Provider not found or inactive'::TEXT, NULL::UUID, 0::DECIMAL;
        RETURN;
    END IF;
    
    -- Validate amount
    IF p_amount < v_provider.min_amount THEN
        RETURN QUERY SELECT FALSE, ('Minimum amount is ' || v_provider.min_amount)::TEXT, NULL::UUID, 0::DECIMAL;
        RETURN;
    END IF;
    
    IF p_amount > v_provider.max_amount THEN
        RETURN QUERY SELECT FALSE, ('Maximum amount is ' || v_provider.max_amount)::TEXT, NULL::UUID, 0::DECIMAL;
        RETURN;
    END IF;
    
    -- Lock and get wallet
    SELECT * INTO v_wallet 
    FROM public.wallets 
    WHERE id = p_wallet_id 
    FOR UPDATE;
    
    IF NOT FOUND OR v_wallet.status != 'active' THEN
        RETURN QUERY SELECT FALSE, 'Wallet not found or inactive'::TEXT, NULL::UUID, 0::DECIMAL;
        RETURN;
    END IF;
    
    IF v_wallet.available_balance < p_amount THEN
        RETURN QUERY SELECT FALSE, 'Insufficient funds'::TEXT, NULL::UUID, 0::DECIMAL;
        RETURN;
    END IF;
    
    -- Calculate cashback
    v_cashback := ROUND((p_amount * v_provider.cashback_percentage / 100), 2);
    v_category := v_provider.category;
    v_reference := UPPER(SUBSTR(v_category, 1, 3)) || TO_CHAR(NOW(), 'YYYYMMDDHH24MISS') || SUBSTR(MD5(RANDOM()::TEXT), 1, 6);
    
    -- Create bill payment transaction
    INSERT INTO public.transactions (
        wallet_id, type, category, amount, cashback, reference,
        description, provider_code, provider_reference, biller_item_code,
        status, balance_before, balance_after
    ) VALUES (
        p_wallet_id, 'debit', v_category, p_amount, v_cashback, v_reference,
        v_provider.name || ' - ' || p_phone_or_account,
        p_provider_code, NULL, p_biller_item_code,
        'completed',
        v_wallet.balance, v_wallet.balance - p_amount + v_cashback
    ) RETURNING id INTO v_txn_id;
    
    -- Update wallet balance (debit amount, credit cashback)
    UPDATE public.wallets 
    SET 
        balance = balance - p_amount + v_cashback,
        available_balance = available_balance - p_amount + v_cashback,
        daily_transaction_count = daily_transaction_count + 1
    WHERE id = p_wallet_id;
    
    -- Create cashback transaction if applicable
    IF v_cashback > 0 THEN
        INSERT INTO public.transactions (
            wallet_id, type, category, amount, reference,
            description, status, balance_before, balance_after
        ) VALUES (
            p_wallet_id, 'credit', 'cashback', v_cashback, 
            'CB' || v_reference,
            'Cashback for ' || v_provider.name,
            'completed',
            v_wallet.balance - p_amount, v_wallet.balance - p_amount + v_cashback
        );
    END IF;
    
    RETURN QUERY SELECT TRUE, 'Payment successful'::TEXT, v_txn_id, v_cashback;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- CALCULATE LOAN SCHEDULE FUNCTION
-- NCC-compliant loan calculation
-- ============================================
CREATE OR REPLACE FUNCTION calculate_loan_schedule(
    p_principal DECIMAL(15,2),
    p_tenure_months INTEGER,
    p_interest_rate DECIMAL(6,4) DEFAULT 0.15  -- 15% annual default (NCC max)
)
RETURNS TABLE (
    monthly_payment DECIMAL(15,2),
    total_interest DECIMAL(15,2),
    total_repayment DECIMAL(15,2),
    schedule JSONB
) AS $$
DECLARE
    v_monthly_rate DECIMAL(10,8);
    v_emi DECIMAL(15,2);
    v_total_payment DECIMAL(15,2);
    v_total_interest DECIMAL(15,2);
    v_schedule JSONB := '[]'::JSONB;
    v_remaining_principal DECIMAL(15,2);
    v_interest_portion DECIMAL(15,2);
    v_principal_portion DECIMAL(15,2);
    v_payment_date DATE;
    i INTEGER;
BEGIN
    -- NCC compliance check: max 15% annual interest
    IF p_interest_rate > 0.15 THEN
        RAISE EXCEPTION 'Interest rate exceeds NCC maximum of 15%% per annum';
    END IF;
    
    -- Calculate monthly interest rate
    v_monthly_rate := p_interest_rate / 12;
    
    -- Calculate EMI using standard formula
    IF v_monthly_rate > 0 THEN
        v_emi := p_principal * v_monthly_rate * POWER(1 + v_monthly_rate, p_tenure_months) 
                 / (POWER(1 + v_monthly_rate, p_tenure_months) - 1);
    ELSE
        v_emi := p_principal / p_tenure_months;
    END IF;
    
    v_emi := ROUND(v_emi, 2);
    v_total_payment := v_emi * p_tenure_months;
    v_total_interest := v_total_payment - p_principal;
    
    -- Generate payment schedule
    v_remaining_principal := p_principal;
    v_payment_date := CURRENT_DATE + INTERVAL '1 month';
    
    FOR i IN 1..p_tenure_months LOOP
        v_interest_portion := ROUND(v_remaining_principal * v_monthly_rate, 2);
        v_principal_portion := v_emi - v_interest_portion;
        
        -- Last payment adjustment
        IF i = p_tenure_months THEN
            v_principal_portion := v_remaining_principal;
            v_emi := v_principal_portion + v_interest_portion;
        END IF;
        
        v_schedule := v_schedule || jsonb_build_object(
            'payment_number', i,
            'due_date', v_payment_date,
            'emi', v_emi,
            'principal', v_principal_portion,
            'interest', v_interest_portion,
            'remaining_balance', GREATEST(v_remaining_principal - v_principal_portion, 0)
        );
        
        v_remaining_principal := v_remaining_principal - v_principal_portion;
        v_payment_date := v_payment_date + INTERVAL '1 month';
    END LOOP;
    
    RETURN QUERY SELECT v_emi, v_total_interest, v_total_payment, v_schedule;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- DEPOSIT TO SAVINGS FUNCTION
-- ============================================
CREATE OR REPLACE FUNCTION deposit_to_savings(
    p_savings_plan_id UUID,
    p_amount DECIMAL(15,2)
)
RETURNS TABLE (
    success BOOLEAN,
    message TEXT,
    transaction_id UUID,
    new_balance DECIMAL(15,2)
) AS $$
DECLARE
    v_savings RECORD;
    v_wallet RECORD;
    v_reference TEXT;
    v_txn_id UUID;
BEGIN
    -- Lock and get savings plan
    SELECT * INTO v_savings 
    FROM public.savings_plans 
    WHERE id = p_savings_plan_id 
    FOR UPDATE;
    
    IF NOT FOUND OR v_savings.status NOT IN ('active', 'paused') THEN
        RETURN QUERY SELECT FALSE, 'Savings plan not found or inactive'::TEXT, NULL::UUID, 0::DECIMAL;
        RETURN;
    END IF;
    
    -- Lock and get wallet
    SELECT * INTO v_wallet 
    FROM public.wallets 
    WHERE id = v_savings.wallet_id 
    FOR UPDATE;
    
    IF v_wallet.available_balance < p_amount THEN
        RETURN QUERY SELECT FALSE, 'Insufficient funds in wallet'::TEXT, NULL::UUID, 0::DECIMAL;
        RETURN;
    END IF;
    
    v_reference := 'SAV' || TO_CHAR(NOW(), 'YYYYMMDDHH24MISS') || SUBSTR(MD5(RANDOM()::TEXT), 1, 6);
    
    -- Create transaction
    INSERT INTO public.transactions (
        wallet_id, type, category, amount, reference,
        description, status, balance_before, balance_after
    ) VALUES (
        v_savings.wallet_id, 'debit', 'savings_deposit', p_amount, v_reference,
        'Deposit to ' || v_savings.name,
        'completed',
        v_wallet.balance, v_wallet.balance - p_amount
    ) RETURNING id INTO v_txn_id;
    
    -- Update wallet
    UPDATE public.wallets 
    SET 
        balance = balance - p_amount,
        available_balance = available_balance - p_amount
    WHERE id = v_savings.wallet_id;
    
    -- Update savings plan
    UPDATE public.savings_plans 
    SET 
        current_amount = current_amount + p_amount,
        status = 'active'
    WHERE id = p_savings_plan_id;
    
    RETURN QUERY SELECT TRUE, 'Deposit successful'::TEXT, v_txn_id, (v_savings.current_amount + p_amount);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- CALCULATE DAILY INTEREST (For scheduled job)
-- ============================================
CREATE OR REPLACE FUNCTION calculate_daily_interest()
RETURNS INTEGER AS $$
DECLARE
    v_plan RECORD;
    v_daily_rate DECIMAL(10,8);
    v_interest DECIMAL(15,2);
    v_count INTEGER := 0;
BEGIN
    FOR v_plan IN 
        SELECT * FROM public.savings_plans 
        WHERE status = 'active' 
        AND current_amount > 0
        AND (last_interest_calculated_at IS NULL OR last_interest_calculated_at < CURRENT_DATE)
    LOOP
        -- Calculate daily interest (annual rate / 365)
        v_daily_rate := v_plan.interest_rate / 365;
        v_interest := ROUND(v_plan.current_amount * v_daily_rate, 2);
        
        IF v_interest > 0 THEN
            UPDATE public.savings_plans 
            SET 
                accrued_interest = accrued_interest + v_interest,
                last_interest_calculated_at = NOW()
            WHERE id = v_plan.id;
            
            v_count := v_count + 1;
        END IF;
    END LOOP;
    
    RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- GET WALLET BY ACCOUNT NUMBER/PHONE
-- For transfer recipient lookup
-- ============================================
CREATE OR REPLACE FUNCTION find_wallet_by_identifier(
    p_identifier TEXT
)
RETURNS TABLE (
    wallet_id UUID,
    account_number TEXT,
    user_name TEXT,
    is_verified BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        w.id,
        w.account_number,
        u.first_name || ' ' || u.last_name,
        u.is_phone_verified
    FROM public.wallets w
    JOIN public.users u ON u.id = w.user_id
    WHERE (w.account_number = p_identifier OR u.phone_number = p_identifier)
    AND w.status = 'active';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
