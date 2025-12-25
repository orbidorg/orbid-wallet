'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AnimatedButton, ModalBackdrop, ModalContent, FadeIn, Pressable } from '../ui/Motion';
import { useToast } from '@/lib/ToastContext';
import { useI18n } from '@/lib/i18n';
import { useAuth } from '@/lib/AuthContext';

interface HelpModalProps {
    isOpen: boolean;
    onClose: () => void;
}

type Topic = 'general' | 'transactions' | 'account' | 'security' | 'other';
type View = 'topics' | 'form' | 'success' | 'status-check' | 'status-result';

interface TicketStatus {
    status: 'new' | 'in-progress' | 'resolved' | 'closed';
    updatedAt: string;
    lastReply: string | null;
}

export default function HelpModal({ isOpen, onClose }: HelpModalProps) {
    const { showToast } = useToast();
    const { t, lang } = useI18n();
    const { walletAddress } = useAuth();
    const [view, setView] = useState<View>('topics');
    const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null);
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [attachments, setAttachments] = useState<File[]>([]);
    const [uploadedUrls, setUploadedUrls] = useState<string[]>([]);
    const [isUploading, setIsUploading] = useState(false);

    // Status Check State
    const [ticketId, setTicketId] = useState('');
    const [ticketStatus, setTicketStatus] = useState<TicketStatus | null>(null);

    // Dynamic FAQs State
    const [dynamicFaqs, setDynamicFaqs] = useState<{ qKey?: any, aKey?: any, question?: string, answer?: string }[]>([]);
    const [isLoadingFaqs, setIsLoadingFaqs] = useState(false);

    // Load FAQs on mount
    useEffect(() => {
        if (isOpen) {
            setIsLoadingFaqs(true);
            fetch('/api/support?type=faq')
                .then(res => res.json())
                .then(data => {
                    if (data.faqs) {
                        setDynamicFaqs(data.faqs.map((f: any) => ({
                            question: lang === 'es' ? f.question_es : f.question_en,
                            answer: lang === 'es' ? f.answer_es : f.answer_en
                        })));
                    }
                })
                .catch(err => console.error("Failed to load FAQs", err))
                .finally(() => setIsLoadingFaqs(false));
        }
    }, [isOpen, lang]);

    const handleCheckStatus = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const res = await fetch(`/api/support?type=status&id=${ticketId}&email=${email}`);
            if (res.ok) {
                const data = await res.json();
                setTicketStatus(data);
                setView('status-result');
            } else {
                showToast({ type: 'error', title: 'Error', message: 'Ticket not found or invalid email' });
            }
        } catch {
            showToast({ type: 'error', title: 'Error', message: 'Connection error' });
        } finally {
            setIsSubmitting(false);
        }
    };


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

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        if (files.length === 0) return;

        // Limit to 3 files max
        const newFiles = files.slice(0, 3 - attachments.length);
        if (newFiles.length === 0) {
            showToast({ type: 'error', title: 'Error', message: 'Máximo 3 imágenes' });
            return;
        }

        setIsUploading(true);
        const urls: string[] = [];

        for (const file of newFiles) {
            try {
                const formData = new FormData();
                formData.append('file', file);

                const res = await fetch('/api/support/upload', {
                    method: 'POST',
                    body: formData
                });

                if (res.ok) {
                    const data = await res.json();
                    urls.push(data.url);
                }
            } catch (err) {
                console.error('Upload error:', err);
            }
        }

        setAttachments(prev => [...prev, ...newFiles]);
        setUploadedUrls(prev => [...prev, ...urls]);
        setIsUploading(false);
    };

    const removeAttachment = (index: number) => {
        setAttachments(prev => prev.filter((_, i) => i !== index));
        setUploadedUrls(prev => prev.filter((_, i) => i !== index));
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
                    attachments: uploadedUrls,
                    language: lang,
                    walletAddress,
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
        setAttachments([]);
        setUploadedUrls([]);
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
                                                    {isLoadingFaqs ? (
                                                        <p className="text-zinc-500 text-xs">Loading...</p>
                                                    ) : dynamicFaqs.length > 0 ? (
                                                        dynamicFaqs.map((faq, index) => (
                                                            <motion.div
                                                                key={index}
                                                                initial={{ opacity: 0, y: 10 }}
                                                                animate={{ opacity: 1, y: 0 }}
                                                                transition={{ delay: index * 0.05 }}
                                                                className="glass rounded-xl p-3"
                                                            >
                                                                <p className="text-white text-sm font-medium mb-1">{faq.question}</p>
                                                                <p className="text-zinc-500 text-xs">{faq.answer}</p>
                                                            </motion.div>
                                                        ))
                                                    ) : (
                                                        <p className="text-zinc-500 text-xs">No FAQs available</p>
                                                    )}
                                                </div>
                                            </div>
                                        </FadeIn>

                                        {/* Status Check Button */}
                                        <FadeIn delay={0.1}>
                                            <Pressable
                                                onClick={() => setView('status-check')}
                                                className="w-full flex items-center gap-3 p-3 glass rounded-xl border border-pink-500/20 bg-pink-500/5 hover:bg-pink-500/10"
                                            >
                                                <span className="text-2xl">🔍</span>
                                                <div className="flex-1">
                                                    <p className="text-white font-medium text-sm">Check Ticket Status</p>
                                                    <p className="text-zinc-500 text-xs">See updates on your support request</p>
                                                </div>
                                                <svg className="w-4 h-4 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                                </svg>
                                            </Pressable>
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

                                        {/* Attachment Section */}
                                        <FadeIn delay={0.12}>
                                            <div>
                                                <label className="text-xs text-zinc-500 mb-1.5 block">
                                                    📎 Adjuntar imágenes (opcional, máx. 3)
                                                </label>

                                                {/* Attachment previews */}
                                                {attachments.length > 0 && (
                                                    <div className="flex gap-2 mb-2 flex-wrap">
                                                        {attachments.map((file, index) => (
                                                            <div key={index} className="relative group">
                                                                <img
                                                                    src={URL.createObjectURL(file)}
                                                                    alt={`Attachment ${index + 1}`}
                                                                    className="w-16 h-16 object-cover rounded-lg border border-white/10"
                                                                />
                                                                <button
                                                                    type="button"
                                                                    onClick={() => removeAttachment(index)}
                                                                    className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-white text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                                                >
                                                                    ✕
                                                                </button>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}

                                                {/* Upload button */}
                                                {attachments.length < 3 && (
                                                    <label className="flex items-center gap-2 px-4 py-2 rounded-xl bg-black/30 border border-white/10 text-zinc-400 cursor-pointer hover:border-pink-500/50 transition-colors">
                                                        <input
                                                            type="file"
                                                            accept="image/jpeg,image/png"
                                                            onChange={handleFileSelect}
                                                            className="hidden"
                                                            disabled={isUploading}
                                                        />
                                                        {isUploading ? (
                                                            <span className="text-sm">Subiendo...</span>
                                                        ) : (
                                                            <>
                                                                <span>📷</span>
                                                                <span className="text-sm">Agregar imagen</span>
                                                            </>
                                                        )}
                                                    </label>
                                                )}
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

                                {/* Status Check View */}
                                {view === 'status-check' && (
                                    <motion.form
                                        key="status-check"
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: 20 }}
                                        onSubmit={handleCheckStatus}
                                        className="space-y-4"
                                    >
                                        <div className="text-center mb-6">
                                            <h3 className="text-lg font-bold text-white">Check Ticket Status</h3>
                                            <p className="text-zinc-500 text-xs">Enter your details to track your request</p>
                                        </div>

                                        <div>
                                            <label className="text-xs text-zinc-500 mb-1.5 block">Ticket ID (e.g. T-123498)</label>
                                            <input
                                                type="text"
                                                value={ticketId}
                                                onChange={(e) => setTicketId(e.target.value)}
                                                placeholder="T-..."
                                                required
                                                className="w-full px-4 py-3 rounded-xl bg-black/30 border border-white/10 text-white placeholder-zinc-500 focus:outline-none focus:border-pink-500/50 transition-colors uppercase"
                                            />
                                        </div>

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

                                        <AnimatedButton
                                            type="submit"
                                            variant="gradient"
                                            fullWidth
                                            disabled={isSubmitting || !ticketId || !email}
                                            className="disabled:opacity-50"
                                        >
                                            {isSubmitting ? 'Checking...' : 'Check Status'}
                                        </AnimatedButton>
                                    </motion.form>
                                )}

                                {/* Status Result View */}
                                {view === 'status-result' && ticketStatus && (
                                    <motion.div
                                        key="status-result"
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        className="space-y-6 text-center"
                                    >
                                        <div className={`w-20 h-20 mx-auto rounded-full flex items-center justify-center ${ticketStatus.status === 'resolved' ? 'bg-emerald-500/20 text-emerald-400' :
                                            ticketStatus.status === 'in-progress' ? 'bg-yellow-500/20 text-yellow-400' :
                                                'bg-blue-500/20 text-blue-400'
                                            }`}>
                                            <span className="text-3xl">
                                                {ticketStatus.status === 'resolved' ? '✅' :
                                                    ticketStatus.status === 'in-progress' ? '🚧' : '📩'}
                                            </span>
                                        </div>

                                        <div>
                                            <h3 className="text-white font-bold text-lg capitalize mb-1">{ticketStatus.status.replace('-', ' ')}</h3>
                                            <p className="text-zinc-500 text-xs">Last updated {new Date(ticketStatus.updatedAt).toLocaleDateString()}</p>
                                        </div>

                                        {ticketStatus.lastReply && (
                                            <div className="bg-zinc-800/50 rounded-xl p-4 text-left border border-white/5">
                                                <p className="text-xs text-zinc-500 uppercase tracking-wider mb-2">Latest Update</p>
                                                <p className="text-sm text-zinc-300 whitespace-pre-wrap">{ticketStatus.lastReply}</p>
                                            </div>
                                        )}

                                        <AnimatedButton variant="glass" fullWidth onClick={() => setView('topics')}>
                                            Back to Help
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
