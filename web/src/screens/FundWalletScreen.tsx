import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useWallet } from '../context/WalletContext'
import { createTransaction, formatCurrency } from '../services/wallet'
import { PAYSTACK_PUBLIC } from '../services/paystack'

declare global {
    interface Window {
        PaystackPop: any
    }
}

const QUICK_AMOUNTS = [1000, 2000, 5000, 10000, 20000, 50000]

export const FundWalletScreen: React.FC = () => {
    const navigate = useNavigate()
    const { wallet, refreshWallet, refreshTransactions } = useWallet()
    const [amount, setAmount] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [success, setSuccess] = useState(false)
    const [fundedAmount, setFundedAmount] = useState(0)

    const loadPaystackScript = (): Promise<void> => {
        return new Promise((resolve) => {
            if (window.PaystackPop) { resolve(); return }
            const script = document.createElement('script')
            script.src = 'https://js.paystack.co/v1/inline.js'
            script.onload = () => resolve()
            document.head.appendChild(script)
        })
    }

    const handleFund = async () => {
        const amountNum = parseFloat(amount)
        if (!amountNum || amountNum < 100) {
            setError('Minimum amount is ₦100')
            return
        }
        if (amountNum > 1000000) {
            setError('Maximum amount is ₦1,000,000')
            return
        }
        if (!wallet) return

        setLoading(true)
        setError('')

        try {
            await loadPaystackScript()

            const reference = `FUND-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`

            const handler = window.PaystackPop.setup({
                key: PAYSTACK_PUBLIC,
                email: 'user@novapay.ng',
                amount: amountNum * 100, // kobo
                currency: 'NGN',
                ref: reference,
                metadata: {
                    wallet_id: wallet.id,
                    user_id: wallet.user_id,
                },
                callback: async (response: any) => {
                    if (response.status === 'success') {
                        // Record the transaction — 'deposit' matches the DB category constraint
                        await createTransaction({
                            wallet_id: wallet.id,
                            type: 'credit',
                            category: 'deposit',
                            amount: amountNum,
                            description: 'Wallet top-up via Paystack',
                            reference: response.reference,
                            fee: 0,
                        })
                        await refreshWallet()
                        await refreshTransactions()
                        setFundedAmount(amountNum)
                        setSuccess(true)
                        setLoading(false)
                    } else {
                        setError('Payment was not completed. Please try again.')
                        setLoading(false)
                    }
                },
                onClose: () => {
                    setLoading(false)
                    setError('Payment window closed. Try again when ready.')
                },
            })

            handler.openIframe()
        } catch (err: any) {
            setError(err.message || 'Failed to open payment gateway.')
            setLoading(false)
        }
    }

    if (success) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center px-4">
                <div className="bg-white rounded-3xl p-8 shadow-2xl text-center max-w-sm w-full">
                    <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <svg className="w-10 h-10 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Wallet Funded! 🎉</h2>
                    <p className="text-gray-500 mb-4">You added</p>
                    <p className="text-4xl font-bold text-green-600 mb-6">{formatCurrency(fundedAmount)}</p>
                    <p className="text-sm text-gray-500 mb-6">
                        New balance: <span className="font-semibold text-gray-800">{wallet ? formatCurrency(wallet.balance) : '—'}</span>
                    </p>
                    <button
                        onClick={() => navigate('/')}
                        className="w-full py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold rounded-xl hover:shadow-lg transition-all"
                    >
                        Back to Dashboard
                    </button>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
                <div className="max-w-2xl mx-auto px-4 py-5 flex items-center">
                    <button
                        onClick={() => navigate(-1)}
                        className="mr-4 p-2 rounded-full hover:bg-white/20 transition-colors"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                    </button>
                    <div>
                        <h1 className="text-xl font-bold">Fund Wallet</h1>
                        <p className="text-blue-100 text-sm">Add money via card, bank, or USSD</p>
                    </div>
                </div>
            </div>

            <div className="max-w-2xl mx-auto px-4 py-6 space-y-5">
                {/* Current Balance Card */}
                {wallet && (
                    <div className="bg-white rounded-2xl p-5 shadow-md flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500">Current Balance</p>
                            <p className="text-2xl font-bold text-gray-900">{formatCurrency(wallet.balance)}</p>
                        </div>
                        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                            <span className="text-2xl">💰</span>
                        </div>
                    </div>
                )}

                {/* Amount Input */}
                <div className="bg-white rounded-2xl p-6 shadow-md">
                    <label className="block text-sm font-semibold text-gray-600 mb-3">
                        Enter Amount (₦)
                    </label>
                    <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-bold text-gray-400">₦</span>
                        <input
                            type="number"
                            value={amount}
                            onChange={(e) => { setAmount(e.target.value); setError('') }}
                            placeholder="0.00"
                            className="w-full pl-10 pr-4 py-4 text-2xl font-bold border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 transition-colors"
                            disabled={loading}
                            min="100"
                        />
                    </div>

                    {/* Quick amounts */}
                    <p className="text-sm text-gray-500 mt-4 mb-3">Quick Select</p>
                    <div className="grid grid-cols-3 gap-2">
                        {QUICK_AMOUNTS.map((amt) => (
                            <button
                                key={amt}
                                onClick={() => { setAmount(amt.toString()); setError('') }}
                                className={`py-2.5 px-3 rounded-lg text-sm font-semibold transition-all border-2 ${amount === amt.toString()
                                    ? 'bg-blue-600 text-white border-blue-600'
                                    : 'bg-gray-50 text-gray-700 border-gray-200 hover:border-blue-300 hover:bg-blue-50'
                                    }`}
                                disabled={loading}
                            >
                                ₦{amt.toLocaleString()}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Payment Methods */}
                <div className="bg-white rounded-2xl p-6 shadow-md">
                    <p className="text-sm font-semibold text-gray-600 mb-4">Payment Methods Available</p>
                    <div className="grid grid-cols-2 gap-3">
                        {[
                            { icon: '💳', label: 'Debit/Credit Card' },
                            { icon: '🏦', label: 'Bank Transfer' },
                            { icon: '📱', label: 'USSD' },
                            { icon: '🔗', label: 'Bank Account' },
                        ].map((m) => (
                            <div key={m.label} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                                <span className="text-xl">{m.icon}</span>
                                <span className="text-sm text-gray-700 font-medium">{m.label}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Info */}
                <div className="bg-blue-50 rounded-xl p-4 flex gap-3">
                    <span className="text-blue-500 text-lg">ℹ️</span>
                    <div>
                        <p className="text-sm font-semibold text-blue-800">No Hidden Charges</p>
                        <p className="text-xs text-blue-600 mt-1">
                            Standard card fees: 1.5% + ₦100 (capped at ₦2,000). USSD and bank transfers are free.
                        </p>
                    </div>
                </div>

                {error && (
                    <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                        <p className="text-red-600 text-sm font-medium">{error}</p>
                    </div>
                )}

                <button
                    onClick={handleFund}
                    disabled={loading || !amount || parseFloat(amount) < 100}
                    className="w-full py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold text-lg rounded-xl hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
                >
                    {loading ? (
                        <>
                            <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                            </svg>
                            Opening Payment...
                        </>
                    ) : (
                        <>
                            <span>💳</span>
                            Fund {amount ? formatCurrency(parseFloat(amount)) : 'Wallet'}
                        </>
                    )}
                </button>

                <p className="text-center text-xs text-gray-400 pb-2">
                    Secured by <span className="font-semibold text-gray-600">Paystack</span> · PCI DSS Compliant
                </p>
            </div>
        </div>
    )
}
