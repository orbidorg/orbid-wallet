'use client';

import { motion } from 'framer-motion';
import type { TabType } from '@/lib/types';

interface BottomNavProps {
    activeTab: TabType;
    onTabChange: (tab: TabType) => void;
}

export default function BottomNav({ activeTab, onTabChange }: BottomNavProps) {
    const tabs: { id: TabType; label: string; icon: React.ReactNode }[] = [
        {
            id: 'wallet',
            label: 'Wallet',
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                        d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
            ),
        },
        {
            id: 'swap',
            label: 'Swap',
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                        d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                </svg>
            ),
        },
        {
            id: 'activity',
            label: 'Activity',
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            ),
        },
    ];

    return (
        <motion.nav
            initial={{ y: 100 }}
            animate={{ y: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 z-50 glass-strong safe-area-pb"
        >
            <div className="flex justify-around items-center max-w-md mx-auto px-2 py-1.5">
                {tabs.map((tab) => (
                    <motion.button
                        key={tab.id}
                        onClick={() => onTabChange(tab.id)}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className={`relative flex flex-col items-center justify-center gap-0.5 px-6 py-1.5 rounded-xl transition-colors duration-200 min-w-[72px]
                            ${activeTab === tab.id
                                ? 'text-pink-400'
                                : 'text-zinc-600 hover:text-zinc-400'
                            }`}
                    >
                        <motion.div
                            animate={{
                                scale: activeTab === tab.id ? 1.1 : 1,
                                y: activeTab === tab.id ? -2 : 0
                            }}
                            className={`relative ${activeTab === tab.id ? 'drop-shadow-[0_0_8px_rgba(244,114,182,0.5)]' : ''}`}
                        >
                            {tab.icon}
                        </motion.div>
                        <span className="text-[10px] font-medium">{tab.label}</span>
                        {activeTab === tab.id && (
                            <motion.div
                                layoutId="activeTab"
                                className="absolute -bottom-0.5 w-1 h-1 bg-pink-400 rounded-full"
                                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                            />
                        )}
                    </motion.button>
                ))}
            </div>
        </motion.nav>
    );
}
