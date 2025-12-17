'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { AnimatedButton, FadeIn } from './ui/Motion';
import { useI18n } from '@/lib/i18n';

interface EmailLinkingStepProps {
    username: string | null;
    walletAddress: string;
    onComplete: (email: string) => Promise<{ success: boolean; error?: string }>;
    onSkip: () => void;
}

export default function EmailLinkingStep({ username, walletAddress, onComplete, onSkip }: EmailLinkingStepProps) {
    const { t, lang } = useI18n();
    const [email, setEmail] = useState('');
    const [code, setCode] = useState('');
    const [step, setStep] = useState<'email' | 'verify'>('email');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSendCode = async () => {
        if (!email || !email.includes('@')) {
            setError(t.validation.invalidEmail);
            return;
        }

        setLoading(true);
        setError('');

        try {
            // First, check if this wallet already has a linked email
            const checkRes = await fetch('/api/analytics/user/check', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ walletAddress, email })
            });

            if (!checkRes.ok) {
                const checkData = await checkRes.json();
                if (checkData.error === 'wallet_already_linked') {
                    setError(t.validation.walletAlreadyLinked);
                    setLoading(false);
                    return;
                }
                if (checkData.error === 'email_already_linked') {
                    setError(t.validation.emailAlreadyLinked);
                    setLoading(false);
                    return;
                }
            }

            // If check passed, send the verification code with current language
            const res = await fetch('/api/auth/send-code', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, lang })
            });

            if (res.ok) {
                setStep('verify');
            } else {
                const data = await res.json();
                setError(data.error || 'Failed to send code');
            }
        } catch {
            setError(t.validation.connectionError);
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyCode = async () => {
        if (!code || code.length < 6) {
            setError(t.validation.enter6DigitCode);
            return;
        }

        setLoading(true);
        setError('');

        try {
            const res = await fetch('/api/auth/verify-code', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, code })
            });

            if (res.ok) {
                // Email verified, now link to wallet
                const result = await onComplete(email);
                if (!result.success) {
                    setError(result.error || t.validation.failedToComplete);
                    setStep('email');
                    setCode('');
                }
            } else {
                const data = await res.json();
                setError(data.error || 'Invalid code');
            }
        } catch {
            setError(t.validation.connectionError);
        } finally {
            setLoading(false);
        }
    };

    const shortAddress = `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`;

    return (
        <div className="min-h-screen bg-gradient-to-br from-zinc-900 via-black to-zinc-900 flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-md text-center"
            >
                {/* Success Icon */}
                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 200, delay: 0.1 }}
                    className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-full flex items-center justify-center mx-auto mb-4"
                >
                    <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                </motion.div>

                <FadeIn delay={0.2}>
                    <h2 className="text-xl font-bold text-white mb-1">
                        {t.email.welcome}{username ? `, @${username}` : ''}! 👋
                    </h2>
                </FadeIn>

                <FadeIn delay={0.25}>
                    <p className="text-zinc-500 text-sm mb-1">{t.email.connectedWallet}</p>
                    <p className="text-zinc-300 font-mono text-sm mb-6">{shortAddress}</p>
                </FadeIn>

                {step === 'email' ? (
                    <FadeIn delay={0.3}>
                        <div className="bg-zinc-900/80 backdrop-blur-xl border border-zinc-800 rounded-2xl p-6">
                            <h3 className="text-lg font-semibold text-white mb-2">
                                {t.email.linkEmail}
                            </h3>
                            <p className="text-zinc-400 text-sm mb-4">
                                {t.email.optionalMessage || 'Optional but recommended'}
                            </p>

                            <div className="space-y-4">
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleSendCode()}
                                    placeholder="your@email.com"
                                    className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-pink-500 transition-colors"
                                    disabled={loading}
                                />

                                {error && (
                                    <p className="text-red-400 text-sm">{error}</p>
                                )}

                                <AnimatedButton
                                    variant="gradient"
                                    size="md"
                                    onClick={handleSendCode}
                                    disabled={loading || !email}
                                    fullWidth
                                >
                                    {loading ? (
                                        <span className="flex items-center gap-2">
                                            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                            </svg>
                                            Sending...
                                        </span>
                                    ) : (
                                        t.email.sendCode
                                    )}
                                </AnimatedButton>

                                <button
                                    onClick={onSkip}
                                    className="text-zinc-500 text-sm hover:text-zinc-300 transition-colors mt-2"
                                >
                                    {t.email.skipButton || 'Skip for now'}
                                </button>
                            </div>
                        </div>
                    </FadeIn>
                ) : (
                    <FadeIn delay={0.1}>
                        <div className="bg-zinc-900/80 backdrop-blur-xl border border-zinc-800 rounded-2xl p-6">
                            <h3 className="text-lg font-semibold text-white mb-2">
                                {t.email.enterCode}
                            </h3>
                            <p className="text-zinc-400 text-sm mb-6">
                                {t.email.codeSent}: <span className="text-white">{email}</span>
                            </p>

                            <div className="space-y-4">
                                <input
                                    type="text"
                                    value={code}
                                    onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                    onKeyDown={(e) => e.key === 'Enter' && handleVerifyCode()}
                                    placeholder="000000"
                                    className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl text-white text-center text-2xl tracking-widest placeholder-zinc-600 focus:outline-none focus:border-pink-500 transition-colors font-mono"
                                    maxLength={6}
                                    disabled={loading}
                                />

                                {error && (
                                    <p className="text-red-400 text-sm">{error}</p>
                                )}

                                <AnimatedButton
                                    variant="gradient"
                                    size="md"
                                    onClick={handleVerifyCode}
                                    disabled={loading || code.length !== 6}
                                    fullWidth
                                >
                                    {loading ? t.common.loading : t.email.verifyCode}
                                </AnimatedButton>

                                <button
                                    onClick={() => { setStep('email'); setCode(''); setError(''); }}
                                    className="text-zinc-500 text-sm hover:text-zinc-300 transition-colors"
                                >
                                    ← Change email
                                </button>
                            </div>
                        </div>
                    </FadeIn>
                )}
            </motion.div>
        </div>
    );
}
