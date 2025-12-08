'use client';

import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { AnimatedButton, ModalBackdrop, ModalContent, FadeIn } from '../ui/Motion';

interface AboutModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function AboutModal({ isOpen, onClose }: AboutModalProps) {
    const features = [
        { icon: '💳', title: 'Send & Receive', desc: 'Transfer crypto instantly on World Chain' },
        { icon: '📊', title: 'Track Portfolio', desc: 'Real-time prices and balance updates' },
        { icon: '🔒', title: 'World ID Verified', desc: 'Proof of personhood for security' },
        { icon: '⚡', title: 'Zero Fees', desc: 'Free transactions on World Chain' },
    ];

    const team = [
        { role: 'Founder & Developer', name: 'OrbId Labs Team' },
    ];

    return (
        <AnimatePresence>
            {isOpen && (
                <ModalBackdrop onClose={onClose}>
                    <ModalContent className="max-h-[90vh] overflow-y-auto">
                        {/* Header */}
                        <div className="sticky top-0 glass-strong px-5 py-4 flex items-center justify-between border-b border-white/5 z-10">
                            <h2 className="text-lg font-bold text-white">About OrbId</h2>
                            <motion.button
                                whileHover={{ scale: 1.1, rotate: 90 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={onClose}
                                className="p-2 -mr-2 rounded-full hover:bg-white/10 transition-colors"
                            >
                                <svg className="w-5 h-5 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </motion.button>
                        </div>

                        <div className="p-5 space-y-6">
                            {/* Logo & Title */}
                            <FadeIn>
                                <div className="text-center py-4">
                                    <motion.div
                                        initial={{ scale: 0, rotate: -180 }}
                                        animate={{ scale: 1, rotate: 0 }}
                                        transition={{ type: 'spring', stiffness: 200 }}
                                        className="w-20 h-20 mx-auto mb-4"
                                    >
                                        <Image src="/logo.svg" alt="OrbId" width={80} height={80} />
                                    </motion.div>
                                    <h1 className="text-2xl font-bold text-white mb-1">OrbId Wallet</h1>
                                    <p className="text-zinc-500 text-sm">Version 1.0.0</p>
                                </div>
                            </FadeIn>

                            {/* Mission */}
                            <FadeIn delay={0.1}>
                                <div className="glass rounded-xl p-4">
                                    <h3 className="text-white font-semibold mb-2">Our Mission</h3>
                                    <p className="text-sm text-zinc-400 leading-relaxed">
                                        OrbId Wallet is your secure gateway to the World App ecosystem.
                                        We believe in building a decentralized future where everyone can
                                        access financial tools with ease and security, powered by World ID's
                                        proof of personhood.
                                    </p>
                                </div>
                            </FadeIn>

                            {/* Features */}
                            <FadeIn delay={0.15}>
                                <div>
                                    <h3 className="text-white font-semibold mb-3">Features</h3>
                                    <div className="grid grid-cols-2 gap-2">
                                        {features.map((feature, index) => (
                                            <motion.div
                                                key={feature.title}
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: 0.2 + index * 0.05 }}
                                                className="glass rounded-xl p-3"
                                            >
                                                <span className="text-2xl mb-2 block">{feature.icon}</span>
                                                <p className="text-white text-sm font-medium">{feature.title}</p>
                                                <p className="text-zinc-500 text-xs">{feature.desc}</p>
                                            </motion.div>
                                        ))}
                                    </div>
                                </div>
                            </FadeIn>

                            {/* Tech Stack */}
                            <FadeIn delay={0.2}>
                                <div className="glass rounded-xl p-4">
                                    <h3 className="text-white font-semibold mb-2">Built With</h3>
                                    <div className="flex flex-wrap gap-2">
                                        {['Next.js', 'World Mini Kit', 'World Chain', 'Framer Motion'].map((tech) => (
                                            <span key={tech} className="px-2.5 py-1 glass rounded-full text-xs text-zinc-400">
                                                {tech}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </FadeIn>

                            {/* Team */}
                            <FadeIn delay={0.25}>
                                <div className="glass rounded-xl p-4">
                                    <h3 className="text-white font-semibold mb-3">Team</h3>
                                    {team.map((member) => (
                                        <div key={member.name} className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-gradient-to-br from-pink-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                                                O
                                            </div>
                                            <div>
                                                <p className="text-white text-sm font-medium">{member.name}</p>
                                                <p className="text-zinc-500 text-xs">{member.role}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </FadeIn>

                            {/* Footer */}
                            <FadeIn delay={0.3}>
                                <div className="text-center pt-4 border-t border-white/5">
                                    <p className="text-zinc-600 text-xs mb-1">
                                        Developed with ❤️ by <span className="text-zinc-500">OrbId Labs</span>
                                    </p>
                                    <p className="text-zinc-600 text-xs">
                                        Made in Colombia 🇨🇴
                                    </p>
                                </div>
                            </FadeIn>

                            {/* Close Button */}
                            <FadeIn delay={0.35}>
                                <AnimatedButton variant="glass" fullWidth onClick={onClose}>
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                    </svg>
                                    Back to Settings
                                </AnimatedButton>
                            </FadeIn>
                        </div>
                    </ModalContent>
                </ModalBackdrop>
            )}
        </AnimatePresence>
    );
}
