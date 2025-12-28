'use client';

import { useState, lazy, Suspense } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/lib/AuthContext';
import type { TabType, TokenBalance } from '@/lib/types';
import { useWalletBalances } from '@/hooks/useWalletBalances';
import BottomNav from './BottomNav';
import TokenList from './TokenList';
import SwapInterface from './SwapInterface';
import ActivityList from './ActivityList';
import WorldIDVerify from './WorldIDVerify';
import ProfileCard from './ProfileCard';
import SocialLinks from './SocialLinks';
import NewsletterModal from './modals/NewsletterModal';
import { AnimatedButton, FadeIn } from './ui/Motion';
import { QRCodeSVG } from 'qrcode.react';
import { useI18n } from '@/lib/i18n';

// Lazy load heavy modals (reduces initial bundle by ~100KB)
const TokenDetailModal = lazy(() => import('./modals/TokenDetailModal'));
const SendModal = lazy(() => import('./modals/SendModal'));
const ReceiveModal = lazy(() => import('./modals/ReceiveModal'));
const BuyModal = lazy(() => import('./modals/BuyModal'));
const SettingsModal = lazy(() => import('./modals/SettingsModal'));

// Loading fallback for modals
const ModalLoader = () => (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
        <div className="w-8 h-8 border-2 border-pink-500 border-t-transparent rounded-full animate-spin" />
    </div>
);

const WORLD_APP_DEEP_LINK = 'https://worldcoin.org/mini-app?app_id=app_920c1c9a0cb3aaa68e626f54c09f3cf9';

