import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useWallet } from '../../context/WalletContext'
import { createTransaction, formatCurrency } from '../../services/wallet'

interface CableProvider {
    code: string
    name: string
    icon: string
    colors: [string, string]
    packages: CablePackage[]
}

interface CablePackage {
    code: string
    name: string
    price: number
    duration: string
    channels: string
}

const providers: CableProvider[] = [
    {
        code: 'DSTV',
        name: 'DStv',
        icon: '📺',
        colors: ['#0052CC', '#003D99'],
        packages: [
            { code: 'DSTV_PADI', name: 'Padi', price: 2950, duration: '1 month', channels: '65+ channels' },
            { code: 'DSTV_YANGA', name: 'Yanga', price: 3900, duration: '1 month', channels: '80+ channels' },
            { code: 'DSTV_CONFAM', name: 'Confam', price: 6800, duration: '1 month', channels: '115+ channels' },
            { code: 'DSTV_COMPACT', name: 'Compact', price: 15700, duration: '1 month', channels: '145+ channels' },
            { code: 'DSTV_COMPACTPLUS', name: 'Compact+', price: 25000, duration: '1 month', channels: '175+ channels' },
            { code: 'DSTV_PREMIUM', name: 'Premium', price: 37000, duration: '1 month', channels: '200+ channels' },
        ],
    },
    {
        code: 'GOTV',
        name: 'GOtv',
        icon: '📡',
        colors: ['#E8320A', '#B52608'],
        packages: [
            { code: 'GOTV_SMALLIE', name: 'Smallie', price: 1575, duration: '1 month', channels: '35+ channels' },
            { code: 'GOTV_JINJA', name: 'Jinja', price: 2715, duration: '1 month', channels: '55+ channels' },
            { code: 'GOTV_JOLLI', name: 'Jolli', price: 4115, duration: '1 month', channels: '75+ channels' },
            { code: 'GOTV_MAX', name: 'Max', price: 7600, duration: '1 month', channels: '100+ channels' },
        ],
    },
    {
        code: 'STARTIMES',
        name: 'StarTimes',
        icon: '⭐',
        colors: ['#FFD700', '#FFA500'],
        packages: [
            { code: 'ST_NOVA', name: 'Nova', price: 900, duration: '1 month', channels: '25+ channels' },
            { code: 'ST_BASIC', name: 'Basic', price: 1700, duration: '1 month', channels: '55+ channels' },
            { code: 'ST_SMART', name: 'Smart', price: 2500, duration: '1 month', channels: '70+ channels' },
            { code: 'ST_CLASSIC', name: 'Classic', price: 3000, duration: '1 month', channels: '90+ channels' },
            { code: 'ST_SUPER', name: 'Super', price: 6500, duration: '1 month', channels: '120+ channels' },
        ],
    },
]

