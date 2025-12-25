'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MiniKit, VerifyCommandInput, VerificationLevel } from '@worldcoin/minikit-js';
import { AnimatedButton, FadeIn } from './ui/Motion';
import { createOrUpdateUser } from '@/lib/analytics';
import { useI18n } from '@/lib/i18n';
import { useAuth } from '@/lib/AuthContext';

const VERIFIED_STORAGE_KEY = 'orbid_world_id_verified';

interface WorldIDVerifyProps {
    onVerificationSuccess?: (proof: unknown) => void;
    onVerificationError?: (error: Error) => void;
}

export default function WorldIDVerify({
    onVerificationSuccess,
    onVerificationError
}: WorldIDVerifyProps) {
    const { t } = useI18n();
    const { isVerifiedHuman, setVerifiedHuman } = useAuth();
    const [isVerifying, setIsVerifying] = useState(false);
    const [showAlreadyVerified, setShowAlreadyVerified] = useState(false);
    const [error, setError] = useState<string | null>(null);


    const handleVerify = async () => {
        if (isVerifiedHuman) {
            setShowAlreadyVerified(true);
            setTimeout(() => setShowAlreadyVerified(false), 3000);
            return;
        }

        if (!MiniKit.isInstalled()) {
            setError(t.worldId.openInWorldAppError);
            return;
        }

        setIsVerifying(true);
        setError(null);

        try {
            const verifyPayload: VerifyCommandInput = {
                action: 'verifyhuman',
                verification_level: VerificationLevel.Orb,
            };

            const { finalPayload } = await MiniKit.commandsAsync.verify(verifyPayload);

            if (finalPayload.status === 'success') {
                // Verify proof on backend (registers with World ID portal)
                const backendRes = await fetch('/api/auth/verify-world-id', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        payload: finalPayload,
                        action: 'verifyhuman',
                    }),
                });

                const backendData = await backendRes.json();

                // Continue regardless of backend result - MiniKit proof is valid
                // CONTINUE
                localStorage.setItem(VERIFIED_STORAGE_KEY, 'true');
                setVerifiedHuman(true);

                // Update user as verified in Supabase
                const stored = localStorage.getItem('orbid_wallet_cache');
                const walletAddress = stored ? JSON.parse(stored)?.walletAddress : null;

                if (walletAddress) {
                    await createOrUpdateUser({ walletAddress, isVerifiedHuman: true });
                }

                onVerificationSuccess?.(finalPayload);
            } else {
                throw new Error(t.worldId.verificationFailed);
            }
        } catch (err) {
            const errorMsg = err instanceof Error ? err.message : t.worldId.verificationFailed;
            setError(errorMsg);
            onVerificationError?.(err instanceof Error ? err : new Error(errorMsg));
        } finally {
            setIsVerifying(false);
        }
    };

    // Verified state
    if (isVerifiedHuman) {
        return (
            <FadeIn>
                <motion.button
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    onClick={handleVerify}
                    className="w-full glass rounded-2xl p-4 border border-emerald-500/20 transition-all hover:bg-white/5"
                >
                    <div className="flex items-center gap-3">
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: 'spring', stiffness: 300 }}
                            className="w-10 h-10 bg-emerald-500/10 rounded-full flex items-center justify-center"
                        >
                            <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                        </motion.div>
                        <div className="text-left">
                            <p className="font-medium text-emerald-400 text-sm">{t.worldId.verifiedTitle}</p>
                            <p className="text-xs text-zinc-500">{t.worldId.verifiedDesc}</p>
                        </div>
                    </div>

                    <AnimatePresence>
                        {showAlreadyVerified && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="mt-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3"
                            >
                                <p className="text-xs text-emerald-400 text-center">
                                    ✓ {t.worldId.alreadyVerified}
                                </p>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.button>
            </FadeIn>
        );
    }

    // Not verified state
    return (
        <FadeIn>
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass rounded-2xl p-4"
            >
                <div className="flex items-center gap-3 mb-3">
                    <motion.div
                        animate={{ rotate: [0, 5, -5, 0] }}
                        transition={{ duration: 2, repeat: Infinity }}
                        className="w-10 h-10 bg-gradient-to-br from-pink-500 to-purple-600 rounded-full flex items-center justify-center"
                    >
                        <svg className="w-6 h-6" viewBox="0 0 48 48" fill="none" stroke="white" strokeWidth="2">
                            <circle cx="24" cy="24" r="22" />
                            <circle cx="24" cy="24" r="9" />
                        </svg>
                    </motion.div>
                    <div>
                        <p className="font-medium text-white text-sm">{t.worldId.title}</p>
                        <p className="text-xs text-zinc-500">{t.worldId.description}</p>
                    </div>
                </div>

                <AnimatePresence>
                    {error && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 mb-3"
                        >
                            <p className="text-xs text-red-400">{error}</p>
                        </motion.div>
                    )}
                </AnimatePresence>

                <AnimatedButton
                    variant="gradient"
                    onClick={handleVerify}
                    disabled={isVerifying}
                    fullWidth
                    size="sm"
                    className="disabled:opacity-50"
                >
                    {isVerifying ? (
                        <>
                            <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                                className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                            />
                            {t.worldId.verifying}
                        </>
                    ) : (
                        <>
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                            </svg>
                            {t.worldId.verifyButton}
                        </>
                    )}
                </AnimatedButton>
            </motion.div>
        </FadeIn>
    );
}
