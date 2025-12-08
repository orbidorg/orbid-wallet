'use client';

import { useState, useEffect, useRef } from 'react';
import { AnimatePresence } from 'framer-motion';
import QRCode from 'qrcode';
import { AnimatedButton, ModalBackdrop, ModalContent, FadeIn } from '../ui/Motion';

interface ReceiveModalProps {
    isOpen: boolean;
    onClose: () => void;
    walletAddress: string;
}

export default function ReceiveModal({ isOpen, onClose, walletAddress }: ReceiveModalProps) {
    const [copied, setCopied] = useState(false);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    // Generate real QR code
    useEffect(() => {
        if (!isOpen || !canvasRef.current || !walletAddress) return;

        QRCode.toCanvas(canvasRef.current, walletAddress, {
            width: 180,
            margin: 2,
            color: {
                dark: '#ffffff',
                light: '#00000000'
            },
            errorCorrectionLevel: 'H'
        }, (error) => {
            if (error) console.error('QR Code generation error:', error);
        });
    }, [isOpen, walletAddress]);

    const copyAddress = async () => {
        try {
            await navigator.clipboard.writeText(walletAddress);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy:', err);
        }
    };

    const shareAddress = async () => {
        if (navigator.share) {
            try {
                await navigator.share({
                    title: 'My OrbId Wallet Address',
                    text: `Send tokens to my World Chain address: ${walletAddress}`,
                });
            } catch (err) {
                if ((err as Error).name !== 'AbortError') {
                    copyAddress();
                }
            }
        } else {
            copyAddress();
        }
    };

    const shortAddress = `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`;

    return (
        <AnimatePresence>
            {isOpen && (
                <ModalBackdrop onClose={onClose}>
                    <ModalContent>
                        {/* Header */}
                        <div className="px-5 py-4 flex items-center justify-between border-b border-white/5">
                            <h2 className="text-lg font-bold text-white">Receive</h2>
                            <button
                                onClick={onClose}
                                className="p-2 -mr-2 rounded-full hover:bg-white/10 active:scale-95 transition-all"
                            >
                                <svg className="w-5 h-5 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <div className="px-5 py-6 flex flex-col items-center">
                            {/* QR Code Container */}
                            <FadeIn delay={0.1}>
                                <div className="p-4 glass rounded-2xl mb-5">
                                    <canvas
                                        ref={canvasRef}
                                        className="rounded-xl block"
                                        style={{ width: 180, height: 180 }}
                                    />
                                </div>
                            </FadeIn>

                            {/* Network Badge */}
                            <FadeIn delay={0.2}>
                                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 glass rounded-full mb-4">
                                    <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                                    <span className="text-xs text-zinc-400">World Chain</span>
                                </div>
                            </FadeIn>

                            {/* Address */}
                            <FadeIn delay={0.25}>
                                <p className="text-base font-mono text-white mb-1">{shortAddress}</p>
                                <p className="text-xs text-zinc-500 text-center mb-6">
                                    Scan QR code or copy address to receive tokens
                                </p>
                            </FadeIn>

                            {/* Action Buttons */}
                            <FadeIn delay={0.3} className="w-full">
                                <div className="flex gap-3 w-full">
                                    <AnimatedButton
                                        variant={copied ? 'gradient' : 'glass'}
                                        onClick={copyAddress}
                                        fullWidth
                                    >
                                        {copied ? (
                                            <>
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                </svg>
                                                Copied!
                                            </>
                                        ) : (
                                            <>
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                                </svg>
                                                Copy
                                            </>
                                        )}
                                    </AnimatedButton>
                                    <AnimatedButton
                                        variant="gradient"
                                        onClick={shareAddress}
                                        fullWidth
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                                        </svg>
                                        Share
                                    </AnimatedButton>
                                </div>
                            </FadeIn>

                            {/* Warning */}
                            <FadeIn delay={0.35} className="w-full">
                                <div className="mt-5 glass rounded-xl p-3 w-full">
                                    <div className="flex items-start gap-2.5">
                                        <svg className="w-4 h-4 text-yellow-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                        </svg>
                                        <p className="text-xs text-zinc-400 leading-relaxed">
                                            Only send <span className="text-white font-medium">World Chain</span> compatible tokens to this address.
                                        </p>
                                    </div>
                                </div>
                            </FadeIn>
                        </div>
                    </ModalContent>
                </ModalBackdrop>
            )}
        </AnimatePresence>
    );
}
