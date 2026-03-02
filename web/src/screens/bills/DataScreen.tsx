import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useWallet } from '../../context/WalletContext'
import { buyData } from '../../services/flutterwave'
import { createTransaction, formatCurrency } from '../../services/wallet'

type Network = 'mtn-data' | 'glo-data' | 'airtel-data' | '9mobile-data'

interface DataPlan {
    code: string
    name: string
    price: number
    validity: string
    data_amount: string
}

interface NetworkConfig {
    name: string
    icon: string
    cashback: string
    colors: [string, string]
    code: Network
    plans: DataPlan[]
}

const networks: NetworkConfig[] = [
    {
        name: 'MTN',
        icon: '📱',
        cashback: '2.0%',
        colors: ['#FFCC00', '#FF9500'],
        code: 'mtn-data',
        plans: [
            { code: 'MTN_500MB', name: '500MB', price: 300, validity: '1 week', data_amount: '500MB' },
            { code: 'MTN_1GB', name: '1GB', price: 500, validity: '1 month', data_amount: '1GB' },
            { code: 'MTN_2GB', name: '2GB', price: 1000, validity: '1 month', data_amount: '2GB' },
            { code: 'MTN_3GB', name: '3GB', price: 1500, validity: '1 month', data_amount: '3GB' },
            { code: 'MTN_5GB', name: '5GB', price: 2000, validity: '1 month', data_amount: '5GB' },
            { code: 'MTN_10GB', name: '10GB', price: 3500, validity: '1 month', data_amount: '10GB' },
        ],
    },
    {
        name: 'Glo',
        icon: '📞',
        cashback: '1.8%',
        colors: ['#00A859', '#34C759'],
        code: 'glo-data',
        plans: [
            { code: 'GLO_500MB', name: '500MB', price: 200, validity: '1 week', data_amount: '500MB' },
            { code: 'GLO_1GB', name: '1GB', price: 500, validity: '1 month', data_amount: '1GB' },
            { code: 'GLO_2GB', name: '2GB', price: 1000, validity: '1 month', data_amount: '2GB' },
            { code: 'GLO_3GB', name: '3GB', price: 1500, validity: '1 month', data_amount: '3GB' },
            { code: 'GLO_5GB', name: '5GB', price: 2000, validity: '1 month', data_amount: '5GB' },
        ],
    },
    {
        name: 'Airtel',
        icon: '📲',
        cashback: '1.5%',
        colors: ['#DC143C', '#FF6347'],
        code: 'airtel-data',
        plans: [
            { code: 'AIRTEL_500MB', name: '500MB', price: 300, validity: '1 week', data_amount: '500MB' },
            { code: 'AIRTEL_1GB', name: '1GB', price: 500, validity: '1 month', data_amount: '1GB' },
            { code: 'AIRTEL_2GB', name: '2GB', price: 1000, validity: '1 month', data_amount: '2GB' },
            { code: 'AIRTEL_5GB', name: '5GB', price: 2000, validity: '1 month', data_amount: '5GB' },
        ],
    },
    {
        name: '9mobile',
        icon: '☎️',
        cashback: '1.5%',
        colors: ['#006838', '#009B4D'],
        code: '9mobile-data',
        plans: [
            { code: '9MOBILE_500MB', name: '500MB', price: 300, validity: '1 week', data_amount: '500MB' },
            { code: '9MOBILE_1GB', name: '1GB', price: 500, validity: '1 month', data_amount: '1GB' },
            { code: '9MOBILE_2GB', name: '2GB', price: 1000, validity: '1 month', data_amount: '2GB' },
        ],
    },
]

