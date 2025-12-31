'use client';

import { useI18n } from '@/lib/i18n';
import { SWAP_CONFIG } from '@/lib/uniswap/config';
import type { SwapQuote } from '@/lib/uniswap/types';
import type { Token } from '@/lib/types';

interface QuoteDisplayProps {
    quote: SwapQuote | null;
    tokenIn: Token | null;
    tokenOut: Token | null;
    isLoading: boolean;
    error: string | null;
}

export default function QuoteDisplay({
    quote,
    tokenIn,
    tokenOut,
    isLoading,
    error,
}: QuoteDisplayProps) {
    const { t } = useI18n();

    if (isLoading && !quote) {
        return (
            <div className="glass rounded-xl p-4 animate-pulse">
                <div className="h-4 bg-zinc-700 rounded w-3/4 mb-2" />
                <div className="h-4 bg-zinc-700 rounded w-1/2" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="glass rounded-xl p-4 border border-red-500/30">
                <p className="text-red-400 text-sm">{error}</p>
            </div>
        );
    }

    if (!quote || !tokenIn || !tokenOut) {
        return null;
    }

    // Format amounts
    const amountOut = formatBigInt(quote.amountOut, tokenOut.decimals);
    const amountOutMin = formatBigInt(quote.amountOutMin, tokenOut.decimals);
    const feeAmount = formatBigInt(quote.fee, tokenIn.decimals);

    // Calculate rate
    const amountInNum = Number(quote.amountIn) / (10 ** tokenIn.decimals);
    const amountOutNum = Number(quote.amountOut) / (10 ** tokenOut.decimals);
    const rate = amountOutNum / amountInNum;

    return (
        <div className="flex flex-col gap-2 py-1">
            {/* Rate Line */}
            <div className="flex justify-between items-center px-1">
                <span className="text-[11px] font-medium text-zinc-500 uppercase tracking-widest">{t.swap.rate}</span>
                <span className="text-xs font-semibold text-zinc-300">
                    1 {tokenIn.symbol} = {rate < 0.0001 ? rate.toExponential(4) : rate.toLocaleString(undefined, { maximumFractionDigits: 6 })} {tokenOut.symbol}
                </span>
            </div>

            {/* Extra Details Row */}
            <div className="flex flex-wrap items-center justify-between gap-y-2 mt-1 opacity-60">
                <div className="flex items-center gap-1.5 bg-white/5 px-2 py-1 rounded-lg border border-white/5">
                    <span className="text-[10px] text-zinc-400 font-bold uppercase">{t.swap.minimumReceived}:</span>
                    <span className="text-[10px] text-zinc-300 font-bold">{amountOutMin} {tokenOut.symbol}</span>
                </div>

                {quote.priceImpact > 0.1 && (
                    <div className={`flex items-center gap-1.5 px-2 py-1 rounded-lg border ${quote.priceImpact > 5 ? 'bg-red-500/10 border-red-500/20' : 'bg-amber-500/10 border-amber-500/20'}`}>
                        <span className="text-[10px] text-zinc-400 font-bold uppercase">{t.swap.priceImpact}:</span>
                        <span className={`text-[10px] font-bold ${quote.priceImpact > 5 ? 'text-red-400' : 'text-amber-400'}`}>
                            {quote.priceImpact.toFixed(2)}%
                        </span>
                    </div>
                )}
            </div>
        </div>
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
