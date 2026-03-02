import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useWallet } from '../context/WalletContext'
import { formatCurrency } from '../services/wallet'

interface QuickAction {
    icon: string
    label: string
    path: string
    colors: [string, string]
}

const quickActions: QuickAction[] = [
    { icon: '💵', label: 'Fund Wallet', path: '/fund-wallet', colors: ['#10B981', '#059669'] },
    { icon: '↗️', label: 'Transfer', path: '/transfer', colors: ['#3B82F6', '#1D4ED8'] },
    { icon: '🏦', label: 'Withdraw', path: '/withdraw', colors: ['#8B5CF6', '#6D28D9'] },
    { icon: '📱', label: 'Data', path: '/data', colors: ['#F59E0B', '#D97706'] },
    { icon: '📞', label: 'Airtime', path: '/airtime', colors: ['#EC4899', '#DB2777'] },
    { icon: '💡', label: 'Bills', path: '/bills', colors: ['#F97316', '#EA580C'] },
]

const categoryIcons: Record<string, string> = {
    airtime: '📞',
    data: '📱',
    electricity: '⚡',
    cable_tv: '📺',
    transfer: '↗️',
    wallet_funding: '💵',
    withdrawal: '🏦',
    default: '💳',
}

export const DashboardScreen: React.FC = () => {
    const navigate = useNavigate()
    const { wallet, transactions, loading, refreshWallet } = useWallet()

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-gray-600 font-medium">Loading NovaPay...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-700 to-purple-700 text-white pt-6 pb-24 px-4">
                <div className="max-w-2xl mx-auto flex justify-between items-start">
                    <div>
                        <p className="text-blue-200 text-sm font-medium">Good morning 👋</p>
                        <h1 className="text-2xl font-bold mt-1">NovaPay</h1>
                    </div>
                    <button
                        onClick={() => navigate('/profile')}
                        className="w-10 h-10 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center text-xl transition-colors"
                    >
                        👤
                    </button>
                </div>
            </div>

            {/* Balance Card */}
            <div className="max-w-2xl mx-auto px-4 -mt-16">
                <div className="bg-white rounded-3xl p-6 shadow-2xl mb-6">
                    <div className="flex justify-between items-start mb-1">
                        <p className="text-gray-500 text-sm">Available Balance</p>
                        <button
                            onClick={refreshWallet}
                            className="text-blue-500 hover:text-blue-700 p-1 rounded-full hover:bg-blue-50 transition-colors"
                            title="Refresh balance"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                        </button>
                    </div>
                    <h2 className="text-4xl font-bold text-gray-900 mb-3">
                        {wallet ? formatCurrency(wallet.balance) : '₦0.00'}
                    </h2>
                    {wallet && (
                        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                            <div>
                                <p className="text-xs text-gray-400">Account Number</p>
                                <p className="text-sm font-mono font-bold text-gray-700 tracking-wider">{wallet.account_number}</p>
                            </div>
                            <button
                                onClick={() => { navigator.clipboard?.writeText(wallet.account_number); }}
                                className="text-xs text-blue-500 font-semibold bg-blue-50 px-3 py-1.5 rounded-full hover:bg-blue-100 transition-colors"
                            >
                                Copy
                            </button>
                        </div>
                    )}
                </div>

                {/* Quick Actions Grid */}
                <div className="mb-6">
                    <h3 className="text-base font-bold text-gray-700 mb-3">Quick Actions</h3>
                    <div className="grid grid-cols-3 gap-3">
                        {quickActions.map((action) => (
                            <button
                                key={action.path}
                                onClick={() => navigate(action.path)}
                                className="bg-white rounded-2xl p-4 shadow-md hover:shadow-xl active:scale-95 transition-all text-center group"
                            >
                                <div
                                    className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl mx-auto mb-2 group-hover:scale-110 transition-transform"
                                    style={{ background: `linear-gradient(135deg, ${action.colors[0]}, ${action.colors[1]})` }}
                                >
                                    {action.icon}
                                </div>
                                <p className="text-xs font-semibold text-gray-700 leading-tight">{action.label}</p>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Recent Transactions */}
                <div className="mb-8">
                    <div className="flex justify-between items-center mb-3">
                        <h3 className="text-base font-bold text-gray-700">Recent Transactions</h3>
                        {transactions.length > 5 && (
                            <button className="text-xs text-blue-600 font-semibold">See all</button>
                        )}
                    </div>

                    {transactions.length === 0 ? (
                        <div className="bg-white rounded-2xl p-8 shadow-md text-center">
                            <p className="text-4xl mb-3">📭</p>
                            <p className="text-gray-600 font-medium">No transactions yet</p>
                            <p className="text-sm text-gray-400 mt-1">Fund your wallet to get started</p>
                            <button
                                onClick={() => navigate('/fund-wallet')}
                                className="mt-4 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white text-sm font-bold rounded-xl hover:shadow-lg transition-all"
                            >
                                Fund Wallet
                            </button>
                        </div>
                    ) : (
                        <div className="bg-white rounded-2xl shadow-md overflow-hidden">
                            {transactions.slice(0, 6).map((txn, idx) => (
                                <div
                                    key={txn.id}
                                    className={`px-4 py-3.5 flex items-center gap-3 hover:bg-gray-50 transition-colors ${idx < Math.min(transactions.length, 6) - 1 ? 'border-b border-gray-100' : ''}`}
                                >
                                    <div
                                        className={`w-10 h-10 rounded-full flex items-center justify-center text-lg flex-shrink-0 ${txn.type === 'credit' ? 'bg-green-100' : 'bg-red-50'}`}
                                    >
                                        {categoryIcons[txn.category] ?? categoryIcons.default}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-semibold text-gray-800 truncate">
                                            {txn.description || txn.category}
                                        </p>
                                        <p className="text-xs text-gray-400">
                                            {new Date(txn.created_at).toLocaleDateString('en-NG', {
                                                month: 'short',
                                                day: 'numeric',
                                                hour: '2-digit',
                                                minute: '2-digit',
                                            })}
                                        </p>
                                    </div>
                                    <div className="text-right flex-shrink-0">
                                        <p className={`text-sm font-bold ${txn.type === 'credit' ? 'text-green-600' : 'text-red-500'}`}>
                                            {txn.type === 'credit' ? '+' : '-'}{formatCurrency(txn.amount)}
                                        </p>
                                        <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${txn.status === 'completed' ? 'bg-green-100 text-green-700' : txn.status === 'pending' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-600'}`}>
                                            {txn.status}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
