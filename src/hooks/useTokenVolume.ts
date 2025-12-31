'use client';

import { useState, useEffect } from 'react';

const GECKOTERMINAL_API = 'https://api.geckoterminal.com/api/v2';
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
                // Fetch first 2 pages of pools to cover major tokens
                const responses = await Promise.all([
                    fetch(`${GECKOTERMINAL_API}/networks/${NETWORK_ID}/pools?page=1`, {
                        headers: { 'Accept': 'application/json;version=20230203' }
                    }),
                    fetch(`${GECKOTERMINAL_API}/networks/${NETWORK_ID}/pools?page=2`, {
                        headers: { 'Accept': 'application/json;version=20230203' }
                    })
                ]);

                const data = await Promise.all(responses.map(r => r.json()));

                const volumeMap: Record<string, number> = {};

                data.forEach(page => {
                    if (!page.data) return;

                    page.data.forEach((pool: any) => {
                        const attributes = pool.attributes;
                        const volume24h = parseFloat(attributes.volume_usd.h24 || '0');

                        // Pools have relationships with base_token and quote_token
                        const baseTokenAddress = pool.relationships?.base_token?.data?.id?.split('_')[1];
                        const quoteTokenAddress = pool.relationships?.quote_token?.data?.id?.split('_')[1];

                        if (baseTokenAddress) {
                            volumeMap[baseTokenAddress.toLowerCase()] = (volumeMap[baseTokenAddress.toLowerCase()] || 0) + volume24h;
                        }
                        if (quoteTokenAddress) {
                            volumeMap[quoteTokenAddress.toLowerCase()] = (volumeMap[quoteTokenAddress.toLowerCase()] || 0) + volume24h;
                        }
                    });
                });

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
