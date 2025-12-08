'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AnimatedButton, ModalBackdrop, ModalContent, FadeIn, Pressable } from '../ui/Motion';
import { useToast } from '@/lib/ToastContext';

interface HelpModalProps {
    isOpen: boolean;
    onClose: () => void;
}

type Topic = 'general' | 'transactions' | 'account' | 'security' | 'other';
type View = 'topics' | 'form' | 'success';

const topics: { id: Topic; label: string; icon: string; desc: string }[] = [
    { id: 'general', label: 'General Questions', icon: '❓', desc: 'How to use OrbId Wallet' },
    { id: 'transactions', label: 'Transactions', icon: '💸', desc: 'Send, receive, or pending txs' },
    { id: 'account', label: 'Account Issues', icon: '👤', desc: 'Login, verification, or access' },
    { id: 'security', label: 'Security', icon: '🔐', desc: 'Safety and privacy concerns' },
    { id: 'other', label: 'Other', icon: '📝', desc: 'Anything else' },
];

const faqs = [
    { q: 'How do I receive crypto?', a: 'Tap "Receive" and share your wallet address or QR code.' },
    { q: 'Are transactions free?', a: 'Yes! Transactions on World Chain are free for verified humans.' },
    { q: 'How do I verify with World ID?', a: 'Tap the verification card on the wallet tab to start.' },
];

