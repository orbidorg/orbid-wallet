'use client';

import { AnimatePresence } from 'framer-motion';
import { AnimatedButton, ModalBackdrop, ModalContent, FadeIn, Pulse } from '../ui/Motion';

interface BuyModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function BuyModal({ isOpen, onClose }: BuyModalProps) {
    return (
        <AnimatePresence>
            {isOpen && (
                <ModalBackdrop onClose={onClose}>
                    <ModalContent>
                        {/* Header */}
                        <div className="px-5 py-4 flex items-center justify-between border-b border-white/5">
                            <h2 className="text-lg font-bold text-white">Buy Crypto</h2>
                            <button
                                onClick={onClose}
                                className="p-2 -mr-2 rounded-full hover:bg-white/10 active:scale-95 transition-all"
                            >
                                <svg className="w-5 h-5 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <div className="px-5 py-6 flex flex-col items-center">
                            {/* Coming Soon Icon */}
                            <FadeIn delay={0.1}>
                                <Pulse>
                                    <div className="w-20 h-20 mb-5 rounded-full bg-gradient-to-r from-pink-500/20 to-purple-600/20 flex items-center justify-center">
                                        <svg className="w-10 h-10 text-pink-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                                                d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                            />
                                        </svg>
                                    </div>
                                </Pulse>
                            </FadeIn>

                            {/* Message */}
                            <FadeIn delay={0.15}>
                                <h3 className="text-xl font-bold text-white mb-2">Coming Soon!</h3>
                                <p className="text-zinc-400 text-center text-sm mb-6 leading-relaxed px-2">
                                    Soon you will be able to buy crypto directly from your <span className="text-pink-400 font-semibold">OrbId Wallet</span>.
                                </p>
                            </FadeIn>

                            {/* Features Preview */}
                            <FadeIn delay={0.2} className="w-full">
                                <div className="glass rounded-xl p-4 mb-5 w-full">
                                    <p className="text-xs text-zinc-500 mb-3 uppercase tracking-wider">What&apos;s coming</p>
                                    <div className="space-y-3">
                                        <div className="flex items-center gap-3">
                                            <div className="w-9 h-9 rounded-full bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
                                                <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                                                </svg>
                                            </div>
                                            <span className="text-sm text-zinc-300">Credit & debit card payments</span>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <div className="w-9 h-9 rounded-full bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                                                <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" />
                                                </svg>
                                            </div>
                                            <span className="text-sm text-zinc-300">Bank transfers</span>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <div className="w-9 h-9 rounded-full bg-pink-500/10 flex items-center justify-center flex-shrink-0">
                                                <svg className="w-4 h-4 text-pink-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                                </svg>
                                            </div>
                                            <span className="text-sm text-zinc-300">Instant purchases on World Chain</span>
                                        </div>
                                    </div>
                                </div>
                            </FadeIn>

                            {/* Close Button */}
                            <FadeIn delay={0.25} className="w-full">
                                <AnimatedButton
                                    variant="gradient"
                                    onClick={onClose}
                                    fullWidth
                                >
                                    Got it!
                                </AnimatedButton>
                            </FadeIn>
                        </div>
                    </ModalContent>
                </ModalBackdrop>
            )}
        </AnimatePresence>
    );
}
