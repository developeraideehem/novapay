import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useWallet } from '../context/WalletContext'
import { formatCurrency } from '../services/wallet'
import { supabase } from '../services/supabase'

type Step = 'enter_details' | 'confirm' | 'success'

export const TransferScreen: React.FC = () => {
    const navigate = useNavigate()
    const { wallet, refreshWallet, refreshTransactions } = useWallet()
    const [step, setStep] = useState<Step>('enter_details')
    const [recipientAccount, setRecipientAccount] = useState('')
    const [amount, setAmount] = useState('')
    const [note, setNote] = useState('')
    const [recipientName, setRecipientName] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [reference, setReference] = useState('')

    const lookupAccount = async () => {
        if (recipientAccount.length < 10) {
            setError('Enter a valid 10-digit account number')
            return
        }
        if (recipientAccount === wallet?.account_number) {
            setError('You cannot transfer to your own account')
            return
        }

        setLoading(true)
        setError('')

        const { data, error: dbError } = await supabase
            .from('wallets')
            .select('account_number, user_id')
            .eq('account_number', recipientAccount)
            .single()

        setLoading(false)

        if (dbError || !data) {
            setError('Account not found. Please check the account number.')
            return
        }

        setRecipientName('NovaPay User')
    }

    const handleProceed = async () => {
        if (!recipientName) {
            await lookupAccount()
            if (!recipientName) return
        }

        const amountNum = parseFloat(amount)
        if (!amountNum || amountNum < 10) {
            setError('Minimum transfer is ₦10')
            return
        }
        if (!wallet || amountNum > wallet.balance) {
            setError('Insufficient balance')
            return
        }

        setError('')
        setStep('confirm')
    }

    const handleTransfer = async () => {
        if (!wallet) return
        const amountNum = parseFloat(amount)
        const ref = `TRF-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`

        setLoading(true)
        setError('')

        const { data, error: rpcError } = await supabase.rpc('transfer_between_wallets', {
            p_sender_wallet_id: wallet.id,
            p_recipient_account_number: recipientAccount,
            p_amount: amountNum,
            p_description: note || `Transfer to ${recipientAccount}`,
            p_reference: ref,
        })

        setLoading(false)

        if (rpcError || !data?.success) {
            setError(data?.message || rpcError?.message || 'Transfer failed. Please try again.')
            setStep('enter_details')
            return
        }

        setReference(ref)
        await refreshWallet()
        await refreshTransactions()
        setStep('success')
    }

    if (step === 'success') {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center px-4">
                <div className="bg-white rounded-3xl p-8 shadow-2xl text-center max-w-sm w-full">
                    <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <svg className="w-10 h-10 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Transfer Sent!</h2>
                    <p className="text-gray-500 mb-1">You sent</p>
                    <p className="text-4xl font-bold text-blue-600 mb-2">{formatCurrency(parseFloat(amount))}</p>
                    <p className="text-gray-500 text-sm mb-1">to</p>
                    <p className="font-semibold text-gray-800 mb-4">{recipientAccount}</p>
                    <div className="bg-gray-50 rounded-xl p-3 mb-6">
                        <p className="text-xs text-gray-400">Transaction Reference</p>
                        <p className="text-xs font-mono font-semibold text-gray-600 mt-1">{reference}</p>
                    </div>
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

    if (step === 'confirm') {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
                <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
                    <div className="max-w-2xl mx-auto px-4 py-5 flex items-center">
                        <button onClick={() => setStep('enter_details')} className="mr-4 p-2 rounded-full hover:bg-white/20 transition-colors">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                        </button>
                        <h1 className="text-xl font-bold">Confirm Transfer</h1>
                    </div>
                </div>

                <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
                    <div className="bg-white rounded-2xl p-6 shadow-md">
                        <h3 className="font-semibold text-gray-600 text-sm mb-4 uppercase tracking-wide">Transfer Summary</h3>
                        <div className="space-y-4">
                            <div className="flex justify-between items-center py-3 border-b border-gray-100">
                                <span className="text-gray-500">Recipient Account</span>
                                <span className="font-bold text-gray-900">{recipientAccount}</span>
                            </div>
                            <div className="flex justify-between items-center py-3 border-b border-gray-100">
                                <span className="text-gray-500">Recipient Name</span>
                                <span className="font-bold text-gray-900">{recipientName}</span>
                            </div>
                            <div className="flex justify-between items-center py-3 border-b border-gray-100">
                                <span className="text-gray-500">Amount</span>
                                <span className="font-bold text-2xl text-blue-600">{formatCurrency(parseFloat(amount))}</span>
                            </div>
                            <div className="flex justify-between items-center py-3 border-b border-gray-100">
                                <span className="text-gray-500">Fee</span>
                                <span className="font-semibold text-green-600">Free</span>
                            </div>
                            {note && (
                                <div className="flex justify-between items-center py-3 border-b border-gray-100">
                                    <span className="text-gray-500">Note</span>
                                    <span className="font-medium text-gray-700 text-right max-w-[200px]">{note}</span>
                                </div>
                            )}
                            <div className="flex justify-between items-center py-3">
                                <span className="text-gray-500">Balance After</span>
                                <span className="font-bold text-gray-900">
                                    {wallet ? formatCurrency(wallet.balance - parseFloat(amount)) : '—'}
                                </span>
                            </div>
                        </div>
                    </div>

                    {error && (
                        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                            <p className="text-red-600 text-sm font-medium">{error}</p>
                        </div>
                    )}

                    <button
                        onClick={handleTransfer}
                        disabled={loading}
                        className="w-full py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold text-lg rounded-xl hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
                    >
                        {loading ? (
                            <><svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>Processing...</>
                        ) : (
                            <><span>📤</span>Confirm Transfer</>
                        )}
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
                    <button onClick={() => navigate(-1)} className="mr-4 p-2 rounded-full hover:bg-white/20 transition-colors">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                    </button>
                    <div>
                        <h1 className="text-xl font-bold">Send Money</h1>
                        <p className="text-blue-100 text-sm">Transfer to any NovaPay wallet</p>
                    </div>
                </div>
            </div>

            <div className="max-w-2xl mx-auto px-4 py-6 space-y-5">
                {wallet && (
                    <div className="bg-white rounded-2xl p-4 shadow-md flex items-center justify-between">
                        <div>
                            <p className="text-xs text-gray-500">Available Balance</p>
                            <p className="text-xl font-bold text-gray-900">{formatCurrency(wallet.balance)}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-xs text-gray-500">Your Account</p>
                            <p className="text-sm font-mono font-semibold text-gray-700">{wallet.account_number}</p>
                        </div>
                    </div>
                )}

                <div className="bg-white rounded-2xl p-6 shadow-md space-y-5">
                    {/* Recipient Account */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-600 mb-2">Recipient Account Number</label>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={recipientAccount}
                                onChange={(e) => {
                                    setRecipientAccount(e.target.value.replace(/\D/g, '').slice(0, 10))
                                    setRecipientName('')
                                    setError('')
                                }}
                                placeholder="Enter 10-digit account number"
                                className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 font-mono text-lg transition-colors"
                            />
                            <button
                                onClick={lookupAccount}
                                disabled={loading || recipientAccount.length < 10}
                                className="px-4 py-3 bg-blue-100 text-blue-700 font-semibold rounded-xl hover:bg-blue-200 transition-colors disabled:opacity-40"
                            >
                                {loading ? '...' : 'Verify'}
                            </button>
                        </div>
                        {recipientName && (
                            <div className="mt-2 flex items-center gap-2 text-green-700">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                                <span className="text-sm font-semibold">{recipientName}</span>
                            </div>
                        )}
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
                                className="w-full pl-9 pr-4 py-3 text-xl font-bold border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 transition-colors"
                                min="10"
                            />
                        </div>
                        <div className="grid grid-cols-4 gap-2 mt-3">
                            {[500, 1000, 5000, 10000].map((amt) => (
                                <button
                                    key={amt}
                                    onClick={() => setAmount(amt.toString())}
                                    className={`py-2 rounded-lg text-xs font-semibold transition-all border ${amount === amt.toString() ? 'bg-blue-600 text-white border-blue-600' : 'bg-gray-50 text-gray-600 border-gray-200 hover:border-blue-300'
                                        }`}
                                >
                                    ₦{amt >= 1000 ? `${amt / 1000}k` : amt}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Note */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-600 mb-2">Note (Optional)</label>
                        <input
                            type="text"
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                            placeholder="What's this for?"
                            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 transition-colors"
                            maxLength={100}
                        />
                    </div>
                </div>

                {error && (
                    <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                        <p className="text-red-600 text-sm font-medium">{error}</p>
                    </div>
                )}

                <button
                    onClick={handleProceed}
                    disabled={loading || !recipientAccount || !amount}
                    className="w-full py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold text-lg rounded-xl hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
                >
                    <span>📤</span>
                    Continue
                </button>
            </div>
        </div>
    )
}
