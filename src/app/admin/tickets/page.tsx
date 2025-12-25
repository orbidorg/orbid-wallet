'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';

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
    created_at: string;
    updated_at: string;
    resolved_at?: string;
}

const STATUS_CONFIG = {
    'new': { label: 'Nuevo', color: 'bg-blue-500' },
    'in-progress': { label: 'En Curso', color: 'bg-yellow-500' },
    'resolved': { label: 'Resuelto', color: 'bg-emerald-500' },
    'closed': { label: 'Cerrado', color: 'bg-zinc-500' },
    're-opened': { label: 'Re-abierto', color: 'bg-violet-500' },
};

const PRIORITY_CONFIG = {
    'low': { label: 'Baja', color: 'text-zinc-400' },
    'medium': { label: 'Media', color: 'text-yellow-400' },
    'high': { label: 'Alta', color: 'text-red-400' },
};

const TOPIC_ICONS: Record<string, string> = {
    'general': '❓', 'transactions': '💸', 'account': '👤', 'security': '🔐', 'other': '📝'
};

const LANGUAGE_FLAGS: Record<string, string> = {
    'en': '🇺🇸', 'es': '🇪🇸', 'es_419': '🇲🇽', 'pt': '🇧🇷', 'fr': '🇫🇷', 'de': '🇩🇪',
    'ja': '🇯🇵', 'ko': '🇰🇷', 'zh_CN': '🇨🇳', 'zh_TW': '🇹🇼', 'hi': '🇮🇳', 'ar': '🇸🇦',
    'ca': '🇪🇸', 'id': '🇮🇩', 'ms': '🇲🇾', 'pl': '🇵🇱', 'th': '🇹🇭'
};

