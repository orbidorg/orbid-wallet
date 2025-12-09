'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import Image from 'next/image';

export default function NotFound() {
    return (
        <div className="min-h-screen bg-black flex flex-col items-center justify-center p-6">
            {/* Animated Background Glow */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 0.5 }}
                    transition={{ duration: 2, repeat: Infinity, repeatType: 'reverse' }}
                    className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-pink-500/20 rounded-full blur-[120px]"
                />
                <motion.div
                    initial={{ opacity: 0.3 }}
                    animate={{ opacity: 0.6 }}
                    transition={{ duration: 3, repeat: Infinity, repeatType: 'reverse', delay: 0.5 }}
                    className="absolute bottom-1/4 left-1/3 w-[400px] h-[400px] bg-purple-500/20 rounded-full blur-[100px]"
                />
            </div>

            {/* Content */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="relative z-10 text-center max-w-md"
            >
                {/* Logo */}
                <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    className="mb-8"
                >
                    <Image
                        src="/logo.svg"
                        alt="OrbId"
                        width={80}
                        height={80}
                        className="mx-auto"
                    />
                </motion.div>

                {/* 404 Text */}
                <motion.h1
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{
                        duration: 0.8,
                        delay: 0.3,
                        type: 'spring',
                        stiffness: 100
                    }}
                    className="text-8xl md:text-9xl font-bold bg-gradient-to-r from-pink-500 via-purple-500 to-pink-500 bg-clip-text text-transparent mb-4"
                >
                    404
                </motion.h1>

                {/* Message */}
                <motion.h2
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.5, delay: 0.5 }}
                    className="text-2xl font-semibold text-white mb-3"
                >
                    Page Not Found
                </motion.h2>

                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.5, delay: 0.6 }}
                    className="text-zinc-400 mb-8"
                >
                    Oops! The page you&apos;re looking for seems to have wandered off into the blockchain void.
                </motion.p>

                {/* Animated Orbs */}
                <motion.div
                    className="flex justify-center gap-3 mb-8"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.7 }}
                >
                    {[0, 1, 2].map((i) => (
                        <motion.div
                            key={i}
                            animate={{
                                y: [0, -10, 0],
                                opacity: [0.5, 1, 0.5]
                            }}
                            transition={{
                                duration: 1.5,
                                repeat: Infinity,
                                delay: i * 0.2
                            }}
                            className="w-3 h-3 rounded-full bg-gradient-to-r from-pink-500 to-purple-500"
                        />
                    ))}
                </motion.div>

                {/* Back Button */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.8 }}
                >
                    <Link
                        href="/"
                        className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-pink-500 to-purple-600 text-white font-semibold rounded-xl hover:opacity-90 active:scale-95 transition-all"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                        </svg>
                        Back to Wallet
                    </Link>
                </motion.div>

                {/* Subtle Footer */}
                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.5, delay: 1 }}
                    className="mt-12 text-xs text-zinc-600"
                >
                    OrbId Wallet • World Chain
                </motion.p>
            </motion.div>
        </div>
    );
}
