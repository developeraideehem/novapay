import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useWallet } from '../context/WalletContext'
import { formatCurrency } from '../services/wallet'

export const ProfileScreen: React.FC = () => {
    const navigate = useNavigate()
    const { wallet, transactions } = useWallet()

    const totalSpent = transactions
        .filter((t) => t.type === 'debit')
        .reduce((sum, t) => sum + t.amount, 0)

    const totalReceived = transactions
        .filter((t) => t.type === 'credit')
        .reduce((sum, t) => sum + t.amount, 0)

    const menuItems = [
        { icon: '🔔', label: 'Notifications', sub: 'Manage your alerts', action: () => alert('Coming soon!') },
        { icon: '🔒', label: 'Security & PIN', sub: 'Change PIN, biometrics', action: () => alert('Coming soon!') },
        { icon: '📋', label: 'Transaction History', sub: 'View all transactions', action: () => navigate('/history') },
        { icon: '💳', label: 'Saved Cards', sub: 'Manage payment cards', action: () => alert('Coming soon!') },
        { icon: '🏦', label: 'Saved Banks', sub: 'Saved bank accounts', action: () => alert('Coming soon!') },
        { icon: '🎁', label: 'Referral Programme', sub: 'Earn ₦500 per referral', action: () => alert('Coming soon!') },
        { icon: '⚙️', label: 'Settings', sub: 'App preferences', action: () => alert('Coming soon!') },
        { icon: '🆘', label: 'Help & Support', sub: '24/7 customer support', action: () => alert('Coming soon!') },
        { icon: '📄', label: 'About NovaPay', sub: 'Version 1.0.0', action: () => alert('NovaPay v1.0.0 – Your digital wallet') },
    ]

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white pb-20">
                <div className="max-w-2xl mx-auto px-4 py-5 flex items-center">
                    <button onClick={() => navigate(-1)} className="mr-4 p-2 rounded-full hover:bg-white/20 transition-colors">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                    </button>
                    <h1 className="text-xl font-bold">My Profile</h1>
                </div>
            </div>

            <div className="max-w-2xl mx-auto px-4 -mt-14 space-y-5 pb-10">
                {/* Profile Card */}
                <div className="bg-white rounded-3xl p-6 shadow-xl">
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center text-3xl text-white font-bold shadow-lg">
                            N
                        </div>
                        <div className="flex-1">
                            <h2 className="text-xl font-bold text-gray-900">NovaPay User</h2>
                            <p className="text-gray-500 text-sm">user@novapay.ng</p>
                            {wallet && (
                                <p className="text-xs text-gray-400 mt-1 font-mono">{wallet.account_number}</p>
                            )}
                        </div>
                        <div className="bg-green-100 px-3 py-1 rounded-full">
                            <span className="text-xs font-semibold text-green-700">Tier 1</span>
                        </div>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-3 gap-4 mt-6 pt-5 border-t border-gray-100">
                        <div className="text-center">
                            <p className="text-2xl font-bold text-gray-900">{transactions.length}</p>
                            <p className="text-xs text-gray-500 mt-1">Transactions</p>
                        </div>
                        <div className="text-center border-x border-gray-100">
                            <p className="text-lg font-bold text-green-600">{formatCurrency(totalReceived)}</p>
                            <p className="text-xs text-gray-500 mt-1">Received</p>
                        </div>
                        <div className="text-center">
                            <p className="text-lg font-bold text-red-500">{formatCurrency(totalSpent)}</p>
                            <p className="text-xs text-gray-500 mt-1">Spent</p>
                        </div>
                    </div>
                </div>

                {/* Wallet Info */}
                {wallet && (
                    <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-5 text-white shadow-lg">
                        <div className="flex items-center justify-between mb-4">
                            <p className="text-blue-100 text-sm">Wallet Balance</p>
                            <span className="text-xs bg-white/20 px-2 py-1 rounded-full">NGN</span>
                        </div>
                        <p className="text-3xl font-bold mb-4">{formatCurrency(wallet.balance)}</p>
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-blue-200 text-xs">Account Number</p>
                                <p className="font-mono font-bold tracking-wider">{wallet.account_number}</p>
                            </div>
                            <button
                                onClick={() => { navigator.clipboard?.writeText(wallet.account_number); alert('Account number copied!') }}
                                className="bg-white/20 hover:bg-white/30 transition-colors px-3 py-2 rounded-lg text-xs font-semibold"
                            >
                                Copy
                            </button>
                        </div>
                    </div>
                )}

                {/* KYC Banner */}
                <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3">
                    <span className="text-2xl">🆔</span>
                    <div className="flex-1">
                        <p className="font-bold text-amber-800">Complete KYC Verification</p>
                        <p className="text-xs text-amber-600 mt-1">Verify your BVN to unlock higher transaction limits and full features.</p>
                    </div>
                    <button className="text-xs font-bold text-amber-700 bg-amber-100 px-3 py-2 rounded-lg hover:bg-amber-200 transition-colors whitespace-nowrap">
                        Verify
                    </button>
                </div>

                {/* Menu Items */}
                <div className="bg-white rounded-2xl shadow-md overflow-hidden">
                    {menuItems.map((item, idx) => (
                        <button
                            key={item.label}
                            onClick={item.action}
                            className={`w-full flex items-center gap-4 px-5 py-4 hover:bg-gray-50 transition-colors text-left ${idx < menuItems.length - 1 ? 'border-b border-gray-100' : ''}`}
                        >
                            <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center text-xl flex-shrink-0">
                                {item.icon}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="font-semibold text-gray-800 text-sm">{item.label}</p>
                                <p className="text-xs text-gray-400 truncate">{item.sub}</p>
                            </div>
                            <svg className="w-4 h-4 text-gray-300 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                        </button>
                    ))}
                </div>

                {/* Logout */}
                <button className="w-full py-4 text-red-500 font-bold text-lg border-2 border-red-100 rounded-2xl hover:bg-red-50 transition-colors flex items-center justify-center gap-2">
                    <span>🚪</span> Sign Out
                </button>

                <p className="text-center text-xs text-gray-400 pb-4">
                    NovaPay v1.0.0 · Made with 💙 in Nigeria
                </p>
            </div>
        </div>
    )
}
