'use client';

import { useState, useEffect, useCallback } from 'react';
import type { TokenBalance } from '@/lib/types';
import { WORLD_CHAIN_TOKENS, COINGECKO_IDS } from '@/lib/tokens';

const ALCHEMY_API_KEY = process.env.NEXT_PUBLIC_ALCHEMY_API_KEY;
const ALCHEMY_RPC = `https://worldchain-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}`;

// ERC20 balanceOf function signature
const BALANCE_OF_SELECTOR = '0x70a08231';

interface TokenPrice {
    usd: number;
    usd_24h_change: number;
}

async function getTokenBalance(tokenAddress: string, walletAddress: string): Promise<bigint> {
    const paddedAddress = walletAddress.slice(2).padStart(64, '0');
    const data = BALANCE_OF_SELECTOR + paddedAddress;

    const response = await fetch(ALCHEMY_RPC, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            jsonrpc: '2.0',
            id: 1,
            method: 'eth_call',
            params: [
                { to: tokenAddress, data },
                'latest'
            ]
        })
    });

    const result = await response.json();
    if (result.error) {
        console.error('RPC error:', result.error);
        return BigInt(0);
    }

    return BigInt(result.result || '0x0');
}

async function getTokenPrices(): Promise<Record<string, TokenPrice>> {
    try {
        const ids = Object.values(COINGECKO_IDS).join(',');
        const response = await fetch(
            `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd&include_24hr_change=true`
        );
        const data = await response.json();

        const prices: Record<string, TokenPrice> = {};
        for (const [symbol, geckoId] of Object.entries(COINGECKO_IDS)) {
            if (data[geckoId]) {
                prices[symbol] = {
                    usd: data[geckoId].usd || 0,
                    usd_24h_change: data[geckoId].usd_24h_change || 0
                };
            }
        }
        return prices;
    } catch (error) {
        console.error('Failed to fetch prices:', error);
        return {};
    }
}

function formatBalance(balance: bigint, decimals: number): string {
    const divisor = BigInt(10 ** decimals);
    const integerPart = balance / divisor;
    const fractionalPart = balance % divisor;

    const fractionalStr = fractionalPart.toString().padStart(decimals, '0');
    const significantDecimals = Math.min(decimals, 6);
    const trimmedFractional = fractionalStr.slice(0, significantDecimals).replace(/0+$/, '') || '0';

    if (integerPart === BigInt(0) && balance > BigInt(0)) {
        return `0.${fractionalStr.slice(0, significantDecimals)}`;
    }

    return trimmedFractional === '0'
        ? integerPart.toString()
        : `${integerPart}.${trimmedFractional}`;
}

export function useWalletBalances(walletAddress: string | null) {
    const [balances, setBalances] = useState<TokenBalance[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [totalValueUSD, setTotalValueUSD] = useState(0);

    const fetchBalances = useCallback(async () => {
        if (!walletAddress) {
            setBalances([]);
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            // Fetch balances and prices in parallel
            const [rawBalances, prices] = await Promise.all([
                Promise.all(
                    WORLD_CHAIN_TOKENS.map(async (token) => {
                        const balance = await getTokenBalance(token.address, walletAddress);
                        return { token, balance };
                    })
                ),
                getTokenPrices()
            ]);

            let total = 0;
            const tokenBalances: TokenBalance[] = rawBalances.map(({ token, balance }) => {
                const formattedBalance = formatBalance(balance, token.decimals);
                const price = prices[token.symbol]?.usd || 0;
                const change24h = prices[token.symbol]?.usd_24h_change || 0;
                const valueUSD = parseFloat(formattedBalance) * price;
                total += valueUSD;

                return {
                    token,
                    balance: formattedBalance,
                    valueUSD,
                    change24h
                };
            });

            // Sort: WLD first, then by value
            tokenBalances.sort((a, b) => {
                if (a.token.symbol === 'WLD') return -1;
                if (b.token.symbol === 'WLD') return 1;
                return b.valueUSD - a.valueUSD;
            });

            setBalances(tokenBalances);
            setTotalValueUSD(total);
        } catch (err) {
            console.error('Failed to fetch balances:', err);
            setError('Failed to load balances');
        } finally {
            setIsLoading(false);
        }
    }, [walletAddress]);

    useEffect(() => {
        fetchBalances();

        // Refresh every 30 seconds
        const interval = setInterval(fetchBalances, 30000);
        return () => clearInterval(interval);
    }, [fetchBalances]);

    return { balances, isLoading, error, totalValueUSD, refetch: fetchBalances };
}
