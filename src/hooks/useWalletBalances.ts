'use client';

import { useQuery } from '@tanstack/react-query';
import type { TokenBalance } from '@/lib/types';
import { WORLD_CHAIN_TOKENS, COINGECKO_IDS } from '@/lib/tokens';

const ALCHEMY_API_KEY = process.env.NEXT_PUBLIC_ALCHEMY_API_KEY;
const ALCHEMY_RPC = `https://worldchain-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}`;

const BALANCE_OF_SELECTOR = '0x70a08231';

interface TokenPrice {
    usd: number;
    usd_24h_change: number;
}

interface WalletBalancesData {
    balances: TokenBalance[];
    totalValueUSD: number;
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
            params: [{ to: tokenAddress, data }, 'latest']
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

/** Fetch wallet balances from Alchemy + CoinGecko */
async function fetchWalletBalances(walletAddress: string): Promise<WalletBalancesData> {
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

    return { balances: tokenBalances, totalValueUSD: total };
}

/** Hook for fetching wallet balances with caching and auto-refresh */
export function useWalletBalances(walletAddress: string | null) {
    const { data, isLoading, error, refetch } = useQuery({
        queryKey: ['walletBalances', walletAddress],
        queryFn: () => fetchWalletBalances(walletAddress!),
        staleTime: 30 * 1000,           // Fresh for 30 seconds
        gcTime: 5 * 60 * 1000,          // Keep in cache for 5 minutes
        refetchInterval: 30 * 1000,     // Auto-refetch every 30 seconds
        refetchOnWindowFocus: true,
        retry: 2,
        enabled: !!walletAddress
    });

    return {
        balances: data?.balances ?? [],
        isLoading,
        error: error?.message ?? null,
        totalValueUSD: data?.totalValueUSD ?? 0,
        refetch
    };
}
