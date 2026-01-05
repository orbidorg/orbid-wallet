'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import type { Token } from '@/lib/types';
import type { SwapQuote } from '@/lib/uniswap/types';
import { useI18n } from '@/lib/i18n';

interface SwapConfirmModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    tokenIn: Token;
    tokenOut: Token;
    amountIn: string;
    amountOut: string;
    fiatValueIn: string;
    fiatValueOut: string;
    quote: SwapQuote;
    slippage: number;
    isSwapping: boolean;
}

interface InfoTooltipProps {
    title: string;
    description: string;
}

function InfoTooltip({ title, description }: InfoTooltipProps) {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="relative inline-block">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-4 h-4 rounded-full bg-zinc-700 text-zinc-400 text-[10px] font-bold flex items-center justify-center hover:bg-zinc-600 transition-colors"
            >
                i
            </button>
            <AnimatePresence>
                {isOpen && (
                    <>
                        <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
                        <motion.div
                            initial={{ opacity: 0, y: -5 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -5 }}
                            className="absolute left-0 top-6 z-50 w-64 p-3 bg-zinc-800 border border-zinc-700 rounded-xl shadow-xl"
                        >
                            <div className="font-semibold text-white text-sm mb-1">{title}</div>
                            <div className="text-xs text-zinc-400 leading-relaxed">{description}</div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}

export default function SwapConfirmModal({
    isOpen,
    onClose,
    onConfirm,
    tokenIn,
    tokenOut,
    amountIn,
    amountOut,
    fiatValueIn,
    fiatValueOut,
    quote,
    slippage,
    isSwapping,
}: SwapConfirmModalProps) {
    const [showMore, setShowMore] = useState(false);
    const { t } = useI18n();

    if (!isOpen) return null;


    const rate = parseFloat(amountOut) / parseFloat(amountIn);
    const rateFormatted = rate.toLocaleString(undefined, { maximumFractionDigits: 6 });
    const rateFiat = (parseFloat(fiatValueOut.replace(/[$,]/g, '')) / parseFloat(amountOut || '1')).toFixed(2);

    const sellTax = tokenIn.sellTax || 0;
    const buyTax = tokenOut.buyTax || 0;

    const minReceived = (parseFloat(amountOut) * (1 - slippage / 100) * (1 - buyTax / 100)).toLocaleString(undefined, { maximumFractionDigits: 6 });

    const priceImpact = quote.priceImpact || 0;
    const priceImpactFormatted = priceImpact < 0.01 ? '<0.01%' : `${priceImpact.toFixed(2)}%`;

    const routeVersion = quote.route.version.toUpperCase();
    const poolFee = (quote.route.pools[0]?.fee || 3000) / 10000;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4"
                onClick={onClose}
            >
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="bg-zinc-900 border border-zinc-800 rounded-3xl w-full max-w-md overflow-hidden"
                    onClick={(e) => e.stopPropagation()}
                >

                    <div className="flex items-center justify-between p-4 pb-2">
                        <span className="text-zinc-400 text-sm">{t.swapConfirm.youreSwapping}</span>
                        <button onClick={onClose} className="text-zinc-500 hover:text-white transition-colors">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>


                    <div className="px-4 flex items-center justify-between">
                        <div>
                            <div className="text-2xl font-bold text-white">{parseFloat(amountIn).toLocaleString(undefined, { maximumFractionDigits: 6 })} {tokenIn.symbol}</div>
                            <div className="text-sm text-zinc-500">{fiatValueIn}</div>
                        </div>
                        <div className="w-10 h-10 rounded-full overflow-hidden bg-zinc-800 border-2 border-zinc-700">
                            {tokenIn.logoURI && (
                                <Image src={tokenIn.logoURI} alt={tokenIn.symbol} width={40} height={40} className="w-full h-full object-cover" />
                            )}
                        </div>
                    </div>


                    <div className="flex justify-start px-4 py-2">
                        <svg className="w-4 h-4 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                        </svg>
                    </div>


                    <div className="px-4 flex items-center justify-between">
                        <div>
                            <div className="text-2xl font-bold text-white">{parseFloat(amountOut).toLocaleString(undefined, { maximumFractionDigits: 6 })} {tokenOut.symbol}</div>
                            <div className="text-sm text-zinc-500">{fiatValueOut}</div>
                        </div>
                        <div className="w-10 h-10 rounded-full overflow-hidden bg-zinc-800 border-2 border-zinc-700">
                            {tokenOut.logoURI && (
                                <Image src={tokenOut.logoURI} alt={tokenOut.symbol} width={40} height={40} className="w-full h-full object-cover" />
                            )}
                        </div>
                    </div>


                    <div className="flex items-center justify-center py-4">
                        <div className="flex-1 h-px bg-zinc-800" />
                        <button
                            onClick={() => setShowMore(!showMore)}
                            className="px-3 text-xs text-zinc-400 hover:text-white flex items-center gap-1 transition-colors"
                        >
                            {showMore ? t.swapConfirm.showLess : t.swapConfirm.showMore}
                            <svg className={`w-3 h-3 transition-transform ${showMore ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                        </button>
                        <div className="flex-1 h-px bg-zinc-800" />
                    </div>


                    <div className="px-4 pb-2 space-y-2">

                        <div className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-2 text-zinc-400">
                                <span>Fee</span>
                                <InfoTooltip
                                    title="Swap Fee"
                                    description="This is the fee charged by the liquidity pool for executing your swap. The fee goes to liquidity providers."
                                />
                            </div>
                            <span className="text-green-400 font-medium">Free</span>
                        </div>


                        <div className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-2 text-zinc-400">
                                <span>{t.swapConfirm.networkCost}</span>
                                <InfoTooltip
                                    title="Network Cost"
                                    description="The estimated gas fee required to execute this transaction on the network. This cost is paid to network validators."
                                />
                            </div>
                            <span className="text-zinc-300">~$0.01</span>
                        </div>


                        <AnimatePresence>
                            {showMore && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="space-y-2 overflow-hidden"
                                >

                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-zinc-400">Rate</span>
                                        <span className="text-zinc-300">
                                            1 {tokenIn.symbol} = {rateFormatted} {tokenOut.symbol}
                                        </span>
                                    </div>


                                    <div className="flex items-center justify-between text-sm">
                                        <div className="flex items-center gap-2 text-zinc-400">
                                            <span>{t.swapConfirm.maxSlippage}</span>
                                            <InfoTooltip
                                                title="Maximum Slippage"
                                                description="If the price slips any further, your transaction will revert. This protects you from receiving significantly less than expected due to price movements."
                                            />
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="px-2 py-0.5 bg-zinc-800 rounded text-xs text-zinc-400">Auto</span>
                                            <span className="text-zinc-300">{slippage}%</span>
                                        </div>
                                    </div>


                                    <div className="flex items-center justify-between text-sm">
                                        <div className="flex items-center gap-2 text-zinc-400">
                                            <span>{t.swapConfirm.orderRouting}</span>
                                            <InfoTooltip
                                                title="Order Routing"
                                                description={`Most efficient route is estimated to cost ~<$0.01 in network costs. This route uses Uniswap ${routeVersion} with a ${poolFee}% pool fee.`}
                                            />
                                        </div>
                                        <span className="text-zinc-300">Uniswap {routeVersion}</span>
                                    </div>


                                    <div className="flex items-center justify-between text-sm">
                                        <div className="flex items-center gap-2 text-zinc-400">
                                            <span>{t.swapConfirm.priceImpact}</span>
                                            <InfoTooltip
                                                title="Price Impact"
                                                description="The difference between the market price and the price your trade will be executed at. Large trades may have higher price impact."
                                            />
                                        </div>
                                        <span className={`${priceImpact > 1 ? 'text-yellow-400' : priceImpact > 3 ? 'text-red-400' : 'text-zinc-300'}`}>
                                            {priceImpactFormatted}
                                        </span>
                                    </div>


                                    {sellTax > 0 && (
                                        <div className="flex items-center justify-between text-sm">
                                            <div className="flex items-center gap-2 text-zinc-400">
                                                <span>{t.swapConfirm.sellFee} ({tokenIn.symbol})</span>
                                                <InfoTooltip
                                                    title="Token Sell Fee"
                                                    description={`This token has a ${sellTax}% transfer fee when sending it. This is taken by the token contract itself.`}
                                                />
                                            </div>
                                            <span className="text-yellow-400">{sellTax.toFixed(1)}%</span>
                                        </div>
                                    )}

                                    {buyTax > 0 && (
                                        <div className="flex items-center justify-between text-sm">
                                            <div className="flex items-center gap-2 text-zinc-400">
                                                <span>{t.swapConfirm.buyFee} ({tokenOut.symbol})</span>
                                                <InfoTooltip
                                                    title="Token Buy Fee"
                                                    description={`This token has a ${buyTax}% transfer fee when receiving it. This is taken by the token contract itself.`}
                                                />
                                            </div>
                                            <span className="text-yellow-400">{buyTax.toFixed(1)}%</span>
                                        </div>
                                    )}


                                    <div className="mt-3 p-3 bg-zinc-800/50 rounded-xl">
                                        <div className="text-xs text-zinc-400 mb-2">
                                            {(sellTax > 0 || buyTax > 0) ? (
                                                <span className="text-yellow-400/80 italic flex items-center gap-1 mb-1 font-medium">
                                                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                                    </svg>
                                                    Note: Some tokens in this swap have transfer taxes
                                                </span>
                                            ) : null}
                                            {t.swapConfirm.slippageTooltip}
                                        </div>
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="text-zinc-400">{t.swapConfirm.receiveAtLeast}</span>
                                            <span className="text-white font-medium">{minReceived} {tokenOut.symbol}</span>
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>


                    <div className="p-4 pt-2">
                        <button
                            onClick={onConfirm}
                            disabled={isSwapping}
                            className="w-full py-4 bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-2xl font-bold text-white text-lg transition-all active:scale-[0.98]"
                        >
                            {isSwapping ? (
                                <span className="flex items-center justify-center gap-2">
                                    <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                    </svg>
                                    Swapping...
                                </span>
                            ) : (
                                'Swap'
                            )}
                        </button>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
