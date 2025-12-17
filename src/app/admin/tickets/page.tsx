'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface SupportTicket {
    id: string;
    email: string;
    topic: string;
    message: string;
    status: 'new' | 'in-progress' | 'resolved' | 'closed';
    walletAddress?: string;
    createdAt: string;
    updatedAt: string;
    resolvedAt?: string;
}

const STATUS_CONFIG = {
    'new': { label: 'Nuevo', color: 'bg-blue-500', textColor: 'text-blue-400' },
    'in-progress': { label: 'En Curso', color: 'bg-yellow-500', textColor: 'text-yellow-400' },
    'resolved': { label: 'Resuelto', color: 'bg-emerald-500', textColor: 'text-emerald-400' },
    'closed': { label: 'Cerrado', color: 'bg-zinc-500', textColor: 'text-zinc-400' },
};

const TOPIC_ICONS: Record<string, string> = {
    'general': '❓',
    'transactions': '💸',
    'account': '👤',
    'security': '🔐',
    'other': '📝',
};

export default function AdminTicketsPage() {
    const [authenticated, setAuthenticated] = useState(false);
    const [password, setPassword] = useState('');
    const [tickets, setTickets] = useState<SupportTicket[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
    const [filter, setFilter] = useState<string>('all');
    const [error, setError] = useState('');

    const loadTickets = useCallback(async () => {
        if (!password) return;

        setLoading(true);
        try {
            const res = await fetch('/api/support', {
                headers: { 'Authorization': `Bearer ${password}` }
            });

            if (res.ok) {
                const data = await res.json();
                setTickets(data.tickets || []);
            }
        } catch (err) {
            console.error('Failed to load tickets:', err);
        } finally {
            setLoading(false);
        }
    }, [password]);

    const authenticate = async () => {
        setLoading(true);
        setError('');

        try {
            const res = await fetch('/api/support', {
                headers: { 'Authorization': `Bearer ${password}` }
            });

            if (res.ok) {
                setAuthenticated(true);
                await loadTickets();
            } else {
                setError('Contraseña incorrecta');
            }
        } catch {
            setError('Error de conexión');
        }
        setLoading(false);
    };

    const updateTicketStatus = async (ticketId: string, newStatus: string) => {
        try {
            const res = await fetch('/api/support', {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${password}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ ticketId, status: newStatus })
            });

            if (res.ok) {
                await loadTickets();
                if (selectedTicket?.id === ticketId) {
                    const data = await res.json();
                    setSelectedTicket(data.ticket);
                }
            }
        } catch (err) {
            console.error('Failed to update ticket:', err);
        }
    };

    const deleteTicket = async (ticketId: string) => {
        if (!confirm('¿Estás seguro de eliminar este ticket?')) return;

        try {
            await fetch(`/api/support?id=${ticketId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${password}` }
            });
            await loadTickets();
            setSelectedTicket(null);
        } catch (err) {
            console.error('Failed to delete ticket:', err);
        }
    };

    const filteredTickets = filter === 'all'
        ? tickets
        : tickets.filter(t => t.status === filter);

    const stats = {
        total: tickets.length,
        new: tickets.filter(t => t.status === 'new').length,
        inProgress: tickets.filter(t => t.status === 'in-progress').length,
        resolved: tickets.filter(t => t.status === 'resolved').length,
    };

    // Login Screen
    if (!authenticated) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center p-4">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="w-full max-w-md"
                >
                    <div className="bg-zinc-900/80 backdrop-blur-xl border border-zinc-800 rounded-2xl p-8 shadow-2xl">
                        <div className="text-center mb-8">
                            <div className="w-16 h-16 bg-gradient-to-br from-pink-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                <span className="text-3xl">🎫</span>
                            </div>
                            <h1 className="text-2xl font-bold text-white">Tickets de Soporte</h1>
                            <p className="text-zinc-400 mt-2">Panel de administración</p>
                        </div>

                        <form onSubmit={(e) => { e.preventDefault(); authenticate(); }}>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Contraseña de admin"
                                className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-pink-500 transition-colors mb-4"
                            />
                            {error && (
                                <p className="text-red-400 text-sm mb-4">{error}</p>
                            )}
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full py-3 bg-gradient-to-r from-pink-500 to-purple-600 rounded-xl font-semibold text-white hover:opacity-90 transition-opacity disabled:opacity-50"
                            >
                                {loading ? 'Cargando...' : 'Acceder'}
                            </button>
                        </form>
                    </div>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-black text-white p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold">🎫 Tickets de Soporte</h1>
                        <p className="text-zinc-400">Gestiona las solicitudes de los usuarios</p>
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={loadTickets}
                            className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-xl transition-colors"
                        >
                            🔄 Actualizar
                        </button>
                        <a
                            href="/admin"
                            className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-xl transition-colors"
                        >
                            ← Dashboard
                        </a>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-4 gap-4 mb-8">
                    <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-5">
                        <p className="text-zinc-400 text-sm">Total</p>
                        <p className="text-3xl font-bold text-white">{stats.total}</p>
                    </div>
                    <div className="bg-zinc-900/50 border border-blue-900/50 rounded-2xl p-5">
                        <p className="text-blue-400 text-sm">Nuevos</p>
                        <p className="text-3xl font-bold text-blue-400">{stats.new}</p>
                    </div>
                    <div className="bg-zinc-900/50 border border-yellow-900/50 rounded-2xl p-5">
                        <p className="text-yellow-400 text-sm">En Curso</p>
                        <p className="text-3xl font-bold text-yellow-400">{stats.inProgress}</p>
                    </div>
                    <div className="bg-zinc-900/50 border border-emerald-900/50 rounded-2xl p-5">
                        <p className="text-emerald-400 text-sm">Resueltos</p>
                        <p className="text-3xl font-bold text-emerald-400">{stats.resolved}</p>
                    </div>
                </div>

                {/* Filter Tabs */}
                <div className="flex gap-2 mb-6">
                    {['all', 'new', 'in-progress', 'resolved', 'closed'].map((status) => (
                        <button
                            key={status}
                            onClick={() => setFilter(status)}
                            className={`px-4 py-2 rounded-xl transition-colors ${filter === status
                                    ? 'bg-pink-500/20 text-pink-400 border border-pink-500/50'
                                    : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                                }`}
                        >
                            {status === 'all' ? 'Todos' : STATUS_CONFIG[status as keyof typeof STATUS_CONFIG]?.label || status}
                        </button>
                    ))}
                </div>

                <div className="flex gap-6">
                    {/* Tickets List */}
                    <div className="flex-1 bg-zinc-900/50 border border-zinc-800 rounded-2xl overflow-hidden">
                        {loading ? (
                            <div className="p-8 text-center text-zinc-500">Cargando tickets...</div>
                        ) : filteredTickets.length === 0 ? (
                            <div className="p-8 text-center text-zinc-500">No hay tickets</div>
                        ) : (
                            <div className="divide-y divide-zinc-800">
                                {filteredTickets.map((ticket) => (
                                    <motion.div
                                        key={ticket.id}
                                        onClick={() => setSelectedTicket(ticket)}
                                        whileHover={{ backgroundColor: 'rgba(255,255,255,0.02)' }}
                                        className={`p-4 cursor-pointer transition-colors ${selectedTicket?.id === ticket.id ? 'bg-white/5' : ''
                                            }`}
                                    >
                                        <div className="flex items-start justify-between">
                                            <div className="flex items-center gap-3">
                                                <span className="text-2xl">
                                                    {TOPIC_ICONS[ticket.topic] || '📝'}
                                                </span>
                                                <div>
                                                    <p className="font-medium text-white">{ticket.email}</p>
                                                    <p className="text-sm text-zinc-500">
                                                        {ticket.id} • {new Date(ticket.createdAt).toLocaleDateString('es-ES')}
                                                    </p>
                                                </div>
                                            </div>
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${STATUS_CONFIG[ticket.status].color}/20 ${STATUS_CONFIG[ticket.status].textColor}`}>
                                                {STATUS_CONFIG[ticket.status].label}
                                            </span>
                                        </div>
                                        <p className="mt-2 text-sm text-zinc-400 line-clamp-2">
                                            {ticket.message}
                                        </p>
                                    </motion.div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Ticket Detail */}
                    <AnimatePresence mode="wait">
                        {selectedTicket && (
                            <motion.div
                                key={selectedTicket.id}
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20 }}
                                className="w-96 bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6"
                            >
                                <div className="flex items-center justify-between mb-4">
                                    <h2 className="text-lg font-bold">Detalles del Ticket</h2>
                                    <button
                                        onClick={() => setSelectedTicket(null)}
                                        className="text-zinc-400 hover:text-white"
                                    >
                                        ✕
                                    </button>
                                </div>

                                <div className="space-y-4">
                                    <div>
                                        <p className="text-xs text-zinc-500 mb-1">ID del Ticket</p>
                                        <p className="font-mono text-sm text-white">{selectedTicket.id}</p>
                                    </div>

                                    <div>
                                        <p className="text-xs text-zinc-500 mb-1">Email</p>
                                        <p className="text-white">{selectedTicket.email}</p>
                                    </div>

                                    {selectedTicket.walletAddress && (
                                        <div>
                                            <p className="text-xs text-zinc-500 mb-1">Wallet</p>
                                            <p className="font-mono text-xs text-zinc-400 break-all">
                                                {selectedTicket.walletAddress}
                                            </p>
                                        </div>
                                    )}

                                    <div>
                                        <p className="text-xs text-zinc-500 mb-1">Tema</p>
                                        <p className="text-white capitalize">
                                            {TOPIC_ICONS[selectedTicket.topic]} {selectedTicket.topic}
                                        </p>
                                    </div>

                                    <div>
                                        <p className="text-xs text-zinc-500 mb-1">Estado</p>
                                        <select
                                            value={selectedTicket.status}
                                            onChange={(e) => updateTicketStatus(selectedTicket.id, e.target.value)}
                                            className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:border-pink-500"
                                        >
                                            <option value="new">🔵 Nuevo</option>
                                            <option value="in-progress">🟡 En Curso</option>
                                            <option value="resolved">🟢 Resuelto</option>
                                            <option value="closed">⚫ Cerrado</option>
                                        </select>
                                    </div>

                                    <div>
                                        <p className="text-xs text-zinc-500 mb-1">Mensaje</p>
                                        <div className="bg-zinc-800 rounded-lg p-3 text-sm text-zinc-300 max-h-48 overflow-y-auto">
                                            {selectedTicket.message}
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3 text-xs">
                                        <div>
                                            <p className="text-zinc-500">Creado</p>
                                            <p className="text-white">
                                                {new Date(selectedTicket.createdAt).toLocaleString('es-ES')}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-zinc-500">Actualizado</p>
                                            <p className="text-white">
                                                {new Date(selectedTicket.updatedAt).toLocaleString('es-ES')}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="pt-4 border-t border-zinc-800 flex gap-2">
                                        <a
                                            href={`mailto:${selectedTicket.email}?subject=Re: Ticket ${selectedTicket.id}`}
                                            className="flex-1 py-2 bg-pink-500/20 text-pink-400 rounded-lg text-center hover:bg-pink-500/30 transition-colors"
                                        >
                                            📧 Responder
                                        </a>
                                        <button
                                            onClick={() => deleteTicket(selectedTicket.id)}
                                            className="px-4 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors"
                                        >
                                            🗑️
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
}
