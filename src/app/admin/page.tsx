'use client';

import { useState, useEffect } from 'react';

interface DashboardStats {
    totalUsers: number;
    verifiedUsers: number;
    newUsersToday: number;
    countries: { country: string; count: number }[];
    growth: { date: string; count: number }[];
}

export default function AdminDashboard() {
    const [authenticated, setAuthenticated] = useState(false);
    const [password, setPassword] = useState('');
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const authenticate = async () => {
        setLoading(true);
        setError('');
        try {
            const res = await fetch('/api/analytics?stat=overview', {
                headers: { 'Authorization': `Bearer ${password}` }
            });
            if (res.ok) {
                setAuthenticated(true);
                await loadStats();
            } else {
                setError('Invalid password');
            }
        } catch {
            setError('Connection error');
        }
        setLoading(false);
    };

    const loadStats = async () => {
        try {
            const [overview, countries, growth] = await Promise.all([
                fetch('/api/analytics?stat=overview', { headers: { 'Authorization': `Bearer ${password}` } }).then(r => r.json()),
                fetch('/api/analytics?stat=countries', { headers: { 'Authorization': `Bearer ${password}` } }).then(r => r.json()),
                fetch('/api/analytics?stat=growth', { headers: { 'Authorization': `Bearer ${password}` } }).then(r => r.json())
            ]);
            setStats({
                totalUsers: overview.totalUsers || 0,
                verifiedUsers: overview.verifiedUsers || 0,
                newUsersToday: overview.newUsersToday || 0,
                countries: countries.countries || [],
                growth: growth.growth || []
            });
        } catch {
            console.error('Failed to load stats');
        }
    };

    // Login Screen
    if (!authenticated) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-zinc-900 via-black to-zinc-900 flex items-center justify-center p-4">
                <div className="w-full max-w-md">
                    <div className="bg-zinc-900/80 backdrop-blur-xl border border-zinc-800 rounded-2xl p-8 shadow-2xl">
                        <div className="text-center mb-8">
                            <div className="w-16 h-16 bg-gradient-to-br from-pink-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                <span className="text-2xl">🔐</span>
                            </div>
                            <h1 className="text-2xl font-bold text-white">OrbId Admin</h1>
                            <p className="text-zinc-400 mt-2">Analytics Dashboard</p>
                        </div>

                        <div className="space-y-4">
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && authenticate()}
                                placeholder="Admin Secret"
                                className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-pink-500 transition-colors"
                            />
                            {error && <p className="text-red-400 text-sm text-center">{error}</p>}
                            <button
                                onClick={authenticate}
                                disabled={loading || !password}
                                className="w-full py-3 bg-gradient-to-r from-pink-500 to-purple-600 text-white font-semibold rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50"
                            >
                                {loading ? 'Authenticating...' : 'Login'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Dashboard
    return (
        <div className="min-h-screen bg-gradient-to-br from-zinc-900 via-black to-zinc-900 p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-white">Analytics Dashboard</h1>
                        <p className="text-zinc-400 mt-1">OrbId Wallet Metrics</p>
                    </div>
                    <button
                        onClick={loadStats}
                        className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg transition-colors"
                    >
                        ↻ Refresh
                    </button>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <StatCard
                        title="Total Users"
                        value={stats?.totalUsers || 0}
                        icon="👥"
                        color="from-blue-500 to-cyan-500"
                    />
                    <StatCard
                        title="Verified Humans"
                        value={stats?.verifiedUsers || 0}
                        icon="✓"
                        color="from-green-500 to-emerald-500"
                        subtitle={stats ? `${((stats.verifiedUsers / stats.totalUsers) * 100 || 0).toFixed(1)}% verified` : undefined}
                    />
                    <StatCard
                        title="New Today"
                        value={stats?.newUsersToday || 0}
                        icon="📈"
                        color="from-pink-500 to-purple-500"
                    />
                </div>

                {/* Charts Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Growth Chart */}
                    <div className="bg-zinc-900/80 backdrop-blur-xl border border-zinc-800 rounded-2xl p-6">
                        <h2 className="text-lg font-semibold text-white mb-4">User Growth (Last 30 Days)</h2>
                        <div className="h-64 flex items-end gap-1">
                            {(stats?.growth || []).slice(-30).map((day, i) => (
                                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                                    <div
                                        className="w-full bg-gradient-to-t from-pink-500 to-purple-500 rounded-t"
                                        style={{ height: `${Math.max(4, (day.count / Math.max(...(stats?.growth || []).map(d => d.count), 1)) * 200)}px` }}
                                    />
                                    {i % 7 === 0 && (
                                        <span className="text-[10px] text-zinc-500">
                                            {new Date(day.date).getDate()}
                                        </span>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Countries */}
                    <div className="bg-zinc-900/80 backdrop-blur-xl border border-zinc-800 rounded-2xl p-6">
                        <h2 className="text-lg font-semibold text-white mb-4">Top Countries</h2>
                        <div className="space-y-3">
                            {(stats?.countries || []).slice(0, 8).map((country, i) => (
                                <div key={i} className="flex items-center gap-3">
                                    <span className="text-xl">{getFlagEmoji(country.country)}</span>
                                    <span className="flex-1 text-white">{country.country || 'Unknown'}</span>
                                    <span className="text-zinc-400">{country.count}</span>
                                    <div className="w-24 h-2 bg-zinc-800 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-gradient-to-r from-pink-500 to-purple-500"
                                            style={{ width: `${(country.count / (stats?.countries[0]?.count || 1)) * 100}%` }}
                                        />
                                    </div>
                                </div>
                            ))}
                            {(!stats?.countries || stats.countries.length === 0) && (
                                <p className="text-zinc-500 text-center py-8">No data yet</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function StatCard({ title, value, icon, color, subtitle }: { title: string; value: number; icon: string; color: string; subtitle?: string }) {
    return (
        <div className="bg-zinc-900/80 backdrop-blur-xl border border-zinc-800 rounded-2xl p-6 relative overflow-hidden">
            <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${color} opacity-10 rounded-full -translate-y-1/2 translate-x-1/2`} />
            <div className="flex items-start justify-between">
                <div>
                    <p className="text-zinc-400 text-sm">{title}</p>
                    <p className="text-4xl font-bold text-white mt-1">{value.toLocaleString()}</p>
                    {subtitle && <p className="text-zinc-500 text-sm mt-1">{subtitle}</p>}
                </div>
                <div className={`w-12 h-12 bg-gradient-to-br ${color} rounded-xl flex items-center justify-center text-xl`}>
                    {icon}
                </div>
            </div>
        </div>
    );
}

function getFlagEmoji(countryName: string): string {
    const flags: Record<string, string> = {
        'Colombia': '🇨🇴', 'United States': '🇺🇸', 'Mexico': '🇲🇽', 'Argentina': '🇦🇷',
        'Brazil': '🇧🇷', 'Spain': '🇪🇸', 'Germany': '🇩🇪', 'France': '🇫🇷',
        'United Kingdom': '🇬🇧', 'Canada': '🇨🇦', 'Japan': '🇯🇵', 'China': '🇨🇳',
        'India': '🇮🇳', 'Australia': '🇦🇺', 'Italy': '🇮🇹', 'Netherlands': '🇳🇱',
    };
    return flags[countryName] || '🌍';
}
