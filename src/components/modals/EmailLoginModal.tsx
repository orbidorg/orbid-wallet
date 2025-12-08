'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AnimatedButton, ModalBackdrop, FadeIn } from '../ui/Motion';

interface EmailLoginModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: (email: string) => void;
}

type Step = 'email' | 'code' | 'loading';

export default function EmailLoginModal({ isOpen, onClose, onSuccess }: EmailLoginModalProps) {
    const [step, setStep] = useState<Step>('email');
    const [email, setEmail] = useState('');
    const [code, setCode] = useState('');
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    const handleSendCode = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        setError('');
        setSuccessMessage('');
        setStep('loading');

        try {
            const res = await fetch('/api/auth/send-code', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email }),
            });

            const data = await res.json();

            if (!res.ok) {
                setError(data.error || 'Failed to send code');
                setStep('email');
                return;
            }

            setSuccessMessage('Code sent! Check your spam folder if you don\'t see it.');
            setStep('code');
        } catch {
            setError('Network error');
            setStep('email');
        }
    };

    const handleVerifyCode = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setStep('loading');

        try {
            const res = await fetch('/api/auth/verify-code', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, code }),
            });

            const data = await res.json();

            if (!res.ok) {
                setError(data.error || 'Invalid code');
                setStep('code');
                return;
            }

            onSuccess(email);
        } catch {
            setError('Network error');
            setStep('code');
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <ModalBackdrop onClose={onClose}>
                    <motion.div
                        initial={{ scale: 0.95, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.95, opacity: 0, y: 20 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                        className="glass rounded-2xl p-6 w-full max-w-sm mx-4"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between mb-6">
                            <motion.h2
                                key={step}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="text-xl font-bold text-white"
                            >
                                {step === 'code' ? 'Enter Code' : 'Sign In'}
                            </motion.h2>
                            <motion.button
                                whileHover={{ scale: 1.1, rotate: 90 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={onClose}
                                className="p-2 rounded-full hover:bg-white/10 transition-colors"
                            >
                                <svg className="w-5 h-5 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </motion.button>
                        </div>

                        {/* Error */}
                        <AnimatePresence>
                            {error && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20"
                                >
                                    <p className="text-sm text-red-400">{error}</p>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <AnimatePresence mode="wait">
                            {/* Email Step */}
                            {step === 'email' && (
                                <motion.form
                                    key="email"
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 20 }}
                                    onSubmit={handleSendCode}
                                >
                                    <FadeIn delay={0.05}>
                                        <p className="text-zinc-400 text-sm mb-4">
                                            Enter your email to receive a login code
                                        </p>
                                    </FadeIn>
                                    <FadeIn delay={0.1}>
                                        <input
                                            type="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            placeholder="your@email.com"
                                            required
                                            className="w-full px-4 py-3 rounded-xl bg-black/30 border border-white/10 text-white placeholder-zinc-500 focus:outline-none focus:border-pink-500/50 mb-4 transition-colors"
                                        />
                                    </FadeIn>
                                    <FadeIn delay={0.15}>
                                        <AnimatedButton type="submit" variant="gradient" fullWidth>
                                            Send Code
                                        </AnimatedButton>
                                    </FadeIn>
                                </motion.form>
                            )}

                            {/* Code Step */}
                            {step === 'code' && (
                                <motion.form
                                    key="code"
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 20 }}
                                    onSubmit={handleVerifyCode}
                                >
                                    <FadeIn delay={0.05}>
                                        <p className="text-zinc-400 text-sm mb-2">
                                            We sent a code to <span className="text-white">{email}</span>
                                        </p>
                                    </FadeIn>
                                    <AnimatePresence>
                                        {successMessage && (
                                            <motion.div
                                                initial={{ opacity: 0, height: 0 }}
                                                animate={{ opacity: 1, height: 'auto' }}
                                                exit={{ opacity: 0, height: 0 }}
                                                className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20"
                                            >
                                                <p className="text-sm text-emerald-400">{successMessage}</p>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                    <FadeIn delay={0.1}>
                                        <input
                                            type="text"
                                            value={code}
                                            onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                            placeholder="123456"
                                            maxLength={6}
                                            required
                                            className="w-full px-4 py-3 rounded-xl bg-black/30 border border-white/10 text-white text-center text-2xl tracking-widest font-mono placeholder-zinc-500 focus:outline-none focus:border-pink-500/50 mb-4 transition-colors"
                                        />
                                    </FadeIn>
                                    <FadeIn delay={0.15}>
                                        <AnimatedButton type="submit" variant="gradient" disabled={code.length !== 6} fullWidth className="mb-3 disabled:opacity-50">
                                            Verify Code
                                        </AnimatedButton>
                                    </FadeIn>
                                    <FadeIn delay={0.2}>
                                        <div className="flex gap-2">
                                            <motion.button
                                                whileHover={{ scale: 1.02 }}
                                                whileTap={{ scale: 0.98 }}
                                                type="button"
                                                onClick={handleSendCode}
                                                className="flex-1 py-2 text-pink-400 text-sm hover:text-pink-300 transition-colors"
                                            >
                                                Resend Code
                                            </motion.button>
                                            <motion.button
                                                whileHover={{ scale: 1.02 }}
                                                whileTap={{ scale: 0.98 }}
                                                type="button"
                                                onClick={() => setStep('email')}
                                                className="flex-1 py-2 text-zinc-400 text-sm hover:text-white transition-colors"
                                            >
                                                Change Email
                                            </motion.button>
                                        </div>
                                    </FadeIn>
                                </motion.form>
                            )}

                            {/* Loading */}
                            {step === 'loading' && (
                                <motion.div
                                    key="loading"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="flex flex-col items-center py-8"
                                >
                                    <motion.div
                                        animate={{ rotate: 360 }}
                                        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                                        className="w-10 h-10 border-2 border-pink-500 border-t-transparent rounded-full mb-4"
                                    />
                                    <p className="text-zinc-400 text-sm">Please wait...</p>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.div>
                </ModalBackdrop>
            )}
        </AnimatePresence>
    );
}
