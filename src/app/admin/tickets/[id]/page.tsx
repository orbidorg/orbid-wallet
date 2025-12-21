'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

interface HistoryEntry {
    type: 'user_message' | 'admin_reply' | 'status_change' | 'note';
    content: string;
    attachments?: string[];
    author?: string;
    timestamp: string;
}

interface SupportTicket {
    id: string;
    ticket_id: string;
    email: string;
    topic: string;
    message: string;
    status: 'new' | 'in-progress' | 'resolved' | 'closed' | 're-opened';
    priority: 'low' | 'medium' | 'high';
    wallet_address?: string;
    language: string;
    internal_notes?: string;
    admin_reply?: string;
    attachments?: string[];
    history?: HistoryEntry[];
    created_at: string;
    updated_at: string;
    resolved_at?: string;
}

const STATUS_CONFIG = {
    'new': { label: 'Nuevo', color: 'bg-blue-500', textColor: 'text-blue-400' },
    'in-progress': { label: 'En Curso', color: 'bg-yellow-500', textColor: 'text-yellow-400' },
    'resolved': { label: 'Resuelto', color: 'bg-emerald-500', textColor: 'text-emerald-400' },
    'closed': { label: 'Cerrado', color: 'bg-zinc-500', textColor: 'text-zinc-400' },
    're-opened': { label: 'Re-abierto', color: 'bg-violet-500', textColor: 'text-violet-400' },
};

const PRIORITY_CONFIG = {
    'low': { label: 'Baja', color: 'text-zinc-400', emoji: '⚪' },
    'medium': { label: 'Media', color: 'text-yellow-400', emoji: '🟡' },
    'high': { label: 'Alta', color: 'text-red-400', emoji: '🔴' },
};

const TOPIC_LABELS: Record<string, string> = {
    'general': 'Pregunta General',
    'transactions': 'Problema de Transacción',
    'account': 'Ayuda con Cuenta',
    'security': 'Seguridad',
    'other': 'Otro'
};

const LANGUAGES: Record<string, { name: string, flag: string }> = {
    'en': { name: 'English', flag: '🇺🇸' },
    'es': { name: 'Español', flag: '🇪🇸' },
    'es_419': { name: 'Español (LATAM)', flag: '🇲🇽' },
    'pt': { name: 'Português', flag: '🇧🇷' },
    'fr': { name: 'Français', flag: '🇫🇷' },
    'de': { name: 'Deutsch', flag: '🇩🇪' },
    'ja': { name: '日本語', flag: '🇯🇵' },
    'ko': { name: '한국어', flag: '🇰🇷' },
    'zh_CN': { name: '简体中文', flag: '🇨🇳' },
    'zh_TW': { name: '繁體中文', flag: '🇹🇼' },
    'hi': { name: 'हिन्दी', flag: '🇮🇳' },
    'ar': { name: 'العربية', flag: '🇸🇦' },
    'ca': { name: 'Català', flag: '🇪🇸' },
    'id': { name: 'Bahasa Indonesia', flag: '🇮🇩' },
    'ms': { name: 'Bahasa Melayu', flag: '🇲🇾' },
    'pl': { name: 'Polski', flag: '🇵🇱' },
    'th': { name: 'ไทย', flag: '🇹🇭' }
};

