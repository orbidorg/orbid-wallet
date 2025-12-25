'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/lib/AuthContext';
import { useI18n } from '@/lib/i18n';
import { AnimatedButton, FadeIn } from '../ui/Motion';

export default function NewsletterModal() {
    const { newsletterClosed, updateNewsletterSubscription, closeNewsletter } = useAuth();
    const { t } = useI18n();
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    if (newsletterClosed) return null;

    const handleSubscribe = async () => {
        if (!email || !email.includes('@')) return;
        setLoading(true);
        await updateNewsletterSubscription(email);
        setLoading(false);
        setSuccess(true);
        setTimeout(() => closeNewsletter(), 2000);
    };

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
                <motion.div
                    initial={{ scale: 0.9, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.9, opacity: 0, y: 20 }}
                    className="w-full max-w-sm bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden shadow-2xl relative"
                >
                    {/* Premium Gradient Header */}
                    <div className="h-24 bg-gradient-to-br from-pink-500/20 via-purple-600/20 to-zinc-900 absolute inset-0 pointer-events-none" />

                    <div className="p-8 pt-10 relative">
                        <button
                            onClick={closeNewsletter}
                            className="absolute top-4 right-4 p-2 text-zinc-500 hover:text-white transition-colors"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>

                        <div className="w-16 h-16 bg-gradient-to-br from-pink-500 to-purple-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-pink-500/20">
                            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                        </div>

                        {!success ? (
                            <FadeIn>
                                <h2 className="text-2xl font-bold text-white mb-2 leading-tight">
                                    {t.newsletter?.title || 'Join the Community'}
                                </h2>
                                <p className="text-zinc-400 text-sm mb-8 leading-relaxed">
                                    {t.newsletter?.description || 'Get early access to new features, ecosystem updates, and exclusive OID drops.'}
                                </p>

                                <div className="space-y-4">
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="your@email.com"
                                        className="w-full px-4 py-4 bg-zinc-800 border border-zinc-700 rounded-2xl text-white placeholder-zinc-500 focus:outline-none focus:border-pink-500 transition-all font-medium"
                                        disabled={loading}
                                    />

                                    <AnimatedButton
                                        variant="gradient"
                                        onClick={handleSubscribe}
                                        disabled={loading || !email.includes('@')}
                                        fullWidth
                                        size="lg"
                                    >
                                        {loading ? t.common.loading : (t.newsletter?.button || 'Subscribe Now')}
                                    </AnimatedButton>

                                    <button
                                        onClick={closeNewsletter}
                                        className="w-full text-zinc-500 text-xs font-medium hover:text-zinc-300 transition-colors pt-2"
                                    >
                                        {t.newsletter?.skip || 'Maybe later'}
                                    </button>
                                </div>
                            </FadeIn>
                        ) : (
                            <FadeIn>
                                <div className="text-center py-6">
                                    <motion.div
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        className="w-12 h-12 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-4"
                                    >
                                        <svg className="w-6 h-6 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                    </motion.div>
                                    <h3 className="text-xl font-bold text-white mb-2">Welcome Aboard!</h3>
                                    <p className="text-zinc-400 text-sm">You are now subscribed to our updates.</p>
                                </div>
                            </FadeIn>
                        )}
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
