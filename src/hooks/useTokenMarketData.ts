'use client';

import { useQuery } from "@tanstack/react-query";
import type { TokenMarketData, ChartPeriod, PricePoint } from '@/lib/types';
import { WORLD_CHAIN_TOKENS } from "@/lib/tokens";

const STABLECOIN_SYMBOLS = ["USDC", "USDT", "sDAI", "USDC.e"];
const GECKO_TERMINAL_NETWORK = "world-chain";

function getOHLCVParams(period: ChartPeriod): { timeframe: string; limit: number } {
    switch (period) {
        case "1d":
            return { timeframe: "hour", limit: 24 };
        case "7d":
            return { timeframe: "hour", limit: 168 };
        case "30d":
            return { timeframe: "day", limit: 30 };
        case "365d":
            return { timeframe: "day", limit: 365 };
        case "max":
            return { timeframe: "day", limit: 1000 };
        default:
            return { timeframe: "day", limit: 30 };
    }
}

function generateStablecoinHistory(period: ChartPeriod): PricePoint[] {
    const now = Date.now();
    const { limit } = getOHLCVParams(period);
    const interval = period === "1d" || period === "7d" ? 3600000 : 86400000;

    return Array.from({ length: limit }, (_, i) => ({
        timestamp: now - (limit - 1 - i) * interval,
        price: 1,
        volume: 0,
    }));
}