export default function WalletApp() {
    const {
        isReady,
        isAuthenticated,
        walletAddress,
        username,
        isVerifiedHuman,
        isInWorldApp,
        loginWithWorldApp,
        logout,
        loginAsDev,
    } = useAuth();
    const { t } = useI18n();
    const [activeTab, setActiveTab] = useState<TabType>('wallet');
    const [selectedToken, setSelectedToken] = useState<TokenBalance | null>(null);
    const [sendWithToken, setSendWithToken] = useState<TokenBalance | null>(null);
    const [showSendModal, setShowSendModal] = useState(false);
    const [showReceiveModal, setShowReceiveModal] = useState(false);
    const [showBuyModal, setShowBuyModal] = useState(false);
    const [showSettingsModal, setShowSettingsModal] = useState(false);

    const { balances, isLoading: balancesLoading, totalValueUSD } = useWalletBalances(walletAddress);
    const wldBalance = balances.find(b => b.token.symbol === 'WLD')?.balance || '0';

    // Loading state
    if (!isReady) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex flex-col items-center gap-4"
                >
                    <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                        className="w-12 h-12 border-2 border-pink-500 border-t-transparent rounded-full"
                    />
                    <p className="text-zinc-500 text-sm">{t.common.loading}</p>
                </motion.div>
            </div>
        );
    }

    // Not authenticated - show connect screen
    if (!isAuthenticated) {
        // Browser users - show QR code to open in World App
        if (!isInWorldApp) {
            return (
                <div className="min-h-screen bg-black flex flex-col items-center justify-center p-8 relative">
                    {/* Static gradient background */}
                    <div className="absolute inset-0 overflow-hidden pointer-events-none">
                        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-pink-500/10 rounded-full blur-[120px]" />
                        <div className="absolute bottom-1/4 left-1/3 w-64 h-64 bg-purple-500/10 rounded-full blur-[100px]" />
                    </div>

                    <div className="relative max-w-sm w-full text-center">
                        {/* Logo */}
                        <div className="w-24 h-24 mx-auto mb-6">
                            <Image src="/logo.svg" alt="OrbId" width={96} height={96} priority />
                        </div>

                        <h1 className="text-3xl font-display font-bold text-white mb-2 tracking-tight">
                            OrbId Wallet
                        </h1>
                        <p className="text-zinc-400 mb-8">
                            {t.wallet.openFromWorldApp}
                        </p>

                        {/* QR Code */}
                        <div className="bg-white p-4 rounded-2xl mx-auto w-fit mb-6">
                            <QRCodeSVG
                                value={WORLD_APP_DEEP_LINK}
                                size={180}
                                level="M"
                                includeMargin={false}
                            />
                        </div>

                        <p className="text-zinc-500 text-sm mb-4">
                            {t.wallet.scanWithPhone}
                        </p>

                        <a
                            href={WORLD_APP_DEEP_LINK}
                            className="inline-block w-full py-4 px-6 bg-gradient-to-r from-pink-500 to-purple-600 text-white font-semibold rounded-2xl shadow-lg shadow-pink-500/20 hover:opacity-90 active:scale-[0.98] transition-all"
                        >
                            {t.wallet.openInWorldApp}
                        </a>

                        <p className="mt-8 text-xs text-zinc-600">
                            {t.wallet.poweredBy}
                        </p>

                        {/* Developer Bypass - only in development */}
                        {process.env.NODE_ENV === 'development' && (
                            <button
                                onClick={loginAsDev}
                                className="mt-4 text-xs text-zinc-500 hover:text-pink-400 underline transition-colors"
                            >
                                Connect for Devs
                            </button>
                        )}
                    </div>
                </div>
            );
        }

        // World App users - show connect button
        return (
            <div className="min-h-screen bg-black flex flex-col items-center justify-center p-6 relative">
                {/* Static gradient background */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-72 h-72 bg-pink-500/10 rounded-full blur-[100px]" />
                    <div className="absolute bottom-1/4 left-1/3 w-48 h-48 bg-purple-500/10 rounded-full blur-[80px]" />
                </div>

                <div className="relative max-w-xs w-full text-center">
                    {/* Logo - smaller for mobile */}
                    <div className="w-20 h-20 mx-auto mb-6">
                        <Image src="/logo.svg" alt="OrbId" width={80} height={80} priority />
                    </div>

                    <h1 className="text-2xl font-display font-bold text-white mb-2 tracking-tight">
                        OrbId Wallet
                    </h1>
                    <p className="text-zinc-400 text-sm mb-8">{t.wallet.gateway}</p>

                    {/* Connect Button - smaller */}
                    <button
                        onClick={loginWithWorldApp}
                        className="w-full py-3 px-5 bg-gradient-to-r from-pink-500 to-purple-600 text-white font-semibold rounded-xl shadow-lg shadow-pink-500/20 hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center gap-2 text-sm"
                    >
                        <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor">
                            <circle cx="12" cy="12" r="10" strokeWidth="2" />
                            <circle cx="12" cy="12" r="4" fill="currentColor" />
                        </svg>
                        {t.wallet.connectWithWorldApp}
                    </button>

                    <p className="mt-4 text-xs text-zinc-500 text-center">
                        {t.wallet.termsNotice}{' '}
                        <a href="/legal/terms" className="text-pink-400 hover:underline">{t.wallet.termsLink}</a>
                        {' '}{t.wallet.and}{' '}
                        <a href="/legal/privacy" className="text-pink-400 hover:underline">{t.wallet.privacyLink}</a>
                    </p>

                    <p className="mt-4 text-xs text-zinc-600">
                        {t.wallet.poweredBy}
                    </p>
                </div>
            </div>
        );
    }

    // Authenticated with wallet - show wallet app
    return (
        <div className="min-h-screen bg-black pb-32">
            {/* Header */}
            <motion.header
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="sticky top-0 z-40 glass-strong"
            >
                <div className="flex items-center justify-between max-w-md mx-auto px-4 py-2.5">
                    <div className="w-10" />
                    <motion.div
                        whileHover={{ scale: 1.02 }}
                        className="flex items-center gap-2"
                    >
                        <Image src="/logo.svg" alt="OrbId" width={24} height={24} />
                        <span className="font-display font-bold text-white text-sm tracking-tight">OrbId Wallet</span>
                    </motion.div>
                    <motion.button
                        whileHover={{ scale: 1.1, rotate: 45 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => setShowSettingsModal(true)}
                        className="p-2 rounded-full hover:bg-white/10 transition-colors"
                    >
                        <svg className="w-5 h-5 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                    </motion.button>
                </div>
            </motion.header>

            {/* Main Content */}
            <main className="px-4 py-4 max-w-md mx-auto">
                <AnimatePresence mode="wait">
                    {activeTab === 'wallet' && (
                        <motion.div
                            key="wallet"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            transition={{ duration: 0.2 }}
                            className="flex flex-col gap-8" /* 32px gap between main sections */
                        >
                            <ProfileCard
                                address={walletAddress!}
                                username={username}
                                isVerifiedHuman={isVerifiedHuman}
                                totalBalanceUSD={totalValueUSD}
                                wldBalance={wldBalance}
                                onDisconnect={logout}
                            />
                            <TokenList
                                balances={balances}
                                isLoading={balancesLoading}
                                onTokenClick={setSelectedToken}
                                onSend={() => setShowSendModal(true)}
                                onReceive={() => setShowReceiveModal(true)}
                                onBuy={() => setShowBuyModal(true)}
                            />
                            <div className="flex flex-col gap-4"> {/* 16px gap between secondary items */}
                                <WorldIDVerify />
                                <SocialLinks />
                                <div className="h-4" /> {/* Extra buffer before BottomNav */}
                            </div>
                        </motion.div>
                    )}
                    {activeTab === 'swap' && (
                        <motion.div
                            key="swap"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            transition={{ duration: 0.2 }}
                        >
                            <SwapInterface />
                        </motion.div>
                    )}
                    {activeTab === 'activity' && (
                        <motion.div
                            key="activity"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            transition={{ duration: 0.2 }}
                        >
                            <ActivityList walletAddress={walletAddress!} />
                        </motion.div>
                    )}
                </AnimatePresence>
            </main>

            {/* Bottom Navigation */}
            <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />

            {/* Modals */}
            {/* Lazy-loaded modals with Suspense */}
            <Suspense fallback={<ModalLoader />}>
                {selectedToken && (
                    <TokenDetailModal
                        tokenBalance={selectedToken}
                        isOpen={true}
                        onClose={() => setSelectedToken(null)}
                        onSend={() => {
                            setSendWithToken(selectedToken);
                            setSelectedToken(null);
                            setShowSendModal(true);
                        }}
                        onBuy={() => { setSelectedToken(null); setShowBuyModal(true); }}
                    />
                )}

                {showSendModal && (
                    <SendModal
                        isOpen={showSendModal}
                        onClose={() => {
                            setShowSendModal(false);
                            setSendWithToken(null);
                        }}
                        walletAddress={walletAddress!}
                        balances={balances}
                        initialToken={sendWithToken}
                    />
                )}

                {showReceiveModal && (
                    <ReceiveModal
                        isOpen={showReceiveModal}
                        onClose={() => setShowReceiveModal(false)}
                        walletAddress={walletAddress!}
                    />
                )}

                {showBuyModal && (
                    <BuyModal
                        isOpen={showBuyModal}
                        onClose={() => setShowBuyModal(false)}
                    />
                )}

                {showSettingsModal && (
                    <SettingsModal
                        isOpen={showSettingsModal}
                        onClose={() => setShowSettingsModal(false)}
                    />
                )}

                <NewsletterModal />
            </Suspense>
        </div>
    );
}
