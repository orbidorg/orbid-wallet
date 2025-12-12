'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { AnimatedButton, ModalBackdrop, ModalContent, FadeIn, Pressable } from '../ui/Motion';
import AboutModal from './AboutModal';
import HelpModal from './HelpModal';
import { useI18n } from '@/lib/i18n';
import { useNotifications } from '@/hooks/useNotifications';

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
    const { t, lang, setLang, languages } = useI18n();
    const { isEnabled: notificationsEnabled, isSupported: notificationsSupported, isLoading: notificationsLoading, requestPermission, disableNotifications } = useNotifications();
    const [showAboutModal, setShowAboutModal] = useState(false);
    const [showHelpModal, setShowHelpModal] = useState(false);
    const [showLanguageDropdown, setShowLanguageDropdown] = useState(false);

    const currentLanguage = languages.find(l => l.code === lang);

    const menuItems = [
        {
            id: 'language',
            label: t.settings.language,
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
                </svg>
            ),
            color: 'text-purple-400',
            bgColor: 'bg-purple-500/10',
            action: () => setShowLanguageDropdown(!showLanguageDropdown),
            rightContent: (
                <span className="text-sm text-zinc-400">{currentLanguage?.flag} {currentLanguage?.nativeName}</span>
            ),
        },
        {
            id: 'notifications',
            label: t.notifications.title,
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
            ),
            color: 'text-amber-400',
            bgColor: 'bg-amber-500/10',
            action: async () => {
                if (!notificationsSupported) return;
                if (notificationsEnabled) {
                    disableNotifications();
                } else {
                    await requestPermission();
                }
            },
            rightContent: (
                <div className={`w-11 h-6 rounded-full relative transition-colors ${notificationsEnabled ? 'bg-emerald-500' : 'bg-zinc-600'} ${!notificationsSupported ? 'opacity-50' : ''}`}>
                    <motion.div
                        className="w-5 h-5 bg-white rounded-full absolute top-0.5 shadow"
                        animate={{ left: notificationsEnabled ? '22px' : '2px' }}
                        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    />
                </div>
            ),
            disabled: !notificationsSupported || notificationsLoading,
        },
        {
            id: 'about',
            label: t.settings.about,
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
            label: t.settings.help,
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
            label: t.settings.contact,
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
            ),
            color: 'text-pink-400',
            bgColor: 'bg-pink-500/10',
            action: () => window.open('mailto:support@orbidwallet.com', '_blank'),
        },
        {
            id: 'twitter',
            label: t.settings.followX,
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

    const handleLanguageSelect = (langCode: string) => {
        setLang(langCode as 'en' | 'es' | 'zh' | 'hi' | 'pt' | 'fr' | 'de' | 'ja' | 'ko' | 'ar');
        setShowLanguageDropdown(false);
    };

    return (
        <>
            <AnimatePresence>
                {isOpen && (
                    <ModalBackdrop onClose={onClose}>
                        <ModalContent className="max-h-[85vh] overflow-y-auto">
                            {/* Header */}
                            <div className="sticky top-0 glass-strong px-5 py-4 flex items-center justify-between border-b border-white/5 z-10">
                                <h2 className="text-lg font-bold text-white">{t.settings.title}</h2>
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
                                                    {item.rightContent || (
                                                        item.external ? (
                                                            <svg className="w-4 h-4 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                                            </svg>
                                                        ) : (
                                                            <svg className="w-4 h-4 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                                            </svg>
                                                        )
                                                    )}
                                                </Pressable>

                                                {/* Language Dropdown */}
                                                {item.id === 'language' && (
                                                    <AnimatePresence>
                                                        {showLanguageDropdown && (
                                                            <motion.div
                                                                initial={{ opacity: 0, height: 0 }}
                                                                animate={{ opacity: 1, height: 'auto' }}
                                                                exit={{ opacity: 0, height: 0 }}
                                                                className="overflow-hidden mt-2"
                                                            >
                                                                <div className="glass rounded-xl p-2 grid grid-cols-2 gap-2">
                                                                    {languages.map((language) => (
                                                                        <button
                                                                            key={language.code}
                                                                            onClick={() => handleLanguageSelect(language.code)}
                                                                            className={`flex items-center gap-2 p-2 rounded-lg text-sm transition-colors ${lang === language.code
                                                                                ? 'bg-pink-500/20 text-pink-400'
                                                                                : 'hover:bg-white/5 text-zinc-300'
                                                                                }`}
                                                                        >
                                                                            <span className="text-lg">{language.flag}</span>
                                                                            <span className="truncate">{language.nativeName}</span>
                                                                        </button>
                                                                    ))}
                                                                </div>
                                                            </motion.div>
                                                        )}
                                                    </AnimatePresence>
                                                )}
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
                                                <p className="text-xs text-zinc-500">{t.settings.version} 1.0.0</p>
                                            </div>
                                        </div>
                                        <p className="text-sm text-zinc-400">
                                            {t.settings.tagline}
                                        </p>
                                    </div>
                                </FadeIn>

                                {/* Close Button */}
                                <FadeIn delay={0.25}>
                                    <AnimatedButton variant="glass" fullWidth onClick={onClose}>
                                        {t.modals.close}
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
