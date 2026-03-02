// NovaPay - Savings Service (OWealth-style)
import { supabase } from './supabase';

// Types
export interface SavingsPlan {
    id: string;
    user_id: string;
    wallet_id: string;
    name: string;
    plan_type: 'flexible' | 'fixed' | 'target';
    target_amount: number | null;
    current_amount: number;
    interest_rate: number;
    accrued_interest: number;
    start_date: string;
    maturity_date: string | null;
    lock_period_days: number;
    auto_save_enabled: boolean;
    auto_save_amount: number | null;
    auto_save_frequency: 'daily' | 'weekly' | 'monthly' | null;
    status: 'active' | 'paused' | 'matured' | 'withdrawn' | 'closed' | 'completed' | 'liquidated';
    created_at: string;
}

export interface CreateSavingsPlanRequest {
    userId: string;
    walletId: string;
    name: string;
    planType: 'flexible' | 'fixed' | 'target';
    targetAmount?: number;
    interestRate?: number;
    maturityDate?: string;
    lockPeriodDays?: number;
    autoSaveEnabled?: boolean;
    autoSaveAmount?: number;
    autoSaveFrequency?: 'daily' | 'weekly' | 'monthly';
}

// Interest rates by plan type
export const INTEREST_RATES = {
    flexible: 0.10,  // 10% p.a. - can withdraw anytime
    fixed: 0.15,     // 15% p.a. - locked for duration
    target: 0.12,    // 12% p.a. - goal-based savings
};

// Get user's savings plans
export const getSavingsPlans = async (userId: string): Promise<SavingsPlan[]> => {
    try {
        const { data, error } = await supabase
            .from('savings_plans')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Get savings error:', error);
            return [];
        }

        return data || [];
    } catch (error) {
        console.error('Get savings exception:', error);
        return [];
    }
};

// Get single savings plan
export const getSavingsPlan = async (planId: string): Promise<SavingsPlan | null> => {
    try {
        const { data, error } = await supabase
            .from('savings_plans')
            .select('*')
            .eq('id', planId)
            .single();

        if (error) {
            console.error('Get savings plan error:', error);
            return null;
        }

        return data;
    } catch (error) {
        console.error('Get savings plan exception:', error);
        return null;
    }
};

// Create new savings plan
export const createSavingsPlan = async (
    request: CreateSavingsPlanRequest
): Promise<{ success: boolean; message: string; plan?: SavingsPlan }> => {
    try {
        const interestRate = request.interestRate || INTEREST_RATES[request.planType];

        const { data, error } = await supabase
            .from('savings_plans')
            .insert({
                user_id: request.userId,
                wallet_id: request.walletId,
                name: request.name,
                plan_type: request.planType,
                target_amount: request.targetAmount || null,
                interest_rate: interestRate,
                maturity_date: request.maturityDate || null,
                lock_period_days: request.lockPeriodDays || 0,
                auto_save_enabled: request.autoSaveEnabled || false,
                auto_save_amount: request.autoSaveAmount || null,
                auto_save_frequency: request.autoSaveFrequency || null,
            })
            .select()
            .single();

        if (error) {
            return { success: false, message: error.message };
        }

        return { success: true, message: 'Savings plan created', plan: data };
    } catch (error: any) {
        return { success: false, message: error.message || 'Failed to create plan' };
    }
};

// Deposit to savings
export const depositToSavings = async (
    planId: string,
    amount: number
): Promise<{ success: boolean; message: string; newBalance?: number }> => {
    try {
        const { data, error } = await supabase
            .rpc('deposit_to_savings', {
                p_savings_plan_id: planId,
                p_amount: amount,
            });

        if (error) {
            return { success: false, message: error.message };
        }

        if (!data || !data.success) {
            return { success: false, message: data?.message || 'Deposit failed' };
        }

        return {
            success: true,
            message: 'Deposit successful',
            newBalance: data.new_balance,
        };
    } catch (error: any) {
        return { success: false, message: error.message || 'Deposit failed' };
    }
};

