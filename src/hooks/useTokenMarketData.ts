'use client';

import { useQuery } from '@tanstack/react-query';
import { WORLD_CHAIN_TOKENS } from '@/lib/tokens';

export type ChartPeriod = '1d' | '7d' | '30d' | '365d' | 'max';

export interface PricePoint {
    timestamp: number;
    price: number;
    volume?: number;
}

export interface TokenMarketData {
    price: number;
    change24h: number;
    change7d: number;
    volume24h: number;
    marketCap: number;
    fdv: number;
    high24h: number;
    low24h: number;
    priceHistory: PricePoint[];
}

/** Fetch market data from DEX Screener and GeckoTerminal only */
async function fetchMarketData(symbol: string, period: ChartPeriod): Promise<TokenMarketData> {
    const token = WORLD_CHAIN_TOKENS.find(t => t.symbol === symbol);

    if (!token?.address) {
        return {
            price: 0, change24h: 0, change7d: 0, volume24h: 0,
            marketCap: 0, fdv: 0, high24h: 0, low24h: 0, priceHistory: []
        };
    }

    try {
        const dexResponse = await fetch(`https://api.dexscreener.com/latest/dex/tokens/${token.address}`);
        const dexData = await dexResponse.json();
        const tokenAddr = token.address.toLowerCase();

        // Find pairs where this token is the BASE token on World Chain
        const basePairs = (dexData.pairs || []).filter((p: any) =>
            p.chainId === 'worldchain' &&
            p.baseToken?.address?.toLowerCase() === tokenAddr
        );

        // Find pairs where this token is the QUOTE token on World Chain
        const quotePairs = (dexData.pairs || []).filter((p: any) =>
            p.chainId === 'worldchain' &&
            p.quoteToken?.address?.toLowerCase() === tokenAddr
        );

        let price = 0;
        let change24h = 0;
        let volume24h = 0;
        let marketCap = 0;
        let fdv = 0;

        if (basePairs.length > 0) {
            const bestPair = basePairs.sort((a: any, b: any) =>
                (parseFloat(b.liquidity?.usd || '0')) - (parseFloat(a.liquidity?.usd || '0'))
            )[0];

            price = parseFloat(bestPair.priceUsd || '0');
            change24h = bestPair.priceChange?.h24 || 0;
            volume24h = bestPair.volume?.h24 || 0;
            marketCap = bestPair.marketCap || 0;
            fdv = bestPair.fdv || 0;
        } else if (quotePairs.length > 0) {
            const bestPair = quotePairs.sort((a: any, b: any) =>
                (parseFloat(b.liquidity?.usd || '0')) - (parseFloat(a.liquidity?.usd || '0'))
            )[0];

            // Calculate price from inverse
            const basePrice = parseFloat(bestPair.priceNative || '0');
            if (basePrice > 0) {
                price = parseFloat(bestPair.priceUsd || '0') / basePrice;
            }
            change24h = -(bestPair.priceChange?.h24 || 0);
            volume24h = bestPair.volume?.h24 || 0;
        }

        // Hardcode stablecoin price as safety net
        if (symbol === 'USDC' && (price < 0.9 || price > 1.1)) {
            price = 1.0;
            change24h = 0;
        }

        // Fetch chart data from GeckoTerminal
        let priceHistory: PricePoint[] = [];
        try {
            const poolsRes = await fetch(`https://api.geckoterminal.com/api/v2/networks/worldchain/tokens/${token.address}/pools`, {
                headers: { 'Accept': 'application/json;version=20230203' }
            });

            if (poolsRes.ok) {
                const poolsData = await poolsRes.json();
                const pool = poolsData.data?.[0];

                if (pool) {
                    const poolAddress = pool.attributes.address;

                    let tf = 'day';
                    let limit = 30;
                    if (period === '1d') { tf = 'hour'; limit = 24; }
                    else if (period === '7d') { tf = 'hour'; limit = 168; }
                    else if (period === '30d') { tf = 'day'; limit = 30; }
                    else if (period === '365d') { tf = 'day'; limit = 365; }
                    else if (period === 'max') { tf = 'day'; limit = 1000; }

                    const ohlcvRes = await fetch(
                        `https://api.geckoterminal.com/api/v2/networks/worldchain/pools/${poolAddress}/ohlcv/${tf}?limit=${limit}`,
                        { headers: { 'Accept': 'application/json;version=20230203' } }
                    );

                    if (ohlcvRes.ok) {
                        const ohlcvData = await ohlcvRes.json();
                        const ohlcvList = ohlcvData.data?.attributes?.ohlcv_list || [];

                        priceHistory = ohlcvList.map(([ts, o, h, l, c, v]: [number, number, number, number, number, number]) => ({
                            timestamp: ts * 1000,
                            price: c,
                            volume: v
                        })).reverse();
                    }
                }
            }
        } catch (ce) {
            console.warn(`GeckoTerminal chart failed for ${symbol}`, ce);
        }

        // Calculate 7d change from history
        let change7d = 0;
        if (priceHistory.length >= 7) {
            const latestPrice = priceHistory[priceHistory.length - 1].price;
            const oldPrice = priceHistory[0].price;
            if (oldPrice > 0) {
                change7d = ((latestPrice - oldPrice) / oldPrice) * 100;
            }
        }

        return {
            price,
            change24h,
            change7d,
            volume24h,
            marketCap,
            fdv,
            high24h: 0,
            low24h: 0,
            priceHistory
        };
    } catch (e) {
        console.error(`Failed to fetch market data for ${symbol}`, e);
        return {
            price: 0, change24h: 0, change7d: 0, volume24h: 0,
            marketCap: 0, fdv: 0, high24h: 0, low24h: 0, priceHistory: []
        };
    }
}

/** Hook for fetching token market data with caching */
export function useTokenMarketData(symbol: string, period: ChartPeriod = '30d') {
    const { data, isLoading, error, refetch } = useQuery({
        queryKey: ['tokenMarketData', symbol, period],
        queryFn: () => fetchMarketData(symbol, period),
        staleTime: 5 * 60 * 1000,      // Data fresh for 5 minutes
        gcTime: 30 * 60 * 1000,        // Keep in cache for 30 minutes
        refetchOnWindowFocus: false,
        retry: 2,
        enabled: !!symbol
    });

    return {
        data: data ?? null,
        isLoading,
        error: error?.message ?? null,
        refetch
    };
}
