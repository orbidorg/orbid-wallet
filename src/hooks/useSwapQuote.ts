'use client';

import { useState, useEffect, useCallback } from 'react';
import { getSwapQuote } from '@/lib/uniswap/quoter';
import type { Token, SwapQuote } from '@/lib/uniswap/types';

interface UseSwapQuoteParams {
    tokenIn: Token | null;
    tokenOut: Token | null;
    amountIn: string;
    rpcUrl: string;
}

interface UseSwapQuoteResult {
    quote: SwapQuote | null;
    isLoading: boolean;
    error: string | null;
    refetch: () => void;
}

/**
 * Hook for fetching swap quotes from Uniswap
 */
export function useSwapQuote({
    tokenIn,
    tokenOut,
    amountIn,
    rpcUrl,
}: UseSwapQuoteParams): UseSwapQuoteResult {
    const [quote, setQuote] = useState<SwapQuote | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchQuote = useCallback(async () => {
        if (!tokenIn || !tokenOut || !amountIn || !rpcUrl) {
            setQuote(null);
            setError(null);
            return;
        }

        // Parse amount to bigint
        let parsedAmount: bigint;
        try {
            const amountFloat = parseFloat(amountIn);
            if (isNaN(amountFloat) || amountFloat <= 0) {
                setQuote(null);
                setError(null);
                return;
            }
            parsedAmount = BigInt(Math.floor(amountFloat * (10 ** tokenIn.decimals)));
        } catch {
            setQuote(null);
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            const result = await getSwapQuote({
                tokenIn,
                tokenOut,
                amountIn: parsedAmount,
                rpcUrl,
            });

            if (result) {
                setQuote(result);
                setError(null);
            } else {
                setError('No liquidity available for this pair');
                setQuote(null);
            }
        } catch (err) {
            console.error('Quote fetch error:', err);
            setError('Failed to fetch quote');
            setQuote(null);
        } finally {
            setIsLoading(false);
        }
    }, [tokenIn, tokenOut, amountIn, rpcUrl]);

    // Debounced quote fetching
    useEffect(() => {
        const timer = setTimeout(() => {
            fetchQuote();
        }, 500);

        return () => clearTimeout(timer);
    }, [fetchQuote]);

    return {
        quote,
        isLoading,
        error,
        refetch: fetchQuote,
    };
}

/**
 * Format a bigint amount to a human-readable string
 */
export function formatAmount(amount: bigint, decimals: number, maxDecimals = 6): string {
    const divisor = BigInt(10) ** BigInt(decimals);
    const wholePart = amount / divisor;
    const fractionalPart = amount % divisor;

    if (fractionalPart === BigInt(0)) {
        return wholePart.toString();
    }

    const fractionalStr = fractionalPart.toString().padStart(decimals, '0');
    const trimmed = fractionalStr.slice(0, maxDecimals).replace(/0+$/, '');

    if (trimmed === '') {
        return wholePart.toString();
    }

    return `${wholePart}.${trimmed}`;
}

/**
 * Parse a human-readable amount to bigint
 */
export function parseAmount(amount: string, decimals: number): bigint {
    const [whole, fraction = ''] = amount.split('.');
    const paddedFraction = fraction.padEnd(decimals, '0').slice(0, decimals);
    return BigInt(whole + paddedFraction);
}