export default function TicketDetailPage() {
    const params = useParams();
    const router = useRouter();
    const ticketId = params.id as string;

    const [authenticated, setAuthenticated] = useState(false);
    const [password, setPassword] = useState('');
    const [ticket, setTicket] = useState<SupportTicket | null>(null);
    const [loading, setLoading] = useState(false);
    const [sending, setSending] = useState(false);
    const [error, setError] = useState('');
    const [replyText, setReplyText] = useState('');
    const [internalNotes, setInternalNotes] = useState('');
    const [replyAttachments, setReplyAttachments] = useState<File[]>([]);
    const [replyAttachmentUrls, setReplyAttachmentUrls] = useState<string[]>([]);
    const [isUploading, setIsUploading] = useState(false);
    const replyRef = useRef<HTMLTextAreaElement>(null);
    const notesRef = useRef<HTMLTextAreaElement>(null);

    const loadTicket = useCallback(async () => {
        if (!password || !ticketId) return;
        setLoading(true);
        try {
            const res = await fetch('/api/support', { headers: { 'Authorization': `Bearer ${password}` } });
            if (res.ok) {
                const data = await res.json();
                const found = (data.tickets || []).find((t: SupportTicket) => t.ticket_id === ticketId);
                if (found) {
                    setTicket(found);
                    setInternalNotes(found.internal_notes || '');
                    setReplyText(found.admin_reply || '');
                } else {
                    setError('Ticket no encontrado');
                }
            }
        } catch (e) { console.error(e); }
        setLoading(false);
    }, [password, ticketId]);

    const authenticate = async () => {
        setLoading(true);
        setError('');
        try {
            const res = await fetch('/api/support', { headers: { 'Authorization': `Bearer ${password}` } });
            if (res.ok) {
                setAuthenticated(true);
                localStorage.setItem('adminToken', password);
                await loadTicket();
            } else {
                setError('Contraseña incorrecta');
            }
        } catch { setError('Error de conexión'); }
        setLoading(false);
    };

    useEffect(() => {
        const stored = localStorage.getItem('adminToken');
        if (stored) {
            setPassword(stored);
            setAuthenticated(true);
        }
    }, []);

    useEffect(() => {
        if (authenticated && password) {
            loadTicket();
        }
    }, [authenticated, password, loadTicket]);

    const updateTicket = async (updates: Record<string, unknown>) => {
        if (!ticket) return;
        try {
            const res = await fetch('/api/support', {
                method: 'PATCH',
                headers: { 'Authorization': `Bearer ${password}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ ticketId: ticket.ticket_id, ...updates })
            });
            if (res.ok) {
                await loadTicket();
            }
        } catch (e) { console.error(e); }
    };

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        if (files.length === 0) return;

        const newFiles = files.slice(0, 3 - replyAttachments.length);
        if (newFiles.length === 0) return;

        setIsUploading(true);
        const urls: string[] = [];

        for (const file of newFiles) {
            try {
                const formData = new FormData();
                formData.append('file', file);
                formData.append('ticketId', ticketId);

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

        setReplyAttachments(prev => [...prev, ...newFiles]);
        setReplyAttachmentUrls(prev => [...prev, ...urls]);
        setIsUploading(false);
    };

    const removeReplyAttachment = (index: number) => {
        setReplyAttachments(prev => prev.filter((_, i) => i !== index));
        setReplyAttachmentUrls(prev => prev.filter((_, i) => i !== index));
    };

    const handleReply = async () => {
        if (!replyText.trim() || !ticket) return;
        setSending(true);
        try {
            await fetch('/api/support', {
                method: 'PATCH',
                headers: { 'Authorization': `Bearer ${password}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ticketId: ticket.ticket_id,
                    admin_reply: replyText,
                    action: 'reply',
                    attachmentUrls: replyAttachmentUrls
                })
            });
            setReplyAttachments([]);
            setReplyAttachmentUrls([]);
            await loadTicket();
        } catch (e) { console.error(e); }
        setSending(false);
    };

    const handleResolve = async () => {
        if (!ticket) return;
        setSending(true);
        try {
            await fetch('/api/support', {
                method: 'PATCH',
                headers: { 'Authorization': `Bearer ${password}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ticketId: ticket.ticket_id,
                    admin_reply: replyText,
                    action: 'resolve',
                    attachmentUrls: replyAttachmentUrls
                })
            });
            setReplyAttachments([]);
            setReplyAttachmentUrls([]);
            await loadTicket();
        } catch (e) { console.error(e); }
        setSending(false);
    };

    const deleteTicket = async () => {
        if (!ticket || !confirm('¿Eliminar este ticket permanentemente?')) return;
        try {
            await fetch(`/api/support?id=${ticket.ticket_id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${password}` }
            });
            router.push('/admin/tickets');
        } catch (e) { console.error(e); }
    };

    const formatDate = (date: string) => {
        return new Date(date).toLocaleString('es-CO', {
            day: '2-digit', month: 'short', year: 'numeric',
            hour: '2-digit', minute: '2-digit'
        });
    };

    const adjustHeight = (ref: React.RefObject<HTMLTextAreaElement | null>) => {
        if (ref.current) {
            ref.current.style.height = 'auto';
            ref.current.style.height = `${ref.current.scrollHeight}px`;
        }
    };

    useEffect(() => {
        if (ticket) {
            adjustHeight(replyRef);
            adjustHeight(notesRef);
        }
    }, [ticket, replyText, internalNotes]);

    // Login screen
    if (!authenticated) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center p-4">
                <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl p-8">
                    <div className="text-center mb-8">
                        <div className="w-16 h-16 bg-gradient-to-br from-pink-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                            <span className="text-3xl">🎫</span>
                        </div>
                        <h1 className="text-2xl font-bold text-white">Acceso Admin</h1>
                    </div>
                    <form onSubmit={(e) => { e.preventDefault(); authenticate(); }}>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Contraseña"
                            className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl text-white mb-4"
                        />
                        {error && <p className="text-red-400 text-sm mb-4">{error}</p>}
                        <button type="submit" disabled={loading} className="w-full py-3 bg-pink-500 rounded-xl font-semibold text-white">
                            {loading ? 'Verificando...' : 'Acceder'}
                        </button>
                    </form>
                </div>
            </div>
        );
    }

    // Loading
    if (loading && !ticket) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <p className="text-zinc-400">Cargando ticket...</p>
            </div>
        );
    }

    // Not found
    if (!ticket) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <div className="text-center">
                    <p className="text-zinc-400 mb-4">Ticket no encontrado</p>
                    <Link href="/admin/tickets" className="text-pink-400 hover:text-pink-300">
                        ← Volver a tickets
                    </Link>
                </div>
            </div>
        );
    }

    const statusConfig = STATUS_CONFIG[ticket.status];
    const priorityConfig = PRIORITY_CONFIG[ticket.priority];

    return (
        <div className="min-h-screen bg-black text-white">
            {/* Header */}
            <header className="border-b border-zinc-800 px-6 py-4 sticky top-0 bg-black/80 backdrop-blur-md z-10">
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href="/admin/tickets" className="text-zinc-400 hover:text-white transition-colors">
                            ← Volver
                        </Link>
                        <span className="text-zinc-600">|</span>
                        <h1 className="font-mono text-lg">{ticket.ticket_id}</h1>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusConfig.color}/20 ${statusConfig.textColor} border border-${statusConfig.color === 'bg-blue-500' ? 'blue' : statusConfig.color === 'bg-yellow-500' ? 'yellow' : statusConfig.color === 'bg-emerald-500' ? 'emerald' : statusConfig.color === 'bg-zinc-500' ? 'zinc' : 'violet'}-500/30`}>
                            {statusConfig.label}
                        </span>
                    </div>
                    <button
                        onClick={deleteTicket}
                        className="px-4 py-2 bg-red-500/10 text-red-400 rounded-xl text-sm hover:bg-red-500/20 border border-red-500/20 transition-all active:scale-95"
                    >
                        🗑️ Eliminar Ticket
                    </button>
                </div>
            </header>

            <div className="max-w-7xl mx-auto p-6 grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Left Side: Details & Sidebar */}
                <div className="lg:col-span-4 space-y-6 order-2 lg:order-1">
                    {/* Information Card */}
                    <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6 space-y-6 sticky top-24">
                        <h3 className="font-bold text-xs text-zinc-500 uppercase tracking-widest border-b border-zinc-800 pb-2 flex items-center gap-2">
                            <span>📋</span> Detalles del Ticket
                        </h3>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <p className="text-[10px] text-zinc-500 uppercase font-black tracking-tight">Categoría</p>
                                <div className="flex items-center gap-2">
                                    <span className="text-sm">{TOPIC_LABELS[ticket.topic] || ticket.topic}</span>
                                </div>
                            </div>
                            <div className="space-y-1">
                                <p className="text-[10px] text-zinc-500 uppercase font-black tracking-tight">Idioma</p>
                                <p className="text-sm flex items-center gap-2">
                                    <span>{LANGUAGES[ticket.language]?.flag || '🌐'}</span>
                                    {LANGUAGES[ticket.language]?.name || ticket.language}
                                </p>
                            </div>
                        </div>

                        <div className="space-y-1">
                            <p className="text-[10px] text-zinc-500 uppercase font-black tracking-tight">Email del Usuario</p>
                            <p className="text-sm font-medium text-pink-400 break-all select-all">{ticket.email.toLowerCase()}</p>
                        </div>

                        {ticket.wallet_address && (
                            <div className="space-y-1">
                                <p className="text-[10px] text-zinc-500 uppercase font-black tracking-tight">Dirección de Wallet</p>
                                <p className="text-[11px] font-mono text-zinc-300 break-all bg-black/30 p-2 rounded-lg border border-zinc-800 select-all cursor-pointer hover:border-zinc-700 transition-colors">
                                    {ticket.wallet_address}
                                </p>
                            </div>
                        )}

                        <div className="pt-2 space-y-4 border-t border-zinc-800/50">
                            <div className="space-y-3">
                                <h3 className="font-bold text-[10px] text-zinc-500 uppercase tracking-widest">Estado</h3>
                                <div className="relative group">
                                    <select
                                        value={ticket.status}
                                        onChange={(e) => updateTicket({ status: e.target.value })}
                                        className="w-full h-10 px-3 bg-zinc-800 border border-zinc-700 rounded-xl text-sm appearance-none focus:border-pink-500 outline-none transition-all cursor-pointer"
                                    >
                                        <option value="new">🔵 Nuevo</option>
                                        <option value="in-progress">🟡 En Curso</option>
                                        <option value="resolved">🟢 Resuelto</option>
                                        <option value="re-opened">🟣 Re-abierto</option>
                                        <option value="closed">⚫ Cerrado</option>
                                    </select>
                                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-500 text-xs text-zinc-600">
                                        ▼
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <h3 className="font-bold text-[10px] text-zinc-500 uppercase tracking-widest">Prioridad</h3>
                                <div className="relative">
                                    <select
                                        value={ticket.priority}
                                        onChange={(e) => updateTicket({ priority: e.target.value })}
                                        className="w-full h-10 px-3 bg-zinc-800 border-zinc-700 border rounded-xl text-sm appearance-none focus:border-pink-500 outline-none transition-all cursor-pointer"
                                    >
                                        <option value="low">⚪ Baja</option>
                                        <option value="medium">🟡 Media</option>
                                        <option value="high">🔴 Alta</option>
                                    </select>
                                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-500 text-xs text-zinc-600">
                                        ▼
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Internal Notes in Sidebar */}
                        <div className="bg-zinc-800/30 border border-zinc-800 rounded-xl overflow-hidden focus-within:border-yellow-500/30 transition-all mt-4">
                            <div className="px-3 py-2 bg-zinc-900/30 border-b border-zinc-800 flex items-center justify-between">
                                <h3 className="font-bold text-[10px] text-zinc-500 uppercase tracking-widest text-yellow-500/80">Notas Internas</h3>
                                <span className="text-[8px] bg-yellow-500/10 text-yellow-500 px-1.5 py-0.5 rounded-full border border-yellow-500/20 font-bold uppercase tracking-tighter">Privado</span>
                            </div>
                            <div className="p-3">
                                <textarea
                                    ref={notesRef}
                                    value={internalNotes}
                                    onChange={(e) => setInternalNotes(e.target.value)}
                                    onBlur={() => updateTicket({ internal_notes: internalNotes })}
                                    placeholder="Añade notas privadas..."
                                    className="w-full px-0 py-1 bg-transparent text-white border-0 resize-none min-h-[60px] focus:ring-0 text-xs leading-relaxed placeholder-zinc-700 overflow-hidden"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 gap-2 pt-4 border-t border-zinc-800/50">
                            <div className="flex justify-between items-center text-[11px]">
                                <p className="text-zinc-500">Fecha creación</p>
                                <p className="font-bold">{formatDate(ticket.created_at)}</p>
                            </div>
                            {ticket.resolved_at && (
                                <div className="flex justify-between items-center text-[11px]">
                                    <p className="text-zinc-500">Fecha resolución</p>
                                    <p className="font-bold text-emerald-500">{formatDate(ticket.resolved_at)}</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Right Side: Conversation & Reply */}
                <div className="lg:col-span-8 space-y-8 order-1 lg:order-2">
                    {/* Conversation Timeline */}
                    <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-2xl overflow-hidden shadow-sm">
                        <div className="px-6 py-4 border-b border-zinc-800 bg-zinc-900/30">
                            <h3 className="font-bold flex items-center gap-2">
                                <span className="text-lg">💬</span> Historial de Conversación
                            </h3>
                        </div>

                        <div className="p-6 space-y-6 max-h-[600px] overflow-y-auto custom-scrollbar">
                            {(!ticket.history || ticket.history.length === 0) ? (
                                <div className="flex gap-4">
                                    <div className="w-10 h-10 bg-blue-500/10 rounded-full flex items-center justify-center flex-shrink-0 border border-blue-500/20">
                                        <span className="text-xl">👤</span>
                                    </div>
                                    <div className="flex-1 space-y-2">
                                        <div className="flex items-center gap-3">
                                            <p className="font-bold text-sm text-zinc-100">{ticket.email.toLowerCase()}</p>
                                            <span className="text-[10px] uppercase font-bold text-zinc-600 tracking-wider bg-zinc-800 px-2 py-0.5 rounded-full">{formatDate(ticket.created_at)}</span>
                                        </div>
                                        <div className="bg-zinc-800/80 rounded-2xl rounded-tl-none p-4 border border-zinc-700/50">
                                            <p className="text-zinc-300 text-sm leading-relaxed whitespace-pre-wrap">{ticket.message}</p>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                ticket.history.map((entry, index) => (
                                    <div key={index} className={`flex gap-4 ${entry.type === 'admin_reply' ? 'flex-row-reverse' : ''}`}>
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 border ${entry.type === 'user_message' ? 'bg-blue-500/10 border-blue-500/20' :
                                            entry.type === 'admin_reply' ? 'bg-pink-500/10 border-pink-500/20' :
                                                'bg-zinc-800 border-zinc-700'
                                            }`}>
                                            <span className="text-xl">{entry.type === 'user_message' ? '👤' : entry.type === 'admin_reply' ? '🎧' : '⚙️'}</span>
                                        </div>
                                        <div className={`flex-1 max-w-[85%] ${entry.type === 'admin_reply' ? 'text-right' : ''}`}>
                                            <div className={`flex items-center gap-2 mb-2 ${entry.type === 'admin_reply' ? 'justify-end' : ''}`}>
                                                <p className="font-bold text-sm text-zinc-400 capitalize">{entry.author || 'Sistema'}</p>
                                                <span className="text-[10px] uppercase font-bold text-zinc-600 tracking-wider bg-zinc-800 px-1.5 py-0.5 rounded-full">{formatDate(entry.timestamp)}</span>
                                            </div>
                                            {entry.type === 'status_change' ? (
                                                <div className="bg-zinc-800/10 border border-dashed border-zinc-800 rounded-lg p-2 inline-block">
                                                    <p className="text-xs text-zinc-500 italic">{entry.content}</p>
                                                </div>
                                            ) : (
                                                <div className={`rounded-2xl p-4 border ${entry.type === 'admin_reply' ? 'bg-pink-500/5 border-pink-500/10 rounded-tr-none text-left ml-auto' : 'bg-zinc-800/80 border-zinc-700/50 rounded-tl-none'
                                                    }`}>
                                                    <p className="text-zinc-300 text-sm leading-relaxed whitespace-pre-wrap">{entry.content}</p>
                                                </div>
                                            )}
                                            {entry.attachments && entry.attachments.length > 0 && (
                                                <div className={`flex gap-2 mt-3 flex-wrap ${entry.type === 'admin_reply' ? 'justify-end' : ''}`}>
                                                    {entry.attachments.map((url, i) => (
                                                        <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="hover:scale-105 transition-transform">
                                                            <img src={url} alt="" className="w-20 h-20 object-cover rounded-xl border border-zinc-700 bg-zinc-800" />
                                                        </a>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Reply Section */}
                    <div className="bg-zinc-900 shadow-xl border border-zinc-800/50 rounded-2xl overflow-hidden focus-within:border-pink-500/30 transition-all">
                        <div className="px-6 py-4 border-b border-zinc-800 bg-zinc-900/30">
                            <h3 className="font-bold flex items-center gap-2 text-pink-500">
                                <span>✍️</span> Redactar Respuesta
                            </h3>
                        </div>
                        <div className="p-6">
                            <textarea
                                ref={replyRef}
                                value={replyText}
                                onChange={(e) => setReplyText(e.target.value)}
                                placeholder="Escribe tu respuesta oficial aquí..."
                                className="w-full px-0 py-2 bg-transparent text-white border-0 resize-none min-h-[140px] focus:ring-0 text-base leading-relaxed placeholder-zinc-600 overflow-hidden"
                            />

                            <div className="mt-6 flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-zinc-800">
                                <div className="flex gap-3 items-center">
                                    {replyAttachments.length > 0 && (
                                        <div className="flex gap-2 mr-2">
                                            {replyAttachments.map((file, index) => (
                                                <div key={index} className="relative group animate-in fade-in zoom-in duration-200">
                                                    <img
                                                        src={URL.createObjectURL(file)}
                                                        alt=""
                                                        className="w-12 h-12 object-cover rounded-xl border border-zinc-700"
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => removeReplyAttachment(index)}
                                                        className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-white text-[10px] flex items-center justify-center border-2 border-zinc-900 active:scale-90 transition-all"
                                                    >
                                                        ✕
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {replyAttachments.length < 3 && ticket.status !== 'resolved' && (
                                        <label className="flex items-center gap-2 px-4 py-2 bg-zinc-800 rounded-xl text-zinc-400 text-sm cursor-pointer hover:bg-zinc-700 hover:text-white transition-all active:scale-95 group">
                                            <input
                                                type="file"
                                                accept="image/jpeg,image/png"
                                                onChange={handleFileSelect}
                                                className="hidden"
                                                disabled={isUploading}
                                            />
                                            <span className="text-lg group-hover:rotate-12 transition-transform">📷</span>
                                            {isUploading ? 'Subiendo...' : 'Adjuntar'}
                                        </label>
                                    )}
                                </div>

                                <div className="flex gap-3">
                                    <button
                                        onClick={handleReply}
                                        disabled={sending || !replyText.trim() || ticket.status === 'resolved'}
                                        className="px-6 py-2.5 bg-zinc-800 text-zinc-400 rounded-xl font-bold text-sm hover:bg-yellow-500/10 hover:text-yellow-500 disabled:opacity-50 transition-all active:scale-95 border border-zinc-700/50"
                                    >
                                        {sending ? '...' : 'Solo Responder'}
                                    </button>
                                    <button
                                        onClick={handleResolve}
                                        disabled={sending || ticket.status === 'resolved'}
                                        className="px-8 py-2.5 bg-emerald-500 text-white rounded-xl font-bold text-sm hover:bg-emerald-600 shadow-lg shadow-emerald-500/20 disabled:opacity-50 transition-all active:scale-95"
                                    >
                                        {sending ? '...' : '✅ Resolver y Cerrar'}
                                    </button>
                                </div>
                            </div>
                            {ticket.status === 'resolved' && (
                                <p className="text-emerald-500 font-bold text-xs mt-4 text-center bg-emerald-500/10 py-2 rounded-lg border border-emerald-500/20">
                                    ✓ Este ticket ya fue marcado como resuelto
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
