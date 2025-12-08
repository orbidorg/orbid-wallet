'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTransactionHistory, Transaction } from '@/hooks/useTransactionHistory';
import { AnimatedButton, ModalBackdrop, ModalContent, FadeIn, StaggerContainer, StaggerItem, Pressable } from './ui/Motion';

interface ActivityListProps {
    walletAddress: string;
}

// Transaction Detail Modal
function TransactionDetailModal({
    transaction,
    isOpen,
    onClose
}: {
    transaction: Transaction | null;
    isOpen: boolean;
    onClose: () => void;
}) {
    const explorerUrl = transaction ? `https://worldscan.org/tx/${transaction.hash}` : '';
    const fromShort = transaction ? `${transaction.from.slice(0, 8)}...${transaction.from.slice(-6)}` : '';
    const toShort = transaction ? `${transaction.to.slice(0, 8)}...${transaction.to.slice(-6)}` : '';
    const date = transaction ? new Date(transaction.timestamp) : new Date();

    return (
        <AnimatePresence>
            {isOpen && transaction && (
                <ModalBackdrop onClose={onClose}>
                    <ModalContent>
                        {/* Header */}
                        <div className="sticky top-0 glass-strong px-4 py-3 flex items-center justify-between border-b border-white/5">
                            <h2 className="text-lg font-bold text-white">Transaction Details</h2>
                            <button onClick={onClose} className="p-2 rounded-full hover:bg-white/10 transition-colors">
                                <svg className="w-5 h-5 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <div className="p-4 space-y-4">
                            {/* Transaction Type Icon */}
                            <div className="text-center py-4">
                                <div className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center ${transaction.type === 'receive'
                                    ? 'bg-emerald-500/10'
                                    : 'bg-pink-500/10'
                                    }`}>
                                    {transaction.type === 'receive' ? (
                                        <svg className="w-8 h-8 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                                        </svg>
                                    ) : (
                                        <svg className="w-8 h-8 text-pink-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                                        </svg>
                                    )}
                                </div>
                                <p className="mt-3 text-2xl font-bold text-white">
                                    {transaction.type === 'receive' ? '+' : '-'}{transaction.tokenAmount} {transaction.tokenSymbol}
                                </p>
                                <span className={`inline-block mt-2 px-2 py-0.5 rounded text-xs font-medium ${transaction.status === 'confirmed'
                                    ? 'bg-emerald-500/10 text-emerald-400'
                                    : transaction.status === 'pending'
                                        ? 'bg-yellow-500/10 text-yellow-400'
                                        : 'bg-red-500/10 text-red-400'
                                    }`}>
                                    {transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
                                </span>
                            </div>

                            {/* Details */}
                            <div className="glass rounded-xl p-4 space-y-3">
                                <div className="flex justify-between">
                                    <span className="text-zinc-500 text-sm">Type</span>
                                    <span className="text-white text-sm capitalize">{transaction.type}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-zinc-500 text-sm">Date</span>
                                    <span className="text-white text-sm">
                                        {date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-zinc-500 text-sm">Time</span>
                                    <span className="text-white text-sm">
                                        {date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-zinc-500 text-sm">From</span>
                                    <span className="text-white text-sm font-mono">{fromShort}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-zinc-500 text-sm">To</span>
                                    <span className="text-white text-sm font-mono">{toShort}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-zinc-500 text-sm">Network</span>
                                    <span className="text-white text-sm">World Chain</span>
                                </div>
                                <div className="flex justify-between items-start">
                                    <span className="text-zinc-500 text-sm">Transaction Hash</span>
                                    <span className="text-white text-xs font-mono text-right break-all max-w-[180px]">
                                        {transaction.hash.slice(0, 20)}...
                                    </span>
                                </div>
                            </div>

                            {/* View on Explorer Button */}
                            <AnimatedButton
                                variant="gradient"
                                fullWidth
                                onClick={() => window.open(explorerUrl, '_blank')}
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                </svg>
                                View on WorldScan
                            </AnimatedButton>
                        </div>
                    </ModalContent>
                </ModalBackdrop>
            )}
        </AnimatePresence>
    );
}

// Loading Skeleton
function LoadingSkeleton() {
    return (
        <div className="divide-y divide-white/5">
            {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center justify-between px-4 py-3">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-zinc-800 animate-pulse" />
                        <div>
                            <div className="w-16 h-4 bg-zinc-800 rounded animate-pulse mb-1" />
                            <div className="w-24 h-3 bg-zinc-800 rounded animate-pulse" />
                        </div>
                    </div>
                    <div className="text-right">
                        <div className="w-20 h-4 bg-zinc-800 rounded animate-pulse mb-1" />
                        <div className="w-12 h-3 bg-zinc-800 rounded animate-pulse" />
                    </div>
                </div>
            ))}
        </div>
    );
}

export default function ActivityList({ walletAddress }: ActivityListProps) {
    const { transactions, isLoading, getRelativeTime } = useTransactionHistory(walletAddress);
    const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);

    // Empty state
    if (!isLoading && transactions.length === 0) {
        return (
            <FadeIn>
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="glass rounded-2xl p-8 text-center"
                >
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.1, type: 'spring' }}
                        className="w-16 h-16 mx-auto mb-4 rounded-full bg-zinc-800/50 flex items-center justify-center"
                    >
                        <svg className="w-8 h-8 text-zinc-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                    </motion.div>
                    <h3 className="text-white font-semibold mb-2">No Transactions Yet</h3>
                    <p className="text-zinc-500 text-sm">Your transaction history will appear here</p>
                </motion.div>
            </FadeIn>
        );
    }

    return (
        <>
            <div className="glass rounded-2xl overflow-hidden">
                <div className="px-4 py-2.5 border-b border-white/5 flex items-center justify-between">
                    <h3 className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Recent Activity</h3>
                    <span className="text-xs text-zinc-600">{transactions.length} transactions</span>
                </div>

                {isLoading ? (
                    <LoadingSkeleton />
                ) : (
                    <div className="divide-y divide-white/5">
                        {transactions.map((tx) => (
                            <button
                                key={tx.hash}
                                onClick={() => setSelectedTx(tx)}
                                className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-white/5 active:bg-white/10 transition-colors"
                            >
                                <div className="flex items-center gap-3">
                                    {/* Icon */}
                                    <div className={`w-9 h-9 rounded-full flex items-center justify-center ${tx.type === 'receive'
                                        ? 'bg-emerald-500/10'
                                        : tx.type === 'send'
                                            ? 'bg-pink-500/10'
                                            : 'bg-blue-500/10'
                                        }`}>
                                        {tx.type === 'receive' ? (
                                            <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                                            </svg>
                                        ) : tx.type === 'send' ? (
                                            <svg className="w-4 h-4 text-pink-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                                            </svg>
                                        ) : (
                                            <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                                            </svg>
                                        )}
                                    </div>

                                    {/* Info */}
                                    <div>
                                        <p className="font-medium text-white text-sm capitalize">{tx.type}</p>
                                        <p className="text-xs text-zinc-500">
                                            {tx.type === 'receive'
                                                ? `From ${tx.from.slice(0, 6)}...${tx.from.slice(-4)}`
                                                : `To ${tx.to.slice(0, 6)}...${tx.to.slice(-4)}`
                                            }
                                        </p>
                                    </div>
                                </div>

                                {/* Amount & Time */}
                                <div className="text-right">
                                    <p className={`font-medium text-sm ${tx.type === 'receive' ? 'text-emerald-400' : 'text-white'
                                        }`}>
                                        {tx.type === 'receive' ? '+' : '-'}{parseFloat(tx.tokenAmount || '0').toFixed(4)} {tx.tokenSymbol}
                                    </p>
                                    <p className="text-xs text-zinc-500">{getRelativeTime(tx.timestamp)}</p>
                                </div>
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Transaction Detail Modal */}
            <TransactionDetailModal
                transaction={selectedTx}
                isOpen={!!selectedTx}
                onClose={() => setSelectedTx(null)}
            />
        </>
    );
}
