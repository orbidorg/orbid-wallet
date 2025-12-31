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
import SwapSettings from './swap/SwapSettings';
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
    const [slippage, setSlippage] = useState(0.5);
    const [deadline, setDeadline] = useState(20);
    const [useV2, setUseV2] = useState(true);
    const [useV3, setUseV3] = useState(true);
    const [useV4, setUseV4] = useState(true);

    const handlePoolSettingsChange = (v2: boolean, v3: boolean, v4: boolean) => {
        // Ensure at least one pool version is always enabled
        if (!v2 && !v3 && !v4) return;
        setUseV2(v2);
        setUseV3(v3);
        setUseV4(v4);
    };


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
        poolPreferences: { useV2, useV3, useV4 },
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

                {/* Header with Settings */}
                <div className="flex justify-end mb-2 px-1">
                    <SwapSettings
                        slippage={slippage}
                        deadline={deadline}
                        useV2={useV2}
                        useV3={useV3}
                        useV4={useV4}
                        onSlippageChange={setSlippage}
                        onDeadlineChange={setDeadline}
                        onPoolSettingsChange={handlePoolSettingsChange}
                    />
                </div>

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

            <div className="mt-6 flex justify-center items-center gap-2">
                <span className="text-[10px] text-zinc-500 uppercase tracking-wider">Powered by</span>
                <div className="flex items-center gap-1.5">
                    <svg className="w-4 h-4" viewBox="0 0 41 41" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M17.2884 17.0901C17.2286 17.3208 17.1243 17.5374 16.9813 17.7277C16.7151 18.0747 16.3628 18.3453 15.9597 18.5125C15.5972 18.6694 15.2132 18.7709 14.8207 18.8134C14.7417 18.8234 14.6599 18.8297 14.5804 18.8358L14.5621 18.8372C14.3135 18.8467 14.0745 18.9359 13.88 19.0917C13.6855 19.2476 13.5458 19.4619 13.4813 19.7032C13.4518 19.8233 13.4298 19.9451 13.4156 20.068C13.3931 20.2525 13.3815 20.4413 13.3689 20.6455L13.3688 20.6482C13.3598 20.7954 13.3502 20.9507 13.3358 21.118C13.2514 21.7996 13.0551 22.4624 12.755 23.0795C12.6937 23.2092 12.6312 23.335 12.5697 23.4585C12.2408 24.1203 11.9434 24.7186 12.0287 25.5194C12.0955 26.1365 12.4102 26.55 12.8283 26.9765C13.0267 27.1802 13.2896 27.3544 13.5626 27.5352L13.5635 27.5358C14.3285 28.0422 15.1719 28.6006 14.894 30.0074C14.6666 31.1473 12.7852 32.3435 10.1408 32.7613C10.3971 32.7222 9.83296 31.755 9.76966 31.6465L9.76576 31.6398C9.69456 31.5277 9.62156 31.4173 9.54876 31.3071L9.54066 31.2948C9.32646 30.9705 9.11326 30.6477 8.94686 30.29C8.50506 29.3515 8.30026 28.2657 8.48126 27.2373C8.64516 26.3068 9.25746 25.5635 9.84706 24.8478C9.94326 24.7311 10.0393 24.6146 10.1322 24.4987C10.921 23.5147 11.7486 22.2254 11.9317 20.9481C11.9472 20.8371 11.961 20.7161 11.9755 20.5888L11.976 20.5844C12.0018 20.3577 12.03 20.1112 12.074 19.8656C12.1397 19.4387 12.2729 19.025 12.4684 18.6402C12.6018 18.3879 12.7775 18.1605 12.9878 17.968C13.0974 17.8658 13.1697 17.7296 13.1932 17.5812C13.2166 17.4329 13.1898 17.2809 13.1171 17.1496L8.90156 9.53322L14.9565 17.0392C15.0255 17.1262 15.1126 17.1969 15.2118 17.2462C15.311 17.2955 15.4198 17.3223 15.5304 17.3247C15.6411 17.3271 15.7509 17.305 15.8521 17.2599C15.9533 17.2149 16.0434 17.148 16.116 17.0641C16.1927 16.9743 16.2362 16.8606 16.2391 16.7422C16.2421 16.6239 16.2043 16.5082 16.1321 16.4146C15.855 16.0589 15.5668 15.6984 15.2797 15.3394L15.266 15.3222C15.148 15.1747 15.0301 15.0272 14.9134 14.8807L13.3897 12.9864L10.3315 9.20412L6.93576 5.16588L10.7238 8.86532L13.9791 12.4808L15.6031 14.2929C15.7511 14.4603 15.899 14.6262 16.0469 14.7921L16.0506 14.7962C16.4402 15.2329 16.8298 15.6698 17.2194 16.1332L17.3078 16.2414L17.3272 16.4092C17.3534 16.6367 17.3403 16.8671 17.2884 17.0901Z" fill="#FF37C7" />
                        <path d="M26.9818 16.7721C26.7603 17.0018 26.6213 17.2939 26.5773 17.6018C26.3601 17.5581 26.1436 17.5063 25.9284 17.4447C25.7129 17.383 25.4974 17.3158 25.2894 17.2347C25.1816 17.1957 25.0814 17.1535 24.9748 17.108C24.8681 17.0625 24.7592 17.0106 24.6515 16.9554C24.2461 16.7323 23.8706 16.4584 23.534 16.1403C22.9226 15.5689 22.4319 14.9269 21.9498 14.2962L21.826 14.1344C21.3333 13.4498 20.8046 12.7922 20.242 12.1643C19.687 11.5492 19.0309 11.0344 18.3024 10.6423C17.5481 10.2606 16.7287 10.0256 15.8875 9.94952C16.7602 9.85432 17.643 9.96252 18.4673 10.2656C19.299 10.59 20.0594 11.075 20.7054 11.6934C21.1272 12.0907 21.523 12.5148 21.8906 12.9631C23.8137 12.5828 25.4815 12.707 26.895 13.1381C26.6531 13.4878 26.5606 13.9375 26.6793 14.3804C26.7168 14.5202 26.7728 14.6501 26.844 14.7681C26.7227 14.9227 26.63 15.1039 26.5759 15.3057C26.43 15.8505 26.6036 16.4056 26.9818 16.7721Z" fill="#FF37C7" />
                        <path d="M33.9255 27.3398C34.7143 26.3096 35.174 23.9847 34.1192 22.0407C33.8755 22.2119 33.5784 22.3125 33.2579 22.3125C32.5739 22.3125 31.9968 21.8547 31.8164 21.2287C31.31 21.3728 30.7426 21.2456 30.3438 20.8469C30.2104 20.7135 30.1073 20.5612 30.0346 20.3986C29.8574 20.417 29.6738 20.404 29.4914 20.3551C28.9461 20.209 28.5518 19.7805 28.4239 19.2691C27.8455 19.4129 27.2228 19.1989 26.8587 18.7082C25.7254 18.5075 24.7209 18.2058 24.0193 17.4534C23.5876 20.771 26.4874 21.9531 29.2596 23.0831C31.69 24.0738 34.0227 25.0247 33.9255 27.3398Z" fill="#FF37C7" />
                        <path d="M18.0908 21.4226C18.8225 21.3522 20.3818 20.9701 19.6846 19.7371C19.5346 19.4863 19.3172 19.2831 19.0574 19.1507C18.7976 19.0184 18.5059 18.9624 18.2158 18.9891C17.9215 19.0209 17.6439 19.1428 17.4209 19.3384C17.1979 19.534 17.0401 19.7937 16.9691 20.0824C16.7525 20.8889 16.982 21.5308 18.0908 21.4226Z" fill="#FF37C7" />
                    </svg>
                    <span className="text-xs font-semibold" style={{ color: '#FF37C7' }}>Uniswap</span>
                </div>
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
