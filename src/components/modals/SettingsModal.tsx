'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { AnimatedButton, ModalBackdrop, ModalContent, FadeIn, Pressable } from '../ui/Motion';
import AboutModal from './AboutModal';
import HelpModal from './HelpModal';

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
    const [showAboutModal, setShowAboutModal] = useState(false);
    const [showHelpModal, setShowHelpModal] = useState(false);

    const menuItems = [
        {
            id: 'about',
            label: 'About OrbId',
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            ),
            color: 'text-blue-400',
            bgColor: 'bg-blue-500/10',
            action: () => setShowAboutModal(true),
        },
        {
            id: 'help',
            label: 'Help & Support',
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            ),
            color: 'text-emerald-400',
            bgColor: 'bg-emerald-500/10',
            action: () => setShowHelpModal(true),
        },
        {
            id: 'contact',
            label: 'Contact Us',
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
            ),
            color: 'text-pink-400',
            bgColor: 'bg-pink-500/10',
            action: () => window.open('mailto:support@orbid.io', '_blank'),
        },
        {
            id: 'twitter',
            label: 'Follow on X',
            icon: (
                <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
            ),
            color: 'text-zinc-300',
            bgColor: 'bg-zinc-500/10',
            action: () => window.open('https://x.com/OrbIdLabs', '_blank'),
            external: true,
        },
    ];

    return (
        <>
            <AnimatePresence>
                {isOpen && (
                    <ModalBackdrop onClose={onClose}>
                        <ModalContent className="max-h-[85vh] overflow-y-auto">
                            {/* Header */}
                            <div className="sticky top-0 glass-strong px-5 py-4 flex items-center justify-between border-b border-white/5 z-10">
                                <h2 className="text-lg font-bold text-white">Settings</h2>
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

                            <div className="p-5 space-y-4">
                                {/* Menu Items */}
                                <FadeIn>
                                    <div className="space-y-2">
                                        {menuItems.map((item, index) => (
                                            <motion.div
                                                key={item.id}
                                                initial={{ opacity: 0, x: -10 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: index * 0.05 }}
                                            >
                                                <Pressable
                                                    onClick={item.action}
                                                    className="w-full flex items-center gap-3 p-3 glass rounded-xl"
                                                >
                                                    <div className={`w-10 h-10 ${item.bgColor} rounded-full flex items-center justify-center ${item.color}`}>
                                                        {item.icon}
                                                    </div>
                                                    <span className="flex-1 text-white font-medium">{item.label}</span>
                                                    {item.external ? (
                                                        <svg className="w-4 h-4 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                                        </svg>
                                                    ) : (
                                                        <svg className="w-4 h-4 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                                        </svg>
                                                    )}
                                                </Pressable>
                                            </motion.div>
                                        ))}
                                    </div>
                                </FadeIn>

                                {/* App Info */}
                                <FadeIn delay={0.2}>
                                    <div className="glass rounded-xl p-4">
                                        <div className="flex items-center gap-3 mb-3">
                                            <Image src="/logo.svg" alt="OrbId" width={40} height={40} />
                                            <div>
                                                <h3 className="text-white font-bold">OrbId Wallet</h3>
                                                <p className="text-xs text-zinc-500">Version 1.0.0</p>
                                            </div>
                                        </div>
                                        <p className="text-sm text-zinc-400">
                                            Your secure gateway to World App ecosystem.
                                        </p>
                                    </div>
                                </FadeIn>

                                {/* Close Button */}
                                <FadeIn delay={0.25}>
                                    <AnimatedButton variant="glass" fullWidth onClick={onClose}>
                                        Close
                                    </AnimatedButton>
                                </FadeIn>
                            </div>
                        </ModalContent>
                    </ModalBackdrop>
                )}
            </AnimatePresence>

            {/* Sub-modals */}
            <AboutModal isOpen={showAboutModal} onClose={() => setShowAboutModal(false)} />
            <HelpModal isOpen={showHelpModal} onClose={() => setShowHelpModal(false)} />
        </>
    );
}
