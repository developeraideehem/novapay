// Nigerian Banks List with Paystack Bank Codes
// https://paystack.com/docs/banking/supported-banks/

export interface NigerianBank {
    name: string;
    code: string;
    slug: string;
}

export const nigerianBanks: NigerianBank[] = [
    { name: 'Access Bank', code: '044', slug: 'access-bank' },
    { name: 'Citibank Nigeria', code: '023', slug: 'citibank-nigeria' },
    { name: 'Ecobank Nigeria', code: '050', slug: 'ecobank-nigeria' },
    { name: 'Fidelity Bank', code: '070', slug: 'fidelity-bank' },
    { name: 'First Bank of Nigeria', code: '011', slug: 'first-bank-of-nigeria' },
    { name: 'First City Monument Bank (FCMB)', code: '214', slug: 'fcmb' },
    { name: 'Globus Bank', code: '00103', slug: 'globus-bank' },
    { name: 'Guaranty Trust Bank (GTB)', code: '058', slug: 'gtbank' },
    { name: 'Heritage Bank', code: '030', slug: 'heritage-bank' },
    { name: 'Keystone Bank', code: '082', slug: 'keystone-bank' },
    { name: 'Kuda Bank', code: '50211', slug: 'kuda-bank' },
    { name: 'Opay', code: '999992', slug: 'opay' },
    { name: 'PalmPay', code: '999991', slug: 'palmpay' },
    { name: 'Parallex Bank', code: '526', slug: 'parallex-bank' },
    { name: 'Polaris Bank', code: '076', slug: 'polaris-bank' },
    { name: 'Providus Bank', code: '101', slug: 'providus-bank' },
    { name: 'Stanbic IBTC Bank', code: '221', slug: 'stanbic-ibtc-bank' },
    { name: 'Standard Chartered Bank', code: '068', slug: 'standard-chartered-bank' },
    { name: 'Sterling Bank', code: '232', slug: 'sterling-bank' },
    { name: 'Suntrust Bank', code: '100', slug: 'suntrust-bank' },
    { name: 'Union Bank of Nigeria', code: '032', slug: 'union-bank-of-nigeria' },
    { name: 'United Bank for Africa (UBA)', code: '033', slug: 'uba' },
    { name: 'Unity Bank', code: '215', slug: 'unity-bank' },
    { name: 'Wema Bank', code: '035', slug: 'wema-bank' },
    { name: 'Zenith Bank', code: '057', slug: 'zenith-bank' },
];

/**
 * Find bank by code
 */
export const getBankByCode = (code: string): NigerianBank | undefined => {
    return nigerianBanks.find(bank => bank.code === code);
};

/**
 * Find bank by name (case-insensitive partial match)
 */
export const searchBanks = (query: string): NigerianBank[] => {
    const lowerQuery = query.toLowerCase();
    return nigerianBanks.filter(bank =>
        bank.name.toLowerCase().includes(lowerQuery) ||
        bank.slug.includes(lowerQuery)
    );
};

export default nigerianBanks;
