import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY
const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001'

if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// ============================================================================
// USER SERVICES
// ============================================================================

export const userService = {
  register: async (email: string, phone_number: string, first_name: string, last_name: string, pin: string) => {
    const response = await fetch(`${apiUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, phone_number, first_name, last_name, pin }),
    })
    return response.json()
  },

  login: async (email: string, pin: string) => {
    const response = await fetch(`${apiUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, pin }),
    })
    return response.json()
  },

  verifyPin: async (email: string, pin: string) => {
    const response = await fetch(`${apiUrl}/api/auth/verify-pin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, pin }),
    })
    return response.json()
  },
}

// ============================================================================
// WALLET SERVICES
// ============================================================================

export const walletService = {
  getWallet: async (token: string) => {
    const response = await fetch(`${apiUrl}/api/wallets`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    return response.json()
  },

  getBalance: async (token: string) => {
    const response = await fetch(`${apiUrl}/api/wallets/balance`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    return response.json()
  },

  fundWallet: async (token: string, amount: number) => {
    const response = await fetch(`${apiUrl}/api/wallets/fund`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ amount }),
    })
    return response.json()
  },

  withdraw: async (token: string, amount: number) => {
    const response = await fetch(`${apiUrl}/api/wallets/withdraw`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ amount }),
    })
    return response.json()
  },
}

// ============================================================================
// TRANSACTION SERVICES
// ============================================================================

export const transactionService = {
  getTransactions: async (token: string) => {
    const response = await fetch(`${apiUrl}/api/transactions`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    return response.json()
  },

  getTransaction: async (token: string, id: string) => {
    const response = await fetch(`${apiUrl}/api/transactions/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    return response.json()
  },

  createTransaction: async (token: string, data: any) => {
    const response = await fetch(`${apiUrl}/api/transactions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    })
    return response.json()
  },
}

// ============================================================================
// BILLS SERVICES
// ============================================================================

export const billsService = {
  payElectricity: async (token: string, provider: string, customer_reference: string, amount: number) => {
    const response = await fetch(`${apiUrl}/api/bills/electricity`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ provider, customer_reference, amount }),
    })
    return response.json()
  },

  payCableTV: async (token: string, provider: string, customer_reference: string, amount: number) => {
    const response = await fetch(`${apiUrl}/api/bills/cable-tv`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ provider, customer_reference, amount }),
    })
    return response.json()
  },

  buyAirtime: async (token: string, provider: string, phone_number: string, amount: number) => {
    const response = await fetch(`${apiUrl}/api/bills/airtime`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ provider, phone_number, amount }),
    })
    return response.json()
  },

  buyData: async (token: string, provider: string, phone_number: string, amount: number, data_plan?: string) => {
    const response = await fetch(`${apiUrl}/api/bills/data`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ provider, phone_number, amount, data_plan }),
    })
    return response.json()
  },
}

// ============================================================================
// PAYSTACK SERVICES
// ============================================================================

export const paystackService = {
  initializePayment: async (email: string, amount: number, reference: string) => {
    const response = await fetch(`${apiUrl}/api/paystack/initialize`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, amount, reference }),
    })
    return response.json()
  },

  verifyPayment: async (reference: string) => {
    const response = await fetch(`${apiUrl}/api/paystack/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reference }),
    })
    return response.json()
  },

  resolveBank: async (account_number: string, bank_code: string) => {
    const response = await fetch(`${apiUrl}/api/paystack/resolve-bank`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ account_number, bank_code }),
    })
    return response.json()
  },

  createRecipient: async (name: string, account_number: string, bank_code: string) => {
    const response = await fetch(`${apiUrl}/api/paystack/create-recipient`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, account_number, bank_code }),
    })
    return response.json()
  },

  transfer: async (amount: number, recipient_code: string, reason?: string) => {
    const response = await fetch(`${apiUrl}/api/paystack/transfer`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount, recipient_code, reason }),
    })
    return response.json()
  },
}
