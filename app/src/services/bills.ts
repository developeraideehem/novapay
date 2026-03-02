// NovaPay - Bills & Airtime Service
import { supabase } from './supabase';
import {
    payElectricity as flutterwavePayElectricity,
    payCableTv as flutterwavePayCableTv
} from './flutterwave-bills';
import { createTransaction } from './wallet';

// Types
export interface BillProvider {
    id: string;
    code: string;
    name: string;
    category: 'airtime' | 'data' | 'electricity' | 'cable_tv' | 'internet' | 'water' | string;
    min_amount: number;
    max_amount: number;
    cashback_percentage: number;
    is_active: boolean;
    logo_url: string | null;
}

export interface DataPlan {
    code: string;
    name: string;
    price: number;
    validity: string;
    data_amount: string;
}

export interface BillPaymentRequest {
    walletId: string;
    providerCode: string;
    amount: number;
    phoneOrAccount: string;
    billerItemCode?: string;
}

// Get all bill providers
export const getBillProviders = async (
    category?: string
): Promise<BillProvider[]> => {
    try {
        let query = supabase
            .from('bill_providers')
            .select('*')
            .eq('is_active', true);

        if (category) {
            query = query.eq('category', category);
        }

        const { data, error } = await query.order('name');

        if (error) {
            console.error('Get providers error:', error);
            return [];
        }

        return data || [];
    } catch (error) {
        console.error('Get providers exception:', error);
        return [];
    }
};

// Get airtime providers (shortcut)
export const getAirtimeProviders = async (): Promise<BillProvider[]> => {
    return getBillProviders('airtime');
};

// Get data providers (shortcut)
export const getDataProviders = async (): Promise<BillProvider[]> => {
    return getBillProviders('data');
};

// Get electricity providers (shortcut)
export const getElectricityProviders = async (): Promise<BillProvider[]> => {
    return getBillProviders('electricity');
};

// Get cable TV providers (shortcut)
export const getCableTvProviders = async (): Promise<BillProvider[]> => {
    return getBillProviders('cable_tv');
};

// Available data plans (mock data - would come from provider API in production)
export const getDataPlans = (providerCode: string): DataPlan[] => {
    const plans: Record<string, DataPlan[]> = {
        MTN_DATA: [
            { code: 'MTN_100MB', name: '100MB', price: 100, validity: '1 day', data_amount: '100MB' },
            { code: 'MTN_200MB', name: '200MB', price: 200, validity: '3 days', data_amount: '200MB' },
            { code: 'MTN_500MB', name: '500MB', price: 300, validity: '1 week', data_amount: '500MB' },
            { code: 'MTN_1GB', name: '1GB', price: 500, validity: '1 month', data_amount: '1GB' },
            { code: 'MTN_2GB', name: '2GB', price: 1000, validity: '1 month', data_amount: '2GB' },
            { code: 'MTN_3GB', name: '3GB', price: 1500, validity: '1 month', data_amount: '3GB' },
            { code: 'MTN_5GB', name: '5GB', price: 2000, validity: '1 month', data_amount: '5GB' },
            { code: 'MTN_10GB', name: '10GB', price: 3500, validity: '1 month', data_amount: '10GB' },
        ],
        AIRTEL_DATA: [
            { code: 'AIRTEL_100MB', name: '100MB', price: 100, validity: '1 day', data_amount: '100MB' },
            { code: 'AIRTEL_500MB', name: '500MB', price: 300, validity: '1 week', data_amount: '500MB' },
            { code: 'AIRTEL_1GB', name: '1GB', price: 500, validity: '1 month', data_amount: '1GB' },
            { code: 'AIRTEL_2GB', name: '2GB', price: 1000, validity: '1 month', data_amount: '2GB' },
            { code: 'AIRTEL_5GB', name: '5GB', price: 2000, validity: '1 month', data_amount: '5GB' },
        ],
        GLO_DATA: [
            { code: 'GLO_100MB', name: '100MB', price: 100, validity: '1 day', data_amount: '100MB' },
            { code: 'GLO_500MB', name: '500MB', price: 200, validity: '1 week', data_amount: '500MB' },
            { code: 'GLO_1GB', name: '1GB', price: 500, validity: '1 month', data_amount: '1GB' },
            { code: 'GLO_2GB', name: '2GB', price: 1000, validity: '1 month', data_amount: '2GB' },
        ],
    };

    return plans[providerCode] || [];
};

// Calculate cashback
export const calculateCashback = (
    amount: number,
    provider: BillProvider
): number => {
    return Math.round((amount * provider.cashback_percentage / 100) * 100) / 100;
};

