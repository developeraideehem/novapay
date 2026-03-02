import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useWallet } from '../../context/WalletContext'
import { createTransaction, formatCurrency } from '../../services/wallet'

interface ElectricityProvider {
    code: string
    name: string
    shortName: string
    icon: string
    colors: [string, string]
    area: string
}

const providers: ElectricityProvider[] = [
    { code: 'IKEDC', name: 'Ikeja Electric', shortName: 'IKEDC', icon: '⚡', colors: ['#F59E0B', '#D97706'], area: 'Lagos (Ikeja)' },
    { code: 'EKEDC', name: 'Eko Electricity', shortName: 'EKEDC', icon: '⚡', colors: ['#3B82F6', '#1D4ED8'], area: 'Lagos (Eko)' },
    { code: 'AEDC', name: 'Abuja Electricity', shortName: 'AEDC', icon: '⚡', colors: ['#8B5CF6', '#6D28D9'], area: 'FCT Abuja' },
    { code: 'PHED', name: 'Port Harcourt Electric', shortName: 'PHED', icon: '⚡', colors: ['#10B981', '#059669'], area: 'Port Harcourt' },
    { code: 'KEDCO', name: 'Kano Electricity', shortName: 'KEDCO', icon: '⚡', colors: ['#EC4899', '#DB2777'], area: 'Kano' },
    { code: 'IBEDC', name: 'Ibadan Electricity', shortName: 'IBEDC', icon: '⚡', colors: ['#F97316', '#EA580C'], area: 'Ibadan' },
    { code: 'EEDC', name: 'Enugu Electricity', shortName: 'EEDC', icon: '⚡', colors: ['#6366F1', '#4F46E5'], area: 'Enugu' },
    { code: 'BEDC', name: 'Benin Electricity', shortName: 'BEDC', icon: '⚡', colors: ['#14B8A6', '#0D9488'], area: 'Benin' },
]

