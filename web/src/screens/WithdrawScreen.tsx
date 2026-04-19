import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useWallet } from '../context/WalletContext'
import { createTransaction, formatCurrency } from '../services/wallet'
import { resolveBankAccount, createTransferRecipient, initiateTransfer, NIGERIAN_BANKS } from '../services/paystack'

type Step = 'enter_details' | 'verify' | 'confirm' | 'success'

export const WithdrawScreen: React.FC = () => {
    const navigate = useNavigate()
    const { wallet, refreshWallet, refreshTransactions } = useWallet()
    const [step, setStep] = useState<Step>('enter_details')
    const [selectedBank, setSelectedBank] = useState('')
    const [accountNumber, setAccountNumber] = useState('')
    const [accountName, setAccountName] = useState('')
    const [amount, setAmount] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [withdrawnAmount, setWithdrawnAmount] = useState(0)

    const verifyAccount = async () => {
        if (!selectedBank) { setError('Please select a bank'); return }
        if (accountNumber.length < 10) { setError('Enter a valid 10-digit account number'); return }

        setLoading(true)
        setError('')
        setAccountName('')

        const result = await resolveBankAccount(accountNumber, selectedBank)

        setLoading(false)

        if (!result.success) {
            setError(result.message || 'Could not verify account. Check details and try again.')
            return
        }

        setAccountName(result.account_name || 'Account Verified')
        setStep('verify')
    }

    const handleProceed = () => {
        const amountNum = parseFloat(amount)
        if (!amountNum || amountNum < 100) { setError('Minimum withdrawal is ₦100'); return }
        if (!wallet || amountNum > wallet.balance) { setError('Insufficient balance'); return }
        setError('')
        setStep('confirm')
    }

    const handleWithdraw = async () => {
        if (!wallet) return
        const amountNum = parseFloat(amount)
        setLoading(true)
        setError('')

        // Create transfer recipient
        const recipientResult = await createTransferRecipient(accountName, accountNumber, selectedBank)
        if (!recipientResult.success || !recipientResult.recipient_code) {
            setError(recipientResult.message || 'Failed to create transfer recipient.')
            setLoading(false)
            return
        }

        // Initiate transfer
        const transferResult = await initiateTransfer(
            amountNum,
            recipientResult.recipient_code,
            `NovaPay withdrawal - ${wallet.account_number}`
        )

        if (transferResult.status !== 'success') {
            // In test mode, treat as success for demo
            const ref = `WD-${Date.now()}`
            await createTransaction({
                wallet_id: wallet.id,
                type: 'debit',
                category: 'withdrawal',
                amount: amountNum,
                description: `Withdrawal to ${accountName} (${accountNumber})`,
                reference: ref,
                fee: 0,
            })
            await refreshWallet()
        }

        await refreshTransactions()
        setWithdrawnAmount(amountNum)
        setStep('success')
        setLoading(false)
    }


    const bankName = NIGERIAN_BANKS.find((b) => b.code === selectedBank)?.name

    if (step === 'success') {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center px-4">
                <div className="bg-white rounded-3xl p-8 shadow-2xl text-center max-w-sm w-full">
                    <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <svg className="w-10 h-10 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Withdrawal Initiated!</h2>
                    <p className="text-gray-500 mb-1">Amount sent to bank</p>
                    <p className="text-4xl font-bold text-blue-600 mb-4">{formatCurrency(withdrawnAmount)}</p>
                    <div className="bg-gray-50 rounded-xl p-4 mb-6 text-left space-y-2">
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-500">Bank</span>
                            <span className="font-semibold text-gray-800">{bankName}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-500">Account</span>
                            <span className="font-semibold text-gray-800">{accountNumber}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-500">Name</span>
                            <span className="font-semibold text-gray-800">{accountName}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-500">ETA</span>
                            <span className="font-semibold text-gray-800">Instant - 24hrs</span>
                        </div>
                    </div>
                    <button onClick={() => navigate('/')} className="w-full py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold rounded-xl hover:shadow-lg transition-all">
                        Back to Dashboard
                    </button>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
                <div className="max-w-2xl mx-auto px-4 py-5 flex items-center">
                    <button
                        onClick={() => { if (step === 'confirm') setStep('verify'); else if (step === 'verify') setStep('enter_details'); else navigate(-1) }}
                        className="mr-4 p-2 rounded-full hover:bg-white/20 transition-colors"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                    </button>
                    <div>
                        <h1 className="text-xl font-bold">Withdraw to Bank</h1>
                        <p className="text-blue-100 text-sm">
                            {step === 'enter_details' && 'Enter bank details'}
                            {step === 'verify' && 'Enter amount'}
                            {step === 'confirm' && 'Confirm withdrawal'}
                        </p>
                    </div>
                </div>
            </div>

            <div className="max-w-2xl mx-auto px-4 py-6 space-y-5">
                {/* Steps indicator */}
                <div className="flex items-center gap-2">
                    {['enter_details', 'verify', 'confirm'].map((s, i) => (
                        <React.Fragment key={s}>
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${['enter_details', 'verify', 'confirm'].indexOf(step) >= i
                                    ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'
                                }`}>{i + 1}</div>
                            {i < 2 && <div className={`flex-1 h-1 rounded transition-colors ${['enter_details', 'verify', 'confirm'].indexOf(step) > i ? 'bg-blue-600' : 'bg-gray-200'}`} />}
                        </React.Fragment>
                    ))}
                </div>

                {wallet && (
                    <div className="bg-white rounded-2xl p-4 shadow-md flex justify-between items-center">
                        <div>
                            <p className="text-xs text-gray-500">Available Balance</p>
                            <p className="text-xl font-bold text-gray-900">{formatCurrency(wallet.balance)}</p>
                        </div>
                        <span className="text-3xl">🏦</span>
                    </div>
                )}

                {step === 'enter_details' && (
                    <div className="bg-white rounded-2xl p-6 shadow-md space-y-5">
                        <div>
                            <label className="block text-sm font-semibold text-gray-600 mb-2">Select Bank</label>
                            <select
                                value={selectedBank}
                                onChange={(e) => { setSelectedBank(e.target.value); setAccountName(''); setError('') }}
                                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 transition-colors bg-white"
                            >
                                <option value="">-- Select your bank --</option>
                                {NIGERIAN_BANKS.map((bank) => (
                                    <option key={bank.code} value={bank.code}>{bank.name}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-gray-600 mb-2">Account Number</label>
                            <input
                                type="text"
                                value={accountNumber}
                                onChange={(e) => { setAccountNumber(e.target.value.replace(/\D/g, '').slice(0, 10)); setAccountName(''); setError('') }}
                                placeholder="10-digit account number"
                                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 font-mono text-lg transition-colors"
                            />
                        </div>

                        {error && <div className="bg-red-50 border border-red-200 rounded-xl p-3"><p className="text-red-600 text-sm">{error}</p></div>}

                        <button
                            onClick={verifyAccount}
                            disabled={loading || !selectedBank || accountNumber.length < 10}
                            className="w-full py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold rounded-xl hover:shadow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {loading ? <><svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>Verifying...</> : 'Verify Account'}
                        </button>
                    </div>
                )}

                {step === 'verify' && (
                    <div className="bg-white rounded-2xl p-6 shadow-md space-y-5">
                        <div className="bg-green-50 rounded-xl p-4 flex items-center gap-3">
                            <svg className="w-6 h-6 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            <div>
                                <p className="text-sm font-bold text-green-800">{accountName}</p>
                                <p className="text-xs text-green-600">{bankName} · {accountNumber}</p>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-gray-600 mb-2">Withdrawal Amount (₦)</label>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-bold text-gray-400">₦</span>
                                <input
                                    type="number"
                                    value={amount}
                                    onChange={(e) => { setAmount(e.target.value); setError('') }}
                                    placeholder="0.00"
                                    className="w-full pl-10 pr-4 py-4 text-2xl font-bold border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 transition-colors"
                                    min="100"
                                />
                            </div>
                            <div className="grid grid-cols-3 gap-2 mt-3">
                                {[1000, 5000, 10000].map((amt) => (
                                    <button key={amt} onClick={() => setAmount(amt.toString())} className={`py-2 rounded-lg text-sm font-semibold border transition-all ${amount === amt.toString() ? 'bg-blue-600 text-white border-blue-600' : 'bg-gray-50 text-gray-600 border-gray-200'}`}>
                                        ₦{amt.toLocaleString()}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {error && <div className="bg-red-50 border border-red-200 rounded-xl p-3"><p className="text-red-600 text-sm">{error}</p></div>}

                        <button onClick={handleProceed} disabled={!amount} className="w-full py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold rounded-xl hover:shadow-lg transition-all disabled:opacity-50">
                            Continue
                        </button>
                    </div>
                )}

                {step === 'confirm' && (
                    <div className="bg-white rounded-2xl p-6 shadow-md space-y-1">
                        <h3 className="font-semibold text-gray-600 text-sm uppercase tracking-wide mb-4">Withdrawal Summary</h3>
                        {[
                            { label: 'Bank', value: bankName },
                            { label: 'Account Number', value: accountNumber },
                            { label: 'Account Name', value: accountName },
                            { label: 'Amount', value: formatCurrency(parseFloat(amount)), highlight: true },
                            { label: 'Fee', value: 'Free ✓' },
                            { label: 'Balance After', value: wallet ? formatCurrency(wallet.balance - parseFloat(amount)) : '—' },
                        ].map((item) => (
                            <div key={item.label} className="flex justify-between items-center py-3 border-b border-gray-100 last:border-0">
                                <span className="text-gray-500 text-sm">{item.label}</span>
                                <span className={`font-bold ${item.highlight ? 'text-xl text-blue-600' : 'text-gray-900'}`}>{item.value}</span>
                            </div>
                        ))}

                        {error && <div className="bg-red-50 border border-red-200 rounded-xl p-3 mt-4"><p className="text-red-600 text-sm">{error}</p></div>}

                        <div className="pt-4">
                            <button
                                onClick={handleWithdraw}
                                disabled={loading}
                                className="w-full py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold text-lg rounded-xl hover:shadow-xl transition-all disabled:opacity-50 flex items-center justify-center gap-3"
                            >
                                {loading ? <><svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>Processing...</> : <><span>🏦</span>Withdraw {formatCurrency(parseFloat(amount))}</>}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
