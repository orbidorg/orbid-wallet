'use client';

import { useMemo, useState, useRef, useCallback } from 'react';
import Image from 'next/image';
import type { TokenBalance } from '@/lib/types';
import { useTokenMarketData, ChartPeriod, PricePoint } from '@/hooks/useTokenMarketData';
import { useI18n } from '@/lib/i18n';
import { formatPrice, formatTokenValue } from '@/lib/format';

interface TokenDetailModalProps {
    tokenBalance: TokenBalance;
    isOpen: boolean;
    onClose: () => void;
    onSend?: () => void;
    onBuy?: () => void;
}

// Format large numbers
function formatNumber(num: number): string {
    if (num >= 1_000_000_000) return `$${(num / 1_000_000_000).toFixed(2)}B`;
    if (num >= 1_000_000) return `$${(num / 1_000_000).toFixed(2)}M`;
    if (num >= 1_000) return `$${(num / 1_000).toFixed(2)}K`;
    return `$${num.toFixed(2)}`;
}

// Format date based on period
function formatDate(timestamp: number, period: ChartPeriod): string {
    const date = new Date(timestamp);
    if (period === '1d') {
        return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    }
    if (period === '7d' || period === '30d') {
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
    return date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
}

const PERIOD_LABELS: Record<ChartPeriod, string> = {
    '1d': '24H',
    '7d': '7D',
    '30d': '1M',
    '365d': '1Y',
    'max': 'MAX'
};

// Token-specific brand colors
const TOKEN_COLORS: Record<string, string> = {
    // Major tokens
    'WLD': '#ffffff',      // Worldcoin - White
    'BTC': '#f7931a',      // Bitcoin - Orange
    'WBTC': '#f7931a',     // Wrapped Bitcoin - Orange
    'ETH': '#627eea',      // Ethereum - Blue/Purple
    'WETH': '#627eea',     // Wrapped ETH - Blue/Purple
    'USDC': '#2775ca',     // USDC - Blue
    'USDT': '#26a17b',     // Tether - Green
    'LINK': '#375bd2',     // Chainlink - Blue
    'UNI': '#ff007a',      // Uniswap - Pink
    'AAVE': '#b6509e',     // Aave - Purple
    'DAI': '#f5ac37',      // DAI - Yellow
    'sDAI': '#f5ac37',     // Savings DAI - Yellow
    'SOL': '#00ffa3',      // Solana - Green
    'uSOL': '#00ffa3',     // Unifinished SOL - Green
    'MATIC': '#8247e5',    // Polygon - Purple
    'ARB': '#28a0f0',      // Arbitrum - Blue
    'OP': '#ff0420',       // Optimism - Red
    'AVAX': '#e84142',     // Avalanche - Red
    // World Chain specific
    'ORO': '#ffd700',      // ORO - Gold
    'FOOTBALL': '#00a651', // Football - Green
    'PUF': '#ff4d00',      // PUF - Bright Orange
    'ORB': '#7c3aed',      // ORB - Vivid Purple
    'SUSHI': '#fa52a0',    // Sushi - Pink
    'uSUI': '#6fbcf0',     // SUI - Light Blue
    'uXRP': '#23292f',     // XRP - Dark Grey/Black
    'uDOGE': '#c2a633',    // Dogecoin - Tan/Gold
    'uPEPE': '#3c7e00',    // PEPE - Dark Green
    'PEPE': '#3c7e00',     // PEPE - Dark Green
    // Fallback for unknown tokens
    'DEFAULT': '#ec4899',  // Pink (app theme)
};

// Get token color with fallback
function getTokenColor(symbol: string): string {
    return TOKEN_COLORS[symbol.toUpperCase()] || TOKEN_COLORS['DEFAULT'];
}

export default function TokenDetailModal({ tokenBalance, isOpen, onClose, onSend, onBuy }: TokenDetailModalProps) {
    const { t } = useI18n();
    const { token, balance, valueUSD, change24h } = tokenBalance;
    const [chartPeriod, setChartPeriod] = useState<ChartPeriod>('30d');
    const [hoveredPoint, setHoveredPoint] = useState<PricePoint | null>(null);
    const [hoverX, setHoverX] = useState<number | null>(null);
    const chartRef = useRef<SVGSVGElement>(null);
    const { data: marketData, isLoading } = useTokenMarketData(token.symbol, chartPeriod);

    // Chart dimensions - increased height for better UX
    const width = 300;
    const height = 160;
    const padding = 10;

    // Calculate chart data
    const chartData = useMemo(() => {
        if (!marketData?.priceHistory?.length) return null;

        const prices = marketData.priceHistory;
        const minPrice = Math.min(...prices.map((p: PricePoint) => p.price));
        const maxPrice = Math.max(...prices.map((p: PricePoint) => p.price));
        const range = maxPrice - minPrice || 1;

        const points = prices.map((p: PricePoint, i: number) => ({
            x: padding + (i / (prices.length - 1)) * (width - 2 * padding),
            y: height - padding - ((p.price - minPrice) / range) * (height - 2 * padding),
            data: p
        }));

        const path = `M${points.map((p: { x: number, y: number }) => `${p.x},${p.y}`).join(' L')}`;

        return { points, path, minPrice, maxPrice };
    }, [marketData]);

    // Determine chart color based on token (brand color)
    const chartColor = getTokenColor(token.symbol);
    const chartGradientId = `gradient-${token.symbol}-${chartPeriod}`;

    // Calculate price change for period display
    const priceChange = useMemo(() => {
        if (!marketData?.priceHistory?.length) return 0;
        const first = marketData.priceHistory[0].price;
        const last = marketData.priceHistory[marketData.priceHistory.length - 1].price;
        return ((last - first) / first) * 100;
    }, [marketData]);

    // Handle chart interaction
    const handleChartInteraction = useCallback((clientX: number) => {
        if (!chartRef.current || !chartData) return;

        const rect = chartRef.current.getBoundingClientRect();
        const x = ((clientX - rect.left) / rect.width) * width;

        // Find closest point
        let closestPoint = chartData.points[0];
        let minDist = Math.abs(x - closestPoint.x);

        for (const point of chartData.points) {
            const dist = Math.abs(x - point.x);
            if (dist < minDist) {
                minDist = dist;
                closestPoint = point;
            }
        }

        setHoveredPoint(closestPoint.data);
        setHoverX(closestPoint.x);
    }, [chartData]);

    const handleMouseMove = (e: React.MouseEvent) => {
        handleChartInteraction(e.clientX);
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        if (e.touches.length > 0) {
            handleChartInteraction(e.touches[0].clientX);
        }
    };

    const handleMouseLeave = () => {
        setHoveredPoint(null);
        setHoverX(null);
    };

    const getChartStartLabel = (period: ChartPeriod): string => {
        switch (period) {
            case '1d': return t.tokenDetail.ago24h;
            case '7d': return t.tokenDetail.ago7d;
            case '30d': return t.tokenDetail.ago30d;
            case '365d': return t.tokenDetail.ago1y;
            case 'max': return t.tokenDetail.start;
            default: return t.tokenDetail.start;
        }
    };

    if (!isOpen) return null;

    // Loading skeleton for chart
    const ChartSkeleton = () => (
        <div className="glass rounded-xl p-3">
            <div className="w-full h-32 bg-zinc-800/50 rounded animate-pulse" />
        </div>
    );

    // Loading skeleton for stats
    const StatsSkeleton = () => (
        <div className="grid grid-cols-2 gap-3">
            {[1, 2, 3, 4].map((i) => (
                <div key={i} className="glass rounded-xl p-3">
                    <div className="w-12 h-2 bg-zinc-800 rounded animate-pulse mb-2" />
                    <div className="w-16 h-4 bg-zinc-800 rounded animate-pulse" />
                </div>
            ))}
        </div>
    );

    // Display price - either hovered or current
    const displayPrice = hoveredPoint?.price ?? marketData?.price ?? 0;
    const displayVolume = hoveredPoint?.volume;
    const displayDate = hoveredPoint ? formatDate(hoveredPoint.timestamp, chartPeriod) : null;

    return (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm">
            <div className="glass rounded-t-3xl sm:rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto animate-slide-up">
                {/* Header */}
                <div className="sticky top-0 glass-strong px-4 py-3 flex items-center justify-between border-b border-white/5">
                    <div className="flex items-center gap-3">
                        <div className="relative w-10 h-10 rounded-full overflow-hidden bg-zinc-800">
                            <Image src={token.logoURI} alt={token.name} fill className="object-cover" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-white">{token.name}</h2>
                            <p className="text-xs text-zinc-500">{token.symbol}</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-full hover:bg-white/10 transition-colors"
                    >
                        <svg className="w-5 h-5 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Price Section */}
                <div className="px-4 py-4">
                    <div className="flex items-end gap-3 mb-1">
                        {isLoading && !marketData ? (
                            <div className="w-32 h-9 bg-zinc-800 rounded animate-pulse" />
                        ) : (
                            <span className="text-3xl font-bold text-white">
                                {formatPrice(displayPrice)}
                            </span>
                        )}
                        <span className={`text-sm font-medium px-2 py-0.5 rounded ${change24h >= 0 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                            {change24h >= 0 ? '+' : ''}{change24h.toFixed(2)}%
                        </span>
                    </div>
                    <div className="flex gap-3 text-xs text-zinc-500">
                        {displayDate ? (
                            <>
                                <span>{displayDate}</span>
                                {displayVolume !== undefined && displayVolume > 0 && (
                                    <span>Vol: {formatNumber(displayVolume)}</span>
                                )}
                            </>
                        ) : marketData && marketData.high24h > 0 ? (
                            <>
                                <span>H: {formatPrice(marketData.high24h)}</span>
                                <span>L: {formatPrice(marketData.low24h)}</span>
                            </>
                        ) : null}
                    </div>
                </div>

                {/* Chart Period Buttons */}
                <div className="px-4 pb-2">
                    <div className="flex gap-1 p-1 glass rounded-xl">
                        {(Object.keys(PERIOD_LABELS) as ChartPeriod[]).map((period) => (
                            <button
                                key={period}
                                onClick={() => setChartPeriod(period)}
                                className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition-all ${chartPeriod === period
                                    ? 'bg-pink-500/20 text-pink-400'
                                    : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/5'
                                    }`}
                            >
                                {PERIOD_LABELS[period]}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Interactive Chart */}
                <div className="px-4 pb-4">
                    {isLoading ? (
                        <ChartSkeleton />
                    ) : chartData ? (
                        <div className="glass rounded-xl p-3">
                            <svg
                                ref={chartRef}
                                viewBox={`0 0 ${width} ${height}`}
                                className="w-full h-44 touch-none cursor-crosshair"
                                onMouseMove={handleMouseMove}
                                onMouseLeave={handleMouseLeave}
                                onTouchMove={handleTouchMove}
                                onTouchEnd={handleMouseLeave}
                            >
                                <defs>
                                    <linearGradient id={chartGradientId} x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor={chartColor} stopOpacity="0.3" />
                                        <stop offset="100%" stopColor={chartColor} stopOpacity="0" />
                                    </linearGradient>
                                </defs>

                                {/* Fill area */}
                                <path
                                    d={`${chartData.path} L${width - padding},${height - padding} L${padding},${height - padding} Z`}
                                    fill={`url(#${chartGradientId})`}
                                />

                                {/* Line */}
                                <path
                                    d={chartData.path}
                                    fill="none"
                                    stroke={chartColor}
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                />

                                {/* Hover crosshair */}
                                {hoverX !== null && hoveredPoint && (
                                    <>
                                        {/* Vertical line */}
                                        <line
                                            x1={hoverX}
                                            y1={padding}
                                            x2={hoverX}
                                            y2={height - padding}
                                            stroke="white"
                                            strokeWidth="1"
                                            strokeDasharray="3,3"
                                            opacity="0.5"
                                        />
                                        {/* Point circle */}
                                        <circle
                                            cx={hoverX}
                                            cy={chartData.points.find((p: { data: PricePoint, y: number }) => p.data === hoveredPoint)?.y || 0}
                                            r="5"
                                            fill={chartColor}
                                            stroke="white"
                                            strokeWidth="2"
                                        />
                                    </>
                                )}
                            </svg>
                            <div className="flex justify-between mt-2 text-[10px] text-zinc-500">
                                <span>{getChartStartLabel(chartPeriod)}</span>
                                <span className={`font-medium ${priceChange >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                    {priceChange >= 0 ? '+' : ''}{priceChange.toFixed(2)}%
                                </span>
                                <span>{t.tokenDetail.now}</span>
                            </div>
                        </div>
                    ) : (
                        <div className="glass rounded-xl p-6 text-center">
                            <p className="text-zinc-500 text-sm">{t.tokenDetail.noChartData}</p>
                        </div>
                    )}
                </div>

                {/* Your Balance */}
                <div className="px-4 pb-4">
                    <div className="glass rounded-xl p-4">
                        <p className="text-xs text-zinc-500 mb-2">{t.tokenDetail.yourBalance}</p>
                        <div className="flex items-center justify-between">
                            <span className="text-xl font-bold text-white">{balance} {token.symbol}</span>
                            <span className="text-lg text-zinc-400">{formatTokenValue(valueUSD)}</span>
                        </div>
                    </div>
                </div>

                {/* Market Stats */}
                <div className="px-4 pb-4">
                    <h3 className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-3">{t.tokenDetail.marketStats}</h3>
                    {isLoading && !marketData ? (
                        <StatsSkeleton />
                    ) : marketData && marketData.marketCap > 0 ? (
                        <div className="grid grid-cols-2 gap-3">
                            <div className="glass rounded-xl p-3">
                                <p className="text-[10px] text-zinc-500 mb-1">{t.tokenDetail.marketCap}</p>
                                <p className="text-sm font-semibold text-white">{formatNumber(marketData.marketCap)}</p>
                            </div>
                            <div className="glass rounded-xl p-3">
                                <p className="text-[10px] text-zinc-500 mb-1">{t.tokenDetail.volume24h}</p>
                                <p className="text-sm font-semibold text-white">{formatNumber(marketData.volume24h)}</p>
                            </div>
                            <div className="glass rounded-xl p-3">
                                <p className="text-[10px] text-zinc-500 mb-1">{t.tokenDetail.high24h}</p>
                                <p className="text-sm font-semibold text-white">{formatPrice(marketData.high24h)}</p>
                            </div>
                            <div className="glass rounded-xl p-3">
                                <p className="text-[10px] text-zinc-500 mb-1">{t.tokenDetail.fdv}</p>
                                <p className="text-sm font-semibold text-white">{formatNumber(marketData.fdv)}</p>
                            </div>
                        </div>
                    ) : (
                        <div className="glass rounded-xl p-4 text-center">
                            <p className="text-zinc-500 text-sm">{t.tokenDetail.noMarketData}</p>
                        </div>
                    )}
                </div>

                {/* Price Changes */}
                {marketData && (marketData.change24h !== 0 || marketData.change7d !== 0) && (
                    <div className="px-4 pb-4">
                        <div className="glass rounded-xl p-4 flex justify-around">
                            <div className="text-center">
                                <p className="text-[10px] text-zinc-500 mb-1">24h</p>
                                <p className={`text-sm font-medium ${(marketData.change24h) >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                    {(marketData.change24h) >= 0 ? '+' : ''}{(marketData.change24h).toFixed(2)}%
                                </p>
                            </div>
                            <div className="text-center">
                                <p className="text-[10px] text-zinc-500 mb-1">7d</p>
                                <p className={`text-sm font-medium ${(marketData.change7d) >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                    {(marketData.change7d) >= 0 ? '+' : ''}{(marketData.change7d).toFixed(2)}%
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Action Buttons */}
                <div className="px-4 pb-6">
                    <div className="flex gap-3">
                        <button
                            onClick={onBuy}
                            className="flex-1 py-3 bg-gradient-to-r from-pink-500 to-purple-600 text-white font-semibold rounded-xl hover:from-pink-400 hover:to-purple-500 transition-all"
                        >
                            {t.tokens.buy}
                        </button>
                        <button
                            onClick={onSend}
                            className="flex-1 py-3 glass text-white font-semibold rounded-xl hover:bg-white/10 transition-all"
                        >
                            {t.tokens.send}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