// Process bill payment (Cable TV)
export const payBill = async (
    request: BillPaymentRequest
): Promise<{ success: true; message: string; transactionId?: string; cashback: number; token?: string } | { success: false; message: string }> => {
    try {
        // Call Flutterwave to pay cable TV
        const result = await flutterwavePayCableTv(
            request.phoneOrAccount,  // smartcard number
            request.amount,
            request.providerCode,     // e.g., 'dstv'
            request.billerItemCode || 'basic'  // package code
        );

        if (result.status !== 'success') {
            return {
                success: false,
                message: result.message || 'Failed to pay cable TV bill. Please try again.',
            };
        }

        // Get provider details for cashback calculation
        const { data: provider } = await supabase
            .from('bill_providers')
            .select('cashback_percentage')
            .eq('code', request.providerCode)
            .single();

        const cashback = provider ? (request.amount * provider.cashback_percentage) / 100 : 0;

        // Record transaction in Supabase
        await createTransaction({
            wallet_id: request.walletId,
            type: 'debit',
            category: 'cable_tv',
            amount: request.amount,
            description: `Cable TV payment for ${request.phoneOrAccount}`,
            recipient_name: request.phoneOrAccount,
            reference: result.reference || '',
            fee: result.fee || 0,
            cashback,
            metadata: {
                provider: request.providerCode,
                smartcard_number: request.phoneOrAccount,
                package: request.billerItemCode,
                transaction_id: result.transaction_id,
            },
        });

        return {
            success: true,
            message: 'Cable TV payment successful',
            transactionId: result.transaction_id,
            cashback,
        };
    } catch (error: any) {
        console.error('Cable TV payment error:', error);
        return {
            success: false,
            message: error.message || 'Payment failed',
        };
    }
};

// Buy airtime
export const buyAirtime = async (
    walletId: string,
    providerCode: string,
    phoneNumber: string,
    amount: number
): Promise<{ success: boolean; message: string; transactionId?: string; cashback?: number }> => {
    return payBill({
        walletId,
        providerCode,
        amount,
        phoneOrAccount: phoneNumber,
    });
};

// Buy data
export const buyData = async (
    walletId: string,
    providerCode: string,
    phoneNumber: string,
    planCode: string,
    amount: number
): Promise<{ success: boolean; message: string; transactionId?: string; cashback?: number }> => {
    return payBill({
        walletId,
        providerCode,
        amount,
        phoneOrAccount: phoneNumber,
        billerItemCode: planCode,
    });
};

// Pay electricity bill
export const payElectricity = async (
    walletId: string,
    providerCode: string,
    meterNumber: string,
    amount: number
): Promise<{ success: true; message: string; transactionId?: string; cashback: number; token?: string } | { success: false; message: string }> => {
    try {
        // Call Flutterwave to pay electricity
        const result = await flutterwavePayElectricity(
            meterNumber,
            amount,
            providerCode  // e.g., 'ekedc-prepaid'
        );

        if (result.status !== 'success') {
            return {
                success: false,
                message: result.message || 'Failed to pay electricity bill. Please try again.',
            };
        }

        // Get provider details for cashback calculation
        const { data: provider } = await supabase
            .from('bill_providers')
            .select('cashback_percentage')
            .eq('code', providerCode)
            .single();

        const cashback = provider ? (amount * provider.cashback_percentage) / 100 : 0;

        // Record transaction in Supabase
        await createTransaction({
            wallet_id: walletId,
            type: 'debit',
            category: 'electricity',
            amount,
            description: `Electricity bill payment for ${meterNumber}`,
            recipient_name: meterNumber,
            reference: result.reference || '',
            fee: result.fee || 0,
            cashback,
            metadata: {
                provider: providerCode,
                meter_number: meterNumber,
                transaction_id: result.transaction_id,
                token: result.data?.token,
            },
        });

        return {
            success: true,
            message: 'Electricity bill paid successfully',
            transactionId: result.transaction_id,
            cashback,
            token: result.data?.token || undefined,
        };
    } catch (error: any) {
        console.error('Electricity payment error:', error);
        return {
            success: false,
            message: error.message || 'Payment failed',
        };
    }
};

// Validate Nigerian phone number
export const isValidNigerianPhone = (phone: string): boolean => {
    const cleaned = phone.replace(/\D/g, '');

    // Must be 11 digits starting with 0, or 13 digits starting with 234
    if (cleaned.length === 11 && cleaned.startsWith('0')) {
        return true;
    }
    if (cleaned.length === 13 && cleaned.startsWith('234')) {
        return true;
    }
    if (cleaned.length === 10) {
        return true; // Without prefix
    }

    return false;
};

// Detect network from phone number
export const detectNetwork = (phone: string): string | null => {
    const cleaned = phone.replace(/\D/g, '');
    let prefix = '';

    if (cleaned.startsWith('234')) {
        prefix = cleaned.substring(3, 7);
    } else if (cleaned.startsWith('0')) {
        prefix = cleaned.substring(1, 5);
    } else {
        prefix = cleaned.substring(0, 4);
    }

    // MTN prefixes
    const mtn = ['0803', '0806', '0810', '0813', '0814', '0816', '0903', '0906', '0913', '0916'];
    // Airtel prefixes
    const airtel = ['0701', '0708', '0802', '0808', '0812', '0901', '0902', '0904', '0907', '0912'];
    // Glo prefixes
    const glo = ['0705', '0805', '0807', '0811', '0815', '0905', '0915'];
    // 9mobile prefixes
    const nineMobile = ['0809', '0817', '0818', '0908', '0909'];

    const prefix4 = '0' + prefix.substring(0, 3);

    if (mtn.some(p => prefix4.startsWith(p.substring(0, 4)))) return 'MTN';
    if (airtel.some(p => prefix4.startsWith(p.substring(0, 4)))) return 'AIRTEL';
    if (glo.some(p => prefix4.startsWith(p.substring(0, 4)))) return 'GLO';
    if (nineMobile.some(p => prefix4.startsWith(p.substring(0, 4)))) return '9MOBILE';

    return null;
};
