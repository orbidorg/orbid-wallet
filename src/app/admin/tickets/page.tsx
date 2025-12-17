'use client';

import { useState, useEffect, useCallback } from 'react';

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
    created_at: string;
    updated_at: string;
    resolved_at?: string;
}

const STATUS_CONFIG = {
    'new': { label: 'Nuevo', color: 'bg-blue-500' },
    'in-progress': { label: 'En Curso', color: 'bg-yellow-500' },
    'resolved': { label: 'Resuelto', color: 'bg-emerald-500' },
    'closed': { label: 'Cerrado', color: 'bg-zinc-500' },
};

const PRIORITY_CONFIG = {
    'low': { label: 'Baja', color: 'text-zinc-400' },
    'medium': { label: 'Media', color: 'text-yellow-400' },
    'high': { label: 'Alta', color: 'text-red-400' },
};

const TOPIC_ICONS: Record<string, string> = {
    'general': '❓', 'transactions': '💸', 'account': '👤', 'security': '🔐', 'other': '📝'
};

export default function AdminTicketsPage() {
    const [authenticated, setAuthenticated] = useState(false);
    const [password, setPassword] = useState('');
    const [tickets, setTickets] = useState<SupportTicket[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
    const [filter, setFilter] = useState('all');
    const [error, setError] = useState('');
    const [editNotes, setEditNotes] = useState('');
    const [editReply, setEditReply] = useState('');

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

    const authenticate = async () => {
        setLoading(true);
        setError('');
        try {
            const res = await fetch('/api/support', { headers: { 'Authorization': `Bearer ${password}` } });
            if (res.ok) {
                setAuthenticated(true);
                await loadTickets();
            } else {
                setError('Contraseña incorrecta');
            }
        } catch { setError('Error de conexión'); }
        setLoading(false);
    };

    const updateTicket = async (updates: Record<string, unknown>) => {
        if (!selectedTicket) return;
        try {
            const res = await fetch('/api/support', {
                method: 'PATCH',
                headers: { 'Authorization': `Bearer ${password}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ ticketId: selectedTicket.ticket_id, ...updates })
            });
            if (res.ok) {
                await loadTickets();
                const data = await res.json();
                setSelectedTicket(data.ticket);
            }
        } catch (e) { console.error(e); }
    };

    const deleteTicket = async () => {
        if (!selectedTicket || !confirm('¿Eliminar este ticket?')) return;
        try {
            await fetch(`/api/support?id=${selectedTicket.ticket_id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${password}` }
            });
            await loadTickets();
            setSelectedTicket(null);
        } catch (e) { console.error(e); }
    };

    useEffect(() => {
        if (selectedTicket) {
            setEditNotes(selectedTicket.internal_notes || '');
            setEditReply(selectedTicket.admin_reply || '');
        }
    }, [selectedTicket]);

    const filteredTickets = filter === 'all' ? tickets : tickets.filter(t => t.status === filter);
    const stats = {
        total: tickets.length,
        new: tickets.filter(t => t.status === 'new').length,
        inProgress: tickets.filter(t => t.status === 'in-progress').length,
        resolved: tickets.filter(t => t.status === 'resolved').length,
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
            <div className="max-w-7xl mx-auto">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-2xl font-bold">🎫 Tickets de Soporte</h1>
                        <p className="text-zinc-400 text-sm">Gestiona solicitudes</p>
                    </div>
                    <div className="flex gap-2">
                        <button onClick={loadTickets} className="px-3 py-2 bg-zinc-800 rounded-lg text-sm">🔄</button>
                        <a href="/admin" className="px-3 py-2 bg-zinc-800 rounded-lg text-sm">← Dashboard</a>
                    </div>
                </div>

                <div className="grid grid-cols-4 gap-3 mb-6">
                    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
                        <p className="text-zinc-400 text-xs">Total</p>
                        <p className="text-2xl font-bold">{stats.total}</p>
                    </div>
                    <div className="bg-zinc-900 border border-blue-900/50 rounded-xl p-4">
                        <p className="text-blue-400 text-xs">Nuevos</p>
                        <p className="text-2xl font-bold text-blue-400">{stats.new}</p>
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

                <div className="flex gap-2 mb-4">
                    {['all', 'new', 'in-progress', 'resolved', 'closed'].map((s) => (
                        <button
                            key={s}
                            onClick={() => setFilter(s)}
                            className={`px-3 py-1.5 rounded-lg text-sm ${filter === s ? 'bg-pink-500/20 text-pink-400' : 'bg-zinc-800 text-zinc-400'}`}
                        >
                            {s === 'all' ? 'Todos' : STATUS_CONFIG[s as keyof typeof STATUS_CONFIG]?.label}
                        </button>
                    ))}
                </div>

                <div className="flex gap-4">
                    <div className="flex-1 bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
                        {loading ? (
                            <div className="p-8 text-center text-zinc-500">Cargando...</div>
                        ) : filteredTickets.length === 0 ? (
                            <div className="p-8 text-center text-zinc-500">No hay tickets</div>
                        ) : (
                            <div className="divide-y divide-zinc-800">
                                {filteredTickets.map((ticket) => (
                                    <div
                                        key={ticket.id}
                                        onClick={() => setSelectedTicket(ticket)}
                                        className={`p-4 cursor-pointer hover:bg-white/5 ${selectedTicket?.id === ticket.id ? 'bg-white/5' : ''}`}
                                    >
                                        <div className="flex items-start justify-between">
                                            <div className="flex items-center gap-2">
                                                <span className="text-xl">{TOPIC_ICONS[ticket.topic] || '📝'}</span>
                                                <div>
                                                    <p className="font-medium text-white text-sm">{ticket.email}</p>
                                                    <p className="text-xs text-zinc-500">{ticket.ticket_id} • {timeAgo(ticket.created_at)}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className={`text-xs ${PRIORITY_CONFIG[ticket.priority].color}`}>
                                                    {ticket.priority === 'high' ? '🔴' : ticket.priority === 'medium' ? '🟡' : '⚪'}
                                                </span>
                                                <span className={`px-2 py-0.5 rounded text-xs ${STATUS_CONFIG[ticket.status].color}/20 text-white`}>
                                                    {STATUS_CONFIG[ticket.status].label}
                                                </span>
                                            </div>
                                        </div>
                                        <p className="mt-2 text-xs text-zinc-400 line-clamp-1">{ticket.message}</p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {selectedTicket && (
                        <div className="w-96 bg-zinc-900 border border-zinc-800 rounded-xl p-4 space-y-4">
                            <div className="flex items-center justify-between">
                                <h2 className="font-bold">Detalles</h2>
                                <button onClick={() => setSelectedTicket(null)} className="text-zinc-400">✕</button>
                            </div>

                            <div>
                                <p className="text-xs text-zinc-500">ID</p>
                                <p className="font-mono text-sm">{selectedTicket.ticket_id}</p>
                            </div>

                            <div>
                                <p className="text-xs text-zinc-500">Email</p>
                                <p className="text-sm">{selectedTicket.email}</p>
                            </div>

                            {selectedTicket.wallet_address && (
                                <div>
                                    <p className="text-xs text-zinc-500">Wallet</p>
                                    <p className="font-mono text-xs text-zinc-400 break-all">{selectedTicket.wallet_address}</p>
                                </div>
                            )}

                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <p className="text-xs text-zinc-500 mb-1">Estado</p>
                                    <select
                                        value={selectedTicket.status}
                                        onChange={(e) => updateTicket({ status: e.target.value })}
                                        className="w-full px-2 py-1.5 bg-zinc-800 border border-zinc-700 rounded text-sm"
                                    >
                                        <option value="new">🔵 Nuevo</option>
                                        <option value="in-progress">🟡 En Curso</option>
                                        <option value="resolved">🟢 Resuelto</option>
                                        <option value="closed">⚫ Cerrado</option>
                                    </select>
                                </div>
                                <div>
                                    <p className="text-xs text-zinc-500 mb-1">Prioridad</p>
                                    <select
                                        value={selectedTicket.priority}
                                        onChange={(e) => updateTicket({ priority: e.target.value })}
                                        className="w-full px-2 py-1.5 bg-zinc-800 border border-zinc-700 rounded text-sm"
                                    >
                                        <option value="low">⚪ Baja</option>
                                        <option value="medium">🟡 Media</option>
                                        <option value="high">🔴 Alta</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <p className="text-xs text-zinc-500 mb-1">Mensaje</p>
                                <div className="bg-zinc-800 rounded p-2 text-sm text-zinc-300 max-h-32 overflow-y-auto">
                                    {selectedTicket.message}
                                </div>
                            </div>

                            <div>
                                <p className="text-xs text-zinc-500 mb-1">Notas internas</p>
                                <textarea
                                    value={editNotes}
                                    onChange={(e) => setEditNotes(e.target.value)}
                                    onBlur={() => updateTicket({ internal_notes: editNotes })}
                                    placeholder="Solo visible para admin..."
                                    className="w-full px-2 py-1.5 bg-zinc-800 border border-zinc-700 rounded text-sm h-16 resize-none"
                                />
                            </div>

                            <div>
                                <p className="text-xs text-zinc-500 mb-1">Respuesta al usuario</p>
                                <textarea
                                    value={editReply}
                                    onChange={(e) => setEditReply(e.target.value)}
                                    placeholder="Se enviará por email al resolver..."
                                    className="w-full px-2 py-1.5 bg-zinc-800 border border-zinc-700 rounded text-sm h-16 resize-none"
                                />
                                <button
                                    onClick={() => updateTicket({ admin_reply: editReply, status: 'resolved' })}
                                    className="mt-2 w-full py-2 bg-emerald-500/20 text-emerald-400 rounded text-sm"
                                >
                                    ✅ Resolver y enviar respuesta
                                </button>
                            </div>

                            <div className="pt-2 border-t border-zinc-800 flex gap-2">
                                <a
                                    href={`mailto:${selectedTicket.email}?subject=Re: Ticket ${selectedTicket.ticket_id}`}
                                    className="flex-1 py-2 bg-pink-500/20 text-pink-400 rounded text-center text-sm"
                                >
                                    📧 Email
                                </a>
                                <button onClick={deleteTicket} className="px-4 py-2 bg-red-500/20 text-red-400 rounded text-sm">
                                    🗑️
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