// Withdraw from savings
export const withdrawFromSavings = async (
    planId: string,
    amount: number
): Promise<{ success: boolean; message: string; penalty?: number }> => {
    try {
        // Get the plan to check lock period
        const plan = await getSavingsPlan(planId);

        if (!plan) {
            return { success: false, message: 'Savings plan not found' };
        }

        if (plan.status !== 'active') {
            return { success: false, message: 'Savings plan is not active' };
        }

        if (amount > plan.current_amount + plan.accrued_interest) {
            return { success: false, message: 'Insufficient savings balance' };
        }

        // Check lock period for fixed savings
        if (plan.plan_type === 'fixed' && plan.lock_period_days > 0) {
            const startDate = new Date(plan.start_date);
            const lockEndDate = new Date(startDate.getTime() + plan.lock_period_days * 24 * 60 * 60 * 1000);

            if (new Date() < lockEndDate) {
                // Calculate penalty (forfeit accrued interest)
                const penalty = plan.accrued_interest;
                // In production, would deduct penalty and proceed
                return {
                    success: false,
                    message: `Withdrawal before lock period ends. You will lose ₦${penalty.toFixed(2)} in interest.`,
                    penalty,
                };
            }
        }

        // Proceed with withdrawal
        const totalAmount = Math.min(amount, plan.current_amount + plan.accrued_interest);

        // Update savings plan
        const { error: updateError } = await supabase
            .from('savings_plans')
            .update({
                current_amount: plan.current_amount - Math.min(amount, plan.current_amount),
                accrued_interest: Math.max(0, plan.accrued_interest - Math.max(0, amount - plan.current_amount)),
                status: plan.current_amount - amount <= 0 ? 'withdrawn' : 'active',
            })
            .eq('id', planId);

        if (updateError) {
            return { success: false, message: updateError.message };
        }

        // Fetch current wallet to update balance
        const { data: walletData, error: walletFetchError } = await supabase
            .from('wallets')
            .select('balance')
            .eq('id', plan.wallet_id)
            .single();

        if (walletFetchError) {
            return { success: false, message: walletFetchError.message };
        }

        // Credit wallet (Manual update since we don't have atomic increment RPC yet or want to simplify)
        const newBalance = (walletData?.balance || 0) + totalAmount;

        const { error: walletError } = await supabase
            .from('wallets')
            .update({
                balance: newBalance,
                // available_balance removed from update as it is not in the type definition yet, 
                // and generally we should stick to 'balance' or add it to types if it exists in DB.
            })
            .eq('id', plan.wallet_id);

        // Create transaction record
        await supabase.from('transactions').insert({
            wallet_id: plan.wallet_id,
            type: 'credit',
            category: 'savings_withdrawal',
            amount: totalAmount,
            reference: 'SWD' + Date.now() + Math.random().toString(36).substr(2, 6).toUpperCase(),
            description: `Withdrawal from ${plan.name}`,
            status: 'completed',
        });

        return { success: true, message: 'Withdrawal successful' };
    } catch (error: any) {
        return { success: false, message: error.message || 'Withdrawal failed' };
    }
};

// Calculate projected earnings
export const calculateProjectedEarnings = (
    principal: number,
    interestRate: number,
    daysOrMonths: number,
    isMonths: boolean = true
): { total: number; interest: number } => {
    const days = isMonths ? daysOrMonths * 30 : daysOrMonths;
    const dailyRate = interestRate / 365;
    const interest = principal * dailyRate * days;

    return {
        total: principal + interest,
        interest,
    };
};

// Get total savings summary
export const getSavingsSummary = async (
    userId: string
): Promise<{
    totalSaved: number;
    totalInterest: number;
    activePlans: number;
}> => {
    try {
        const plans = await getSavingsPlans(userId);
        const activePlans = plans.filter(p => p.status === 'active');

        const totalSaved = activePlans.reduce((sum, p) => sum + p.current_amount, 0);
        const totalInterest = activePlans.reduce((sum, p) => sum + p.accrued_interest, 0);

        return {
            totalSaved,
            totalInterest,
            activePlans: activePlans.length,
        };
    } catch (error) {
        return { totalSaved: 0, totalInterest: 0, activePlans: 0 };
    }
};
