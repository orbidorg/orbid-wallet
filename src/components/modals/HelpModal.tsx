'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AnimatedButton, ModalBackdrop, ModalContent, FadeIn, Pressable } from '../ui/Motion';
import { useToast } from '@/lib/ToastContext';
import { useI18n } from '@/lib/i18n';

interface HelpModalProps {
    isOpen: boolean;
    onClose: () => void;
}

type Topic = 'general' | 'transactions' | 'account' | 'security' | 'other';
type View = 'topics' | 'form' | 'success';

export default function HelpModal({ isOpen, onClose }: HelpModalProps) {
    const { showToast } = useToast();
    const { t } = useI18n();
    const [view, setView] = useState<View>('topics');
    const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null);
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const topics: { id: Topic; labelKey: keyof typeof t.help; icon: string; descKey: keyof typeof t.help }[] = [
        { id: 'general', labelKey: 'topicGeneral', icon: '❓', descKey: 'topicGeneralDesc' },
        { id: 'transactions', labelKey: 'topicTransactions', icon: '💸', descKey: 'topicTransactionsDesc' },
        { id: 'account', labelKey: 'topicAccount', icon: '👤', descKey: 'topicAccountDesc' },
        { id: 'security', labelKey: 'topicSecurity', icon: '🔐', descKey: 'topicSecurityDesc' },
        { id: 'other', labelKey: 'topicOther', icon: '📝', descKey: 'topicOtherDesc' },
    ];

    const faqs = [
        { qKey: 'faq1Q' as const, aKey: 'faq1A' as const },
        { qKey: 'faq2Q' as const, aKey: 'faq2A' as const },
        { qKey: 'faq3Q' as const, aKey: 'faq3A' as const },
    ];

    const handleSelectTopic = (topic: Topic) => {
        setSelectedTopic(topic);
        setView('form');
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            const response = await fetch('/api/support', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email,
                    topic: selectedTopic,
                    message,
                })
            });

            if (response.ok) {
                const data = await response.json();
                setView('success');
                showToast({
                    type: 'success',
                    title: t.help.messageSent,
                    message: `Ticket #${data.ticketId} - ${t.help.responseTime}`
                });
            } else {
                showToast({
                    type: 'error',
                    title: 'Error',
                    message: 'Failed to submit ticket'
                });
            }
        } catch (error) {
            console.error('Failed to submit ticket:', error);
            showToast({
                type: 'error',
                title: 'Error',
                message: 'Connection error'
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleClose = () => {
        setView('topics');
        setSelectedTopic(null);
        setEmail('');
        setMessage('');
        onClose();
    };

    const getSelectedTopicLabel = () => {
        const topic = topics.find(t => t.id === selectedTopic);
        return topic ? t.help[topic.labelKey] : '';
    };

    const getSelectedTopicIcon = () => {
        const topic = topics.find(t => t.id === selectedTopic);
        return topic?.icon || '';
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
                                <h2 className="text-lg font-bold text-white">{t.help.title}</h2>
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
                                                <h3 className="text-white font-semibold mb-3">{t.help.faqTitle}</h3>
                                                <div className="space-y-2">
                                                    {faqs.map((faq, index) => (
                                                        <motion.div
                                                            key={faq.qKey}
                                                            initial={{ opacity: 0, y: 10 }}
                                                            animate={{ opacity: 1, y: 0 }}
                                                            transition={{ delay: index * 0.05 }}
                                                            className="glass rounded-xl p-3"
                                                        >
                                                            <p className="text-white text-sm font-medium mb-1">{t.help[faq.qKey]}</p>
                                                            <p className="text-zinc-500 text-xs">{t.help[faq.aKey]}</p>
                                                        </motion.div>
                                                    ))}
                                                </div>
                                            </div>
                                        </FadeIn>

                                        {/* Contact Topics */}
                                        <FadeIn delay={0.15}>
                                            <div>
                                                <h3 className="text-white font-semibold mb-3">{t.help.contactTitle}</h3>
                                                <p className="text-zinc-500 text-sm mb-3">{t.help.selectTopic}</p>
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
                                                                    <p className="text-white font-medium text-sm">{t.help[topic.labelKey]}</p>
                                                                    <p className="text-zinc-500 text-xs">{t.help[topic.descKey]}</p>
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
                                                {t.common.backToSettings}
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
                                                <span className="text-2xl">{getSelectedTopicIcon()}</span>
                                                <div>
                                                    <p className="text-white font-medium text-sm">{getSelectedTopicLabel()}</p>
                                                    <p className="text-zinc-500 text-xs">{t.help.supportRequest}</p>
                                                </div>
                                            </div>
                                        </FadeIn>

                                        <FadeIn delay={0.05}>
                                            <div>
                                                <label className="text-xs text-zinc-500 mb-1.5 block">{t.help.yourEmail}</label>
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
                                                <label className="text-xs text-zinc-500 mb-1.5 block">{t.help.howCanWeHelp}</label>
                                                <textarea
                                                    value={message}
                                                    onChange={(e) => setMessage(e.target.value)}
                                                    placeholder={t.help.describePlaceholder}
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
                                                        {t.modals.sending}
                                                    </>
                                                ) : (
                                                    t.help.sendMessage
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
                                        <h3 className="text-xl font-bold text-white mb-2">{t.help.messageSent}</h3>
                                        <p className="text-zinc-500 mb-6">{t.help.responseTime}</p>
                                        <AnimatedButton variant="glass" fullWidth onClick={handleClose}>
                                            {t.common.done}
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
