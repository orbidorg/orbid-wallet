'use client';

import { useState, useEffect } from 'react';
import { WORLD_CHAIN_TOKENS } from '@/lib/tokens';

const GECKOTERMINAL_API = 'https://api.geckoterminal.com/api/v2';
const DEXSCREENER_API = 'https://api.dexscreener.com/latest/dex';
const NETWORK_ID = 'world-chain';

export interface TokenVolume {
    address: string;
    volume24h: number;
}

export function useTokenVolume() {
    const [volumes, setVolumes] = useState<Record<string, number>>({});
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function fetchVolume() {
            try {
                setIsLoading(true);
                const volumeMap: Record<string, number> = {};

                // Step 1: Fetch from GeckoTerminal (multiple pages)
                try {
                    const geckoPages = [1, 2, 3, 4, 5]; // Fetch 5 pages
                    const geckoResponses = await Promise.all(
                        geckoPages.map(page =>
                            fetch(`${GECKOTERMINAL_API}/networks/${NETWORK_ID}/pools?page=${page}`, {
                                headers: { 'Accept': 'application/json;version=20230203' }
                            }).catch(() => null)
                        )
                    );

                    const geckoData = await Promise.all(
                        geckoResponses
                            .filter(r => r && r.ok)
                            .map(r => r!.json())
                    );

                    geckoData.forEach(page => {
                        if (!page.data) return;
                        page.data.forEach((pool: any) => {
                            const attributes = pool.attributes;
                            const volume24h = parseFloat(attributes?.volume_usd?.h24 || '0');

                            const baseTokenAddress = pool.relationships?.base_token?.data?.id?.split('_')[1];
                            const quoteTokenAddress = pool.relationships?.quote_token?.data?.id?.split('_')[1];

                            if (baseTokenAddress) {
                                volumeMap[baseTokenAddress.toLowerCase()] =
                                    (volumeMap[baseTokenAddress.toLowerCase()] || 0) + volume24h;
                            }
                            if (quoteTokenAddress) {
                                volumeMap[quoteTokenAddress.toLowerCase()] =
                                    (volumeMap[quoteTokenAddress.toLowerCase()] || 0) + volume24h;
                            }
                        });
                    });
                } catch (geckoErr) {
                    console.warn('GeckoTerminal fetch failed:', geckoErr);
                }

                // Step 2: Find tokens missing from GeckoTerminal and fetch from DexScreener
                const missingTokens = WORLD_CHAIN_TOKENS.filter(
                    token => !volumeMap[token.address.toLowerCase()]
                );

                if (missingTokens.length > 0) {
                    try {
                        // DexScreener allows batch token queries
                        const addresses = missingTokens.map(t => t.address).join(',');
                        const dexResponse = await fetch(
                            `${DEXSCREENER_API}/tokens/${addresses}`,
                            { headers: { 'Accept': 'application/json' } }
                        );

                        if (dexResponse.ok) {
                            const dexData = await dexResponse.json();
                            if (dexData.pairs) {
                                dexData.pairs.forEach((pair: any) => {
                                    const volume24h = parseFloat(pair.volume?.h24 || '0');
                                    const baseAddress = pair.baseToken?.address?.toLowerCase();
                                    const quoteAddress = pair.quoteToken?.address?.toLowerCase();

                                    if (baseAddress) {
                                        volumeMap[baseAddress] = (volumeMap[baseAddress] || 0) + volume24h;
                                    }
                                    if (quoteAddress) {
                                        volumeMap[quoteAddress] = (volumeMap[quoteAddress] || 0) + volume24h;
                                    }
                                });
                            }
                        }
                    } catch (dexErr) {
                        console.warn('DexScreener fetch failed:', dexErr);
                    }
                }

                setVolumes(volumeMap);
                setError(null);
            } catch (err) {
                console.error('Failed to fetch volume data:', err);
                setError('Failed to fetch volume data');
            } finally {
                setIsLoading(false);
            }
        }

        fetchVolume();
        // Refresh every 5 minutes
        const interval = setInterval(fetchVolume, 5 * 60 * 1000);
        return () => clearInterval(interval);
    }, []);

    return { volumes, isLoading, error };
}
