// NovaPay - Flutterwave Bill Payment Service
// https://developer.flutterwave.com/docs/bills

const FLUTTERWAVE_SECRET_KEY = process.env.FLW_SECRET_KEY || 'FLWSECK_TEST-48ae53a82f6727c19f76b1af91b72ec5-X';
const FLUTTERWAVE_BASE_URL = 'https://api.flutterwave.com/v3';

export interface BillPaymentRequest {
    country: string;
    customer: string;      // Phone number or meter number
    amount: number;
    recurrence?: string;
    type: string;          // AIRTIME, DATABUNDLE, ELECTRICITY, CABLETV
    reference?: string;
}

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
                biller_name: bundleCode,  // Bundle code (e.g., "1GB-30DAYS")
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

/**
 * Get available data bundles for a network
 */
export const getDataBundles = async (
    network: 'mtn-data' | 'glo-data' | 'airtel-data' | '9mobile-data'
): Promise<any[]> => {
    try {
        const response = await fetch(
            `${FLUTTERWAVE_BASE_URL}/bill-categories/${network}/billers`,
            {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${FLUTTERWAVE_SECRET_KEY}`,
                    'Content-Type': 'application/json',
                },
            }
        );

        const data = await response.json();

        if (data.status === 'success' && data.data) {
            return data.data;
        }

        return [];
    } catch (error) {
        console.error('Error fetching data bundles:', error);
        return [];
    }
};

/**
 * Pay electricity bill using Flutterwave
 */
export const payElectricity = async (
    meterNumber: string,
    amount: number,
    billerCode: string,  // e.g., 'ekedc-prepaid'
): Promise<BillPaymentResponse> => {
    try {
        const reference = `electricity_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        const response = await fetch(`${FLUTTERWAVE_BASE_URL}/bills`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${FLUTTERWAVE_SECRET_KEY}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                country: 'NG',
                customer: meterNumber,
                amount,
                recurrence: 'ONCE',
                type: billerCode,
                reference,
            }),
        });

        const data = await response.json();

        if (!response.ok || data.status !== 'success') {
            return {
                status: 'error',
                message: data.message || 'Failed to pay electricity bill. Please try again.',
            };
        }

        return {
            status: 'success',
            message: 'Electricity bill paid successfully!',
            reference: data.data?.reference || reference,
            amount: data.data?.amount || amount,
            fee: data.data?.fee || 0,
            transaction_id: data.data?.flw_ref,
        };
    } catch (error: any) {
        console.error('Electricity payment error:', error);
        return {
            status: 'error',
            message: 'Network error. Please check your connection and try again.',
        };
    }
};

/**
 * Pay cable TV subscription using Flutterwave
 */
export const payCableTv = async (
    smartCardNumber: string,
    amount: number,
    billerCode: string,  // e.g., 'dstv'
    packageCode: string,  // e.g., 'dstv-compact'
): Promise<BillPaymentResponse> => {
    try {
        const reference = `cabletv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        const response = await fetch(`${FLUTTERWAVE_BASE_URL}/bills`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${FLUTTERWAVE_SECRET_KEY}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                country: 'NG',
                customer: smartCardNumber,
                amount,
                recurrence: 'ONCE',
                type: billerCode,
                reference,
                biller_name: packageCode,
            }),
        });

        const data = await response.json();

        if (!response.ok || data.status !== 'success') {
            return {
                status: 'error',
                message: data.message || 'Failed to pay cable TV bill. Please try again.',
            };
        }

        return {
            status: 'success',
            message: 'Cable TV subscription paid successfully!',
            reference: data.data?.reference || reference,
            amount: data.data?.amount || amount,
            fee: data.data?.fee || 0,
            transaction_id: data.data?.flw_ref,
        };
    } catch (error: any) {
        console.error('Cable TV payment error:', error);
        return {
            status: 'error',
            message: 'Network error. Please check your connection and try again.',
        };
    }
};

/**
 * Verify a bill payment transaction
 */
export const verifyBillPayment = async (reference: string): Promise<any> => {
    try {
        const response = await fetch(
            `${FLUTTERWAVE_BASE_URL}/bills/${reference}`,
            {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${FLUTTERWAVE_SECRET_KEY}`,
                    'Content-Type': 'application/json',
                },
            }
        );

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error verifying payment:', error);
        return { status: 'error', message: 'Failed to verify payment' };
    }
};

export default {
    buyAirtime,
    buyData,
    getDataBundles,
    payElectricity,
    payCableTv,
    verifyBillPayment,
};
