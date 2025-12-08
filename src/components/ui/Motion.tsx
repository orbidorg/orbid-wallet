'use client';

import { motion, HTMLMotionProps } from 'framer-motion';
import { ReactNode } from 'react';

// Animated gradient button with hover and tap effects
interface AnimatedButtonProps extends Omit<HTMLMotionProps<'button'>, 'children'> {
    children: ReactNode;
    variant?: 'gradient' | 'glass' | 'ghost';
    size?: 'sm' | 'md' | 'lg';
    fullWidth?: boolean;
}

export function AnimatedButton({
    children,
    variant = 'gradient',
    size = 'md',
    fullWidth = false,
    className = '',
    ...props
}: AnimatedButtonProps) {
    const baseStyles = 'font-semibold rounded-xl transition-colors flex items-center justify-center gap-2';

    const sizeStyles = {
        sm: 'py-2 px-4 text-sm',
        md: 'py-3 px-6 text-base',
        lg: 'py-4 px-8 text-lg',
    };

    const variantStyles = {
        gradient: 'btn-gradient text-white',
        glass: 'glass text-white hover:bg-white/10',
        ghost: 'bg-transparent text-zinc-400 hover:text-white hover:bg-white/5',
    };

    return (
        <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 400, damping: 17 }}
            className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${fullWidth ? 'w-full' : ''} ${className}`}
            {...props}
        >
            {children}
        </motion.button>
    );
}

// Modal/card fade-in animation wrapper
interface FadeInProps {
    children: ReactNode;
    delay?: number;
    direction?: 'up' | 'down' | 'left' | 'right' | 'none';
    className?: string;
}

export function FadeIn({ children, delay = 0, direction = 'up', className = '' }: FadeInProps) {
    const directions = {
        up: { y: 20, x: 0 },
        down: { y: -20, x: 0 },
        left: { x: 20, y: 0 },
        right: { x: -20, y: 0 },
        none: { x: 0, y: 0 },
    };

    return (
        <motion.div
            initial={{ opacity: 0, ...directions[direction] }}
            animate={{ opacity: 1, x: 0, y: 0 }}
            transition={{ duration: 0.3, delay, ease: 'easeOut' }}
            className={className}
        >
            {children}
        </motion.div>
    );
}

// Staggered container for list items
interface StaggerContainerProps {
    children: ReactNode;
    className?: string;
    staggerDelay?: number;
}

export function StaggerContainer({ children, className = '', staggerDelay = 0.05 }: StaggerContainerProps) {
    return (
        <motion.div
            initial="hidden"
            animate="visible"
            variants={{
                hidden: {},
                visible: {
                    transition: {
                        staggerChildren: staggerDelay,
                    },
                },
            }}
            className={className}
        >
            {children}
        </motion.div>
    );
}

export function StaggerItem({ children, className = '' }: { children: ReactNode; className?: string }) {
    return (
        <motion.div
            variants={{
                hidden: { opacity: 0, y: 10 },
                visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
            }}
            className={className}
        >
            {children}
        </motion.div>
    );
}

// Pressable item for lists (tokens, transactions, etc.)
interface PressableProps extends Omit<HTMLMotionProps<'button'>, 'children'> {
    children: ReactNode;
}

export function Pressable({ children, className = '', ...props }: PressableProps) {
    return (
        <motion.button
            whileHover={{ backgroundColor: 'rgba(255, 255, 255, 0.02)' }}
            whileTap={{ scale: 0.99 }}
            transition={{ type: 'spring', stiffness: 400, damping: 17 }}
            className={className}
            {...props}
        >
            {children}
        </motion.button>
    );
}

// Icon button with scale animation
interface IconButtonProps extends Omit<HTMLMotionProps<'button'>, 'children'> {
    children: ReactNode;
    variant?: 'default' | 'pink' | 'emerald' | 'blue';
}

export function IconButton({ children, variant = 'default', className = '', ...props }: IconButtonProps) {
    const variantStyles = {
        default: 'bg-white/5 hover:bg-white/10',
        pink: 'bg-pink-500/10 hover:bg-pink-500/20',
        emerald: 'bg-emerald-500/10 hover:bg-emerald-500/20',
        blue: 'bg-blue-500/10 hover:bg-blue-500/20',
    };

    return (
        <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 400, damping: 17 }}
            className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${variantStyles[variant]} ${className}`}
            {...props}
        >
            {children}
        </motion.button>
    );
}

// Modal backdrop with fade
export function ModalBackdrop({ children, onClose }: { children: ReactNode; onClose?: () => void }) {
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={(e) => {
                if (e.target === e.currentTarget && onClose) onClose();
            }}
            className="fixed inset-0 z-50 flex items-end justify-center bg-black/80 backdrop-blur-sm"
        >
            {children}
        </motion.div>
    );
}

// Modal content with slide-up animation
export function ModalContent({ children, className = '' }: { children: ReactNode; className?: string }) {
    return (
        <motion.div
            initial={{ y: '100%', opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className={`glass rounded-t-3xl w-full max-w-md safe-bottom ${className}`}
        >
            {children}
        </motion.div>
    );
}

// Animated number for balances/prices
export function AnimatedNumber({ value, prefix = '', suffix = '' }: { value: number; prefix?: string; suffix?: string }) {
    return (
        <motion.span
            key={value}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
        >
            {prefix}{value.toLocaleString()}{suffix}
        </motion.span>
    );
}

// Pulse animation for loading/active states
export function Pulse({ children, className = '' }: { children: ReactNode; className?: string }) {
    return (
        <motion.div
            animate={{ opacity: [1, 0.7, 1] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
            className={className}
        >
            {children}
        </motion.div>
    );
}
