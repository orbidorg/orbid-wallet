'use client';

import { useState } from 'react';
import Image from 'next/image';
import { AnimatePresence, motion } from 'framer-motion';
import { MiniKit } from '@worldcoin/minikit-js';
import type { TokenBalance } from '@/lib/types';
import { useToast } from '@/lib/ToastContext';
import { useI18n } from '@/lib/i18n';
import { AnimatedButton, ModalBackdrop, ModalContent, FadeIn, Pressable, StaggerContainer, StaggerItem } from '../ui/Motion';

interface SendModalProps {
    isOpen: boolean;
    onClose: () => void;
    balances: TokenBalance[];
    walletAddress: string;
}

export default function SendModal({ isOpen, onClose, balances }: SendModalProps) {
    const { t } = useI18n();
    const { showToast } = useToast();
    const [step, setStep] = useState<'select' | 'form' | 'confirm' | 'loading' | 'success' | 'error'>('select');
    const [selectedToken, setSelectedToken] = useState<TokenBalance | null>(null);
    const [recipient, setRecipient] = useState('');
    const [amount, setAmount] = useState('');
    const [error, setError] = useState('');
    const [txHash, setTxHash] = useState('');

    const handleSelectToken = (token: TokenBalance) => {
        setSelectedToken(token);
        setStep('form');
    };

    const handleContinue = () => {
        setError('');
        if (!recipient.startsWith('0x') || recipient.length !== 42) {
            setError(t.modals.invalidAddress);
            return;
        }
        const numAmount = parseFloat(amount);
        if (isNaN(numAmount) || numAmount <= 0) {
            setError(t.modals.invalidAmount);
            return;
        }
        if (numAmount > parseFloat(selectedToken?.balance || '0')) {
            setError(t.modals.insufficientBalance);
            return;
        }
        setStep('confirm');
    };

    const handleConfirm = async () => {
        if (!selectedToken) return;
        setStep('loading');

        try {
            if (!MiniKit.isInstalled()) {
                const mockHash = '0x' + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
                setTxHash(mockHash);
                setStep('success');
                showToast({ type: 'success', title: t.modals.transactionSent, message: `${amount} ${selectedToken.token.symbol}`, txHash: mockHash });
                return;
            }

            const decimals = selectedToken.token.decimals;
            const amountInWei = BigInt(Math.floor(parseFloat(amount) * Math.pow(10, decimals))).toString();

            const { finalPayload } = await MiniKit.commandsAsync.sendTransaction({
                transaction: [{
                    address: selectedToken.token.address as `0x${string}`,
                    abi: [{ name: 'transfer', type: 'function', inputs: [{ name: 'to', type: 'address' }, { name: 'amount', type: 'uint256' }], outputs: [{ name: '', type: 'bool' }], stateMutability: 'nonpayable' }],
                    functionName: 'transfer',
                    args: [recipient, amountInWei]
                }]
            });

            if (finalPayload.status === 'success') {
                const hash = finalPayload.transaction_id || '';
                setTxHash(hash);
                setStep('success');
                showToast({ type: 'success', title: t.modals.transactionSent, message: `${amount} ${selectedToken.token.symbol}`, txHash: hash });

                // Send push notification to recipient (fire and forget)
                fetch('/api/notifications/send', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        walletAddresses: [recipient],
                        type: 'tx_received',
                        amount: amount,
                        token: selectedToken.token.symbol,
                    }),
                }).catch(err => console.warn('Notification send failed:', err));
            } else {
                setError(t.modals.transactionRejected);
                setStep('error');
                showToast({ type: 'error', title: t.modals.transactionFailed, message: t.modals.transactionRejected });
            }
        } catch (err) {
            console.error('Transaction error:', err);
            setError(t.common.error);
            setStep('error');
            showToast({ type: 'error', title: t.modals.transactionFailed, message: t.common.error });
        }
    };

    const handleClose = () => {
        setStep('select');
        setSelectedToken(null);
        setRecipient('');
        setAmount('');
        setError('');
        setTxHash('');
        onClose();
    };

    const setMaxAmount = () => {
        if (selectedToken) setAmount(selectedToken.balance);
    };

    const getTitle = () => {
        switch (step) {
            case 'select': return t.modals.selectToken;
            case 'form': return t.modals.send;
            case 'confirm': return t.modals.confirm;
            case 'loading': return t.modals.processing;
            case 'success': return t.modals.success;
            case 'error': return t.modals.error;
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <ModalBackdrop onClose={handleClose}>
                    <ModalContent className="max-h-[85vh] overflow-y-auto">
                        {/* Header */}
                        <div className="sticky top-0 glass-strong px-5 py-4 flex items-center justify-between border-b border-white/5 z-10">
                            <h2 className="text-lg font-bold text-white">{getTitle()}</h2>
                            <button onClick={handleClose} className="p-2 -mr-2 rounded-full hover:bg-white/10 active:scale-95 transition-all">
                                <svg className="w-5 h-5 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <div className="p-5">
                            <AnimatePresence mode="wait">
                                {/* Token Selection */}
                                {step === 'select' && (
                                    <motion.div key="select" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
                                        <StaggerContainer className="space-y-2">
                                            {balances.map((item) => (
                                                <StaggerItem key={item.token.symbol}>
                                                    <Pressable onClick={() => handleSelectToken(item)} className="w-full flex items-center justify-between p-3 glass rounded-xl text-left">
                                                        <div className="flex items-center gap-3">
                                                            <div className="relative w-10 h-10 rounded-full overflow-hidden bg-zinc-800">
                                                                <Image src={item.token.logoURI} alt={item.token.name} fill className="object-cover" />
                                                            </div>
                                                            <div>
                                                                <p className="font-medium text-white">{item.token.symbol}</p>
                                                                <p className="text-xs text-zinc-500">{item.token.name}</p>
                                                            </div>
                                                        </div>
                                                        <div className="text-right">
                                                            <p className="font-medium text-white">{parseFloat(item.balance).toFixed(4)}</p>
                                                            <p className="text-xs text-zinc-500">${item.valueUSD.toFixed(2)}</p>
                                                        </div>
                                                    </Pressable>
                                                </StaggerItem>
                                            ))}
                                        </StaggerContainer>
                                    </motion.div>
                                )}

                                {/* Send Form */}
                                {step === 'form' && selectedToken && (
                                    <motion.div key="form" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="space-y-4">
                                        <div className="flex items-center gap-3 p-3 glass rounded-xl">
                                            <div className="relative w-10 h-10 rounded-full overflow-hidden bg-zinc-800">
                                                <Image src={selectedToken.token.logoURI} alt={selectedToken.token.name} fill className="object-cover" />
                                            </div>
                                            <div>
                                                <p className="font-medium text-white">{selectedToken.token.symbol}</p>
                                                <p className="text-xs text-zinc-500">{t.tokens.balance}: {parseFloat(selectedToken.balance).toFixed(4)}</p>
                                            </div>
                                            <button onClick={() => setStep('select')} className="ml-auto text-xs text-pink-400 hover:text-pink-300">{t.modals.change}</button>
                                        </div>

                                        <div>
                                            <label className="text-xs text-zinc-500 mb-1.5 block">{t.modals.recipientAddress}</label>
                                            <input
                                                type="text"
                                                value={recipient}
                                                onChange={(e) => setRecipient(e.target.value)}
                                                placeholder="0x..."
                                                className="w-full px-4 py-3 rounded-xl bg-black/30 border border-white/10 text-white placeholder-zinc-500 focus:outline-none focus:border-pink-500/50 font-mono text-sm"
                                            />
                                        </div>

                                        <div>
                                            <label className="text-xs text-zinc-500 mb-1.5 block">{t.activity.amount}</label>
                                            <div className="relative">
                                                <input
                                                    type="number"
                                                    value={amount}
                                                    onChange={(e) => setAmount(e.target.value)}
                                                    placeholder="0.00"
                                                    className="w-full px-4 py-3 pr-16 rounded-xl bg-black/30 border border-white/10 text-white placeholder-zinc-500 focus:outline-none focus:border-pink-500/50 text-lg"
                                                />
                                                <button onClick={setMaxAmount} className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-pink-400 hover:text-pink-300 font-medium">{t.modals.max}</button>
                                            </div>
                                            <p className="text-xs text-zinc-500 mt-1.5">
                                                ≈ ${(parseFloat(amount || '0') * (selectedToken.valueUSD / parseFloat(selectedToken.balance || '1'))).toFixed(2)} USD
                                            </p>
                                        </div>

                                        {error && (
                                            <FadeIn>
                                                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20">
                                                    <p className="text-sm text-red-400">{error}</p>
                                                </div>
                                            </FadeIn>
                                        )}

                                        <AnimatedButton variant="gradient" onClick={handleContinue} disabled={!recipient || !amount} fullWidth className="disabled:opacity-50">
                                            {t.modals.continue}
                                        </AnimatedButton>
                                    </motion.div>
                                )}

                                {/* Confirmation */}
                                {step === 'confirm' && selectedToken && (
                                    <motion.div key="confirm" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="space-y-4">
                                        <FadeIn className="text-center py-2">
                                            <div className="relative w-16 h-16 mx-auto mb-4 rounded-full overflow-hidden bg-zinc-800">
                                                <Image src={selectedToken.token.logoURI} alt={selectedToken.token.name} fill className="object-cover" />
                                            </div>
                                            <p className="text-3xl font-bold text-white mb-1">{amount} {selectedToken.token.symbol}</p>
                                            <p className="text-zinc-500">≈ ${(parseFloat(amount) * (selectedToken.valueUSD / parseFloat(selectedToken.balance || '1'))).toFixed(2)} USD</p>
                                        </FadeIn>

                                        <FadeIn delay={0.1}>
                                            <div className="glass rounded-xl p-4 space-y-3">
                                                <div className="flex justify-between">
                                                    <span className="text-zinc-500 text-sm">{t.activity.to}</span>
                                                    <span className="text-white text-sm font-mono">{recipient.slice(0, 8)}...{recipient.slice(-6)}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-zinc-500 text-sm">{t.activity.network}</span>
                                                    <span className="text-white text-sm">{t.profile.worldChain}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-zinc-500 text-sm">{t.modals.fee}</span>
                                                    <span className="text-emerald-400 text-sm">{t.modals.free}</span>
                                                </div>
                                            </div>
                                        </FadeIn>

                                        <FadeIn delay={0.15} className="flex gap-3">
                                            <AnimatedButton variant="glass" onClick={() => setStep('form')} fullWidth>{t.common.back}</AnimatedButton>
                                            <AnimatedButton variant="gradient" onClick={handleConfirm} fullWidth>{t.modals.confirm}</AnimatedButton>
                                        </FadeIn>
                                    </motion.div>
                                )}

                                {/* Loading */}
                                {step === 'loading' && (
                                    <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-center py-8">
                                        <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} className="w-16 h-16 mx-auto mb-6 border-4 border-pink-500 border-t-transparent rounded-full" />
                                        <h3 className="text-lg font-bold text-white mb-2">{t.modals.processing}</h3>
                                        <p className="text-zinc-500">{t.modals.sending}</p>
                                    </motion.div>
                                )}

                                {/* Success */}
                                {step === 'success' && (
                                    <motion.div key="success" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="text-center py-8">
                                        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 200, delay: 0.1 }} className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-r from-emerald-500 to-green-600 flex items-center justify-center">
                                            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                            </svg>
                                        </motion.div>
                                        <h3 className="text-xl font-bold text-white mb-2">{t.modals.transactionSent}</h3>
                                        <p className="text-zinc-500 mb-4">{t.modals.success}</p>
                                        {txHash && (
                                            <a href={`https://worldscan.org/tx/${txHash}`} target="_blank" rel="noopener noreferrer" className="text-sm text-pink-400 hover:text-pink-300 mb-6 block">
                                                {t.activity.viewExplorer} →
                                            </a>
                                        )}
                                        <AnimatedButton variant="gradient" onClick={handleClose} fullWidth>{t.modals.close}</AnimatedButton>
                                    </motion.div>
                                )}

                                {/* Error */}
                                {step === 'error' && (
                                    <motion.div key="error" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="text-center py-8">
                                        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 200, delay: 0.1 }} className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-r from-red-500 to-orange-600 flex items-center justify-center">
                                            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                        </motion.div>
                                        <h3 className="text-xl font-bold text-white mb-2">{t.modals.transactionFailed}</h3>
                                        <p className="text-zinc-500 mb-6">{error}</p>
                                        <AnimatedButton variant="glass" onClick={() => setStep('form')} fullWidth>{t.modals.tryAgain}</AnimatedButton>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </ModalContent>
                </ModalBackdrop>
            )}
        </AnimatePresence>
    );
}