export const DataScreen: React.FC = () => {
    const navigate = useNavigate()
    const { wallet, refreshWallet, refreshTransactions } = useWallet()
    const [selectedNetwork, setSelectedNetwork] = useState<NetworkConfig | null>(null)
    const [selectedPlan, setSelectedPlan] = useState<DataPlan | null>(null)
    const [phoneNumber, setPhoneNumber] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [success, setSuccess] = useState(false)

    const handleNetworkSelect = (network: NetworkConfig) => {
        setSelectedNetwork(network)
        setSelectedPlan(null)
        setError('')
        setSuccess(false)
    }

    const handlePlanSelect = (plan: DataPlan) => {
        setSelectedPlan(plan)
        setError('')
    }

    const handlePurchase = async () => {
        if (!selectedNetwork || !selectedPlan || !wallet) return

        // Validation
        if (!phoneNumber || phoneNumber.length < 10) {
            setError('Please enter a valid phone number')
            return
        }

        if (selectedPlan.price > wallet.balance) {
            setError('Insufficient balance')
            return
        }

        setLoading(true)
        setError('')

        try {
            // Call Flutterwave API
            const result = await buyData(
                phoneNumber,
                selectedPlan.code,
                selectedPlan.price,
                selectedNetwork.code
            )

            if (result.status === 'success') {
                // Record transaction in Supabase
                await createTransaction({
                    wallet_id: wallet.id,
                    type: 'debit',
                    category: 'data',
                    amount: selectedPlan.price,
                    description: `${selectedNetwork.name} ${selectedPlan.data_amount} data for ${phoneNumber}`,
                    reference: result.reference,
                    fee: result.fee || 0,
                    cashback: (selectedPlan.price * parseFloat(selectedNetwork.cashback)) / 100,
                })

                // Refresh wallet and transactions
                await refreshWallet()
                await refreshTransactions()

                setSuccess(true)

                // Reset form after 2 seconds
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
        if (selectedPlan) {
            setSelectedPlan(null)
            setPhoneNumber('')
            setError('')
            setSuccess(false)
        } else if (selectedNetwork) {
            setSelectedNetwork(null)
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
                    <h1 className="text-xl font-bold text-gray-900">Buy Data</h1>
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
                ) : !selectedPlan ? (
                    <>
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

                        <h2 className="text-lg font-semibold text-gray-800 mb-4">Select Data Plan</h2>
                        <div className="space-y-3">
                            {selectedNetwork.plans.map((plan) => (
                                <button
                                    key={plan.code}
                                    onClick={() => handlePlanSelect(plan)}
                                    className="w-full bg-white rounded-xl p-4 shadow-md hover:shadow-lg transition-all text-left"
                                >
                                    <div className="flex justify-between items-center">
                                        <div>
                                            <p className="font-bold text-lg text-gray-900">
                                                {plan.data_amount}
                                            </p>
                                            <p className="text-sm text-gray-500">{plan.validity}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-bold text-xl text-blue-600">
                                                ₦{plan.price.toLocaleString()}
                                            </p>
                                        </div>
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
                            <div className="flex items-center justify-between text-white">
                                <div className="flex items-center">
                                    <span className="text-4xl mr-3">{selectedNetwork.icon}</span>
                                    <div>
                                        <h3 className="font-bold text-xl">{selectedNetwork.name}</h3>
                                        <p className="text-sm opacity-90">{selectedPlan.data_amount}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="font-bold text-2xl">₦{selectedPlan.price}</p>
                                    <p className="text-sm opacity-90">{selectedPlan.validity}</p>
                                </div>
                            </div>
                        </div>

                        {success ? (
                            <div className="text-center py-8">
                                <div className="text-6xl mb-4">✅</div>
                                <h3 className="text-2xl font-bold text-green-600 mb-2">Success!</h3>
                                <p className="text-gray-600">Data bundle purchased successfully</p>
                                <p className="text-sm text-gray-500 mt-2">Redirecting to dashboard...</p>
                            </div>
                        ) : (
                            <>
                                <div className="mb-6">
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

                                {wallet && (
                                    <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                                        <div className="flex justify-between text-sm mb-1">
                                            <span className="text-gray-600">Current Balance:</span>
                                            <span className="font-medium">{formatCurrency(wallet.balance)}</span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-600">Balance After:</span>
                                            <span className="font-medium">
                                                {formatCurrency(wallet.balance - selectedPlan.price)}
                                            </span>
                                        </div>
                                    </div>
                                )}

                                {error && (
                                    <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                                        <p className="text-red-600 text-sm">{error}</p>
                                    </div>
                                )}

                                <button
                                    onClick={handlePurchase}
                                    disabled={loading || !phoneNumber}
                                    className="w-full py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold rounded-lg hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {loading
                                        ? 'Processing...'
                                        : `Purchase ${selectedPlan.data_amount} for ₦${selectedPlan.price}`}
                                </button>
                            </>
                        )}
                    </div>
                )}
            </div>
        </div>
    )
}
