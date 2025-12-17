'use client';

import { useState, useEffect, useCallback } from 'react';
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
    status: 'new' | 'in-progress' | 'resolved' | 'closed';
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
            <header className="border-b border-zinc-800 px-6 py-4">
                <div className="max-w-6xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href="/admin/tickets" className="text-zinc-400 hover:text-white transition-colors">
                            ← Volver
                        </Link>
                        <span className="text-zinc-600">|</span>
                        <h1 className="font-mono text-lg">{ticket.ticket_id}</h1>
                        <span className={`px-2 py-1 rounded text-xs ${statusConfig.color}/20 ${statusConfig.textColor}`}>
                            {statusConfig.label}
                        </span>
                        <span className={`text-sm ${priorityConfig.color}`}>
                            {priorityConfig.emoji} {priorityConfig.label}
                        </span>
                    </div>
                    <button
                        onClick={deleteTicket}
                        className="px-3 py-1.5 bg-red-500/10 text-red-400 rounded-lg text-sm hover:bg-red-500/20"
                    >
                        🗑️ Eliminar
                    </button>
                </div>
            </header>

            <div className="max-w-6xl mx-auto p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Content */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Conversation Timeline */}
                    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
                        <h3 className="font-semibold mb-4 flex items-center gap-2">
                            <span>💬</span> Historial de Conversación
                        </h3>

                        <div className="space-y-4">
                            {/* If no history, show legacy message */}
                            {(!ticket.history || ticket.history.length === 0) ? (
                                <div className="flex gap-3">
                                    <div className="w-10 h-10 bg-blue-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                                        <span className="text-blue-400">👤</span>
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <p className="font-medium text-sm">{ticket.email}</p>
                                            <span className="text-xs text-zinc-500">{formatDate(ticket.created_at)}</span>
                                        </div>
                                        <div className="bg-zinc-800 rounded-lg p-3">
                                            <p className="text-zinc-300 text-sm whitespace-pre-wrap">{ticket.message}</p>
                                        </div>
                                        {ticket.attachments && ticket.attachments.length > 0 && (
                                            <div className="flex gap-2 mt-2 flex-wrap">
                                                {ticket.attachments.map((url, i) => (
                                                    <a key={i} href={url} target="_blank" rel="noopener noreferrer">
                                                        <img src={url} alt="" className="w-16 h-16 object-cover rounded-lg border border-zinc-700" />
                                                    </a>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                /* Full timeline from history */
                                ticket.history.map((entry, index) => (
                                    <div key={index} className={`flex gap-3 ${entry.type === 'admin_reply' ? 'flex-row-reverse' : ''}`}>
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${entry.type === 'user_message' ? 'bg-blue-500/20' :
                                                entry.type === 'admin_reply' ? 'bg-pink-500/20' :
                                                    'bg-zinc-700'
                                            }`}>
                                            <span>{entry.type === 'user_message' ? '👤' : entry.type === 'admin_reply' ? '🎧' : '⚙️'}</span>
                                        </div>
                                        <div className={`flex-1 max-w-[80%] ${entry.type === 'admin_reply' ? 'text-right' : ''}`}>
                                            <div className={`flex items-center gap-2 mb-1 ${entry.type === 'admin_reply' ? 'justify-end' : ''}`}>
                                                <p className="font-medium text-sm text-zinc-400">{entry.author || 'Unknown'}</p>
                                                <span className="text-xs text-zinc-600">{formatDate(entry.timestamp)}</span>
                                            </div>
                                            {entry.type === 'status_change' ? (
                                                <p className="text-xs text-zinc-500 italic">{entry.content}</p>
                                            ) : (
                                                <div className={`rounded-lg p-3 ${entry.type === 'admin_reply' ? 'bg-pink-500/10 ml-auto' : 'bg-zinc-800'
                                                    }`}>
                                                    <p className="text-zinc-300 text-sm whitespace-pre-wrap">{entry.content}</p>
                                                </div>
                                            )}
                                            {entry.attachments && entry.attachments.length > 0 && (
                                                <div className={`flex gap-2 mt-2 flex-wrap ${entry.type === 'admin_reply' ? 'justify-end' : ''}`}>
                                                    {entry.attachments.map((url, i) => (
                                                        <a key={i} href={url} target="_blank" rel="noopener noreferrer">
                                                            <img src={url} alt="" className="w-16 h-16 object-cover rounded-lg border border-zinc-700" />
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

                    {/* Admin Reply Section */}
                    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
                        <h3 className="font-semibold mb-4 flex items-center gap-2">
                            <span>💬</span> Respuesta al Usuario
                        </h3>
                        <textarea
                            value={replyText}
                            onChange={(e) => setReplyText(e.target.value)}
                            placeholder="Escribe tu respuesta aquí..."
                            className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl text-white resize-none h-32 focus:border-pink-500 focus:outline-none"
                        />

                        {/* Admin Reply Attachments */}
                        <div className="mt-3">
                            {replyAttachments.length > 0 && (
                                <div className="flex gap-2 mb-2 flex-wrap">
                                    {replyAttachments.map((file, index) => (
                                        <div key={index} className="relative group">
                                            <img
                                                src={URL.createObjectURL(file)}
                                                alt={`Attachment ${index + 1}`}
                                                className="w-16 h-16 object-cover rounded-lg border border-zinc-700"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => removeReplyAttachment(index)}
                                                className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-white text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                                ✕
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {replyAttachments.length < 3 && ticket.status !== 'resolved' && (
                                <label className="inline-flex items-center gap-2 px-3 py-1.5 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-400 text-sm cursor-pointer hover:border-pink-500/50 transition-colors">
                                    <input
                                        type="file"
                                        accept="image/jpeg,image/png"
                                        onChange={handleFileSelect}
                                        className="hidden"
                                        disabled={isUploading}
                                    />
                                    {isUploading ? 'Subiendo...' : '📷 Adjuntar imagen'}
                                </label>
                            )}
                        </div>

                        <div className="flex gap-3 mt-4">
                            <button
                                onClick={handleReply}
                                disabled={sending || !replyText.trim() || ticket.status === 'resolved'}
                                className="flex-1 py-3 bg-yellow-500/20 text-yellow-400 rounded-xl font-semibold hover:bg-yellow-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                {sending ? 'Enviando...' : '💬 Responder y Mantener En Curso'}
                            </button>
                            <button
                                onClick={handleResolve}
                                disabled={sending || ticket.status === 'resolved'}
                                className="flex-1 py-3 bg-emerald-500/20 text-emerald-400 rounded-xl font-semibold hover:bg-emerald-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                {sending ? 'Enviando...' : '✅ Resolver y Cerrar'}
                            </button>
                        </div>
                        {ticket.status === 'resolved' && (
                            <p className="text-emerald-400 text-sm mt-3 text-center">
                                ✓ Este ticket ya fue resuelto
                            </p>
                        )}
                    </div>

                    {/* Internal Notes */}
                    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
                        <h3 className="font-semibold mb-4 flex items-center gap-2">
                            <span>📝</span> Notas Internas
                            <span className="text-xs text-zinc-500 font-normal">(Solo visible para admin)</span>
                        </h3>
                        <textarea
                            value={internalNotes}
                            onChange={(e) => setInternalNotes(e.target.value)}
                            onBlur={() => updateTicket({ internal_notes: internalNotes })}
                            placeholder="Añade notas privadas sobre este ticket..."
                            className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl text-white resize-none h-24 focus:border-pink-500 focus:outline-none"
                        />
                    </div>
                </div>

                {/* Sidebar */}
                <div className="space-y-4">
                    {/* Info Card */}
                    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 space-y-4">
                        <h3 className="font-semibold text-sm text-zinc-400 uppercase tracking-wide">Información</h3>

                        <div>
                            <p className="text-xs text-zinc-500">Categoría</p>
                            <p className="text-sm">{TOPIC_LABELS[ticket.topic] || ticket.topic}</p>
                        </div>

                        <div>
                            <p className="text-xs text-zinc-500">Email</p>
                            <p className="text-sm break-all">{ticket.email}</p>
                        </div>

                        {ticket.wallet_address && (
                            <div>
                                <p className="text-xs text-zinc-500">Wallet</p>
                                <p className="text-xs font-mono text-zinc-400 break-all">{ticket.wallet_address}</p>
                            </div>
                        )}

                        <div>
                            <p className="text-xs text-zinc-500">Idioma</p>
                            <p className="text-sm">{ticket.language === 'es' ? '🇪🇸 Español' : '🇺🇸 English'}</p>
                        </div>

                        <div>
                            <p className="text-xs text-zinc-500">Creado</p>
                            <p className="text-sm">{formatDate(ticket.created_at)}</p>
                        </div>

                        {ticket.resolved_at && (
                            <div>
                                <p className="text-xs text-zinc-500">Resuelto</p>
                                <p className="text-sm text-emerald-400">{formatDate(ticket.resolved_at)}</p>
                            </div>
                        )}
                    </div>

                    {/* Status Control */}
                    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 space-y-3">
                        <h3 className="font-semibold text-sm text-zinc-400 uppercase tracking-wide">Estado</h3>
                        <select
                            value={ticket.status}
                            onChange={(e) => updateTicket({ status: e.target.value })}
                            className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-sm"
                        >
                            <option value="new">🔵 Nuevo</option>
                            <option value="in-progress">🟡 En Curso</option>
                            <option value="resolved">🟢 Resuelto</option>
                            <option value="closed">⚫ Cerrado</option>
                        </select>
                    </div>

                    {/* Priority Control */}
                    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 space-y-3">
                        <h3 className="font-semibold text-sm text-zinc-400 uppercase tracking-wide">Prioridad</h3>
                        <select
                            value={ticket.priority}
                            onChange={(e) => updateTicket({ priority: e.target.value })}
                            className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-sm"
                        >
                            <option value="low">⚪ Baja</option>
                            <option value="medium">🟡 Media</option>
                            <option value="high">🔴 Alta</option>
                        </select>
                    </div>
                </div>
            </div>
        </div>
    );
}
