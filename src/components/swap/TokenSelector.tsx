'use client';

import { useState, useMemo } from 'react';
import Image from 'next/image';
import TokenIcon from '../ui/TokenIcon';
import { motion, AnimatePresence } from 'framer-motion';
import { WORLD_CHAIN_TOKENS } from '@/lib/tokens';
import { useI18n } from '@/lib/i18n';
import type { Token, TokenBalance } from '@/lib/types';
import { useTokenVolume } from '@/hooks/useTokenVolume';

interface TokenSelectorProps {
    selectedToken: Token | null;
    onSelect: (token: Token) => void;
    excludeToken?: Token | null;
    balances?: TokenBalance[];
}

export default function TokenSelector({ selectedToken, onSelect, excludeToken, balances = [] }: TokenSelectorProps) {
    const { t } = useI18n();
    const [isOpen, setIsOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const { volumes } = useTokenVolume();

    const featuredTokens = useMemo(() =>
        WORLD_CHAIN_TOKENS.slice(0, 4).filter(t => t.address !== excludeToken?.address)
        , [excludeToken]);

    const filteredTokens = useMemo(() => {
        const query = searchQuery.toLowerCase().trim();
        const base = WORLD_CHAIN_TOKENS.filter(token => {
            if (token.address === excludeToken?.address) return false;
            if (!query) return true;
            return (
                token.symbol.toLowerCase().includes(query) ||
                token.name.toLowerCase().includes(query) ||
                token.address.toLowerCase() === query
            );
        });


        return [...base].sort((a, b) => {
            const volA = volumes[a.address.toLowerCase()] || 0;
            const volB = volumes[b.address.toLowerCase()] || 0;
            return volB - volA;
        });
    }, [searchQuery, excludeToken, volumes]);

    const userTokens = useMemo(() =>
        balances.filter(b => Number(b.balance) > 0 && b.token.address !== excludeToken?.address)
        , [balances, excludeToken]);

    return (
        <div className="">
            <button
                onClick={() => setIsOpen(true)}
                className="flex items-center gap-2 px-3 py-1.5 bg-zinc-800/80 hover:bg-zinc-700/80 border border-white/5 rounded-full transition-all active:scale-95 shrink-0"
            >
                {selectedToken ? (
                    <>
                        <TokenIcon
                            symbol={selectedToken.symbol}
                            name={selectedToken.name}
                            logoURI={selectedToken.logoURI}
                            size={24}
                            className="border border-white/10"
                        />
                        <span className="text-white font-bold text-sm tracking-tight">{selectedToken.symbol}</span>
                    </>
                ) : (
                    <span className="text-pink-400 font-bold text-sm px-1">{t.swap.selectToken}</span>
                )}
                <svg
                    className="w-4 h-4 text-zinc-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                </svg>
            </button>

            <AnimatePresence>
                {isOpen && (
                    <>

                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsOpen(false)}
                            className="fixed inset-0 bg-black/60 z-[100] backdrop-blur-sm"
                        />


                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="fixed inset-x-2 bottom-4 top-20 md:inset-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-full md:max-w-md md:max-h-[85vh] bg-zinc-950 border border-white/10 rounded-[32px] z-[101] flex flex-col overflow-hidden shadow-2xl"
                        >

                            <div className="sticky top-0 bg-zinc-950 z-20 pt-3 pb-2 px-1">

                                <div className="md:hidden w-12 h-1.5 bg-zinc-800 rounded-full mx-auto mb-3" />


                                <div className="px-4 pb-2 flex justify-between items-center">
                                    <h3 className="text-lg font-bold text-white px-2">{t.tokenSelector.selectToken}</h3>
                                    <button
                                        onClick={() => setIsOpen(false)}
                                        className="p-2 hover:bg-white/5 rounded-full text-zinc-400 transition-colors"
                                    >
                                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                </div>


                                <div className="px-4 pb-2">
                                    <div className="relative group">
                                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-pink-400 transition-colors">
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                            </svg>
                                        </div>
                                        <input
                                            type="text"
                                            placeholder={t.tokenSelector.searchPlaceholder}
                                            autoFocus
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            className="w-full bg-zinc-900/50 border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-white placeholder:text-zinc-600 outline-none focus:border-pink-500/30 focus:bg-zinc-900/80 transition-all"
                                        />
                                    </div>
                                </div>
                            </div>


                            <div className="flex-1 overflow-y-auto px-1 pb-4">

                                {!searchQuery && (
                                    <div className="flex flex-wrap gap-2 px-3 mb-6">
                                        {featuredTokens.map((token) => (
                                            <button
                                                key={token.address}
                                                onClick={() => {
                                                    onSelect(token);
                                                    setIsOpen(false);
                                                }}
                                                className="flex items-center gap-2 px-3 py-2 bg-zinc-900/50 hover:bg-white/5 border border-white/5 rounded-2xl transition-all"
                                            >
                                                <TokenIcon
                                                    symbol={token.symbol}
                                                    name={token.name}
                                                    logoURI={token.logoURI}
                                                    size={20}
                                                />
                                                <span className="text-white font-bold text-xs uppercase tracking-tight">{token.symbol}</span>
                                            </button>
                                        ))}
                                    </div>
                                )}


                                {!searchQuery && userTokens.length > 0 && (
                                    <div className="mb-4">
                                        <div className="px-4 py-2 flex items-center gap-2">
                                            <svg className="w-3.5 h-3.5 text-zinc-500" fill="currentColor" viewBox="0 0 20 20">
                                                <path d="M7 3a1 1 0 000 2h6a1 1 0 100-2H7zM4 7a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1zM2 11a2 2 0 012-2h12a2 2 0 012 2v4a2 2 0 01-2 2H4a2 2 0 01-2-2v-4z" />
                                            </svg>
                                            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.15em]">{t.tokenSelector.yourTokens}</span>
                                        </div>
                                        {userTokens.map((balance) => (
                                            <TokenItem
                                                key={balance.token.address}
                                                token={balance.token}
                                                balance={balance.balance}
                                                valueUSD={balance.valueUSD}
                                                onClick={() => {
                                                    onSelect(balance.token);
                                                    setIsOpen(false);
                                                }}
                                            />
                                        ))}
                                    </div>
                                )}


                                <div className="">
                                    {!searchQuery && (
                                        <div className="px-4 py-2 flex items-center gap-2">
                                            <svg className="w-3.5 h-3.5 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                                            </svg>
                                            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.15em]">{t.tokenSelector.tokensByVolume}</span>
                                        </div>
                                    )}
                                    {filteredTokens.map((token) => (
                                        <TokenItem
                                            key={token.address}
                                            token={token}
                                            volumeUSD={volumes[token.address.toLowerCase()]}
                                            onClick={() => {
                                                onSelect(token);
                                                setIsOpen(false);
                                            }}
                                        />
                                    ))}
                                    {filteredTokens.length === 0 && (
                                        <div className="text-center py-12 text-zinc-600 text-sm">
                                            {t.tokens.noTokens}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}

function TokenItem({ token, balance, valueUSD, volumeUSD, onClick }: { token: Token; balance?: string; valueUSD?: number; volumeUSD?: number; onClick: () => void }) {
    return (
        <button
            onClick={onClick}
            className="w-full flex items-center justify-between px-4 py-3 hover:bg-white/5 transition-colors group"
        >
            <div className="flex items-center gap-3">
                <TokenIcon
                    symbol={token.symbol}
                    name={token.name}
                    logoURI={token.logoURI}
                    size={40}
                    className="border border-white/5"
                />
                <div className="flex flex-col items-start">
                    <span className="text-white font-bold tracking-tight">{token.name}</span>
                    <span className="text-zinc-500 text-xs font-medium">{token.symbol}</span>
                </div>
            </div>

            <div className="flex flex-col items-end">
                {valueUSD !== undefined ? (
                    <>
                        <span className="text-white font-bold tracking-tight">
                            {valueUSD < 0.01 ? '<$0.01' : `$${valueUSD.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                        </span>
                        {balance && (
                            <span className="text-zinc-500 text-xs font-medium">
                                {Number(balance) < 0.00001 ? '<0.00001' : parseFloat(balance).toLocaleString(undefined, { maximumFractionDigits: 5 })} {token.symbol}
                            </span>
                        )}
                    </>
                ) : volumeUSD !== undefined ? (
                    <div className="flex flex-col items-end">
                        <span className="text-[10px] font-bold text-zinc-600 uppercase tracking-wider mb-0.5">24h Vol</span>
                        <span className="text-white font-bold tracking-tight">
                            ${volumeUSD >= 1000000
                                ? `${(volumeUSD / 1000000).toFixed(2)}M`
                                : volumeUSD >= 1000
                                    ? `${(volumeUSD / 1000).toFixed(1)}K`
                                    : volumeUSD.toFixed(0)}
                        </span>
                    </div>
                ) : null}
            </div>
        </button>
    );
}
