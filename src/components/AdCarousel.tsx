'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';
import { useI18n } from '@/lib/i18n';

interface Ad {
    id: string;
    titleKey: 'orbidLive' | 'followX' | 'oidTokens';
    descKey: 'orbidLiveDesc' | 'followXDesc' | 'oidTokensDesc';
    icon?: 'rocket' | 'gift' | 'star' | 'bell' | 'x' | 'shield' | 'coin';
    image?: string;
    gradient: string;
    link?: string;
    ctaKey?: 'followCta';
    emoji?: string;
}

const SAMPLE_ADS: Ad[] = [

    {
        id: '2',
        titleKey: 'oidTokens',
        descKey: 'oidTokensDesc',
        icon: 'coin',
        gradient: 'from-amber-500 to-orange-600',
        emoji: '🪙'
    },
    {
        id: '3',
        titleKey: 'orbidLive',
        descKey: 'orbidLiveDesc',
        icon: 'rocket',
        gradient: 'from-pink-500 to-purple-600',
        emoji: '🚀'
    },
    {
        id: '4',
        titleKey: 'followX',
        descKey: 'followXDesc',
        icon: 'x',
        gradient: 'from-zinc-700 to-zinc-900',
        link: 'https://x.com/OrbIdLabs',
        ctaKey: 'followCta'
    }
];

const AUTOPLAY_INTERVAL = 10000;
const SWIPE_THRESHOLD = 50;

export default function AdCarousel() {
    const { t } = useI18n();
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isMinimized, setIsMinimized] = useState(false);
    const [direction, setDirection] = useState(0);
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    const resetTimer = useCallback(() => {
        if (timerRef.current) clearInterval(timerRef.current);
        if (!isMinimized) {
            timerRef.current = setInterval(() => {
                setDirection(1);
                setCurrentIndex((prev) => (prev + 1) % SAMPLE_ADS.length);
            }, AUTOPLAY_INTERVAL);
        }
    }, [isMinimized]);

    useEffect(() => {
        resetTimer();
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [resetTimer]);

    const goToSlide = (index: number) => {
        setDirection(index > currentIndex ? 1 : -1);
        setCurrentIndex(index);
        resetTimer();
    };

    const handleDragEnd = (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
        const { offset } = info;
        if (Math.abs(offset.x) > SWIPE_THRESHOLD) {
            if (offset.x > 0) {
                setDirection(-1);
                setCurrentIndex((prev) => (prev - 1 + SAMPLE_ADS.length) % SAMPLE_ADS.length);
            } else {
                setDirection(1);
                setCurrentIndex((prev) => (prev + 1) % SAMPLE_ADS.length);
            }
            resetTimer();
        }
    };

    const currentAd = SAMPLE_ADS[currentIndex];

    if (isMinimized) {
        return (
            <button
                onClick={() => setIsMinimized(false)}
                className="w-full flex items-center justify-center gap-2 py-2 glass rounded-xl hover:bg-white/5 transition-all"
            >
                <svg className="w-4 h-4 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
                <span className="text-xs text-zinc-500">{t.ads.showAnnouncements}</span>
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
            case 'shield':
                return (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                );
            case 'coin':
                return (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                );
            default:
                return null;
        }
    };

    const slideVariants = {
        enter: (dir: number) => ({ x: dir > 0 ? 100 : -100, opacity: 0 }),
        center: { x: 0, opacity: 1 },
        exit: (dir: number) => ({ x: dir > 0 ? -100 : 100, opacity: 0 })
    };

    return (
        <div className="relative overflow-hidden">
            <AnimatePresence mode="wait" custom={direction}>
                <motion.div
                    key={currentAd.id}
                    custom={direction}
                    variants={slideVariants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={{ duration: 0.3, ease: 'easeInOut' }}
                    drag="x"
                    dragConstraints={{ left: 0, right: 0 }}
                    dragElastic={0.2}
                    onDragEnd={handleDragEnd}
                    className={`glass rounded-xl overflow-hidden bg-gradient-to-r ${currentAd.gradient} bg-opacity-10 cursor-grab active:cursor-grabbing min-h-[120px]`}
                    onClick={() => currentAd.link && window.open(currentAd.link, '_blank')}
                >
                    {/* Content */}
                    <div className="p-4 h-full flex items-center">
                        <div className="flex items-center gap-3 w-full">
                            {currentAd.icon && (
                                <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white flex-shrink-0">
                                    {renderIcon()}
                                </div>
                            )}

                            <div className="flex-1 min-w-0">
                                <p className="font-semibold text-white text-sm truncate">
                                    {t.ads[currentAd.titleKey]} {currentAd.emoji || ''}
                                </p>
                                <p className="text-xs text-white/70 mt-0.5 line-clamp-2">
                                    {t.ads[currentAd.descKey]}
                                </p>
                                {currentAd.ctaKey && (
                                    <span className="inline-block mt-2 px-3 py-1 text-xs font-medium bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors">
                                        {t.ads[currentAd.ctaKey]}
                                    </span>
                                )}
                            </div>

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
                </motion.div>
            </AnimatePresence>

            {/* Dots indicator */}
            <div className="flex justify-center gap-1.5 pt-2">
                {SAMPLE_ADS.map((_, index) => (
                    <button
                        key={index}
                        onClick={() => goToSlide(index)}
                        className={`h-1.5 rounded-full transition-all ${index === currentIndex ? 'bg-white w-4' : 'bg-white/30 w-1.5'
                            }`}
                    />
                ))}
            </div>
        </div>
    );
}
