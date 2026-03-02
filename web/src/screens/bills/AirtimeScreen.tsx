import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useWallet } from '../../context/WalletContext'
import { buyAirtime } from '../../services/flutterwave'
import { createTransaction, formatCurrency } from '../../services/wallet'

type Network = 'mtn' | 'glo' | 'airtel' | '9mobile'

interface NetworkConfig {
    name: string
    icon: string
    cashback: string
    colors: [string, string]
    code: Network
}

const networks: NetworkConfig[] = [
    { name: 'MTN', icon: '📱', cashback: '1.5%', colors: ['#FFCC00', '#FF9500'], code: 'mtn' },
    { name: 'Glo', icon: '📞', cashback: '1.2%', colors: ['#00A859', '#34C759'], code: 'glo' },
    { name: 'Airtel', icon: '📲', cashback: '1.0%', colors: ['#DC143C', '#FF6347'], code: 'airtel' },
    { name: '9mobile', icon: '☎️', cashback: '1.0%', colors: ['#006838', '#009B4D'], code: '9mobile' },
]

export const AirtimeScreen: React.FC = () => {
    const navigate = useNavigate()
    const { wallet, refreshWallet, refreshTransactions } = useWallet()
    const [selectedNetwork, setSelectedNetwork] = useState<NetworkConfig | null>(null)
    const [phoneNumber, setPhoneNumber] = useState('')
    const [amount, setAmount] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [success, setSuccess] = useState(false)

    const handleNetworkSelect = (network: NetworkConfig) => {
        setSelectedNetwork(network)
        setError('')
        setSuccess(false)
    }

    const handlePurchase = async () => {
        if (!selectedNetwork || !wallet) return

        // Validation
        if (!phoneNumber || phoneNumber.length < 10) {
            setError('Please enter a valid phone number')
            return
        }

        const amountNum = parseFloat(amount)
        if (!amountNum || amountNum < 50) {
            setError('Minimum amount is ₦50')
            return
        }

        if (amountNum > wallet.balance) {
            setError('Insufficient balance')
            return
        }

        setLoading(true)
        setError('')

        try {
            // Call Flutterwave API
            const result = await buyAirtime(phoneNumber, amountNum, selectedNetwork.code)

            if (result.status === 'success') {
                // Record transaction in Supabase
                await createTransaction({
                    wallet_id: wallet.id,
                    type: 'debit',
                    category: 'airtime',
                    amount: amountNum,
                    description: `${selectedNetwork.name} airtime for ${phoneNumber}`,
                    reference: result.reference,
                    fee: result.fee || 0,
                    cashback: (amountNum * parseFloat(selectedNetwork.cashback)) / 100,
                })

                // Refresh wallet and transactions
                await refreshWallet()
                await refreshTransactions()

                setSuccess(true)

                // Reset form after 2 seconds and show success
                setTimeout(() => {
                    navigate('/')
                }, 2000)
            } else {
                setError(result.message || 'Purchase failed. Please try again.')
            }
        } catch (err: any) {
            setError(err.message || 'An error occurred. Please try again.')
        } finally {
            setLoading(false)
        }
    }

    const handleBack = () => {
        if (selectedNetwork) {
            setSelectedNetwork(null)
            setPhoneNumber('')
            setAmount('')
            setError('')
            setSuccess(false)
        } else {
            navigate(-1)
        }
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
            {/* Header */}
            <div className="bg-white shadow-sm">
                <div className="max-w-2xl mx-auto px-4 py-4 flex items-center">
                    <button
                        onClick={handleBack}
                        className="text-2xl mr-4 hover:bg-gray-100 rounded-full p-2 transition-colors"
                    >
                        ←
                    </button>
                    <h1 className="text-xl font-bold text-gray-900">Buy Airtime</h1>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-2xl mx-auto px-4 py-6">
                {!selectedNetwork ? (
                    <>
                        <h2 className="text-lg font-semibold text-gray-800 mb-4">Select Network</h2>
                        <div className="space-y-3">
                            {networks.map((network) => (
                                <button
                                    key={network.code}
                                    onClick={() => handleNetworkSelect(network)}
                                    className="w-full bg-white rounded-2xl p-4 shadow-md hover:shadow-lg transition-all"
                                    style={{
                                        background: `linear-gradient(135deg, ${network.colors[0]} 0%, ${network.colors[1]} 100%)`,
                                    }}
                                >
                                    <div className="flex justify-between items-center text-white">
                                        <div className="flex items-center">
                                            <span className="text-3xl mr-3">{network.icon}</span>
                                            <span className="font-bold text-lg">{network.name}</span>
                                        </div>
                                        <span className="text-sm opacity-90">{network.cashback} cashback</span>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </>
                ) : (
                    <div className="bg-white rounded-2xl p-6 shadow-lg">
                        <div
                            className="rounded-xl p-4 mb-6"
                            style={{
                                background: `linear-gradient(135deg, ${selectedNetwork.colors[0]} 0%, ${selectedNetwork.colors[1]} 100%)`,
                            }}
                        >
                            <div className="flex items-center text-white">
                                <span className="text-4xl mr-3">{selectedNetwork.icon}</span>
                                <div>
                                    <h3 className="font-bold text-xl">{selectedNetwork.name}</h3>
                                    <p className="text-sm opacity-90">{selectedNetwork.cashback} cashback</p>
                                </div>
                            </div>
                        </div>

                        {success ? (
                            <div className="text-center py-8">
                                <div className="text-6xl mb-4">✅</div>
                                <h3 className="text-2xl font-bold text-green-600 mb-2">Success!</h3>
                                <p className="text-gray-600">Airtime purchased successfully</p>
                                <p className="text-sm text-gray-500 mt-2">Redirecting to dashboard...</p>
                            </div>
                        ) : (
                            <>
                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Phone Number
                                    </label>
                                    <input
                                        type="tel"
                                        value={phoneNumber}
                                        onChange={(e) => setPhoneNumber(e.target.value)}
                                        placeholder="08012345678"
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        disabled={loading}
                                    />
                                </div>

                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Amount (₦)
                                    </label>
                                    <input
                                        type="number"
                                        value={amount}
                                        onChange={(e) => setAmount(e.target.value)}
                                        placeholder="100"
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        disabled={loading}
                                    />
                                </div>

                                {/* Quick amounts */}
                                <div className="mb-6">
                                    <p className="text-sm text-gray-600 mb-2">Quick Select:</p>
                                    <div className="grid grid-cols-4 gap-2">
                                        {[100, 200, 500, 1000].map((amt) => (
                                            <button
                                                key={amt}
                                                onClick={() => setAmount(amt.toString())}
                                                className="py-2 px-3 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium transition-colors"
                                                disabled={loading}
                                            >
                                                ₦{amt}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {wallet && amount && (
                                    <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                                        <div className="flex justify-between text-sm mb-1">
                                            <span className="text-gray-600">Current Balance:</span>
                                            <span className="font-medium">{formatCurrency(wallet.balance)}</span>
                                        </div>
                                        {parseFloat(amount) > 0 && (
                                            <div className="flex justify-between text-sm">
                                                <span className="text-gray-600">Balance After:</span>
                                                <span className="font-medium">
                                                    {formatCurrency(wallet.balance - parseFloat(amount))}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {error && (
                                    <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                                        <p className="text-red-600 text-sm">{error}</p>
                                    </div>
                                )}

                                <button
                                    onClick={handlePurchase}
                                    disabled={loading || !phoneNumber || !amount}
                                    className="w-full py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold rounded-lg hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {loading ? 'Processing...' : `Purchase ₦${amount || '0'} Airtime`}
                                </button>
                            </>
                        )}
                    </div>
                )}
            </div>
        </div>
    )
}