export default function HelpModal({ isOpen, onClose }: HelpModalProps) {
    const { showToast } = useToast();
    const [view, setView] = useState<View>('topics');
    const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null);
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSelectTopic = (topic: Topic) => {
        setSelectedTopic(topic);
        setView('form');
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1500));

        setView('success');
        setIsSubmitting(false);
        showToast({
            type: 'success',
            title: 'Message Sent!',
            message: 'We\'ll get back to you within 24 hours.'
        });
    };

    const handleClose = () => {
        setView('topics');
        setSelectedTopic(null);
        setEmail('');
        setMessage('');
        onClose();
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <ModalBackdrop onClose={handleClose}>
                    <ModalContent className="max-h-[90vh] overflow-y-auto">
                        {/* Header */}
                        <div className="sticky top-0 glass-strong px-5 py-4 flex items-center justify-between border-b border-white/5 z-10">
                            <div className="flex items-center gap-2">
                                {view !== 'topics' && (
                                    <motion.button
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        whileHover={{ scale: 1.1 }}
                                        whileTap={{ scale: 0.9 }}
                                        onClick={() => setView('topics')}
                                        className="p-1 rounded-full hover:bg-white/10 transition-colors"
                                    >
                                        <svg className="w-5 h-5 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                        </svg>
                                    </motion.button>
                                )}
                                <h2 className="text-lg font-bold text-white">Help & Support</h2>
                            </div>
                            <motion.button
                                whileHover={{ scale: 1.1, rotate: 90 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={handleClose}
                                className="p-2 -mr-2 rounded-full hover:bg-white/10 transition-colors"
                            >
                                <svg className="w-5 h-5 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </motion.button>
                        </div>

                        <div className="p-5">
                            <AnimatePresence mode="wait">
                                {/* Topics View */}
                                {view === 'topics' && (
                                    <motion.div
                                        key="topics"
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: 20 }}
                                        className="space-y-4"
                                    >
                                        {/* FAQs */}
                                        <FadeIn>
                                            <div>
                                                <h3 className="text-white font-semibold mb-3">Frequently Asked</h3>
                                                <div className="space-y-2">
                                                    {faqs.map((faq, index) => (
                                                        <motion.div
                                                            key={faq.q}
                                                            initial={{ opacity: 0, y: 10 }}
                                                            animate={{ opacity: 1, y: 0 }}
                                                            transition={{ delay: index * 0.05 }}
                                                            className="glass rounded-xl p-3"
                                                        >
                                                            <p className="text-white text-sm font-medium mb-1">{faq.q}</p>
                                                            <p className="text-zinc-500 text-xs">{faq.a}</p>
                                                        </motion.div>
                                                    ))}
                                                </div>
                                            </div>
                                        </FadeIn>

                                        {/* Contact Topics */}
                                        <FadeIn delay={0.15}>
                                            <div>
                                                <h3 className="text-white font-semibold mb-3">Contact Us</h3>
                                                <p className="text-zinc-500 text-sm mb-3">Select a topic to get help:</p>
                                                <div className="space-y-2">
                                                    {topics.map((topic, index) => (
                                                        <motion.div
                                                            key={topic.id}
                                                            initial={{ opacity: 0, x: -10 }}
                                                            animate={{ opacity: 1, x: 0 }}
                                                            transition={{ delay: 0.2 + index * 0.05 }}
                                                        >
                                                            <Pressable
                                                                onClick={() => handleSelectTopic(topic.id)}
                                                                className="w-full flex items-center gap-3 p-3 glass rounded-xl"
                                                            >
                                                                <span className="text-2xl">{topic.icon}</span>
                                                                <div className="flex-1">
                                                                    <p className="text-white font-medium text-sm">{topic.label}</p>
                                                                    <p className="text-zinc-500 text-xs">{topic.desc}</p>
                                                                </div>
                                                                <svg className="w-4 h-4 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                                                </svg>
                                                            </Pressable>
                                                        </motion.div>
                                                    ))}
                                                </div>
                                            </div>
                                        </FadeIn>

                                        {/* Back Button */}
                                        <FadeIn delay={0.3}>
                                            <AnimatedButton variant="glass" fullWidth onClick={handleClose}>
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                                </svg>
                                                Back to Settings
                                            </AnimatedButton>
                                        </FadeIn>
                                    </motion.div>
                                )}

                                {/* Form View */}
                                {view === 'form' && (
                                    <motion.form
                                        key="form"
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: 20 }}
                                        onSubmit={handleSubmit}
                                        className="space-y-4"
                                    >
                                        <FadeIn>
                                            <div className="glass rounded-xl p-3 flex items-center gap-3">
                                                <span className="text-2xl">{topics.find(t => t.id === selectedTopic)?.icon}</span>
                                                <div>
                                                    <p className="text-white font-medium text-sm">{topics.find(t => t.id === selectedTopic)?.label}</p>
                                                    <p className="text-zinc-500 text-xs">Support Request</p>
                                                </div>
                                            </div>
                                        </FadeIn>

                                        <FadeIn delay={0.05}>
                                            <div>
                                                <label className="text-xs text-zinc-500 mb-1.5 block">Your Email</label>
                                                <input
                                                    type="email"
                                                    value={email}
                                                    onChange={(e) => setEmail(e.target.value)}
                                                    placeholder="your@email.com"
                                                    required
                                                    className="w-full px-4 py-3 rounded-xl bg-black/30 border border-white/10 text-white placeholder-zinc-500 focus:outline-none focus:border-pink-500/50 transition-colors"
                                                />
                                            </div>
                                        </FadeIn>

                                        <FadeIn delay={0.1}>
                                            <div>
                                                <label className="text-xs text-zinc-500 mb-1.5 block">How can we help?</label>
                                                <textarea
                                                    value={message}
                                                    onChange={(e) => setMessage(e.target.value)}
                                                    placeholder="Describe your issue or question..."
                                                    required
                                                    rows={4}
                                                    className="w-full px-4 py-3 rounded-xl bg-black/30 border border-white/10 text-white placeholder-zinc-500 focus:outline-none focus:border-pink-500/50 resize-none transition-colors"
                                                />
                                            </div>
                                        </FadeIn>

                                        <FadeIn delay={0.15}>
                                            <AnimatedButton
                                                type="submit"
                                                variant="gradient"
                                                fullWidth
                                                disabled={isSubmitting || !email || !message}
                                                className="disabled:opacity-50"
                                            >
                                                {isSubmitting ? (
                                                    <>
                                                        <motion.div
                                                            animate={{ rotate: 360 }}
                                                            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                                                            className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                                                        />
                                                        Sending...
                                                    </>
                                                ) : (
                                                    'Send Message'
                                                )}
                                            </AnimatedButton>
                                        </FadeIn>
                                    </motion.form>
                                )}

                                {/* Success View */}
                                {view === 'success' && (
                                    <motion.div
                                        key="success"
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0 }}
                                        className="text-center py-8"
                                    >
                                        <motion.div
                                            initial={{ scale: 0 }}
                                            animate={{ scale: 1 }}
                                            transition={{ type: 'spring', stiffness: 200, delay: 0.1 }}
                                            className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-r from-emerald-500 to-green-600 flex items-center justify-center"
                                        >
                                            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                            </svg>
                                        </motion.div>
                                        <h3 className="text-xl font-bold text-white mb-2">Message Sent!</h3>
                                        <p className="text-zinc-500 mb-6">We'll get back to you within 24 hours.</p>
                                        <AnimatedButton variant="glass" fullWidth onClick={handleClose}>
                                            Done
                                        </AnimatedButton>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </ModalContent>
                </ModalBackdrop>
            )}
        </AnimatePresence>
    );
}
