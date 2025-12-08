'use client';

import { useState, useEffect, useCallback } from 'react';
import { WORLD_CHAIN_TOKENS } from '@/lib/tokens';

const ALCHEMY_API_KEY = process.env.NEXT_PUBLIC_ALCHEMY_API_KEY;
const ALCHEMY_URL = `https://worldchain-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}`;

export interface Transaction {
    hash: string;
    from: string;
    to: string;
    value: string;
    timestamp: number;
    blockNumber: string;
    type: 'send' | 'receive' | 'swap' | 'contract';
    status: 'confirmed' | 'pending' | 'failed';
    tokenSymbol?: string;
    tokenAmount?: string;
    gasUsed?: string;
    gasPrice?: string;
}

interface AlchemyTransfer {
    blockNum: string;
    hash: string;
    from: string;
    to: string;
    value: number;
    asset: string;
    category: string;
    rawContract: {
        address: string;
        decimal: string;
    };
}

// Find token info by address
function getTokenByAddress(address: string) {
    return WORLD_CHAIN_TOKENS.find(
        t => t.address.toLowerCase() === address?.toLowerCase()
    );
}

// Format relative time
function getRelativeTime(timestamp: number): string {
    const now = Date.now();
    const diff = now - timestamp;

    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;

    return new Date(timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

const TRANSACTIONS_PER_PAGE = 10;

export function useTransactionHistory(walletAddress: string | null) {
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);

    const fetchTransactions = useCallback(async (pageNum: number, append: boolean = false) => {
        if (!walletAddress || !ALCHEMY_API_KEY) {
            setTransactions([]);
            setIsLoading(false);
            return;
        }

        if (append) {
            setIsLoadingMore(true);
        } else {
            setIsLoading(true);
        }
        setError(null);

        const maxCount = `0x${(TRANSACTIONS_PER_PAGE * pageNum).toString(16)}`;

        try {
            // Fetch both incoming and outgoing transfers
            const [sentRes, receivedRes] = await Promise.all([
                fetch(ALCHEMY_URL, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        jsonrpc: '2.0',
                        id: 1,
                        method: 'alchemy_getAssetTransfers',
                        params: [{
                            fromAddress: walletAddress,
                            category: ['erc20', 'external'],
                            order: 'desc',
                            maxCount
                        }]
                    })
                }),
                fetch(ALCHEMY_URL, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        jsonrpc: '2.0',
                        id: 2,
                        method: 'alchemy_getAssetTransfers',
                        params: [{
                            toAddress: walletAddress,
                            category: ['erc20', 'external'],
                            order: 'desc',
                            maxCount
                        }]
                    })
                })
            ]);

            const [sentData, receivedData] = await Promise.all([
                sentRes.json(),
                receivedRes.json()
            ]);

            const sentTransfers: AlchemyTransfer[] = sentData.result?.transfers || [];
            const receivedTransfers: AlchemyTransfer[] = receivedData.result?.transfers || [];

            // Get block timestamps for unique blocks (limit to 15 for speed)
            const allBlocks = [...new Set([
                ...sentTransfers.map(t => t.blockNum),
                ...receivedTransfers.map(t => t.blockNum)
            ])].slice(0, 15);

            const blockTimestamps: Record<string, number> = {};

            await Promise.all(
                allBlocks.map(async (blockNum) => {
                    try {
                        const res = await fetch(ALCHEMY_URL, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                jsonrpc: '2.0',
                                id: 1,
                                method: 'eth_getBlockByNumber',
                                params: [blockNum, false]
                            })
                        });
                        const data = await res.json();
                        if (data.result?.timestamp) {
                            blockTimestamps[blockNum] = parseInt(data.result.timestamp, 16) * 1000;
                        }
                    } catch {
                        blockTimestamps[blockNum] = Date.now();
                    }
                })
            );

            // Process sent transactions
            const sentTxs: Transaction[] = sentTransfers.map(t => {
                const token = getTokenByAddress(t.rawContract?.address);
                return {
                    hash: t.hash,
                    from: t.from,
                    to: t.to,
                    value: t.value?.toString() || '0',
                    timestamp: blockTimestamps[t.blockNum] || Date.now(),
                    blockNumber: t.blockNum,
                    type: 'send' as const,
                    status: 'confirmed' as const,
                    tokenSymbol: token?.symbol || t.asset || 'ETH',
                    tokenAmount: t.value?.toString() || '0'
                };
            });

            // Process received transactions
            const receivedTxs: Transaction[] = receivedTransfers.map(t => {
                const token = getTokenByAddress(t.rawContract?.address);
                return {
                    hash: t.hash,
                    from: t.from,
                    to: t.to,
                    value: t.value?.toString() || '0',
                    timestamp: blockTimestamps[t.blockNum] || Date.now(),
                    blockNumber: t.blockNum,
                    type: 'receive' as const,
                    status: 'confirmed' as const,
                    tokenSymbol: token?.symbol || t.asset || 'ETH',
                    tokenAmount: t.value?.toString() || '0'
                };
            });

            // Combine and sort by timestamp
            const allTxs = [...sentTxs, ...receivedTxs]
                .sort((a, b) => b.timestamp - a.timestamp)
                // Remove duplicates by hash
                .filter((tx, index, self) =>
                    index === self.findIndex(t => t.hash === tx.hash)
                );

            // Check if there might be more transactions
            const totalFetched = sentTransfers.length + receivedTransfers.length;
            setHasMore(totalFetched >= TRANSACTIONS_PER_PAGE * pageNum);

            setTransactions(allTxs);
        } catch (err) {
            console.error('Failed to fetch transactions:', err);
            setError('Failed to load transactions');
        } finally {
            setIsLoading(false);
            setIsLoadingMore(false);
        }
    }, [walletAddress]);

    const loadMore = useCallback(() => {
        const nextPage = page + 1;
        setPage(nextPage);
        fetchTransactions(nextPage, true);
    }, [page, fetchTransactions]);

    useEffect(() => {
        setPage(1);
        fetchTransactions(1, false);
    }, [fetchTransactions]);

    return {
        transactions,
        isLoading,
        isLoadingMore,
        error,
        hasMore,
        loadMore,
        refetch: () => fetchTransactions(page, false),
        getRelativeTime
    };
}
