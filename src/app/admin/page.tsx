'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

interface DashboardStats {
    totalUsers: number;
    verifiedUsers: number;
    newUsersToday: number;
    totalLogins: number;
    countries: { country: string; count: number }[];
    cities: { city: string; count: number }[];
    growth: { date: string; count: number; total: number }[];
    devices: { device: string; count: number }[];
    browsers: { browser: string; count: number }[];
    os: { os: string; count: number }[];
    recentUsers: { email: string; wallet: string; username: string; isVerified: boolean; country: string; created: string; logins: number }[];
}

export default function AdminDashboard() {
    const [authenticated, setAuthenticated] = useState(false);
    const [password, setPassword] = useState('');
    const passwordRef = useRef('');
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState('');
    const [showExportModal, setShowExportModal] = useState(false);
    const [exportConfig, setExportConfig] = useState({
        email: true,
        wallet: true,
        username: true,
        verified: true,
        country: true,
        logins: true,
        joined: true
    });

    useEffect(() => {
        passwordRef.current = password;
    }, [password]);

    const loadStats = useCallback(async () => {
        const pwd = passwordRef.current;
        if (!pwd) return;

        setRefreshing(true);
        try {
            const headers = { 'Authorization': `Bearer ${pwd}` };
            const [overview, countries, cities, growth, devices, browsers, os, recentUsers] = await Promise.all([
                fetch('/api/analytics?stat=overview', { headers }).then(r => r.json()),
                fetch('/api/analytics?stat=countries', { headers }).then(r => r.json()),
                fetch('/api/analytics?stat=cities', { headers }).then(r => r.json()),
                fetch('/api/analytics?stat=growth', { headers }).then(r => r.json()),
                fetch('/api/analytics?stat=devices', { headers }).then(r => r.json()),
                fetch('/api/analytics?stat=browsers', { headers }).then(r => r.json()),
                fetch('/api/analytics?stat=os', { headers }).then(r => r.json()),
                fetch('/api/analytics?stat=recent', { headers }).then(r => r.json()).catch(() => ({ users: [] }))
            ]);
            setStats({
                totalUsers: overview.totalUsers || 0,
                verifiedUsers: overview.verifiedUsers || 0,
                newUsersToday: overview.newUsersToday || 0,
                totalLogins: overview.totalLogins || 0,
                countries: countries.countries || [],
                cities: cities.cities || [],
                growth: growth.growth || [],
                devices: devices.devices || [],
                browsers: browsers.browsers || [],
                os: os.os || [],
                recentUsers: recentUsers.users || []
            });
        } catch {
            console.error('Failed to load stats');
        } finally {
            setRefreshing(false);
        }
    }, []);

    const authenticate = async () => {
        setLoading(true);
        setError('');
        try {
            const res = await fetch('/api/analytics?stat=overview', {
                headers: { 'Authorization': `Bearer ${password}` }
            });
            if (res.ok) {
                setAuthenticated(true);
                passwordRef.current = password;
                await loadStats();
            } else {
                setError('Invalid password');
            }
        } catch {
            setError('Connection error');
        }
        setLoading(false);
    };

    const logout = () => {
        setAuthenticated(false);
        setPassword('');
        passwordRef.current = '';
    };

    const downloadCSV = () => {
        if (!stats?.recentUsers) return;

        const headers = [];
        if (exportConfig.email) headers.push('Email');
        if (exportConfig.wallet) headers.push('Wallet');
        if (exportConfig.username) headers.push('Username');
        if (exportConfig.verified) headers.push('Verified');
        if (exportConfig.country) headers.push('Country');
        if (exportConfig.logins) headers.push('Logins');
        if (exportConfig.joined) headers.push('Joined Date');

        const rows = stats.recentUsers.map(user => {
            const row = [];
            if (exportConfig.email) row.push(`"${user.email || ''}"`);
            if (exportConfig.wallet) row.push(`"${user.wallet || ''}"`);
            if (exportConfig.username) row.push(`"${user.username || ''}"`);
            if (exportConfig.verified) row.push(user.isVerified ? 'Yes' : 'No');
            if (exportConfig.country) row.push(`"${user.country || ''}"`);
            if (exportConfig.logins) row.push(user.logins || 0);
            if (exportConfig.joined) row.push(`"${user.created || ''}"`);
            return row.join(',');
        });

        const csvContent = [headers.join(','), ...rows].join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `orbid-users-${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setShowExportModal(false);
    };

    const toggleAllExport = (checked: boolean) => {
        setExportConfig({
            email: checked,
            wallet: checked,
            username: checked,
            verified: checked,
            country: checked,
            logins: checked,
            joined: checked
        });
    };

    // Login Screen
    if (!authenticated) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center p-4">
                <div className="w-full max-w-md">
                    <div className="bg-zinc-900/80 backdrop-blur-xl border border-zinc-800 rounded-2xl p-8 shadow-2xl">
                        <div className="text-center mb-8">
                            <div className="w-16 h-16 bg-gradient-to-br from-pink-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                <LockIcon className="w-8 h-8 text-white" />
                            </div>
                            <h1 className="text-2xl font-bold text-white">OrbId Wallet Admin</h1>
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
                            {error && (
                                <p className="text-red-400 text-sm text-center">
                                    {error}
                                </p>
                            )}
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

    // Loading state after auth
    if (!stats) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <p className="text-zinc-400">Loading dashboard...</p>
            </div>
        );
    }

    // Dashboard
    return (
        <div className="min-h-screen bg-black p-4 md:p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold text-white">Analytics Dashboard</h1>
                        <p className="text-zinc-400 mt-1">OrbId Wallet Metrics</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <a href="/admin/tickets" className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl transition-colors flex items-center gap-2">
                            🎫 Tickets
                        </a>
                        <a href="/admin/notifications" className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl transition-colors flex items-center gap-2">
                            📢 Notificaciones
                        </a>
                        <button
                            onClick={logout}
                            className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 border border-red-500/20 rounded-xl transition-colors flex items-center gap-2"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" /></svg>
                            Logout
                        </button>
                        <button
                            onClick={loadStats}
                            disabled={refreshing}
                            className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl transition-colors disabled:opacity-50 flex items-center gap-2"
                        >
                            <RefreshIcon className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                            {refreshing ? 'Loading...' : 'Refresh'}
                        </button>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    <StatCard
                        title="Total Users"
                        value={stats.totalUsers}
                        icon={<UsersIcon className="w-5 h-5" />}
                        color="from-blue-500 to-cyan-500"
                    />
                    <StatCard
                        title="Verified Humans"
                        value={stats?.verifiedUsers || 0}
                        icon={<CheckIcon className="w-5 h-5" />}
                        color="from-green-500 to-emerald-500"
                        subtitle={stats && stats.totalUsers > 0 ? `${((stats.verifiedUsers / stats.totalUsers) * 100).toFixed(1)}%` : undefined}
                    />
                    <StatCard
                        title="New Today"
                        value={stats?.newUsersToday || 0}
                        icon={<TrendingIcon className="w-5 h-5" />}
                        color="from-pink-500 to-purple-500"
                    />
                    <StatCard
                        title="Total Logins"
                        value={stats?.totalLogins || 0}
                        icon={<LoginIcon className="w-5 h-5" />}
                        color="from-amber-500 to-orange-500"
                    />
                </div>

                {/* Charts Grid - Row 1 */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
                    {/* Growth Chart */}
                    <div className="bg-zinc-900/80 backdrop-blur-xl border border-zinc-800 rounded-2xl p-4 md:p-6">
                        <div className="flex items-center gap-2 mb-4">
                            <ChartIcon className="w-5 h-5 text-pink-400" />
                            <h2 className="text-lg font-semibold text-white">User Growth (Cumulative)</h2>
                        </div>
                        <div className="h-48 flex items-end gap-0.5 w-full relative group">
                            {(stats?.growth || []).map((day, i, arr) => {
                                const maxTotal = arr[arr.length - 1]?.total || 1;
                                const heightPercent = (day.total / maxTotal) * 100;
                                return (
                                    <div
                                        key={i}
                                        className="flex-1 flex flex-col items-center gap-1 group/bar relative"
                                    >
                                        <div
                                            className="w-full bg-gradient-to-t from-pink-500/50 to-purple-500/50 hover:from-pink-500 hover:to-purple-500 transition-colors rounded-t"
                                            style={{ height: `${heightPercent}%`, minHeight: '4px' }}
                                        >
                                            <div className="opacity-0 group-hover/bar:opacity-100 absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-zinc-800 text-white text-xs px-2 py-1 rounded whitespace-nowrap z-10 pointer-events-none border border-zinc-700">
                                                {day.date}: {day.total} users (+{day.count})
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                            {(!stats?.growth || stats.growth.length === 0) && (
                                <div className="absolute inset-0 flex items-center justify-center text-zinc-500">
                                    No growth data
                                </div>
                            )}
                        </div>
                        <div className="flex justify-between mt-2 text-xs text-zinc-500">
                            <span>{stats?.growth?.[0]?.date || ''}</span>
                            <span>{stats?.growth?.[stats.growth.length - 1]?.date || ''}</span>
                        </div>
                    </div>

                    {/* Countries */}
                    <div className="bg-zinc-900/80 backdrop-blur-xl border border-zinc-800 rounded-2xl p-4 md:p-6">
                        <div className="flex items-center gap-2 mb-4">
                            <GlobeIcon className="w-5 h-5 text-cyan-400" />
                            <h2 className="text-lg font-semibold text-white">Top Countries</h2>
                        </div>
                        <div className="space-y-2 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
                            {(stats?.countries || []).map((country, i) => (
                                <div
                                    key={i}
                                    className="flex items-center gap-3"
                                >
                                    <span className="text-lg">{getFlagEmoji(country.country)}</span>
                                    <span className="flex-1 text-white text-sm truncate">{country.country || 'Unknown'}</span>
                                    <span className="text-zinc-400 text-sm">{country.count}</span>
                                    <div className="w-16 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-gradient-to-r from-pink-500 to-purple-500"
                                            style={{ width: `${(country.count / (stats?.countries[0]?.count || 1)) * 100}%` }}
                                        />
                                    </div>
                                </div>
                            ))}
                            {(!stats?.countries || stats.countries.length === 0) && (
                                <p className="text-zinc-500 text-center py-6">No data yet</p>
                            )}
                        </div>
                    </div>

                    {/* Cities */}
                    <div className="bg-zinc-900/80 backdrop-blur-xl border border-zinc-800 rounded-2xl p-4 md:p-6">
                        <div className="flex items-center gap-2 mb-4">
                            <LocationIcon className="w-5 h-5 text-rose-400" />
                            <h2 className="text-lg font-semibold text-white">Top Cities</h2>
                        </div>
                        <div className="space-y-2 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
                            {(stats?.cities || []).map((city, i) => (
                                <div
                                    key={i}
                                    className="flex items-center gap-3"
                                >
                                    <span className="text-rose-400">📍</span>
                                    <span className="flex-1 text-white text-sm truncate">{city.city}</span>
                                    <span className="text-zinc-400 text-sm">{city.count}</span>
                                    <div className="w-16 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-gradient-to-r from-rose-500 to-pink-500"
                                            style={{ width: `${(city.count / (stats?.cities[0]?.count || 1)) * 100}%` }}
                                        />
                                    </div>
                                </div>
                            ))}
                            {(!stats?.cities || stats.cities.length === 0) && (
                                <p className="text-zinc-500 text-center py-6">No data yet</p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Charts Grid - Row 2: Devices, Browsers, OS */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <DistributionCard
                        title="Devices"
                        icon={<DevicesIcon className="w-5 h-5 text-cyan-400" />}
                        data={(stats?.devices || []).map(d => ({ name: d.device, count: d.count }))}
                        color="from-cyan-500 to-blue-500"
                    />
                    <DistributionCard
                        title="Browsers"
                        icon={<BrowserIcon className="w-5 h-5 text-amber-400" />}
                        data={(stats?.browsers || []).map(d => ({ name: d.browser, count: d.count }))}
                        color="from-amber-500 to-orange-500"
                    />
                    <DistributionCard
                        title="Operating Systems"
                        icon={<OSIcon className="w-5 h-5 text-emerald-400" />}
                        data={(stats?.os || []).map(d => ({ name: d.os, count: d.count }))}
                        color="from-emerald-500 to-teal-500"
                    />
                </div>

                {/* All Users Table */}
                <div className="bg-zinc-900/80 backdrop-blur-xl border border-zinc-800 rounded-2xl p-4 md:p-6 flex flex-col h-[500px]">
                    <div className="flex items-center justify-between mb-4 shrink-0">
                        <div className="flex items-center gap-2">
                            <UsersIcon className="w-5 h-5 text-purple-400" />
                            <h2 className="text-lg font-semibold text-white">All Users ({stats?.recentUsers.length || 0})</h2>
                        </div>
                        <button
                            onClick={() => setShowExportModal(true)}
                            className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-white text-sm rounded-lg border border-zinc-700 transition-colors flex items-center gap-2"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                            Export CSV
                        </button>
                    </div>
                    <div className="overflow-auto custom-scrollbar flex-1 -mr-2 pr-2">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="text-zinc-400 border-b border-zinc-800">
                                    <th className="text-left py-2 px-2">User</th>
                                    <th className="text-left py-2 px-2">Wallet</th>
                                    <th className="text-left py-2 px-2">Email</th>
                                    <th className="text-left py-2 px-2">Country</th>
                                    <th className="text-left py-2 px-2">Logins</th>
                                    <th className="text-left py-2 px-2 font-medium">Verified</th>
                                    <th className="text-left py-2 px-2">Joined</th>
                                </tr>
                            </thead>
                            <tbody>
                                {(stats?.recentUsers || []).map((user, i) => (
                                    <tr
                                        key={i}
                                        className="border-b border-zinc-800/50 hover:bg-zinc-800/30"
                                    >
                                        <td className="py-2 px-2">
                                            <div className="flex flex-col">
                                                <span className="text-white font-medium">{user.username || 'Anonymous'}</span>
                                            </div>
                                        </td>
                                        <td className="py-2 px-2 text-zinc-400 font-mono text-xs">
                                            {user.wallet ? `${user.wallet.slice(0, 6)}...${user.wallet.slice(-4)}` : '—'}
                                        </td>
                                        <td className="py-2 px-2 text-zinc-500 text-xs truncate max-w-[120px]">{user.email || '—'}</td>
                                        <td className="py-2 px-2">
                                            {user.country ? (
                                                <span className="flex items-center gap-1">
                                                    <span>{getFlagEmoji(user.country)}</span>
                                                    <span className="text-zinc-400 text-xs">{user.country}</span>
                                                </span>
                                            ) : '—'}
                                        </td>
                                        <td className="py-2 px-2 text-zinc-400 text-xs text-center">{user.logins || 1}</td>
                                        <td className="py-2 px-2">
                                            {user.isVerified ? (
                                                <span className="px-2 py-0.5 bg-green-500/10 text-green-400 text-[10px] font-bold rounded-full border border-green-500/20 uppercase tracking-tighter">Verified</span>
                                            ) : (
                                                <span className="px-2 py-0.5 bg-zinc-800 text-zinc-500 text-[10px] font-bold rounded-full border border-zinc-700/50 uppercase tracking-tighter">Standard</span>
                                            )}
                                        </td>
                                        <td className="py-2 px-2 text-zinc-500 text-xs">{formatDate(user.created)}</td>
                                    </tr>
                                ))}
                                {(!stats?.recentUsers || stats.recentUsers.length === 0) && (
                                    <tr>
                                        <td colSpan={5} className="py-8 text-center text-zinc-500">No users yet</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Export Modal */}
            {showExportModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80">
                    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 w-full max-w-sm shadow-2xl">
                        <h3 className="text-xl font-bold text-white mb-4">Export Users CSV</h3>
                        <div className="space-y-4 mb-6">
                            <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
                                <span className="text-zinc-400 text-sm">Select Columns</span>
                                <button
                                    onClick={() => {
                                        const allSelected = Object.values(exportConfig).every(Boolean);
                                        toggleAllExport(!allSelected);
                                    }}
                                    className="text-pink-400 text-sm hover:underline"
                                >
                                    {Object.values(exportConfig).every(Boolean) ? 'Deselect All' : 'Select All'}
                                </button>
                            </div>
                            <div className="space-y-2">
                                {Object.entries(exportConfig).map(([key, value]) => (
                                    <label key={key} className="flex items-center gap-3 cursor-pointer group">
                                        <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${value ? 'bg-pink-500 border-pink-500' : 'border-zinc-600 group-hover:border-zinc-500'}`}>
                                            {value && <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                                        </div>
                                        <input
                                            type="checkbox"
                                            className="hidden"
                                            checked={value}
                                            onChange={(e) => setExportConfig(prev => ({ ...prev, [key]: e.target.checked }))}
                                        />
                                        <span className="text-zinc-300 capitalize">{key}</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowExportModal(false)}
                                className="flex-1 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={downloadCSV}
                                disabled={!Object.values(exportConfig).some(Boolean)}
                                className="flex-1 py-2 bg-gradient-to-r from-pink-500 to-purple-600 text-white font-semibold rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50"
                            >
                                Download
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// Components
function StatCard({ title, value, icon, color, subtitle }: { title: string; value: number; icon: React.ReactNode; color: string; subtitle?: string }) {
    return (
        <div className="bg-zinc-900/80 backdrop-blur-xl border border-zinc-800 rounded-2xl p-4 md:p-6 relative overflow-hidden transition-transform hover:scale-[1.02]">
            <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br ${color} opacity-10 rounded-full -translate-y-1/2 translate-x-1/2`} />
            <div className="flex items-start justify-between">
                <div>
                    <p className="text-zinc-400 text-sm">{title}</p>
                    <p className="text-2xl md:text-3xl font-bold text-white mt-1">
                        {value.toLocaleString()}
                    </p>
                    {subtitle && <p className="text-zinc-500 text-xs mt-1">{subtitle}</p>}
                </div>
                <div className={`w-10 h-10 bg-gradient-to-br ${color} rounded-xl flex items-center justify-center text-white`}>
                    {icon}
                </div>
            </div>
        </div>
    );
}

function DistributionCard({ title, icon, data, color }: { title: string; icon: React.ReactNode; data: { name: string; count: number }[]; color: string }) {
    const max = data[0]?.count || 1;
    return (
        <div className="bg-zinc-900/80 backdrop-blur-xl border border-zinc-800 rounded-2xl p-4 md:p-6">
            <div className="flex items-center gap-2 mb-4">
                {icon}
                <h2 className="text-lg font-semibold text-white">{title}</h2>
            </div>
            <div className="space-y-3">
                {data.map((item, i) => (
                    <div
                        key={i}
                        className="flex items-center justify-between"
                    >
                        <span className="text-white capitalize text-sm">{item.name}</span>
                        <div className="flex items-center gap-2">
                            <div className="w-20 h-2 bg-zinc-800 rounded-full overflow-hidden">
                                <div
                                    style={{ width: `${(item.count / max) * 100}%` }}
                                    className={`h-full bg-gradient-to-r ${color} transition-all duration-500`}
                                />
                            </div>
                            <span className="text-zinc-400 text-sm w-8 text-right">{item.count}</span>
                        </div>
                    </div>
                ))}
                {data.length === 0 && <p className="text-zinc-500 text-center py-4">No data</p>}
            </div>
        </div>
    );
}

function formatDate(dateStr: string): string {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function getFlagEmoji(countryName: string): string {
    const countryToCodes: Record<string, string> = {
        "Afghanistan": "AF", "Åland Islands": "AX", "Albania": "AL", "Algeria": "DZ", "American Samoa": "AS",
        "Andorra": "AD", "Angola": "AO", "Anguilla": "AI", "Antarctica": "AQ", "Antigua and Barbuda": "AG",
        "Argentina": "AR", "Armenia": "AM", "Aruba": "AW", "Australia": "AU", "Austria": "AT",
        "Azerbaijan": "AZ", "Bahamas": "BS", "Bahrain": "BH", "Bangladesh": "BD", "Barbados": "BB",
        "Belarus": "BY", "Belgium": "BE", "Belize": "BZ", "Benin": "BJ", "Bermuda": "BM",
        "Bhutan": "BT", "Bolivia": "BO", "Bolivia, Plurinational State of": "BO", "Bonaire, Sint Eustatius and Saba": "BQ", "Bosnia and Herzegovina": "BA",
        "Botswana": "BW", "Bouvet Island": "BV", "Brazil": "BR", "British Indian Ocean Territory": "IO", "Brunei Darussalam": "BN",
        "Bulgaria": "BG", "Burkina Faso": "BF", "Burundi": "BI", "Cabo Verde": "CV", "Cambodia": "KH",
        "Cameroon": "CM", "Canada": "CA", "Cayman Islands": "KY", "Central African Republic": "CF", "Chad": "TD",
        "Chile": "CL", "China": "CN", "Christmas Island": "CX", "Cocos (Keeling) Islands": "CC", "Colombia": "CO",
        "Comoros": "KM", "Congo": "CG", "Congo, Democratic Republic of the": "CD", "Cook Islands": "CK", "Costa Rica": "CR",
        "Côte d'Ivoire": "CI", "Croatia": "HR", "Cuba": "CU", "Curaçao": "CW", "Cyprus": "CY",
        "Czech Republic": "CZ", "Czechia": "CZ", "Denmark": "DK", "Djibouti": "DJ", "Dominica": "DM",
        "Dominican Republic": "DO", "Ecuador": "EC", "Egypt": "EG", "El Salvador": "SV", "Equatorial Guinea": "GQ",
        "Eritrea": "ER", "Estonia": "EE", "Eswatini": "SZ", "Ethiopia": "ET", "Falkland Islands (Malvinas)": "FK",
        "Faroe Islands": "FO", "Fiji": "FJ", "Finland": "FI", "France": "FR", "French Guiana": "GF",
        "French Polynesia": "PF", "French Southern Territories": "TF", "Gabon": "GA", "Gambia": "GM", "Georgia": "GE",
        "Germany": "DE", "Ghana": "GH", "Gibraltar": "GI", "Greece": "GR", "Greenland": "GL",
        "Grenada": "GD", "Guadeloupe": "GP", "Guam": "GU", "Guatemala": "GT", "Guernsey": "GG",
        "Guinea": "GN", "Guinea-Bissau": "GW", "Guyana": "GY", "Haiti": "HT", "Heard Island and McDonald Islands": "HM",
        "Holy See": "VA", "Honduras": "HN", "Hong Kong": "HK", "Hungary": "HU", "Iceland": "IS",
        "India": "IN", "Indonesia": "ID", "Iran": "IR", "Iran, Islamic Republic of": "IR", "Iraq": "IQ",
        "Ireland": "IE", "Isle of Man": "IM", "Israel": "IL", "Italy": "IT", "Jamaica": "JM",
        "Japan": "JP", "Jersey": "JE", "Jordan": "JO", "Kazakhstan": "KZ", "Kenya": "KE",
        "Kiribati": "KI", "Korea, Democratic People's Republic of": "KP", "Korea, Republic of": "KR", "South Korea": "KR", "Kuwait": "KW",
        "Kyrgyzstan": "KG", "Lao People's Democratic Republic": "LA", "Laos": "LA", "Latvia": "LV", "Lebanon": "LB",
        "Lesotho": "LS", "Liberia": "LR", "Libya": "LY", "Liechtenstein": "LI", "Lithuania": "LT",
        "Luxembourg": "LU", "Macao": "MO", "Madagascar": "MG", "Malawi": "MW", "Malaysia": "MY",
        "Maldives": "MV", "Mali": "ML", "Malta": "MT", "Marshall Islands": "MH", "Martinique": "MQ",
        "Mauritania": "MR", "Mauritius": "MU", "Mayotte": "YT", "Mexico": "MX", "Micronesia, Federated States of": "FM",
        "Moldova, Republic of": "MD", "Monaco": "MC", "Mongolia": "MN", "Montenegro": "ME", "Montserrat": "MS",
        "Morocco": "MA", "Mozambique": "MZ", "Myanmar": "MM", "Namibia": "NA", "Nauru": "NR",
        "Nepal": "NP", "Netherlands": "NL", "Netherlands, Kingdom of the": "NL", "New Caledonia": "NC", "New Zealand": "NZ",
        "Nicaragua": "NI", "Niger": "NE", "Nigeria": "NG", "Niue": "NU", "Norfolk Island": "NF",
        "North Macedonia": "MK", "Northern Mariana Islands": "MP", "Norway": "NO", "Oman": "OM", "Pakistan": "PK",
        "Palau": "PW", "Palestine, State of": "PS", "Panama": "PA", "Papua New Guinea": "PG", "Paraguay": "PY",
        "Peru": "PE", "Philippines": "PH", "Pitcairn": "PN", "Poland": "PL", "Portugal": "PT",
        "Puerto Rico": "PR", "Qatar": "QA", "Réunion": "RE", "Romania": "RO", "Russia": "RU",
        "Russian Federation": "RU", "Rwanda": "RW", "Saint Barthélemy": "BL", "Saint Helena, Ascension and Tristan da Cunha": "SH",
        "Saint Kitts and Nevis": "KN", "Saint Lucia": "LC", "Saint Martin (French part)": "MF", "Saint Pierre and Miquelon": "PM",
        "Saint Vincent and the Grenadines": "VC", "Samoa": "WS", "San Marino": "SM", "Sao Tome and Principe": "ST",
        "Saudi Arabia": "SA", "Senegal": "SN", "Serbia": "RS", "Seychelles": "SC", "Sierra Leone": "SL",
        "Singapore": "SG", "Sint Maarten (Dutch part)": "SX", "Slovakia": "SK", "Slovenia": "SI", "Solomon Islands": "SB",
        "Somalia": "SO", "South Africa": "ZA", "South Georgia and the South Sandwich Islands": "GS", "South Sudan": "SS", "Spain": "ES",
        "Sri Lanka": "LK", "Sudan": "SD", "Suriname": "SR", "Svalbard and Jan Mayen": "SJ", "Sweden": "SE",
        "Switzerland": "CH", "Syrian Arab Republic": "SY", "Syria": "SY", "Taiwan": "TW", "Taiwan, Province of China": "TW",
        "Tajikistan": "TJ", "Tanzania": "TZ", "Tanzania, United Republic of": "TZ", "Thailand": "TH", "Timor-Leste": "TL",
        "Togo": "TG", "Tokelau": "TK", "Tonga": "TO", "Trinidad and Tobago": "TT", "Tunisia": "TN",
        "Turkey": "TR", "Türkiye": "TR", "Turkmenistan": "TM", "Turks and Caicos Islands": "TC", "Tuvalu": "TV",
        "Uganda": "UG", "Ukraine": "UA", "United Arab Emirates": "AE", "United Kingdom": "GB", "United Kingdom of Great Britain and Northern Ireland": "GB",
        "United States": "US", "United States of America": "US", "United States Minor Outlying Islands": "UM", "Uruguay": "UY", "Uzbekistan": "UZ",
        "Vanuatu": "VU", "Venezuela": "VE", "Venezuela, Bolivarian Republic of": "VE", "Viet Nam": "VN", "Vietnam": "VN",
        "Virgin Islands (British)": "VG", "Virgin Islands (U.S.)": "VI", "Wallis and Futuna": "WF", "Western Sahara": "EH", "Yemen": "YE",
        "Zambia": "ZM", "Zimbabwe": "ZW"
    };
    const code = countryToCodes[countryName];
    if (code) {
        const codePoints = [...code.toUpperCase()].map(c => 0x1F1E6 + c.charCodeAt(0) - 65);
        // eslint-disable-next-line
        return String.fromCodePoint(...codePoints);
    }
    return '🌍';
}

// SVG Icons
const LockIcon = ({ className }: { className?: string }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
    </svg>
);

const RefreshIcon = ({ className }: { className?: string }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
    </svg>
);

const UsersIcon = ({ className }: { className?: string }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
);

const CheckIcon = ({ className }: { className?: string }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);

const TrendingIcon = ({ className }: { className?: string }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
    </svg>
);

const LoginIcon = ({ className }: { className?: string }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
    </svg>
);

const ChartIcon = ({ className }: { className?: string }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
);

const GlobeIcon = ({ className }: { className?: string }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);

const DevicesIcon = ({ className }: { className?: string }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
    </svg>
);

const BrowserIcon = ({ className }: { className?: string }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
    </svg>
);

const OSIcon = ({ className }: { className?: string }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
);

const LocationIcon = ({ className }: { className?: string }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
);
