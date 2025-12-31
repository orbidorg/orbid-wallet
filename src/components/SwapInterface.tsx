'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FadeIn } from './ui/Motion';
import { useI18n } from '@/lib/i18n';
import { useAuth } from '@/lib/AuthContext';
import { useWalletBalances } from '@/hooks/useWalletBalances';
import { useSwapQuote } from '@/hooks/useSwapQuote';
import { ORBID_SWAP_RELAY_ADDRESS, SWAP_CONFIG } from '@/lib/uniswap/config';
import TokenSelector from './swap/TokenSelector';
import AmountInput from './swap/AmountInput';
import QuoteDisplay from './swap/QuoteDisplay';
import type { Token } from '@/lib/types';
import type { Token as SwapToken } from '@/lib/uniswap/types';

// RPC URL for World Chain
const WORLD_CHAIN_RPC = process.env.NEXT_PUBLIC_ALCHEMY_RPC_URL || 'https://worldchain.drpc.org';

export default function SwapInterface() {
    const { t } = useI18n();
    const { walletAddress } = useAuth();
    const { balances } = useWalletBalances(walletAddress || '');

    // Swap state
    const [tokenIn, setTokenIn] = useState<Token | null>(null);
    const [tokenOut, setTokenOut] = useState<Token | null>(null);
    const [amountIn, setAmountIn] = useState('');
    const [isSwapping, setIsSwapping] = useState(false);
    const [isInputHovered, setIsInputHovered] = useState(false);
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        setIsMobile(window.innerWidth < 768);
        const handleResize = () => setIsMobile(window.innerWidth < 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Convert Token to SwapToken
    const swapTokenIn: SwapToken | null = tokenIn ? {
        address: tokenIn.address,
        symbol: tokenIn.symbol,
        name: tokenIn.name,
        decimals: tokenIn.decimals,
        logoURI: tokenIn.logoURI,
    } : null;

    const swapTokenOut: SwapToken | null = tokenOut ? {
        address: tokenOut.address,
        symbol: tokenOut.symbol,
        name: tokenOut.name,
        decimals: tokenOut.decimals,
        logoURI: tokenOut.logoURI,
    } : null;

    // Get quote
    const { quote, isLoading: isQuoteLoading, error: quoteError } = useSwapQuote({
        tokenIn: swapTokenIn,
        tokenOut: swapTokenOut,
        amountIn,
        rpcUrl: WORLD_CHAIN_RPC,
    });

    // Get balance and prices for selected tokens
    const tokenInData = tokenIn && balances ? balances.find(b => b.token.symbol === tokenIn.symbol) : undefined;
    const tokenOutData = tokenOut && balances ? balances.find(b => b.token.symbol === tokenOut.symbol) : undefined;

    const tokenInBalance = tokenInData?.balance;
    const tokenInPrice = tokenInData?.valueUSD ? tokenInData.valueUSD / parseFloat(tokenInData.balance || '1') : 0;
    const fiatValueIn = tokenIn && amountIn ? `$${(parseFloat(amountIn) * tokenInPrice).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '$0.00';

    const amountOut = quote ? formatBigInt(quote.amountOut, tokenOut?.decimals || 18) : '';
    const tokenOutPrice = tokenOutData?.valueUSD ? tokenOutData.valueUSD / parseFloat(tokenOutData.balance || '1') : 0;
    // For output, if we don't have price for tokenOut yet, we can estimate from quote if tokenIn has price
    const estimatedTokenOutPrice = tokenIn && tokenOut && quote ? (parseFloat(amountIn) * tokenInPrice) / parseFloat(amountOut) : tokenOutPrice;
    const fiatValueOut = tokenOut && amountOut ? `$${(parseFloat(amountOut) * (tokenOutPrice || estimatedTokenOutPrice)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '$0.00';

    // Swap tokens
    const handleSwapTokens = () => {
        const temp = tokenIn;
        setTokenIn(tokenOut);
        setTokenOut(temp);
        setAmountIn('');
    };

    const setPercentage = (percent: number) => {
        if (tokenInBalance) {
            const rawBalance = parseFloat(tokenInBalance.replace(/,/g, ''));
            const newAmount = (rawBalance * percent) / 100;
            setAmountIn(newAmount.toString());
        }
    };

    // Check if swap is ready
    const isContractDeployed = !!ORBID_SWAP_RELAY_ADDRESS && ORBID_SWAP_RELAY_ADDRESS !== '0x';
    const canSwap = tokenIn && tokenOut && amountIn && quote && !isQuoteLoading;

    // Execute swap (placeholder)
    const handleSwap = async () => {
        if (!canSwap) return;
        setIsSwapping(true);
        try {
            await new Promise(resolve => setTimeout(resolve, 2000));
            alert('Swap functionality coming soon!');
        } finally {
            setIsSwapping(false);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col max-w-md mx-auto w-full px-2"
        >
            {/* Main Swap Container */}
            <div className="relative flex flex-col gap-1 mt-4">

                {/* Sell Card */}
                <div
                    onMouseEnter={() => setIsInputHovered(true)}
                    onMouseLeave={() => setIsInputHovered(false)}
                    className="bg-zinc-900/40 border border-white/5 rounded-[24px] p-4 pt-5 pb-5 hover:bg-zinc-900/60 transition-colors group/card"
                >
                    <div className="flex justify-between items-center mb-1 h-6">
                        <span className="text-sm font-semibold text-zinc-500">Sell</span>

                        {/* Percentage Buttons - desktop hover / always on mobile */}
                        <AnimatePresence>
                            {(isInputHovered || isMobile) && tokenIn && (
                                <motion.div
                                    initial={{ opacity: 0, x: 10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 10 }}
                                    className="flex items-center gap-1"
                                >
                                    {[25, 50, 75].map((p) => (
                                        <button
                                            key={p}
                                            onClick={() => setPercentage(p)}
                                            className="px-2 py-0.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-[10px] font-bold text-zinc-400 transition-colors"
                                        >
                                            {p}%
                                        </button>
                                    ))}
                                    <button
                                        onClick={() => setPercentage(100)}
                                        className="px-2 py-0.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-[10px] font-bold text-zinc-400 transition-colors uppercase"
                                    >
                                        Max
                                    </button>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    <div className="flex items-center gap-4 py-2">
                        <AmountInput
                            value={amountIn}
                            onChange={setAmountIn}
                            fiatValue={fiatValueIn}
                            label="Sell"
                        />
                        <TokenSelector
                            selectedToken={tokenIn}
                            onSelect={setTokenIn}
                            excludeToken={tokenOut}
                            balances={balances}
                        />
                    </div>

                    <div className="flex justify-end mt-1">
                        {tokenInBalance && (
                            <span className="text-xs font-semibold text-zinc-500">
                                {t.tokens.balance || 'Balance'}: {parseFloat(tokenInBalance).toLocaleString(undefined, { maximumFractionDigits: 6 })}
                            </span>
                        )}
                    </div>
                </div>

                {/* Floating Swap Button */}
                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-20">
                    <motion.button
                        whileHover={{ scale: 1.1, rotate: 180 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={handleSwapTokens}
                        className="p-2.5 bg-zinc-950 border-4 border-black rounded-2xl shadow-xl hover:text-pink-400 transition-colors group"
                    >
                        <svg className="w-5 h-5 text-zinc-400 group-hover:text-pink-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                        </svg>
                    </motion.button>
                </div>

                {/* Buy Card */}
                <div className="bg-zinc-900/40 border border-white/5 rounded-[24px] p-4 pt-5 pb-5 hover:bg-zinc-900/60 transition-colors">
                    <div className="flex justify-between items-center mb-1 h-6">
                        <span className="text-sm font-semibold text-zinc-500">Buy</span>
                    </div>

                    <div className="flex items-center gap-4 py-2">
                        <AmountInput
                            value={amountOut}
                            onChange={() => { }}
                            fiatValue={fiatValueOut}
                            label="Buy"
                            readOnly
                        />
                        <TokenSelector
                            selectedToken={tokenOut}
                            onSelect={setTokenOut}
                            excludeToken={tokenIn}
                            balances={balances}
                        />
                    </div>

                    <div className="flex justify-end mt-1">
                        {tokenOutData && (
                            <span className="text-xs font-semibold text-zinc-500">
                                {t.tokens.balance || 'Balance'}: {parseFloat(tokenOutData.balance).toLocaleString(undefined, { maximumFractionDigits: 6 })}
                            </span>
                        )}
                    </div>
                </div>
            </div>

            {/* Quote & Info Section */}
            <div className="mt-3 px-2">
                <QuoteDisplay
                    quote={quote}
                    tokenIn={tokenIn}
                    tokenOut={tokenOut}
                    isLoading={isQuoteLoading}
                    error={quoteError}
                />
            </div>

            {/* Main Action Button */}
            <div className="mt-6 px-1">
                <motion.button
                    whileHover={{ scale: canSwap ? 1.01 : 1 }}
                    whileTap={{ scale: canSwap ? 0.99 : 1 }}
                    onClick={handleSwap}
                    disabled={!canSwap || isSwapping}
                    className={`
                        w-full py-5 rounded-2xl font-bold text-lg shadow-xl transition-all duration-300
                        ${canSwap
                            ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-pink-500/20 active:shadow-none'
                            : 'bg-zinc-800 text-zinc-500 cursor-not-allowed opacity-50'
                        }
                    `}
                >
                    {isSwapping ? (
                        <span className="flex items-center justify-center gap-2">
                            <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
                                className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
                            />
                            {t.swap.swapping}
                        </span>
                    ) : !tokenIn || !tokenOut ? (
                        t.swap.selectToken
                    ) : !amountIn ? (
                        t.swap.enterAmount
                    ) : isQuoteLoading ? (
                        t.swap.fetchingQuote
                    ) : quoteError ? (
                        t.swap.noLiquidity
                    ) : !isContractDeployed ? (
                        'Ready (Deploy Contract)'
                    ) : (
                        t.swap.swapButton
                    )}
                </motion.button>
            </div>

            <div className="mt-6 flex justify-center gap-4 text-[10px] text-zinc-600 font-medium uppercase tracking-widest">
                <span>Uniswap API</span>
                <span>•</span>
                <span>{SWAP_CONFIG.FEE_BPS / 100}% {t.swap.fee || 'Fee'}</span>
            </div>
        </motion.div>
    );
}

function formatBigInt(value: bigint, decimals: number): string {
    const divisor = BigInt(10) ** BigInt(decimals);
    const whole = value / divisor;
    const fraction = value % divisor;

    if (fraction === BigInt(0)) {
        return whole.toString();
    }

    const fractionStr = fraction.toString().padStart(decimals, '0').slice(0, 6);
    const trimmed = fractionStr.replace(/0+$/, '');

    return trimmed ? `${whole}.${trimmed}` : whole.toString();
}