export const ElectricityScreen: React.FC = () => {
    const navigate = useNavigate()
    const { wallet, refreshWallet, refreshTransactions } = useWallet()
    const [selectedProvider, setSelectedProvider] = useState<ElectricityProvider | null>(null)
    const [meterNumber, setMeterNumber] = useState('')
    const [meterType, setMeterType] = useState<'prepaid' | 'postpaid'>('prepaid')
    const [amount, setAmount] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [success, setSuccess] = useState(false)
    const [token, setToken] = useState('')

    const handlePurchase = async () => {
        if (!selectedProvider || !wallet) return
        if (!meterNumber || meterNumber.length < 10) { setError('Enter a valid meter number (min. 10 digits)'); return }
        const amountNum = parseFloat(amount)
        if (!amountNum || amountNum < 1000) { setError('Minimum amount is ₦1,000'); return }
        if (amountNum > wallet.balance) { setError('Insufficient balance'); return }

        setLoading(true)
        setError('')

        // Simulate API call - in production, integrate Flutterwave/Buypower/Baxi
        await new Promise((resolve) => setTimeout(resolve, 2000))

        const result = await createTransaction({
            wallet_id: wallet.id,
            type: 'debit',
            category: 'electricity',
            amount: amountNum,
            description: `${selectedProvider.name} electricity - Meter ${meterNumber}`,
            reference: `ELEC-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
            fee: 100,
        })

        if (result.success) {
            // Generate a mock token
            setToken(Array.from({ length: 5 }, () => Math.floor(Math.random() * 10000).toString().padStart(4, '0')).join('-'))
            await refreshWallet()
            await refreshTransactions()
            setSuccess(true)
        } else {
            setError(result.message || 'Transaction failed. Please try again.')
        }

        setLoading(false)
    }

    const handleBack = () => {
        if (selectedProvider) { setSelectedProvider(null); setMeterNumber(''); setAmount(''); setError('') }
        else navigate(-1)
    }

    if (success) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-yellow-50 to-orange-50 flex items-center justify-center px-4">
                <div className="bg-white rounded-3xl p-8 shadow-2xl text-center max-w-sm w-full">
                    <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <span className="text-4xl">⚡</span>
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-1">Power Purchased!</h2>
                    <p className="text-gray-500 text-sm mb-4">{selectedProvider?.name}</p>
                    <p className="text-4xl font-bold text-yellow-600 mb-6">{formatCurrency(parseFloat(amount))}</p>

                    {meterType === 'prepaid' && (
                        <div className="bg-yellow-50 border-2 border-yellow-200 rounded-2xl p-4 mb-6">
                            <p className="text-xs text-yellow-700 font-semibold uppercase tracking-wide mb-2">Token</p>
                            <p className="text-2xl font-mono font-bold text-yellow-800 tracking-wider">{token}</p>
                            <p className="text-xs text-yellow-600 mt-2">Enter this on your prepaid meter</p>
                        </div>
                    )}

                    <div className="bg-gray-50 rounded-xl p-4 mb-6 text-left space-y-1">
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-500">Meter Number</span>
                            <span className="font-mono font-semibold">{meterNumber}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-500">Meter Type</span>
                            <span className="font-semibold capitalize">{meterType}</span>
                        </div>
                    </div>

                    <button onClick={() => navigate('/')} className="w-full py-3 bg-gradient-to-r from-yellow-500 to-orange-500 text-white font-bold rounded-xl hover:shadow-lg transition-all">
                        Back to Dashboard
                    </button>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-yellow-50 to-orange-50">
            <div className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white">
                <div className="max-w-2xl mx-auto px-4 py-5 flex items-center">
                    <button onClick={handleBack} className="mr-4 p-2 rounded-full hover:bg-white/20 transition-colors">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                    </button>
                    <div>
                        <h1 className="text-xl font-bold">Electricity</h1>
                        <p className="text-yellow-100 text-sm">{selectedProvider ? selectedProvider.name : 'Pay your electricity bill'}</p>
                    </div>
                </div>
            </div>

            <div className="max-w-2xl mx-auto px-4 py-6 space-y-5">
                {wallet && (
                    <div className="bg-white rounded-2xl p-4 shadow-md flex justify-between items-center">
                        <div>
                            <p className="text-xs text-gray-500">Available Balance</p>
                            <p className="text-xl font-bold text-gray-900">{formatCurrency(wallet.balance)}</p>
                        </div>
                        <span className="text-3xl">⚡</span>
                    </div>
                )}

                {!selectedProvider ? (
                    <div>
                        <h2 className="text-base font-semibold text-gray-700 mb-3">Select Your Provider (DISCO)</h2>
                        <div className="grid grid-cols-2 gap-3">
                            {providers.map((provider) => (
                                <button
                                    key={provider.code}
                                    onClick={() => { setSelectedProvider(provider); setError('') }}
                                    className="bg-white rounded-2xl p-4 shadow-md hover:shadow-lg transition-all text-left"
                                    style={{ borderTop: `4px solid ${provider.colors[0]}` }}
                                >
                                    <div className="text-2xl mb-2" style={{ color: provider.colors[0] }}>{provider.icon}</div>
                                    <p className="font-bold text-gray-900 text-sm">{provider.shortName}</p>
                                    <p className="text-xs text-gray-500 mt-1">{provider.area}</p>
                                </button>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className="bg-white rounded-2xl p-6 shadow-md space-y-5">
                        {/* Provider banner */}
                        <div className="rounded-xl p-4" style={{ background: `linear-gradient(135deg, ${selectedProvider.colors[0]}, ${selectedProvider.colors[1]})` }}>
                            <div className="flex items-center text-white gap-3">
                                <span className="text-3xl">{selectedProvider.icon}</span>
                                <div>
                                    <p className="font-bold text-lg">{selectedProvider.name}</p>
                                    <p className="text-sm opacity-90">{selectedProvider.area}</p>
                                </div>
                            </div>
                        </div>

                        {/* Meter Type */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-600 mb-2">Meter Type</label>
                            <div className="flex gap-3">
                                {(['prepaid', 'postpaid'] as const).map((type) => (
                                    <button
                                        key={type}
                                        onClick={() => setMeterType(type)}
                                        className={`flex-1 py-3 rounded-xl font-semibold text-sm capitalize border-2 transition-all ${meterType === type ? 'border-yellow-500 bg-yellow-50 text-yellow-700' : 'border-gray-200 text-gray-500 hover:border-yellow-300'}`}
                                    >
                                        {type}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Meter Number */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-600 mb-2">Meter Number</label>
                            <input
                                type="text"
                                value={meterNumber}
                                onChange={(e) => { setMeterNumber(e.target.value.replace(/\D/g, '')); setError('') }}
                                placeholder="Enter meter number"
                                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-yellow-500 font-mono text-lg transition-colors"
                            />
                        </div>

                        {/* Amount */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-600 mb-2">Amount (₦)</label>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl font-bold text-gray-400">₦</span>
                                <input
                                    type="number"
                                    value={amount}
                                    onChange={(e) => { setAmount(e.target.value); setError('') }}
                                    placeholder="0.00"
                                    className="w-full pl-9 pr-4 py-3 text-xl font-bold border-2 border-gray-200 rounded-xl focus:outline-none focus:border-yellow-500 transition-colors"
                                />
                            </div>
                            <div className="grid grid-cols-4 gap-2 mt-3">
                                {[1000, 2000, 5000, 10000].map((amt) => (
                                    <button key={amt} onClick={() => setAmount(amt.toString())} className={`py-2 rounded-lg text-xs font-semibold border transition-all ${amount === amt.toString() ? 'bg-yellow-500 text-white border-yellow-500' : 'bg-gray-50 text-gray-600 border-gray-200 hover:border-yellow-300'}`}>
                                        ₦{amt >= 1000 ? `${amt / 1000}k` : amt}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {wallet && amount && (
                            <div className="bg-yellow-50 rounded-xl p-3">
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-600">Balance After</span>
                                    <span className="font-semibold">{formatCurrency(wallet.balance - (parseFloat(amount) || 0) - 100)}</span>
                                </div>
                                <div className="flex justify-between text-sm mt-1">
                                    <span className="text-gray-600">Service Fee</span>
                                    <span className="font-semibold">₦100</span>
                                </div>
                            </div>
                        )}

                        {error && <div className="bg-red-50 border border-red-200 rounded-xl p-3"><p className="text-red-600 text-sm">{error}</p></div>}

                        <button
                            onClick={handlePurchase}
                            disabled={loading || !meterNumber || !amount}
                            className="w-full py-4 font-bold text-white text-lg rounded-xl hover:shadow-xl transition-all disabled:opacity-50 flex items-center justify-center gap-3"
                            style={{ background: 'linear-gradient(135deg, #F59E0B, #D97706)' }}
                        >
                            {loading ? <><svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>Processing...</> : <><span>⚡</span>Pay {amount ? formatCurrency(parseFloat(amount)) : 'Now'}</>}
                        </button>
                    </div>
                )}
            </div>
        </div>
    )
}
