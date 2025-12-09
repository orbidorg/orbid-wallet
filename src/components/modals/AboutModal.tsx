'use client';

import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { AnimatedButton, ModalBackdrop, ModalContent, FadeIn } from '../ui/Motion';
import { useI18n } from '@/lib/i18n';

interface AboutModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function AboutModal({ isOpen, onClose }: AboutModalProps) {
    const { t } = useI18n();

    const features = [
        { icon: '💳', titleKey: 'featureSendReceive' as const, descKey: 'featureSendReceiveDesc' as const },
        { icon: '📊', titleKey: 'featurePortfolio' as const, descKey: 'featurePortfolioDesc' as const },
        { icon: '🔒', titleKey: 'featureWorldId' as const, descKey: 'featureWorldIdDesc' as const },
        { icon: '⚡', titleKey: 'featureZeroFees' as const, descKey: 'featureZeroFeesDesc' as const },
    ];

    return (
        <AnimatePresence>
            {isOpen && (
                <ModalBackdrop onClose={onClose}>
                    <ModalContent className="max-h-[90vh] overflow-y-auto">
                        {/* Header */}
                        <div className="sticky top-0 glass-strong px-5 py-4 flex items-center justify-between border-b border-white/5 z-10">
                            <h2 className="text-lg font-bold text-white">{t.about.title}</h2>
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
                                    <p className="text-zinc-500 text-sm">{t.about.version} 1.0.0</p>
                                </div>
                            </FadeIn>

                            {/* Mission */}
                            <FadeIn delay={0.1}>
                                <div className="glass rounded-xl p-4">
                                    <h3 className="text-white font-semibold mb-2">{t.about.missionTitle}</h3>
                                    <p className="text-sm text-zinc-400 leading-relaxed">
                                        {t.about.missionText}
                                    </p>
                                </div>
                            </FadeIn>

                            {/* Features */}
                            <FadeIn delay={0.15}>
                                <div>
                                    <h3 className="text-white font-semibold mb-3">{t.about.featuresTitle}</h3>
                                    <div className="grid grid-cols-2 gap-2">
                                        {features.map((feature, index) => (
                                            <motion.div
                                                key={feature.titleKey}
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: 0.2 + index * 0.05 }}
                                                className="glass rounded-xl p-3"
                                            >
                                                <span className="text-2xl mb-2 block">{feature.icon}</span>
                                                <p className="text-white text-sm font-medium">{t.about[feature.titleKey]}</p>
                                                <p className="text-zinc-500 text-xs">{t.about[feature.descKey]}</p>
                                            </motion.div>
                                        ))}
                                    </div>
                                </div>
                            </FadeIn>

                            {/* Tech Stack */}
                            <FadeIn delay={0.2}>
                                <div className="glass rounded-xl p-4">
                                    <h3 className="text-white font-semibold mb-2">{t.about.builtWith}</h3>
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
                                    <h3 className="text-white font-semibold mb-3">{t.about.teamTitle}</h3>
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-gradient-to-br from-pink-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                                            O
                                        </div>
                                        <div>
                                            <p className="text-white text-sm font-medium">{t.about.teamName}</p>
                                            <p className="text-zinc-500 text-xs">{t.about.founderRole}</p>
                                        </div>
                                    </div>
                                </div>
                            </FadeIn>

                            {/* Footer */}
                            <FadeIn delay={0.3}>
                                <div className="text-center pt-4 border-t border-white/5">
                                    <p className="text-zinc-600 text-xs mb-1">
                                        {t.about.developedBy} <span className="text-zinc-500">OrbId Labs</span>
                                    </p>
                                    <p className="text-zinc-600 text-xs">
                                        {t.about.madeIn}
                                    </p>
                                </div>
                            </FadeIn>

                            {/* Close Button */}
                            <FadeIn delay={0.35}>
                                <AnimatedButton variant="glass" fullWidth onClick={onClose}>
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                    </svg>
                                    {t.common.backToSettings}
                                </AnimatedButton>
                            </FadeIn>
                        </div>
                    </ModalContent>
                </ModalBackdrop>
            )}
        </AnimatePresence>
    );
}
