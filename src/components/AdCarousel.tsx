'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';

interface Ad {
    id: string;
    title: string;
    description: string;
    icon?: 'rocket' | 'gift' | 'star' | 'bell' | 'x';
    image?: string;
    gradient: string;
    link?: string;
    cta?: string;
}

const SAMPLE_ADS: Ad[] = [
    {
        id: '1',
        title: 'OrbId Wallet is Live! 🚀',
        description: 'Experience the future of Web3 on World App',
        icon: 'rocket',
        gradient: 'from-pink-500 to-purple-600'
        // No link - just informational
    },
    {
        id: '2',
        title: 'Follow us on X',
        description: 'Stay up to date with all the news and upcoming launches',
        icon: 'x',
        gradient: 'from-zinc-700 to-zinc-900',
        link: 'https://x.com/OrbIdLabs',
        cta: 'Follow @OrbIdLabs'
    }
];

export default function AdCarousel() {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isMinimized, setIsMinimized] = useState(false);

    // Auto-rotate ads every 6 seconds
    useEffect(() => {
        if (isMinimized) return;

        const interval = setInterval(() => {
            setCurrentIndex((prev) => (prev + 1) % SAMPLE_ADS.length);
        }, 6000);

        return () => clearInterval(interval);
    }, [isMinimized]);

    const currentAd = SAMPLE_ADS[currentIndex];

    // Minimized state
    if (isMinimized) {
        return (
            <button
                onClick={() => setIsMinimized(false)}
                className="w-full flex items-center justify-center gap-2 py-2 glass rounded-xl hover:bg-white/5 transition-all"
            >
                <svg className="w-4 h-4 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
                <span className="text-xs text-zinc-500">Show announcements</span>
            </button>
        );
    }

    const renderIcon = () => {
        switch (currentAd.icon) {
            case 'rocket':
                return (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.59 14.37a6 6 0 01-5.84 7.38v-4.8m5.84-2.58a14.98 14.98 0 006.16-12.12A14.98 14.98 0 009.631 8.41m5.96 5.96a14.926 14.926 0 01-5.841 2.58m-.119-8.54a6 6 0 00-7.381 5.84h4.8m2.581-5.84a14.927 14.927 0 00-2.58 5.84m2.699 2.7c-.103.021-.207.041-.311.06a15.09 15.09 0 01-2.448-2.448 14.9 14.9 0 01.06-.312m-2.24 2.39a4.493 4.493 0 00-1.757 4.306 4.493 4.493 0 004.306-1.758M16.5 9a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
                    </svg>
                );
            case 'x':
                return (
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                    </svg>
                );
            case 'gift':
                return (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
                    </svg>
                );
            case 'star':
                return (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                    </svg>
                );
            default:
                return null;
        }
    };

    return (
        <div className="relative">
            {/* Ad Container */}
            <div
                className={`glass rounded-xl overflow-hidden bg-gradient-to-r ${currentAd.gradient} bg-opacity-10 cursor-pointer transition-all hover:scale-[1.01]`}
                onClick={() => currentAd.link && window.open(currentAd.link, '_blank')}
            >
                {/* Image header if available */}
                {currentAd.image && (
                    <div className="relative h-24 w-full">
                        <Image src={currentAd.image} alt="" fill className="object-cover" />
                    </div>
                )}

                <div className="p-3">
                    <div className="flex items-start gap-3">
                        {/* Icon */}
                        {currentAd.icon && (
                            <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white flex-shrink-0">
                                {renderIcon()}
                            </div>
                        )}

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                            <p className="font-semibold text-white text-sm">{currentAd.title}</p>
                            <p className="text-xs text-white/70 mt-0.5">{currentAd.description}</p>
                            {currentAd.cta && (
                                <span className="inline-block mt-2 px-3 py-1 text-xs font-medium bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors">
                                    {currentAd.cta}
                                </span>
                            )}
                        </div>

                        {/* Minimize button */}
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                setIsMinimized(true);
                            }}
                            className="p-1.5 hover:bg-white/10 rounded-full transition-colors flex-shrink-0"
                        >
                            <svg className="w-4 h-4 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Dots indicator */}
                <div className="flex justify-center gap-1.5 pb-2">
                    {SAMPLE_ADS.map((_, index) => (
                        <button
                            key={index}
                            onClick={(e) => {
                                e.stopPropagation();
                                setCurrentIndex(index);
                            }}
                            className={`w-1.5 h-1.5 rounded-full transition-all ${index === currentIndex ? 'bg-white w-3' : 'bg-white/30'
                                }`}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
}
