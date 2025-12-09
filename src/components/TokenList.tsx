'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import type { TokenBalance } from '@/lib/types';
import Image from 'next/image';
import AdCarousel from './AdCarousel';
import { Pressable, StaggerContainer, StaggerItem, FadeIn } from './ui/Motion';
import { useI18n } from '@/lib/i18n';

interface TokenListProps {
    balances: TokenBalance[];
    isLoading?: boolean;
    onTokenClick?: (tokenBalance: TokenBalance) => void;
    onSend?: () => void;
    onReceive?: () => void;
    onBuy?: () => void;
}

export default function TokenList({ balances, isLoading, onTokenClick, onSend, onReceive, onBuy }: TokenListProps) {
    const { t } = useI18n();
    const sortedBalances = useMemo(() =>
        [...balances].sort((a, b) => {
            if (a.token.symbol === 'WLD') return -1;
            if (b.token.symbol === 'WLD') return 1;
            return b.valueUSD - a.valueUSD;
        }),
        [balances]
    );

    const LoadingSkeleton = () => (
        <div className="divide-y divide-white/5">
            {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center justify-between px-4 py-3">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-zinc-800 animate-pulse" />
                        <div>
                            <div className="w-12 h-4 bg-zinc-800 rounded animate-pulse mb-1" />
                            <div className="w-20 h-3 bg-zinc-800 rounded animate-pulse" />
                        </div>
                    </div>
                    <div className="text-right">
                        <div className="w-16 h-4 bg-zinc-800 rounded animate-pulse mb-1" />
                        <div className="w-12 h-3 bg-zinc-800 rounded animate-pulse" />
                    </div>
                </div>
            ))}
        </div>
    );

    return (
        <div className="flex flex-col gap-3">
            {/* Quick Actions */}
            <FadeIn>
                <div className="flex justify-center gap-3">
                    <motion.button
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={onSend}
                        className="flex flex-col items-center gap-1.5 px-5 py-2.5 glass rounded-2xl group"
                    >
                        <motion.div
                            whileHover={{ scale: 1.1 }}
                            className="w-10 h-10 bg-pink-500/10 rounded-full flex items-center justify-center group-hover:bg-pink-500/20 transition-colors"
                        >
                            <svg className="w-5 h-5 text-pink-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11l5-5m0 0l5 5m-5-5v12" />
                            </svg>
                        </motion.div>
                        <span className="text-xs text-zinc-400 group-hover:text-zinc-300">{t.tokens.send}</span>
                    </motion.button>
                    <motion.button
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={onReceive}
                        className="flex flex-col items-center gap-1.5 px-5 py-2.5 glass rounded-2xl group"
                    >
                        <motion.div
                            whileHover={{ scale: 1.1 }}
                            className="w-10 h-10 bg-emerald-500/10 rounded-full flex items-center justify-center group-hover:bg-emerald-500/20 transition-colors"
                        >
                            <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 13l-5 5m0 0l-5-5m5 5V6" />
                            </svg>
                        </motion.div>
                        <span className="text-xs text-zinc-400 group-hover:text-zinc-300">{t.tokens.receive}</span>
                    </motion.button>
                    <motion.button
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={onBuy}
                        className="flex flex-col items-center gap-1.5 px-5 py-2.5 glass rounded-2xl group"
                    >
                        <motion.div
                            whileHover={{ scale: 1.1 }}
                            className="w-10 h-10 bg-blue-500/10 rounded-full flex items-center justify-center group-hover:bg-blue-500/20 transition-colors"
                        >
                            <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                            </svg>
                        </motion.div>
                        <span className="text-xs text-zinc-400 group-hover:text-zinc-300">{t.tokens.buy}</span>
                    </motion.button>
                </div>
            </FadeIn>

            {/* Ad Carousel */}
            <FadeIn delay={0.1}>
                <AdCarousel />
            </FadeIn>

            {/* Token List */}
            <FadeIn delay={0.15}>
                <div className="glass rounded-2xl overflow-hidden">
                    <div className="px-4 py-2.5 border-b border-white/5">
                        <h3 className="text-xs font-medium text-zinc-500 uppercase tracking-wider">{t.tokens.title}</h3>
                    </div>
                    {isLoading ? (
                        <LoadingSkeleton />
                    ) : (
                        <StaggerContainer className="divide-y divide-white/5">
                            {sortedBalances.map((item) => (
                                <StaggerItem key={item.token.symbol}>
                                    <Pressable
                                        onClick={() => onTokenClick?.(item)}
                                        className="w-full flex items-center justify-between px-4 py-3 text-left"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="relative w-9 h-9 rounded-full overflow-hidden bg-zinc-800">
                                                <Image
                                                    src={item.token.logoURI}
                                                    alt={item.token.name}
                                                    fill
                                                    className="object-cover"
                                                />
                                            </div>
                                            <div>
                                                <p className="font-medium text-white text-sm">{item.token.symbol}</p>
                                                <p className="text-xs text-zinc-500">{item.token.name}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-medium text-white text-sm">{parseFloat(item.balance).toFixed(4)}</p>
                                            <div className="flex items-center justify-end gap-1.5">
                                                <span className="text-xs text-zinc-500">
                                                    ${item.valueUSD.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                                </span>
                                                <span className={`text-[10px] px-1.5 py-0.5 rounded ${item.change24h >= 0 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                                                    {item.change24h >= 0 ? '+' : ''}{item.change24h.toFixed(2)}%
                                                </span>
                                            </div>
                                        </div>
                                    </Pressable>
                                </StaggerItem>
                            ))}
                        </StaggerContainer>
                    )}
                </div>
            </FadeIn>
        </div>
    );
}
