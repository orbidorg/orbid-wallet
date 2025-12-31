'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface SwapSettingsProps {
    slippage: number;
    deadline: number;
    useV2: boolean;
    useV3: boolean;
    useV4: boolean;
    onSlippageChange: (value: number) => void;
    onDeadlineChange: (value: number) => void;
    onPoolSettingsChange: (useV2: boolean, useV3: boolean, useV4: boolean) => void;
}

export default function SwapSettings({
    slippage,
    deadline,
    useV2,
    useV3,
    useV4,
    onSlippageChange,
    onDeadlineChange,
    onPoolSettingsChange,
}: SwapSettingsProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [isAutoSlippage, setIsAutoSlippage] = useState(true);
    const [customSlippage, setCustomSlippage] = useState('');
    const [showSlippageInfo, setShowSlippageInfo] = useState(false);
    const [showDeadlineInfo, setShowDeadlineInfo] = useState(false);
    const [showTradeOptions, setShowTradeOptions] = useState(false);
    const [useUniswapDefault, setUseUniswapDefault] = useState(true);
    const [showDefaultInfo, setShowDefaultInfo] = useState(false);

    const handleDefaultToggle = () => {
        const newDefault = !useUniswapDefault;
        setUseUniswapDefault(newDefault);
        if (newDefault) {
            // Reset to use all pools when default is enabled
            onPoolSettingsChange(true, true, true);
        }
    };


    const handleSlippageChange = (value: string) => {
        setCustomSlippage(value);
        const parsed = parseFloat(value);
        if (!isNaN(parsed) && parsed > 0 && parsed <= 50) {
            onSlippageChange(parsed);
            setIsAutoSlippage(false);
        }
    };

    const handleAutoSlippage = () => {
        setIsAutoSlippage(true);
        setCustomSlippage('');
        onSlippageChange(0.5);
    };

    const deadlineOptions = [10, 20, 30, 60];

    return (
        <div className="relative">
            {/* Settings Button - Responsive size */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="p-1.5 sm:p-2 rounded-lg sm:rounded-xl hover:bg-white/5 transition-colors group"
                aria-label="Settings"
            >
                <svg
                    className={`w-4 h-4 sm:w-5 sm:h-5 transition-colors ${isOpen ? 'text-pink-400' : 'text-zinc-400 group-hover:text-zinc-200'}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={1.5}
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z"
                    />
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
                    />
                </svg>
            </button>

            {/* Settings Panel */}
            <AnimatePresence>
                {isOpen && (
                    <>
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 z-40"
                            onClick={() => setIsOpen(false)}
                        />

                        {/* Panel - Responsive positioning and sizing */}
                        <motion.div
                            initial={{ opacity: 0, y: -10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -10, scale: 0.95 }}
                            transition={{ duration: 0.15 }}
                            className="fixed sm:absolute left-2 right-2 sm:left-auto sm:right-0 top-auto sm:top-10 bottom-20 sm:bottom-auto z-50 w-auto sm:w-64 md:w-72 bg-zinc-900 border border-white/10 rounded-xl sm:rounded-2xl shadow-2xl p-3 sm:p-4"
                        >
                            {/* Trade Options View */}
                            {showTradeOptions ? (
                                <>
                                    {/* Header */}
                                    <div className="flex items-center gap-2 mb-4">
                                        <button
                                            onClick={() => setShowTradeOptions(false)}
                                            className="p-1 hover:bg-white/10 rounded-lg transition-colors"
                                        >
                                            <svg className="w-4 h-4 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                            </svg>
                                        </button>
                                        <span className="text-sm font-semibold text-zinc-100">Trade options</span>
                                    </div>

                                    {/* Default Option */}
                                    <div className="mb-3">
                                        <div className="flex items-center justify-between mb-2">
                                            <div className="flex items-center gap-1 relative">
                                                <span className="text-xs sm:text-sm font-medium text-zinc-200">Default</span>
                                                <button
                                                    className="text-zinc-500 hover:text-zinc-400"
                                                    onClick={() => setShowDefaultInfo(!showDefaultInfo)}
                                                    onMouseEnter={() => setShowDefaultInfo(true)}
                                                    onMouseLeave={() => setShowDefaultInfo(false)}
                                                >
                                                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                                    </svg>
                                                </button>
                                                <AnimatePresence>
                                                    {showDefaultInfo && (
                                                        <motion.div
                                                            initial={{ opacity: 0, y: 5 }}
                                                            animate={{ opacity: 1, y: 0 }}
                                                            exit={{ opacity: 0, y: 5 }}
                                                            className="absolute left-0 top-5 z-50 w-48 sm:w-56 p-2 sm:p-3 bg-zinc-800 border border-white/10 rounded-lg shadow-xl text-[10px] sm:text-xs text-zinc-300 leading-relaxed"
                                                        >
                                                            A route is identified considering V2, V3, and V4 pools, factoring in estimated price impact and network costs.
                                                        </motion.div>
                                                    )}
                                                </AnimatePresence>
                                            </div>
                                            <button
                                                onClick={handleDefaultToggle}
                                                className={`relative w-10 h-6 rounded-full transition-colors ${useUniswapDefault ? 'bg-pink-500' : 'bg-zinc-700'}`}
                                            >
                                                <span className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${useUniswapDefault ? 'left-5' : 'left-1'}`} />
                                            </button>
                                        </div>
                                        <p className="text-[10px] sm:text-xs text-zinc-400 leading-relaxed">
                                            Selecting this option identifies the most efficient route for your swap.
                                        </p>
                                    </div>

                                    {/* V2/V3/V4 Pool Options */}
                                    <AnimatePresence>
                                        {!useUniswapDefault && (
                                            <motion.div
                                                initial={{ opacity: 0, height: 0 }}
                                                animate={{ opacity: 1, height: 'auto' }}
                                                exit={{ opacity: 0, height: 0 }}
                                                transition={{ duration: 0.2 }}
                                                className="mb-3 space-y-2"
                                            >
                                                {/* V2 Toggle */}
                                                <div className="flex items-center justify-between py-1.5">
                                                    <span className="text-xs sm:text-sm font-medium text-zinc-300">Enable V2 pools</span>
                                                    <button
                                                        onClick={() => onPoolSettingsChange(!useV2, useV3, useV4)}
                                                        disabled={!useV3 && !useV4 && useV2}
                                                        className={`relative w-10 h-6 rounded-full transition-colors ${useV2 ? 'bg-pink-500' : 'bg-zinc-700'} ${!useV3 && !useV4 && useV2 ? 'opacity-50 cursor-not-allowed' : ''}`}
                                                    >
                                                        <span className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${useV2 ? 'left-5' : 'left-1'}`} />
                                                    </button>
                                                </div>
                                                {/* V3 Toggle */}
                                                <div className="flex items-center justify-between py-1.5">
                                                    <span className="text-xs sm:text-sm font-medium text-zinc-300">Enable V3 pools</span>
                                                    <button
                                                        onClick={() => onPoolSettingsChange(useV2, !useV3, useV4)}
                                                        disabled={!useV2 && !useV4 && useV3}
                                                        className={`relative w-10 h-6 rounded-full transition-colors ${useV3 ? 'bg-pink-500' : 'bg-zinc-700'} ${!useV2 && !useV4 && useV3 ? 'opacity-50 cursor-not-allowed' : ''}`}
                                                    >
                                                        <span className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${useV3 ? 'left-5' : 'left-1'}`} />
                                                    </button>
                                                </div>
                                                {/* V4 Toggle */}
                                                <div className="flex items-center justify-between py-1.5">
                                                    <span className="text-xs sm:text-sm font-medium text-zinc-300">Enable V4 pools</span>
                                                    <button
                                                        onClick={() => onPoolSettingsChange(useV2, useV3, !useV4)}
                                                        disabled={!useV2 && !useV3 && useV4}
                                                        className={`relative w-10 h-6 rounded-full transition-colors ${useV4 ? 'bg-pink-500' : 'bg-zinc-700'} ${!useV2 && !useV3 && useV4 ? 'opacity-50 cursor-not-allowed' : ''}`}
                                                    >
                                                        <span className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${useV4 ? 'left-5' : 'left-1'}`} />
                                                    </button>
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>

                                    {/* Powered by Section */}
                                    <div className="pt-3 border-t border-white/5">
                                        <div className="flex items-center gap-2">
                                            <span className="text-[10px] sm:text-xs text-zinc-500">Powered by</span>
                                            <div className="flex items-center gap-1.5">
                                                <svg className="w-4 h-4" viewBox="0 0 41 41" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                    <path d="M17.2884 17.0901C17.2286 17.3208 17.1243 17.5374 16.9813 17.7277C16.7151 18.0747 16.3628 18.3453 15.9597 18.5125C15.5972 18.6694 15.2132 18.7709 14.8207 18.8134C14.7417 18.8234 14.6599 18.8297 14.5804 18.8358L14.5621 18.8372C14.3135 18.8467 14.0745 18.9359 13.88 19.0917C13.6855 19.2476 13.5458 19.4619 13.4813 19.7032C13.4518 19.8233 13.4298 19.9451 13.4156 20.068C13.3931 20.2525 13.3815 20.4413 13.3689 20.6455L13.3688 20.6482C13.3598 20.7954 13.3502 20.9507 13.3358 21.118C13.2514 21.7996 13.0551 22.4624 12.755 23.0795C12.6937 23.2092 12.6312 23.335 12.5697 23.4585C12.2408 24.1203 11.9434 24.7186 12.0287 25.5194C12.0955 26.1365 12.4102 26.55 12.8283 26.9765C13.0267 27.1802 13.2896 27.3544 13.5626 27.5352L13.5635 27.5358C14.3285 28.0422 15.1719 28.6006 14.894 30.0074C14.6666 31.1473 12.7852 32.3435 10.1408 32.7613C10.3971 32.7222 9.83296 31.755 9.76966 31.6465L9.76576 31.6398C9.69456 31.5277 9.62156 31.4173 9.54876 31.3071L9.54066 31.2948C9.32646 30.9705 9.11326 30.6477 8.94686 30.29C8.50506 29.3515 8.30026 28.2657 8.48126 27.2373C8.64516 26.3068 9.25746 25.5635 9.84706 24.8478C9.94326 24.7311 10.0393 24.6146 10.1322 24.4987C10.921 23.5147 11.7486 22.2254 11.9317 20.9481C11.9472 20.8371 11.961 20.7161 11.9755 20.5888L11.976 20.5844C12.0018 20.3577 12.03 20.1112 12.074 19.8656C12.1397 19.4387 12.2729 19.025 12.4684 18.6402C12.6018 18.3879 12.7775 18.1605 12.9878 17.968C13.0974 17.8658 13.1697 17.7296 13.1932 17.5812C13.2166 17.4329 13.1898 17.2809 13.1171 17.1496L8.90156 9.53322L14.9565 17.0392C15.0255 17.1262 15.1126 17.1969 15.2118 17.2462C15.311 17.2955 15.4198 17.3223 15.5304 17.3247C15.6411 17.3271 15.7509 17.305 15.8521 17.2599C15.9533 17.2149 16.0434 17.148 16.116 17.0641C16.1927 16.9743 16.2362 16.8606 16.2391 16.7422C16.2421 16.6239 16.2043 16.5082 16.1321 16.4146C15.855 16.0589 15.5668 15.6984 15.2797 15.3394L15.266 15.3222C15.148 15.1747 15.0301 15.0272 14.9134 14.8807L13.3897 12.9864L10.3315 9.20412L6.93576 5.16588L10.7238 8.86532L13.9791 12.4808L15.6031 14.2929C15.7511 14.4603 15.899 14.6262 16.0469 14.7921L16.0506 14.7962C16.4402 15.2329 16.8298 15.6698 17.2194 16.1332L17.3078 16.2414L17.3272 16.4092C17.3534 16.6367 17.3403 16.8671 17.2884 17.0901Z" fill="#FF37C7" />
                                                    <path d="M26.9818 16.7721C26.7603 17.0018 26.6213 17.2939 26.5773 17.6018C26.3601 17.5581 26.1436 17.5063 25.9284 17.4447C25.7129 17.383 25.4974 17.3158 25.2894 17.2347C25.1816 17.1957 25.0814 17.1535 24.9748 17.108C24.8681 17.0625 24.7592 17.0106 24.6515 16.9554C24.2461 16.7323 23.8706 16.4584 23.534 16.1403C22.9226 15.5689 22.4319 14.9269 21.9498 14.2962L21.826 14.1344C21.3333 13.4498 20.8046 12.7922 20.242 12.1643C19.687 11.5492 19.0309 11.0344 18.3024 10.6423C17.5481 10.2606 16.7287 10.0256 15.8875 9.94952C16.7602 9.85432 17.643 9.96252 18.4673 10.2656C19.299 10.59 20.0594 11.075 20.7054 11.6934C21.1272 12.0907 21.523 12.5148 21.8906 12.9631C23.8137 12.5828 25.4815 12.707 26.895 13.1381C26.6531 13.4878 26.5606 13.9375 26.6793 14.3804C26.7168 14.5202 26.7728 14.6501 26.844 14.7681C26.7227 14.9227 26.63 15.1039 26.5759 15.3057C26.43 15.8505 26.6036 16.4056 26.9818 16.7721Z" fill="#FF37C7" />
                                                    <path d="M33.9255 27.3398C34.7143 26.3096 35.174 23.9847 34.1192 22.0407C33.8755 22.2119 33.5784 22.3125 33.2579 22.3125C32.5739 22.3125 31.9968 21.8547 31.8164 21.2287C31.31 21.3728 30.7426 21.2456 30.3438 20.8469C30.2104 20.7135 30.1073 20.5612 30.0346 20.3986C29.8574 20.417 29.6738 20.404 29.4914 20.3551C28.9461 20.209 28.5518 19.7805 28.4239 19.2691C27.8455 19.4129 27.2228 19.1989 26.8587 18.7082C25.7254 18.5075 24.7209 18.2058 24.0193 17.4534C23.5876 20.771 26.4874 21.9531 29.2596 23.0831C31.69 24.0738 34.0227 25.0247 33.9255 27.3398Z" fill="#FF37C7" />
                                                    <path d="M18.0908 21.4226C18.8225 21.3522 20.3818 20.9701 19.6846 19.7371C19.5346 19.4863 19.3172 19.2831 19.0574 19.1507C18.7976 19.0184 18.5059 18.9624 18.2158 18.9891C17.9215 19.0209 17.6439 19.1428 17.4209 19.3384C17.1979 19.534 17.0401 19.7937 16.9691 20.0824C16.7525 20.8889 16.982 21.5308 18.0908 21.4226Z" fill="#FF37C7" />
                                                </svg>
                                                <span className="text-xs font-semibold" style={{ color: '#FF37C7' }}>Uniswap</span>
                                            </div>
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <>
                                    {/* Main Settings View */}
                                    <div className="mb-3 sm:mb-4">
                                        <div className="flex items-center gap-1 mb-1.5 sm:mb-2 relative">
                                            <span className="text-xs sm:text-sm font-medium text-zinc-300">Max slippage</span>
                                            <button
                                                className="text-zinc-500 hover:text-zinc-400"
                                                onClick={() => setShowSlippageInfo(!showSlippageInfo)}
                                                onMouseEnter={() => setShowSlippageInfo(true)}
                                                onMouseLeave={() => setShowSlippageInfo(false)}
                                            >
                                                <svg className="w-3 h-3 sm:w-3.5 sm:h-3.5" fill="currentColor" viewBox="0 0 20 20">
                                                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                                </svg>
                                            </button>
                                            {/* Slippage Tooltip */}
                                            <AnimatePresence>
                                                {showSlippageInfo && (
                                                    <motion.div
                                                        initial={{ opacity: 0, y: 5 }}
                                                        animate={{ opacity: 1, y: 0 }}
                                                        exit={{ opacity: 0, y: 5 }}
                                                        className="absolute left-0 top-6 z-50 w-56 sm:w-64 p-2 sm:p-3 bg-zinc-800 border border-white/10 rounded-lg shadow-xl text-[10px] sm:text-xs text-zinc-300 leading-relaxed"
                                                    >
                                                        <strong className="text-zinc-100">Slippage tolerance</strong>
                                                        <p className="mt-1">Maximum price change you're willing to accept. If the price changes by more than this %, your swap will revert to protect you from unfavorable rates.</p>
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </div>
                                        <div className="flex items-center gap-1.5 sm:gap-2">
                                            <button
                                                onClick={handleAutoSlippage}
                                                className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg sm:rounded-xl text-xs sm:text-sm font-semibold transition-all ${isAutoSlippage
                                                    ? 'bg-pink-500/20 text-pink-400 border border-pink-500/30'
                                                    : 'bg-zinc-800 text-zinc-400 border border-transparent hover:bg-zinc-700'
                                                    }`}
                                            >
                                                Auto
                                            </button>
                                            <div className="relative flex-1">
                                                <input
                                                    type="text"
                                                    inputMode="decimal"
                                                    value={isAutoSlippage ? '' : customSlippage}
                                                    onChange={(e) => handleSlippageChange(e.target.value)}
                                                    placeholder={isAutoSlippage ? slippage.toFixed(2) : '0.50'}
                                                    className="w-full px-2 sm:px-3 py-1.5 sm:py-2 bg-zinc-800 border border-transparent rounded-lg sm:rounded-xl text-right text-xs sm:text-sm font-semibold text-zinc-200 placeholder-zinc-500 focus:border-pink-500/50 focus:outline-none transition-colors pr-6 sm:pr-7"
                                                />
                                                <span className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 text-xs sm:text-sm text-zinc-400">%</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Swap Deadline */}
                                    <div className="mb-3 sm:mb-4">
                                        <div className="flex items-center gap-1 mb-1.5 sm:mb-2 relative">
                                            <span className="text-xs sm:text-sm font-medium text-zinc-300">Swap deadline</span>
                                            <button
                                                className="text-zinc-500 hover:text-zinc-400"
                                                onClick={() => setShowDeadlineInfo(!showDeadlineInfo)}
                                                onMouseEnter={() => setShowDeadlineInfo(true)}
                                                onMouseLeave={() => setShowDeadlineInfo(false)}
                                            >
                                                <svg className="w-3 h-3 sm:w-3.5 sm:h-3.5" fill="currentColor" viewBox="0 0 20 20">
                                                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                                </svg>
                                            </button>
                                            {/* Deadline Tooltip */}
                                            <AnimatePresence>
                                                {showDeadlineInfo && (
                                                    <motion.div
                                                        initial={{ opacity: 0, y: 5 }}
                                                        animate={{ opacity: 1, y: 0 }}
                                                        exit={{ opacity: 0, y: 5 }}
                                                        className="absolute left-0 top-6 z-50 w-56 sm:w-64 p-2 sm:p-3 bg-zinc-800 border border-white/10 rounded-lg shadow-xl text-[10px] sm:text-xs text-zinc-300 leading-relaxed"
                                                    >
                                                        <strong className="text-zinc-100">Transaction deadline</strong>
                                                        <p className="mt-1">Your swap will expire and revert if it is pending for longer than this time. This protects you from market movements during network delays.</p>
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </div>
                                        <div className="flex items-center gap-1 sm:gap-2">
                                            {deadlineOptions.map((mins) => (
                                                <button
                                                    key={mins}
                                                    onClick={() => onDeadlineChange(mins)}
                                                    className={`flex-1 px-1.5 sm:px-2 py-1.5 sm:py-2 rounded-lg sm:rounded-xl text-[10px] sm:text-xs font-semibold transition-all ${deadline === mins
                                                        ? 'bg-pink-500/20 text-pink-400 border border-pink-500/30'
                                                        : 'bg-zinc-800 text-zinc-400 border border-transparent hover:bg-zinc-700'
                                                        }`}
                                                >
                                                    {mins}m
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Trade Options */}
                                    <div>
                                        <button
                                            onClick={() => setShowTradeOptions(true)}
                                            className="w-full flex items-center justify-between py-1.5 sm:py-2 text-xs sm:text-sm hover:bg-white/5 rounded-lg transition-colors"
                                        >
                                            <span className="font-medium text-zinc-300">Trade options</span>
                                            <div className="flex items-center gap-0.5 sm:gap-1 text-zinc-400">
                                                <span className="text-xs sm:text-sm">Default</span>
                                                <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                                </svg>
                                            </div>
                                        </button>
                                    </div>
                                </>
                            )}
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}