export default function AdminTicketsPage() {
    const [authenticated, setAuthenticated] = useState(false);
    const [password, setPassword] = useState('');
    const [tickets, setTickets] = useState<SupportTicket[]>([]);
    const [loading, setLoading] = useState(false);
    const [filter, setFilter] = useState('all');
    const [search, setSearch] = useState('');
    const [error, setError] = useState('');

    const loadTickets = useCallback(async () => {
        if (!password) return;
        setLoading(true);
        try {
            const res = await fetch('/api/support', { headers: { 'Authorization': `Bearer ${password}` } });
            if (res.ok) {
                const data = await res.json();
                setTickets(data.tickets || []);
            }
        } catch (e) { console.error(e); }
        setLoading(false);
    }, [password]);

    const logout = () => {
        setAuthenticated(false);
        setPassword('');
        localStorage.removeItem('adminToken');
    };

    const authenticate = async () => {
        setLoading(true);
        setError('');
        try {
            const res = await fetch('/api/support', { headers: { 'Authorization': `Bearer ${password}` } });
            if (res.ok) {
                setAuthenticated(true);
                localStorage.setItem('adminToken', password);
                await loadTickets();
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
            loadTickets();
        }
    }, [authenticated, password, loadTickets]);

    // Filter and search
    const filteredTickets = tickets
        .filter(t => filter === 'all' || t.status === filter)
        .filter(t =>
            search === '' ||
            t.email.toLowerCase().includes(search.toLowerCase()) ||
            t.ticket_id.toLowerCase().includes(search.toLowerCase()) ||
            (t.wallet_address && t.wallet_address.toLowerCase().includes(search.toLowerCase()))
        );

    const stats = {
        total: tickets.length,
        new: tickets.filter(t => t.status === 'new').length,
        inProgress: tickets.filter(t => t.status === 'in-progress').length,
        resolved: tickets.filter(t => t.status === 'resolved').length,
        reOpened: tickets.filter(t => t.status === 're-opened').length,
    };

    const timeAgo = (date: string) => {
        const mins = Math.floor((Date.now() - new Date(date).getTime()) / 60000);
        if (mins < 60) return `${mins}m`;
        const hrs = Math.floor(mins / 60);
        if (hrs < 24) return `${hrs}h`;
        return `${Math.floor(hrs / 24)}d`;
    };

    if (!authenticated) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center p-4">
                <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl p-8">
                    <div className="text-center mb-8">
                        <div className="w-16 h-16 bg-gradient-to-br from-pink-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                            <span className="text-3xl">🎫</span>
                        </div>
                        <h1 className="text-2xl font-bold text-white">Tickets de Soporte</h1>
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
                            {loading ? 'Cargando...' : 'Acceder'}
                        </button>
                    </form>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-black text-white p-6">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-2xl font-bold">🎫 Tickets de Soporte</h1>
                        <p className="text-zinc-400 text-sm">Gestiona solicitudes de usuarios</p>
                    </div>
                    <div className="flex gap-2">
                        <button onClick={logout} className="px-3 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 border border-red-500/20 rounded-lg text-sm transition-colors flex items-center gap-2">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" /></svg>
                            Salir
                        </button>
                        <button onClick={loadTickets} className="px-3 py-2 bg-zinc-800 rounded-lg text-sm hover:bg-zinc-700">
                            🔄 Actualizar
                        </button>
                        <Link href="/admin" className="px-3 py-2 bg-zinc-800 rounded-lg text-sm hover:bg-zinc-700">
                            ← Dashboard
                        </Link>
                        <Link href="/admin/notifications" className="px-3 py-2 bg-zinc-800 rounded-lg text-sm hover:bg-zinc-700">
                            📢 Notificaciones
                        </Link>
                    </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-5 gap-3 mb-6">
                    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
                        <p className="text-zinc-400 text-xs">Total</p>
                        <p className="text-2xl font-bold">{stats.total}</p>
                    </div>
                    <div className="bg-zinc-900 border border-blue-900/50 rounded-xl p-4">
                        <p className="text-blue-400 text-xs">Nuevos</p>
                        <p className="text-2xl font-bold text-blue-400">{stats.new}</p>
                    </div>
                    <div className="bg-zinc-900 border border-violet-900/50 rounded-xl p-4">
                        <p className="text-violet-400 text-xs">Re-abiertos</p>
                        <p className="text-2xl font-bold text-violet-400">{stats.reOpened}</p>
                    </div>
                    <div className="bg-zinc-900 border border-yellow-900/50 rounded-xl p-4">
                        <p className="text-yellow-400 text-xs">En Curso</p>
                        <p className="text-2xl font-bold text-yellow-400">{stats.inProgress}</p>
                    </div>
                    <div className="bg-zinc-900 border border-emerald-900/50 rounded-xl p-4">
                        <p className="text-emerald-400 text-xs">Resueltos</p>
                        <p className="text-2xl font-bold text-emerald-400">{stats.resolved}</p>
                    </div>
                </div>

                {/* Search and Filters */}
                <div className="flex gap-4 mb-4">
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="🔍 Buscar por email, ID o wallet..."
                        className="flex-1 px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:border-pink-500 focus:outline-none"
                    />
                    <div className="flex gap-1">
                        {['all', 'new', 'in-progress', 'resolved', 're-opened', 'closed'].map((s) => (
                            <button
                                key={s}
                                onClick={() => setFilter(s)}
                                className={`px-3 py-2 rounded-lg text-sm transition-colors ${filter === s ? 'bg-pink-500/20 text-pink-400' : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'}`}
                            >
                                {s === 'all' ? 'Todos' : STATUS_CONFIG[s as keyof typeof STATUS_CONFIG]?.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Tickets List */}
                <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
                    {loading ? (
                        <div className="p-8 text-center text-zinc-500">Cargando...</div>
                    ) : filteredTickets.length === 0 ? (
                        <div className="p-8 text-center text-zinc-500">
                            {search ? 'No se encontraron tickets' : 'No hay tickets'}
                        </div>
                    ) : (
                        <div className="divide-y divide-zinc-800">
                            {filteredTickets.map((ticket) => (
                                <Link
                                    key={ticket.id}
                                    href={`/admin/tickets/${ticket.ticket_id}`}
                                    className="block p-4 hover:bg-white/5 transition-colors"
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-start gap-4">
                                            <span className="text-2xl mt-1">{TOPIC_ICONS[ticket.topic] || '📝'}</span>
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-pink-500 font-mono text-[10px] font-bold tracking-wider">{ticket.ticket_id}</span>
                                                    <span className="text-zinc-600">•</span>
                                                    <span className="text-zinc-400 text-xs">
                                                        {LANGUAGE_FLAGS[ticket.language] || '🌐'} {ticket.language.toUpperCase()}
                                                    </span>
                                                </div>
                                                <h3 className="text-white font-semibold">
                                                    {ticket.wallet_address ? (
                                                        <span className="flex items-center gap-2">
                                                            <span className="font-mono text-zinc-200">{`${ticket.wallet_address.slice(0, 6)}...${ticket.wallet_address.slice(-4)}`}</span>
                                                            <span className="text-zinc-500 text-xs font-normal">({ticket.email})</span>
                                                        </span>
                                                    ) : (
                                                        <span className="text-zinc-200">{ticket.email}</span>
                                                    )}
                                                </h3>
                                                <p className="text-xs text-zinc-500">{timeAgo(ticket.created_at)}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <div className="flex flex-col items-end gap-1.5">
                                                <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold ${STATUS_CONFIG[ticket.status].color} text-white`}>
                                                    {STATUS_CONFIG[ticket.status].label}
                                                </span>
                                                <span className={`text-[10px] font-bold uppercase tracking-tight ${PRIORITY_CONFIG[ticket.priority].color}`}>
                                                    {PRIORITY_CONFIG[ticket.priority].label}
                                                </span>
                                            </div>
                                            <span className="text-zinc-600 text-lg">→</span>
                                        </div>
                                    </div>
                                    <p className="mt-2 text-xs text-zinc-400 line-clamp-1">{ticket.message}</p>
                                </Link>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