export const CableTVScreen: React.FC = () => {
    const navigate = useNavigate()
    const { wallet, refreshWallet, refreshTransactions } = useWallet()
    const [selectedProvider, setSelectedProvider] = useState<CableProvider | null>(null)
    const [selectedPackage, setSelectedPackage] = useState<CablePackage | null>(null)
    const [smartCardNumber, setSmartCardNumber] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [success, setSuccess] = useState(false)

    const handlePurchase = async () => {
        if (!selectedProvider || !selectedPackage || !wallet) return
        if (!smartCardNumber || smartCardNumber.length < 8) { setError('Enter a valid smart card / IUC number'); return }
        if (selectedPackage.price > wallet.balance) { setError('Insufficient balance'); return }

        setLoading(true)
        setError('')

        // Simulate API delay
        await new Promise((r) => setTimeout(r, 1800))

        const result = await createTransaction({
            wallet_id: wallet.id,
            type: 'debit',
            category: 'cable_tv',
            amount: selectedPackage.price,
            description: `${selectedProvider.name} ${selectedPackage.name} – ${smartCardNumber}`,
            reference: `CABLE-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
            fee: 0,
        })

        setLoading(false)

        if (result.success) {
            await refreshWallet()
            await refreshTransactions()
            setSuccess(true)
        } else {
            setError(result.message || 'Transaction failed. Please try again.')
        }
    }

    const handleBack = () => {
        if (selectedPackage) { setSelectedPackage(null); setError('') }
        else if (selectedProvider) { setSelectedProvider(null); setSmartCardNumber(''); setError('') }
        else navigate(-1)
    }

    if (success) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 flex items-center justify-center px-4">
                <div className="bg-white rounded-3xl p-8 shadow-2xl text-center max-w-sm w-full">
                    <div className="text-6xl mb-6">📺</div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Subscription Renewed!</h2>
                    <p className="text-gray-500 text-sm mb-4">{selectedProvider?.name} · {selectedPackage?.name}</p>
                    <p className="text-4xl font-bold text-purple-600 mb-6">{selectedPackage ? formatCurrency(selectedPackage.price) : ''}</p>
                    <div className="bg-gray-50 rounded-xl p-4 mb-6 text-left space-y-2">
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-500">Smart Card No.</span>
                            <span className="font-mono font-semibold">{smartCardNumber}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-500">Package</span>
                            <span className="font-semibold">{selectedPackage?.name}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-500">Duration</span>
                            <span className="font-semibold">{selectedPackage?.duration}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-500">Channels</span>
                            <span className="font-semibold">{selectedPackage?.channels}</span>
                        </div>
                    </div>
                    <button onClick={() => navigate('/')} className="w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold rounded-xl hover:shadow-lg transition-all">
                        Back to Dashboard
                    </button>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50">
            <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white">
                <div className="max-w-2xl mx-auto px-4 py-5 flex items-center">
                    <button onClick={handleBack} className="mr-4 p-2 rounded-full hover:bg-white/20 transition-colors">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                    </button>
                    <div>
                        <h1 className="text-xl font-bold">Cable TV</h1>
                        <p className="text-purple-100 text-sm">
                            {!selectedProvider ? 'Select provider' : !selectedPackage ? `${selectedProvider.name} – Select Package` : `${selectedProvider.name} · ${selectedPackage.name}`}
                        </p>
                    </div>
                </div>
            </div>

            <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
                {wallet && (
                    <div className="bg-white rounded-2xl p-4 shadow-md flex justify-between items-center">
                        <div>
                            <p className="text-xs text-gray-500">Available Balance</p>
                            <p className="text-xl font-bold text-gray-900">{formatCurrency(wallet.balance)}</p>
                        </div>
                        <span className="text-3xl">📺</span>
                    </div>
                )}

                {!selectedProvider && (
                    <div className="space-y-4">
                        <h2 className="text-base font-semibold text-gray-700">Select TV Provider</h2>
                        {providers.map((provider) => (
                            <button
                                key={provider.code}
                                onClick={() => { setSelectedProvider(provider); setError('') }}
                                className="w-full bg-white rounded-2xl p-5 shadow-md hover:shadow-xl transition-all text-left"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl" style={{ background: `linear-gradient(135deg, ${provider.colors[0]}, ${provider.colors[1]})` }}>
                                        {provider.icon}
                                    </div>
                                    <div>
                                        <p className="font-bold text-lg text-gray-900">{provider.name}</p>
                                        <p className="text-sm text-gray-500">{provider.packages.length} packages available</p>
                                        <p className="text-xs text-gray-400 mt-1">From {formatCurrency(Math.min(...provider.packages.map(p => p.price)))}/month</p>
                                    </div>
                                    <svg className="w-5 h-5 text-gray-400 ml-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                    </svg>
                                </div>
                            </button>
                        ))}
                    </div>
                )}

                {selectedProvider && !selectedPackage && (
                    <div className="space-y-4">
                        {/* Smart card input */}
                        <div className="bg-white rounded-2xl p-5 shadow-md">
                            <label className="block text-sm font-semibold text-gray-600 mb-2">Smart Card / IUC Number</label>
                            <input
                                type="text"
                                value={smartCardNumber}
                                onChange={(e) => { setSmartCardNumber(e.target.value.replace(/\D/g, '')); setError('') }}
                                placeholder="Enter your smart card number"
                                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-purple-500 font-mono text-lg transition-colors"
                            />
                        </div>

                        <h2 className="text-base font-semibold text-gray-700">Select Package</h2>
                        <div className="space-y-3">
                            {selectedProvider.packages.map((pkg) => (
                                <button
                                    key={pkg.code}
                                    onClick={() => { if (!smartCardNumber || smartCardNumber.length < 8) { setError('Enter smart card number first'); return } setSelectedPackage(pkg); setError('') }}
                                    className="w-full bg-white rounded-xl p-4 shadow-md hover:shadow-lg transition-all text-left"
                                >
                                    <div className="flex justify-between items-center">
                                        <div>
                                            <p className="font-bold text-gray-900">{pkg.name}</p>
                                            <p className="text-sm text-gray-500">{pkg.channels}</p>
                                            <p className="text-xs text-gray-400">{pkg.duration}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-bold text-xl text-purple-600">{formatCurrency(pkg.price)}</p>
                                            <p className={`text-xs mt-1 font-medium ${wallet && pkg.price > wallet.balance ? 'text-red-500' : 'text-green-500'}`}>
                                                {wallet && pkg.price > wallet.balance ? 'Insufficient' : '✓ Affordable'}
                                            </p>
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </div>

                        {error && <div className="bg-red-50 border border-red-200 rounded-xl p-3"><p className="text-red-600 text-sm">{error}</p></div>}
                    </div>
                )}

                {selectedProvider && selectedPackage && (
                    <div className="bg-white rounded-2xl p-6 shadow-md space-y-5">
                        {/* Package banner */}
                        <div className="rounded-xl p-4" style={{ background: `linear-gradient(135deg, ${selectedProvider.colors[0]}, ${selectedProvider.colors[1]})` }}>
                            <div className="flex items-center justify-between text-white">
                                <div className="flex items-center gap-3">
                                    <span className="text-3xl">{selectedProvider.icon}</span>
                                    <div>
                                        <p className="font-bold text-lg">{selectedProvider.name} {selectedPackage.name}</p>
                                        <p className="text-sm opacity-90">{selectedPackage.channels}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="font-bold text-2xl">{formatCurrency(selectedPackage.price)}</p>
                                    <p className="text-sm opacity-90">{selectedPackage.duration}</p>
                                </div>
                            </div>
                        </div>

                        {[
                            { label: 'Smart Card No.', value: smartCardNumber },
                            { label: 'Amount', value: formatCurrency(selectedPackage.price) },
                            { label: 'Service Fee', value: 'Free' },
                            { label: 'Balance After', value: wallet ? formatCurrency(wallet.balance - selectedPackage.price) : '—' },
                        ].map((item) => (
                            <div key={item.label} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0">
                                <span className="text-gray-500 text-sm">{item.label}</span>
                                <span className="font-bold text-gray-900">{item.value}</span>
                            </div>
                        ))}

                        {error && <div className="bg-red-50 border border-red-200 rounded-xl p-3"><p className="text-red-600 text-sm">{error}</p></div>}

                        <button
                            onClick={handlePurchase}
                            disabled={loading}
                            className="w-full py-4 font-bold text-white text-lg rounded-xl hover:shadow-xl transition-all disabled:opacity-50 flex items-center justify-center gap-3"
                            style={{ background: `linear-gradient(135deg, ${selectedProvider.colors[0]}, ${selectedProvider.colors[1]})` }}
                        >
                            {loading ? <><svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>Processing...</> : <><span>📺</span>Subscribe {formatCurrency(selectedPackage.price)}</>}
                        </button>
                    </div>
                )}
            </div>
        </div>
    )
}
