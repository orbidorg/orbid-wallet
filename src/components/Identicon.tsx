'use client';

import { useMemo } from 'react';

interface IdenticonProps {
    address: string;
    size?: number;
}

function parseHash(address: string) {
    const hash = address.toLowerCase().slice(2);
    const values: number[] = [];
    for (let i = 0; i < 40; i += 2) {
        values.push(parseInt(hash.slice(i, i + 2), 16));
    }
    return values;
}

// Vibrant, fun palettes
const PALETTES = [
    ['#8b5cf6', '#d946ef'], // Purple magenta
    ['#06b6d4', '#22d3ee'], // Cyan
    ['#f43f5e', '#fb7185'], // Rose
    ['#10b981', '#34d399'], // Emerald
    ['#f59e0b', '#fbbf24'], // Amber
    ['#6366f1', '#818cf8'], // Indigo
    ['#ec4899', '#f472b6'], // Pink
    ['#14b8a6', '#2dd4bf'], // Teal
    ['#ef4444', '#f87171'], // Red
    ['#84cc16', '#a3e635'], // Lime
];

export default function Identicon({ address, size = 56 }: IdenticonProps) {
    const features = useMemo(() => {
        const v = parseHash(address);

        return {
            palette: PALETTES[v[0] % PALETTES.length],
            eyeType: v[1] % 6,
            mouthType: v[2] % 6,
            id: address.slice(2, 10),
        };
    }, [address]);

    const eyeY = size * 0.4;
    const leftX = size * 0.33;
    const rightX = size * 0.67;
    const r = size * 0.05;

    // Fun but clean eyes
    const renderEyes = () => {
        switch (features.eyeType) {
            case 0: // Happy dots
                return (
                    <>
                        <circle cx={leftX} cy={eyeY} r={r} fill="#1a1a1a" />
                        <circle cx={rightX} cy={eyeY} r={r} fill="#1a1a1a" />
                    </>
                );
            case 1: // Smiling arcs
                return (
                    <>
                        <path d={`M${leftX - r * 1.5} ${eyeY + r * 0.3} Q${leftX} ${eyeY - r * 1.2} ${leftX + r * 1.5} ${eyeY + r * 0.3}`} stroke="#1a1a1a" strokeWidth={r * 0.6} fill="none" strokeLinecap="round" />
                        <path d={`M${rightX - r * 1.5} ${eyeY + r * 0.3} Q${rightX} ${eyeY - r * 1.2} ${rightX + r * 1.5} ${eyeY + r * 0.3}`} stroke="#1a1a1a" strokeWidth={r * 0.6} fill="none" strokeLinecap="round" />
                    </>
                );
            case 2: // Wink
                return (
                    <>
                        <circle cx={leftX} cy={eyeY} r={r} fill="#1a1a1a" />
                        <path d={`M${rightX - r * 1.5} ${eyeY} L${rightX + r * 1.5} ${eyeY}`} stroke="#1a1a1a" strokeWidth={r * 0.6} strokeLinecap="round" />
                    </>
                );
            case 3: // Wide eyes
                return (
                    <>
                        <circle cx={leftX} cy={eyeY} r={r * 1.2} fill="#1a1a1a" />
                        <circle cx={rightX} cy={eyeY} r={r * 1.2} fill="#1a1a1a" />
                    </>
                );
            case 4: // Relaxed
                return (
                    <>
                        <line x1={leftX - r * 1.3} y1={eyeY} x2={leftX + r * 1.3} y2={eyeY} stroke="#1a1a1a" strokeWidth={r * 0.6} strokeLinecap="round" />
                        <line x1={rightX - r * 1.3} y1={eyeY} x2={rightX + r * 1.3} y2={eyeY} stroke="#1a1a1a" strokeWidth={r * 0.6} strokeLinecap="round" />
                    </>
                );
            case 5: // Playful asymmetric
            default:
                return (
                    <>
                        <circle cx={leftX} cy={eyeY} r={r * 1.1} fill="#1a1a1a" />
                        <circle cx={rightX} cy={eyeY} r={r * 0.9} fill="#1a1a1a" />
                    </>
                );
        }
    };

    // Fun but clean mouths
    const renderMouth = () => {
        const mouthY = size * 0.6;
        const mouthX = size * 0.5;
        const w = size * 0.12;

        switch (features.mouthType) {
            case 0: // Big smile
                return (
                    <path d={`M${mouthX - w} ${mouthY} Q${mouthX} ${mouthY + w * 0.9} ${mouthX + w} ${mouthY}`} stroke="#1a1a1a" strokeWidth={r * 0.55} fill="none" strokeLinecap="round" />
                );
            case 1: // Grin
                return (
                    <path d={`M${mouthX - w * 1.1} ${mouthY - r * 0.3} Q${mouthX} ${mouthY + w} ${mouthX + w * 1.1} ${mouthY - r * 0.3}`} stroke="#1a1a1a" strokeWidth={r * 0.55} fill="none" strokeLinecap="round" />
                );
            case 2: // Surprised O
                return (
                    <ellipse cx={mouthX} cy={mouthY + r * 0.3} rx={w * 0.4} ry={w * 0.5} fill="#1a1a1a" />
                );
            case 3: // Smirk
                return (
                    <path d={`M${mouthX - w * 0.8} ${mouthY + r * 0.2} Q${mouthX + w * 0.2} ${mouthY} ${mouthX + w * 0.9} ${mouthY - r * 0.4}`} stroke="#1a1a1a" strokeWidth={r * 0.55} fill="none" strokeLinecap="round" />
                );
            case 4: // Content
                return (
                    <line x1={mouthX - w * 0.6} y1={mouthY} x2={mouthX + w * 0.6} y2={mouthY} stroke="#1a1a1a" strokeWidth={r * 0.55} strokeLinecap="round" />
                );
            case 5: // Cheeky tongue
            default:
                return (
                    <>
                        <path d={`M${mouthX - w * 0.9} ${mouthY} Q${mouthX} ${mouthY + w * 0.7} ${mouthX + w * 0.9} ${mouthY}`} stroke="#1a1a1a" strokeWidth={r * 0.55} fill="none" strokeLinecap="round" />
                        <ellipse cx={mouthX} cy={mouthY + w * 0.5} rx={w * 0.25} ry={w * 0.2} fill="#f472b6" />
                    </>
                );
        }
    };

    return (
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="rounded-full">
            <defs>
                <linearGradient id={`g-${features.id}`} x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor={features.palette[0]} />
                    <stop offset="100%" stopColor={features.palette[1]} />
                </linearGradient>
            </defs>

            <circle cx={size / 2} cy={size / 2} r={size / 2} fill={`url(#g-${features.id})`} />

            <ellipse cx={size * 0.35} cy={size * 0.28} rx={size * 0.16} ry={size * 0.1} fill="white" opacity={0.22} />

            {renderEyes()}
            {renderMouth()}
        </svg>
    );
}
