'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MdVerified } from 'react-icons/md';
import { MiniKit } from '@worldcoin/minikit-js';
import Identicon from './Identicon';
import { AnimatedButton, FadeIn } from './ui/Motion';
import { useI18n } from '@/lib/i18n';

interface ProfileCardProps {
    address: string;
    username?: string | null;
    isVerifiedHuman?: boolean;
    totalBalanceUSD: number;
    wldBalance: string;
    onDisconnect: () => void;
}

export default function ProfileCard({
    address,
    username,
    isVerifiedHuman = false,
    totalBalanceUSD,
    wldBalance,
    onDisconnect
}: ProfileCardProps) {
    const { t } = useI18n();
    const [isExpanded, setIsExpanded] = useState(false);
    const [copied, setCopied] = useState(false);
    const [isLoggingOut, setIsLoggingOut] = useState(false);

    const handleDisconnect = async () => {
        if (isLoggingOut) return;

        setIsLoggingOut(true);
        // Wait for animation to complete before disconnecting
        await new Promise(resolve => setTimeout(resolve, 800));
        onDisconnect();
    };

    const displayAddress = `${address.slice(0, 6)}...${address.slice(-4)}`;
    const explorerUrl = `https://worldscan.org/address/${address}`;

    const copyAddress = async () => {
        await navigator.clipboard.writeText(address);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <FadeIn>
            <motion.div
                layout
                className="glass rounded-2xl p-4"
            >
                {/* Header - Always visible */}
                <motion.button
                    type="button"
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="w-full flex items-center gap-4 text-left"
                    whileTap={{ scale: 0.99 }}
                >
                    <motion.div
                        whileHover={{ scale: 1.05 }}
                        transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                    >
                        <Identicon address={address} size={56} />
                    </motion.div>
                    <div className="flex-1 min-w-0">
                        {/* World ID Username with Verification Badge */}
                        {username ? (
                            <div className="flex items-center gap-1.5 mb-0.5">
                                <span className="font-bold text-white text-lg">@{username}</span>
                                {/* Verified badge - only shown for World ID verified users */}
                                {isVerifiedHuman && <MdVerified className="w-[18px] h-[18px] text-[#1D9BF0]" />}
                            </div>
                        ) : (
                            <div className="flex items-center gap-2 mb-0.5">
                                <span className="font-semibold text-white">{displayAddress}</span>
                                <motion.div
                                    animate={{ scale: [1, 1.2, 1] }}
                                    transition={{ duration: 2, repeat: Infinity }}
                                    className="w-1.5 h-1.5 bg-emerald-400 rounded-full"
                                />
                            </div>
                        )}
                        {/* Show address as secondary when username exists */}
                        {username && (
                            <p className="text-xs text-zinc-500 font-mono">{displayAddress}</p>
                        )}
                        <motion.p
                            key={totalBalanceUSD}
                            initial={{ opacity: 0, y: 5 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="text-2xl font-bold text-white mt-1"
                        >
                            ${totalBalanceUSD.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </motion.p>
                    </div>

                    <motion.div
                        animate={{ rotate: isExpanded ? 180 : 0 }}
                        transition={{ duration: 0.2 }}
                        className="p-2.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition-colors"
                    >
                        <svg className="w-5 h-5 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                    </motion.div>
                </motion.button>

                {/* Expandable Content */}
                <AnimatePresence>
                    {isExpanded && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden"
                        >
                            <div className="mt-4 pt-4 border-t border-white/5">
                                {/* WLD Balance */}
                                <motion.div
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.05 }}
                                    className="flex items-center justify-between mb-4"
                                >
                                    <span className="text-sm text-zinc-500">{t.profile.wldBalance}</span>
                                    <span className="text-xl font-semibold text-pink-400">{wldBalance} WLD</span>
                                </motion.div>

                                {/* Action Buttons */}
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.1 }}
                                    className="flex gap-2 mb-4"
                                >
                                    <AnimatedButton
                                        variant={copied ? 'gradient' : 'glass'}
                                        onClick={copyAddress}
                                        size="sm"
                                        fullWidth
                                    >
                                        {copied ? (
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                            </svg>
                                        ) : (
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                            </svg>
                                        )}
                                        <span className="text-sm">{copied ? t.profile.addressCopied : t.profile.copyAddress}</span>
                                    </AnimatedButton>

                                    <motion.a
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        href={explorerUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex-1 flex items-center justify-center gap-2 py-2 px-4 glass rounded-xl text-zinc-400 hover:text-white hover:bg-white/5 transition-colors text-sm font-semibold"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                        </svg>
                                        {t.profile.explorer}
                                    </motion.a>

                                    <motion.button
                                        whileHover={{ scale: isLoggingOut ? 1 : 1.02 }}
                                        whileTap={{ scale: isLoggingOut ? 1 : 0.98 }}
                                        type="button"
                                        onClick={handleDisconnect}
                                        disabled={isLoggingOut}
                                        className={`shrink-0 flex items-center justify-center gap-1.5 p-2.5 glass rounded-xl transition-colors ${isLoggingOut
                                            ? 'text-red-400 bg-red-500/20 cursor-not-allowed'
                                            : 'text-zinc-400 hover:text-red-400 hover:bg-red-500/10'
                                            }`}
                                        title={t.profile.disconnect}
                                    >
                                        {isLoggingOut ? (
                                            <motion.div
                                                initial={{ rotate: 0 }}
                                                animate={{ rotate: 360 }}
                                                transition={{ duration: 0.8, ease: 'linear', repeat: Infinity }}
                                            >
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                                </svg>
                                            </motion.div>
                                        ) : (
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                            </svg>
                                        )}
                                    </motion.button>
                                </motion.div>

                                {/* Network Info */}
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.15 }}
                                    className="bg-black/30 rounded-xl p-3 flex items-center justify-between"
                                >
                                    <div className="flex items-center gap-2">
                                        <svg viewBox="0 0 138 138" className="w-6 h-6" fill="white">
                                            <path d="M103.596 9.22563C93.0251 3.07522 81.4931 0 69 0C56.507 0 44.9749 3.07522 34.4039 9.22563C23.8329 15.3761 15.3761 23.8329 9.22563 34.4039C3.07522 44.9749 0 56.507 0 69C0 81.493 3.07522 93.0251 9.22563 103.596C15.3761 114.167 23.8329 122.624 34.4039 128.774C44.9749 134.925 56.507 138 69 138C81.4931 138 93.0251 134.925 103.596 128.774C114.167 122.624 122.624 114.167 128.774 103.596C134.925 93.0251 138 81.493 138 69C138 56.507 134.925 44.9749 128.774 34.4039C122.624 23.8329 114.167 15.3761 103.596 9.22563ZM73.2284 93.9861C65.3482 93.9861 59.1978 91.6797 54.3928 87.2591C51.1253 84.1838 49.0112 80.5321 48.0502 76.1114H122.624C121.855 82.4541 119.933 88.4123 117.242 93.9861H73.4206H73.2284ZM48.0502 62.0808C49.0112 57.8524 51.1253 54.0084 54.3928 50.9332C59.1978 46.5125 65.3482 44.2061 73.2284 44.2061H117.242C120.125 49.78 121.855 55.7382 122.624 62.0808H48.0502ZM22.2953 41.5153C27.1003 33.2507 33.6351 26.5237 41.8997 21.7187C50.1643 16.9137 59.1978 14.415 69.1922 14.415C79.1867 14.415 88.2201 16.9137 96.4847 21.7187C100.713 24.2173 104.365 27.1003 107.825 30.5599H73.0362C65.156 30.5599 58.0446 32.2897 51.8942 35.5571C45.7438 38.8245 40.9387 43.4373 37.6713 49.2034C35.3649 53.2396 33.8273 57.6602 33.0585 62.273H15.9527C16.7215 54.9694 19.0279 48.0501 22.6797 41.7075L22.2953 41.5153ZM96.2925 116.281C88.0279 121.086 78.9944 123.585 69 123.585C59.0056 123.585 49.9722 121.086 41.7075 116.281C33.4429 111.476 26.9081 104.749 22.1031 96.4847C18.4513 90.1421 16.1448 83.4151 15.376 76.1114H32.4819C33.2507 80.7243 34.7883 85.1448 37.0947 89.1811C40.5543 94.9471 45.3593 99.3677 51.3176 102.827C57.468 106.095 64.5794 107.825 72.4596 107.825H107.056C103.788 111.092 100.137 113.975 96.1003 116.281H96.2925Z" />
                                        </svg>
                                        <div>
                                            <p className="text-xs text-white font-medium">{t.profile.worldChain}</p>
                                            <p className="text-[10px] text-zinc-500">{t.profile.chainId}: 480</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <motion.div
                                            animate={{ scale: [1, 1.3, 1] }}
                                            transition={{ duration: 1.5, repeat: Infinity }}
                                            className="w-1.5 h-1.5 bg-emerald-400 rounded-full"
                                        />
                                        <span className="text-[10px] text-emerald-400">{t.profile.connected}</span>
                                    </div>
                                </motion.div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>
        </FadeIn>
    );
}
