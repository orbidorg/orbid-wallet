'use client';

import { useState, useEffect, useCallback } from 'react';
import { COINGECKO_IDS } from '@/lib/tokens';

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

const PERIOD_TO_DAYS: Record<ChartPeriod, string> = {
    '1d': '1',
    '7d': '7',
    '30d': '30',
    '365d': '365',
    'max': 'max'
};

export function useTokenMarketData(symbol: string, period: ChartPeriod = '30d') {
    const [data, setData] = useState<TokenMarketData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchData = useCallback(async () => {
        const geckoId = COINGECKO_IDS[symbol];
        if (!geckoId) {
            setError('Token not found');
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            const days = PERIOD_TO_DAYS[period];

            // Fetch current market data and chart in parallel
            const [marketRes, chartRes] = await Promise.all([
                fetch(`https://api.coingecko.com/api/v3/coins/${geckoId}?localization=false&tickers=false&community_data=false&developer_data=false`),
                fetch(`https://api.coingecko.com/api/v3/coins/${geckoId}/market_chart?vs_currency=usd&days=${days}`)
            ]);

            if (!marketRes.ok) {
                // If main token data fails, try with fallback values
                console.warn(`Market data not available for ${symbol}`);
                setData({
                    price: 0,
                    change24h: 0,
                    change7d: 0,
                    volume24h: 0,
                    marketCap: 0,
                    fdv: 0,
                    high24h: 0,
                    low24h: 0,
                    priceHistory: []
                });
                setIsLoading(false);
                return;
            }

            const marketData = await marketRes.json();
            let priceHistory: PricePoint[] = [];

            if (chartRes.ok) {
                const chartData = await chartRes.json();
                const prices = chartData.prices || [];
                const volumes = chartData.total_volumes || [];

                // CoinGecko returns:
                // 1d: ~288 points (5 min intervals)
                // 7d: ~672 points (~15 min intervals)
                // 30d: ~720 points (1 hour intervals)
                // 365d: ~365 points (1 day intervals)
                // max: varies by coin age

                // Target points per period:
                // 1d: 24 points (1 per hour)
                // 7d: 28 points (4 per day)
                // 30d: 30 points (1 per day)
                // 365d: 52 points (1 per week)
                // max: 60 points (dynamic)

                let targetPoints: number;
                switch (period) {
                    case '1d':
                        targetPoints = 24; // hourly
                        break;
                    case '7d':
                        targetPoints = 28; // 4 per day
                        break;
                    case '30d':
                        targetPoints = 30; // daily
                        break;
                    case '365d':
                        targetPoints = 52; // weekly
                        break;
                    case 'max':
                        targetPoints = 60; // dynamic
                        break;
                    default:
                        targetPoints = 30;
                }

                const sampleRate = Math.max(1, Math.floor(prices.length / targetPoints));

                priceHistory = prices
                    .filter((_: number[], i: number) => i % sampleRate === 0)
                    .map(([timestamp, price]: [number, number], index: number) => {
                        const volumeIndex = index * sampleRate;
                        const volume = volumes[volumeIndex]?.[1] || 0;
                        return {
                            timestamp,
                            price,
                            volume
                        };
                    });
            }

            setData({
                price: marketData.market_data?.current_price?.usd || 0,
                change24h: marketData.market_data?.price_change_percentage_24h || 0,
                change7d: marketData.market_data?.price_change_percentage_7d || 0,
                volume24h: marketData.market_data?.total_volume?.usd || 0,
                marketCap: marketData.market_data?.market_cap?.usd || 0,
                fdv: marketData.market_data?.fully_diluted_valuation?.usd || 0,
                high24h: marketData.market_data?.high_24h?.usd || 0,
                low24h: marketData.market_data?.low_24h?.usd || 0,
                priceHistory
            });
        } catch (err) {
            console.error('Failed to fetch token market data:', err);
            setError('Failed to load market data');
        } finally {
            setIsLoading(false);
        }
    }, [symbol, period]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    return { data, isLoading, error, refetch: fetchData };
}