async function fetchMarketData(symbol: string, period: ChartPeriod): Promise<TokenMarketData> {
    const token = WORLD_CHAIN_TOKENS.find(t => t.symbol === symbol);

    const emptyData: TokenMarketData = {
        price: 0,
        change24h: 0,
        change7d: 0,
        volume24h: 0,
        marketCap: 0,
        fdv: 0,
        tvl: 0,
        high24h: 0,
        low24h: 0,
        priceHistory: [],
    };

    if (!token?.address) {
        console.log(`[MarketData] No address for ${symbol}, returning empty`);
        return emptyData;
    }

    try {
        let price = 0;
        let change24h = 0;
        let volume24h = 0;
        let marketCap = 0;
        let fdv = 0;
        let tvl = 0;

        try {
            const uniswapRes = await fetch('/api/market/uniswap', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ address: token.address })
            });

            if (uniswapRes.ok) {
                const uniswapData = await uniswapRes.json();
                const tokenData = uniswapData.data?.token;

                if (tokenData) {
                    const market = tokenData.market;
                    const projectMarket = tokenData.project?.markets?.[0];

                    if (market?.price?.value) {
                        price = market.price.value;
                    }
                    if (market?.totalValueLocked?.value) {
                        tvl = market.totalValueLocked.value;
                    }
                    if (market?.volume24H?.value) {
                        volume24h = market.volume24H.value;
                    }
                    if (projectMarket?.marketCap?.value) {
                        marketCap = projectMarket.marketCap.value;
                    }
                    if (projectMarket?.fullyDilutedValuation?.value) {
                        fdv = projectMarket.fullyDilutedValuation.value;
                    }

                    console.log(`[MarketData] Uniswap data for ${symbol}:`, {
                        price, tvl, volume24h, marketCap, fdv
                    });
                }
            }
        } catch (e) {
            console.warn('[MarketData] Uniswap proxy failed, falling back to DEX Screener', e);
        }


        const dexResponse = await fetch(`https://api.dexscreener.com/tokens/v1/worldchain/${token.address}`, {
            headers: { Accept: "application/json" },
        });

        if (!dexResponse.ok) {
            console.warn("DEX Screener API error:", dexResponse.status);
            return emptyData;
        }

        const pairs = await dexResponse.json();
        const tokenAddr = token.address.toLowerCase();


        let hasDexScreenerData = Array.isArray(pairs) && pairs.length > 0;

        if (!hasDexScreenerData && !token.pools?.length) {

            if (STABLECOIN_SYMBOLS.includes(symbol)) {
                return {
                    ...emptyData,
                    price: 1,
                    high24h: 1,
                    low24h: 1,
                    priceHistory: generateStablecoinHistory(period),
                };
            }
            console.log(`[MarketData] No DEX Screener data and no pools for ${symbol}`);

        }


        const safePairs = Array.isArray(pairs) ? pairs : [];

        let bestPair = safePairs
            .filter((p: any) => p.baseToken?.address?.toLowerCase() === tokenAddr)
            .sort(
                (a: any, b: any) => Number.parseFloat(b.liquidity?.usd || "0") - Number.parseFloat(a.liquidity?.usd || "0"),
            )[0];

        let pairAddress = "";

        if (bestPair) {
            if (!price) price = Number.parseFloat(bestPair.priceUsd || "0");
            if (!change24h) change24h = bestPair.priceChange?.h24 || 0;
            if (!volume24h) volume24h = Number.parseFloat(bestPair.volume?.h24 || "0");
            if (!marketCap) marketCap = Number.parseFloat(bestPair.marketCap || "0");
            if (!fdv) fdv = Number.parseFloat(bestPair.fdv || "0");
            pairAddress = bestPair.pairAddress || "";
        } else {
            bestPair = safePairs
                .filter((p: any) => p.quoteToken?.address?.toLowerCase() === tokenAddr)
                .sort(
                    (a: any, b: any) => Number.parseFloat(b.liquidity?.usd || "0") - Number.parseFloat(a.liquidity?.usd || "0"),
                )[0];

            if (bestPair) {
                const basePriceUsd = Number.parseFloat(bestPair.priceUsd || "0");
                const priceNative = Number.parseFloat(bestPair.priceNative || "0");

                if (priceNative > 0 && basePriceUsd > 0 && !price) {
                    price = basePriceUsd / priceNative;
                }
                if (!change24h) change24h = -(bestPair.priceChange?.h24 || 0);
                if (!volume24h) volume24h = Number.parseFloat(bestPair.volume?.h24 || "0");
                pairAddress = bestPair.pairAddress || "";
            }
        }


        try {
            const geckoTokenRes = await fetch(
                `https://api.geckoterminal.com/api/v2/networks/${GECKO_TERMINAL_NETWORK}/tokens/${token.address}`,
                { headers: { Accept: "application/json;version=20230302" } }
            );
            if (geckoTokenRes.ok) {
                const geckoTokenData = await geckoTokenRes.json();
                const attrs = geckoTokenData.data?.attributes;
                if (attrs) {
                    if (!marketCap) marketCap = Number.parseFloat(attrs.market_cap_usd || "0");
                    if (!fdv) fdv = Number.parseFloat(attrs.fdv_usd || "0");
                    if (!tvl) tvl = Number.parseFloat(attrs.total_reserve_in_usd || "0");
                }
            }
        } catch (e) {
            console.warn("[MarketData] Failed to fetch token stats from GeckoTerminal", e);
        }


        let priceHistory: PricePoint[] = [];
        try {
            let poolAddress = "";
            if (token.pools && token.pools.length > 0) {
                poolAddress = token.pools[0];
            } else if (pairAddress) {
                poolAddress = pairAddress;
            }

            if (!poolAddress) {
                const poolsRes = await fetch(
                    `https://api.geckoterminal.com/api/v2/networks/${GECKO_TERMINAL_NETWORK}/tokens/${token.address}/pools?page=1`,
                    { headers: { Accept: "application/json;version=20230302" } },
                );

                if (poolsRes.ok) {
                    const poolsData = await poolsRes.json();
                    const pool = poolsData.data?.[0];
                    poolAddress = pool?.attributes?.address || pool?.id?.split("_")[1];
                }
            }

            if (poolAddress) {

                let tokenParam = "base";
                try {
                    const poolInfoRes = await fetch(
                        `https://api.geckoterminal.com/api/v2/networks/${GECKO_TERMINAL_NETWORK}/pools/${poolAddress}`,
                        { headers: { Accept: "application/json;version=20230302" } },
                    );


                    if (poolInfoRes.ok) {
                        const poolInfo = await poolInfoRes.json();
                        const baseTokenInfo = poolInfo.data?.relationships?.base_token?.data?.id;
                        const quoteTokenInfo = poolInfo.data?.relationships?.quote_token?.data?.id;

                        const baseAddr = baseTokenInfo?.split("_")[1]?.toLowerCase();
                        const quoteAddr = quoteTokenInfo?.split("_")[1]?.toLowerCase();


                        if (quoteAddr === tokenAddr) {
                            tokenParam = "quote";
                            // Get price from GeckoTerminal if no DEX Screener data
                            if (price === 0) {
                                price = Number.parseFloat(poolInfo.data?.attributes?.quote_token_price_usd || "0");
                                volume24h = Number.parseFloat(poolInfo.data?.attributes?.volume_usd?.h24 || "0");
                                const priceChangePct = poolInfo.data?.attributes?.price_change_percentage;

                                change24h = priceChangePct?.h24 ? -Number.parseFloat(priceChangePct.h24) : 0;
                                console.log(`[MarketData] Got price from GeckoTerminal (quote): $${price}, vol: ${volume24h}`);
                            }
                        } else if (baseAddr === tokenAddr) {
                            tokenParam = "base";
                            // Get price from GeckoTerminal if no DEX Screener data
                            if (price === 0) {
                                price = Number.parseFloat(poolInfo.data?.attributes?.base_token_price_usd || "0");
                                volume24h = Number.parseFloat(poolInfo.data?.attributes?.volume_usd?.h24 || "0");
                                const priceChangePct = poolInfo.data?.attributes?.price_change_percentage;
                                change24h = priceChangePct?.h24 ? Number.parseFloat(priceChangePct.h24) : 0;
                                console.log(`[MarketData] Got price from GeckoTerminal (base): $${price}, vol: ${volume24h}`);
                            }
                        } else {
                            console.log(`[MarketData] Token address not found in pool base/quote`);
                        }
                    }
                } catch (e) {
                    console.warn("Failed to get pool info from GeckoTerminal", e);
                }

                const { timeframe, limit } = getOHLCVParams(period);

                const ohlcvRes = await fetch(
                    `https://api.geckoterminal.com/api/v2/networks/${GECKO_TERMINAL_NETWORK}/pools/${poolAddress}/ohlcv/${timeframe}?limit=${limit}&token=${tokenParam}&currency=usd`,
                    { headers: { Accept: "application/json;version=20230302" } },
                );

                if (ohlcvRes.ok) {
                    const ohlcvData = await ohlcvRes.json();
                    const ohlcvList = ohlcvData?.data?.attributes?.ohlcv_list || [];

                    priceHistory = ohlcvList
                        .map(([ts, o, h, l, c, v]: [number, number, number, number, number, number]) => ({
                            timestamp: ts * 1000,
                            price: c,
                            volume: v,
                        }))
                        .reverse();
                }
            }
        } catch (ce) {
            console.warn(`GeckoTerminal chart failed for ${symbol}`, ce);
        }

        const forceFlat_1USD = ["USDC", "USDT", "sDAI", "DAI", "USDC.e"].includes(symbol);

        if (forceFlat_1USD) {
            price = 1;
            priceHistory = generateStablecoinHistory(period);
        }

        let high24h = price;
        let low24h = price;

        if (period === "1d" && priceHistory.length > 0) {
            high24h = Math.max(...priceHistory.map((p) => p.price));
            low24h = Math.min(...priceHistory.map((p) => p.price));
        } else if (bestPair) {
            const changePercent = Math.abs(change24h) / 100;
            high24h = price * (1 + changePercent / 2);
            low24h = price * (1 - changePercent / 2);
        }

        if (forceFlat_1USD) {
            high24h = 1;
            low24h = 1;
        }

        let change7d = 0;
        if (priceHistory.length >= 7) {
            const latestPrice = priceHistory[priceHistory.length - 1]?.price || price;
            const oldPrice = priceHistory[0]?.price;
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
            tvl,
            high24h,
            low24h,
            priceHistory,
        };
    } catch (e) {
        console.error(`Failed to fetch market data for ${symbol}`, e);
        return emptyData;
    }
}

export function useTokenMarketData(symbol: string, period: ChartPeriod = "30d") {
    const { data, isLoading, error, refetch } = useQuery({
        queryKey: ["tokenMarketData", symbol, period],
        queryFn: () => fetchMarketData(symbol, period),
        staleTime: 5 * 60 * 1000,
        gcTime: 30 * 60 * 1000,
        refetchOnWindowFocus: false,
        retry: 2,
        enabled: !!symbol,
    });

    return {
        data: data ?? null,
        isLoading,
        error: error?.message ?? null,
        refetch,
    };
}
