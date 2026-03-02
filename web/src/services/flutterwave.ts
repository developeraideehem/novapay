// NovaPay Web - Flutterwave Bill Payment Service
// https://developer.flutterwave.com/docs/bills

const FLUTTERWAVE_SECRET_KEY = import.meta.env.VITE_FLW_SECRET_KEY || 'FLWSECK-3452e5e23dcf24e549ce4cfd79177e94-19c237bb6f9vt-X';
const FLUTTERWAVE_BASE_URL = 'https://api.flutterwave.com/v3';

export interface BillPaymentResponse {
    status: 'success' | 'error';
    message: string;
    data?: any;
    reference?: string;
    amount?: number;
    fee?: number;
    transaction_id?: string;
}

/**
 * Buy airtime using Flutterwave
 */
export const buyAirtime = async (
    phoneNumber: string,
    amount: number,
    network: 'mtn' | 'glo' | 'airtel' | '9mobile'
): Promise<BillPaymentResponse> => {
    try {
        const reference = `airtime_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        const response = await fetch(`${FLUTTERWAVE_BASE_URL}/bills`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${FLUTTERWAVE_SECRET_KEY}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                country: 'NG',
                customer: phoneNumber,
                amount,
                recurrence: 'ONCE',
                type: network.toUpperCase(),
                reference,
            }),
        });

        const data = await response.json();

        if (!response.ok || data.status !== 'success') {
            return {
                status: 'error',
                message: data.message || 'Failed to purchase airtime. Please try again.',
            };
        }

        return {
            status: 'success',
            message: 'Airtime purchased successfully!',
            reference: data.data?.reference || reference,
            amount: data.data?.amount || amount,
            fee: data.data?.fee || 0,
            transaction_id: data.data?.flw_ref,
        };
    } catch (error: any) {
        console.error('Airtime purchase error:', error);
        return {
            status: 'error',
            message: 'Network error. Please check your connection and try again.',
        };
    }
};

/**
 * Buy data bundle using Flutterwave
 */
export const buyData = async (
    phoneNumber: string,
    bundleCode: string,
    amount: number,
    network: 'mtn-data' | 'glo-data' | 'airtel-data' | '9mobile-data'
): Promise<BillPaymentResponse> => {
    try {
        const reference = `data_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        const response = await fetch(`${FLUTTERWAVE_BASE_URL}/bills`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${FLUTTERWAVE_SECRET_KEY}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                country: 'NG',
                customer: phoneNumber,
                amount,
                recurrence: 'ONCE',
                type: network.toUpperCase(),
                reference,
                biller_name: bundleCode,
            }),
        });

        const data = await response.json();

        if (!response.ok || data.status !== 'success') {
            return {
                status: 'error',
                message: data.message || 'Failed to purchase data. Please try again.',
            };
        }

        return {
            status: 'success',
            message: 'Data bundle purchased successfully!',
            reference: data.data?.reference || reference,
            amount: data.data?.amount || amount,
            fee: data.data?.fee || 0,
            transaction_id: data.data?.flw_ref,
        };
    } catch (error: any) {
        console.error('Data purchase error:', error);
        return {
            status: 'error',
            message: 'Network error. Please check your connection and try again.',
        };
    }
};

export default {
    buyAirtime,
    buyData,
};
