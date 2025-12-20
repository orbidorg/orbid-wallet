"use client"

import { useQuery } from "@tanstack/react-query"
import { WORLD_CHAIN_TOKENS } from "@/lib/tokens"

export type ChartPeriod = "1d" | "7d" | "30d" | "365d" | "max"

export interface PricePoint {
    timestamp: number
    price: number
    volume?: number
}

export interface TokenMarketData {
    price: number
    change24h: number
    change7d: number
    volume24h: number
    marketCap: number
    fdv: number
    high24h: number
    low24h: number
    priceHistory: PricePoint[]
}

const STABLECOIN_SYMBOLS = ["USDC", "USDT", "sDAI", "USDC.e"]
const GECKO_TERMINAL_NETWORK = "world-chain"

async function fetchPriceHistoryFromDexScreener(pairAddress: string, period: ChartPeriod): Promise<PricePoint[]> {
    try {
        // DEX Screener no tiene endpoint público de OHLCV, pero podemos usar el precio actual
        // como punto final del historial si GeckoTerminal falla
        return []
    } catch {
        return []
    }
}

async function fetchMarketData(symbol: string, period: ChartPeriod): Promise<TokenMarketData> {
    const token = WORLD_CHAIN_TOKENS.find((t) => t.symbol === symbol)

    const emptyData: TokenMarketData = {
        price: 0,
        change24h: 0,
        change7d: 0,
        volume24h: 0,
        marketCap: 0,
        fdv: 0,
        high24h: 0,
        low24h: 0,
        priceHistory: [],
    }

    if (!token?.address) {
        return emptyData
    }

    if (STABLECOIN_SYMBOLS.includes(symbol)) {
        return {
            ...emptyData,
            price: 1,
            high24h: 1,
            low24h: 1,
            priceHistory: generateStablecoinHistory(period),
        }
    }

    try {
        const dexResponse = await fetch(`https://api.dexscreener.com/tokens/v1/worldchain/${token.address}`, {
            headers: { Accept: "application/json" },
        })

        if (!dexResponse.ok) {
            console.warn("DEX Screener API error:", dexResponse.status)
            return emptyData
        }

        const pairs = await dexResponse.json()
        const tokenAddr = token.address.toLowerCase()

        let bestPair = pairs
            .filter((p: any) => p.baseToken?.address?.toLowerCase() === tokenAddr)
            .sort(
                (a: any, b: any) => Number.parseFloat(b.liquidity?.usd || "0") - Number.parseFloat(a.liquidity?.usd || "0"),
            )[0]

        let price = 0
        let change24h = 0
        let volume24h = 0
        let marketCap = 0
        let fdv = 0
        let isQuoteToken = false
        let pairAddress = ""

        if (bestPair) {
            price = Number.parseFloat(bestPair.priceUsd || "0")
            change24h = bestPair.priceChange?.h24 || 0
            volume24h = Number.parseFloat(bestPair.volume?.h24 || "0")
            marketCap = Number.parseFloat(bestPair.marketCap || "0")
            fdv = Number.parseFloat(bestPair.fdv || "0")
            pairAddress = bestPair.pairAddress || ""
        } else {
            bestPair = pairs
                .filter((p: any) => p.quoteToken?.address?.toLowerCase() === tokenAddr)
                .sort(
                    (a: any, b: any) => Number.parseFloat(b.liquidity?.usd || "0") - Number.parseFloat(a.liquidity?.usd || "0"),
                )[0]

            if (bestPair) {
                isQuoteToken = true
                const basePriceUsd = Number.parseFloat(bestPair.priceUsd || "0")
                const priceNative = Number.parseFloat(bestPair.priceNative || "0")

                if (priceNative > 0 && basePriceUsd > 0) {
                    price = basePriceUsd / priceNative
                }
                change24h = -(bestPair.priceChange?.h24 || 0)
                volume24h = Number.parseFloat(bestPair.volume?.h24 || "0")
                pairAddress = bestPair.pairAddress || ""
            }
        }

        // Fetch chart data from GeckoTerminal
        let priceHistory: PricePoint[] = []
        try {
            let poolAddress = pairAddress

            // Si no tenemos pool address, buscar en GeckoTerminal
            if (!poolAddress) {
                const poolsRes = await fetch(
                    `https://api.geckoterminal.com/api/v2/networks/${GECKO_TERMINAL_NETWORK}/tokens/${token.address}/pools?page=1`,
                    { headers: { Accept: "application/json;version=20230302" } },
                )

                if (poolsRes.ok) {
                    const poolsData = await poolsRes.json()
                    const pool = poolsData.data?.[0]
                    poolAddress = pool?.attributes?.address || pool?.id?.split("_")[1]
                }
            }

            if (poolAddress) {
                const poolInfoRes = await fetch(
                    `https://api.geckoterminal.com/api/v2/networks/${GECKO_TERMINAL_NETWORK}/pools/${poolAddress}`,
                    { headers: { Accept: "application/json;version=20230302" } },
                )

                let tokenParam = "base" // default

                if (poolInfoRes.ok) {
                    const poolInfo = await poolInfoRes.json()
                    const baseTokenAddress = poolInfo.data?.attributes?.base_token_address?.toLowerCase()
                    const quoteTokenAddress = poolInfo.data?.attributes?.quote_token_address?.toLowerCase()
                    const ourTokenAddress = token.address.toLowerCase()

                    // Determinar si nuestro token es base o quote EN GECKOTERMINAL
                    if (quoteTokenAddress === ourTokenAddress) {
                        tokenParam = "quote"
                    } else if (baseTokenAddress === ourTokenAddress) {
                        tokenParam = "base"
                    }
                }

                const { timeframe, limit } = getOHLCVParams(period)

                const ohlcvRes = await fetch(
                    `https://api.geckoterminal.com/api/v2/networks/${GECKO_TERMINAL_NETWORK}/pools/${poolAddress}/ohlcv/${timeframe}?limit=${limit}&token=${tokenParam}`,
                    { headers: { Accept: "application/json;version=20230302" } },
                )

                if (ohlcvRes.ok) {
                    const ohlcvData = await ohlcvRes.json()
                    const ohlcvList = ohlcvData.data?.attributes?.ohlcv_list || []

                    priceHistory = ohlcvList
                        .map(([ts, o, h, l, c, v]: [number, number, number, number, number, number]) => ({
                            timestamp: ts * 1000,
                            price: c,
                            volume: v,
                        }))
                        .reverse()
                }
            }
        } catch (ce) {
            console.warn(`GeckoTerminal chart failed for ${symbol}`, ce)
        }

        let high24h = price
        let low24h = price

        if (period === "1d" && priceHistory.length > 0) {
            high24h = Math.max(...priceHistory.map((p) => p.price))
            low24h = Math.min(...priceHistory.map((p) => p.price))
        } else if (bestPair) {
            // Usar cambio 24h para estimar high/low si no hay historial
            const changePercent = Math.abs(change24h) / 100
            high24h = price * (1 + changePercent / 2)
            low24h = price * (1 - changePercent / 2)
        }

        let change7d = 0
        if (priceHistory.length >= 7) {
            const latestPrice = priceHistory[priceHistory.length - 1]?.price || price
            const oldPrice = priceHistory[0]?.price
            if (oldPrice > 0) {
                change7d = ((latestPrice - oldPrice) / oldPrice) * 100
            }
        }

        return {
            price,
            change24h,
            change7d,
            volume24h,
            marketCap,
            fdv,
            high24h,
            low24h,
            priceHistory,
        }
    } catch (e) {
        console.error(`Failed to fetch market data for ${symbol}`, e)
        return emptyData
    }
}

function getOHLCVParams(period: ChartPeriod): { timeframe: string; limit: number } {
    switch (period) {
        case "1d":
            return { timeframe: "hour", limit: 24 }
        case "7d":
            return { timeframe: "hour", limit: 168 }
        case "30d":
            return { timeframe: "day", limit: 30 }
        case "365d":
            return { timeframe: "day", limit: 365 }
        case "max":
            return { timeframe: "day", limit: 1000 }
        default:
            return { timeframe: "day", limit: 30 }
    }
}

function generateStablecoinHistory(period: ChartPeriod): PricePoint[] {
    const now = Date.now()
    const { limit } = getOHLCVParams(period)
    const interval = period === "1d" || period === "7d" ? 3600000 : 86400000

    return Array.from({ length: limit }, (_, i) => ({
        timestamp: now - (limit - 1 - i) * interval,
        price: 1,
        volume: 0,
    }))
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
    })

    return {
        data: data ?? null,
        isLoading,
        error: error?.message ?? null,
        refetch,
    }
}
