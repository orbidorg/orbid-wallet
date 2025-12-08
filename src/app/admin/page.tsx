'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

interface DashboardStats {
    totalUsers: number;
    verifiedUsers: number;
    newUsersToday: number;
    countries: { country: string; count: number }[];
    growth: { date: string; count: number }[];
    devices: { device: string; count: number }[];
    browsers: { browser: string; count: number }[];
    os: { os: string; count: number }[];
}

export default function AdminDashboard() {
    const [authenticated, setAuthenticated] = useState(false);
    const [password, setPassword] = useState('');
    const passwordRef = useRef('');
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        passwordRef.current = password;
    }, [password]);

    const loadStats = useCallback(async () => {
        const pwd = passwordRef.current;
        if (!pwd) return;

        setRefreshing(true);
        try {
            const headers = { 'Authorization': `Bearer ${pwd}` };
            const [overview, countries, growth, devices, browsers, os] = await Promise.all([
                fetch('/api/analytics?stat=overview', { headers }).then(r => r.json()),
                fetch('/api/analytics?stat=countries', { headers }).then(r => r.json()),
                fetch('/api/analytics?stat=growth', { headers }).then(r => r.json()),
                fetch('/api/analytics?stat=devices', { headers }).then(r => r.json()),
                fetch('/api/analytics?stat=browsers', { headers }).then(r => r.json()),
                fetch('/api/analytics?stat=os', { headers }).then(r => r.json())
            ]);
            setStats({
                totalUsers: overview.totalUsers || 0,
                verifiedUsers: overview.verifiedUsers || 0,
                newUsersToday: overview.newUsersToday || 0,
                countries: countries.countries || [],
                growth: growth.growth || [],
                devices: devices.devices || [],
                browsers: browsers.browsers || [],
                os: os.os || []
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
        <div className="min-h-screen bg-gradient-to-br from-zinc-900 via-black to-zinc-900 p-4 md:p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold text-white">Analytics Dashboard</h1>
                        <p className="text-zinc-400 mt-1">OrbId Wallet Metrics</p>
                    </div>
                    <button
                        onClick={loadStats}
                        disabled={refreshing}
                        className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
                    >
                        <span className={refreshing ? 'animate-spin' : ''}>↻</span>
                        {refreshing ? 'Loading...' : 'Refresh'}
                    </button>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
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
                        subtitle={stats && stats.totalUsers > 0 ? `${((stats.verifiedUsers / stats.totalUsers) * 100).toFixed(1)}% verified` : undefined}
                    />
                    <StatCard
                        title="New Today"
                        value={stats?.newUsersToday || 0}
                        icon="📈"
                        color="from-pink-500 to-purple-500"
                    />
                </div>

                {/* Charts Grid - Row 1 */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
                    {/* Growth Chart */}
                    <div className="bg-zinc-900/80 backdrop-blur-xl border border-zinc-800 rounded-2xl p-4 md:p-6">
                        <h2 className="text-lg font-semibold text-white mb-4">User Growth (30 Days)</h2>
                        <div className="h-48 flex items-end gap-0.5">
                            {(stats?.growth || []).slice(-30).map((day, i) => (
                                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                                    <div
                                        className="w-full bg-gradient-to-t from-pink-500 to-purple-500 rounded-t"
                                        style={{ height: `${Math.max(4, (day.count / Math.max(...(stats?.growth || []).map(d => d.count), 1)) * 160)}px` }}
                                    />
                                    {i % 7 === 0 && (
                                        <span className="text-[9px] text-zinc-500">
                                            {new Date(day.date).getDate()}
                                        </span>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Countries */}
                    <div className="bg-zinc-900/80 backdrop-blur-xl border border-zinc-800 rounded-2xl p-4 md:p-6">
                        <h2 className="text-lg font-semibold text-white mb-4">Top Countries</h2>
                        <div className="space-y-2">
                            {(stats?.countries || []).slice(0, 6).map((country, i) => (
                                <div key={i} className="flex items-center gap-3">
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
                </div>

                {/* Charts Grid - Row 2: Devices, Browsers, OS */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Devices */}
                    <div className="bg-zinc-900/80 backdrop-blur-xl border border-zinc-800 rounded-2xl p-4 md:p-6">
                        <h2 className="text-lg font-semibold text-white mb-4">📱 Devices</h2>
                        <div className="space-y-3">
                            {(stats?.devices || []).map((item, i) => (
                                <div key={i} className="flex items-center justify-between">
                                    <span className="text-white capitalize">{item.device}</span>
                                    <div className="flex items-center gap-2">
                                        <div className="w-20 h-2 bg-zinc-800 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-gradient-to-r from-cyan-500 to-blue-500"
                                                style={{ width: `${(item.count / (stats?.devices[0]?.count || 1)) * 100}%` }}
                                            />
                                        </div>
                                        <span className="text-zinc-400 text-sm w-8 text-right">{item.count}</span>
                                    </div>
                                </div>
                            ))}
                            {(!stats?.devices || stats.devices.length === 0) && (
                                <p className="text-zinc-500 text-center py-4">No data</p>
                            )}
                        </div>
                    </div>

                    {/* Browsers */}
                    <div className="bg-zinc-900/80 backdrop-blur-xl border border-zinc-800 rounded-2xl p-4 md:p-6">
                        <h2 className="text-lg font-semibold text-white mb-4">🌐 Browsers</h2>
                        <div className="space-y-3">
                            {(stats?.browsers || []).map((item, i) => (
                                <div key={i} className="flex items-center justify-between">
                                    <span className="text-white">{item.browser}</span>
                                    <div className="flex items-center gap-2">
                                        <div className="w-20 h-2 bg-zinc-800 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-gradient-to-r from-orange-500 to-amber-500"
                                                style={{ width: `${(item.count / (stats?.browsers[0]?.count || 1)) * 100}%` }}
                                            />
                                        </div>
                                        <span className="text-zinc-400 text-sm w-8 text-right">{item.count}</span>
                                    </div>
                                </div>
                            ))}
                            {(!stats?.browsers || stats.browsers.length === 0) && (
                                <p className="text-zinc-500 text-center py-4">No data</p>
                            )}
                        </div>
                    </div>

                    {/* OS */}
                    <div className="bg-zinc-900/80 backdrop-blur-xl border border-zinc-800 rounded-2xl p-4 md:p-6">
                        <h2 className="text-lg font-semibold text-white mb-4">💻 Operating Systems</h2>
                        <div className="space-y-3">
                            {(stats?.os || []).map((item, i) => (
                                <div key={i} className="flex items-center justify-between">
                                    <span className="text-white">{item.os}</span>
                                    <div className="flex items-center gap-2">
                                        <div className="w-20 h-2 bg-zinc-800 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-gradient-to-r from-emerald-500 to-teal-500"
                                                style={{ width: `${(item.count / (stats?.os[0]?.count || 1)) * 100}%` }}
                                            />
                                        </div>
                                        <span className="text-zinc-400 text-sm w-8 text-right">{item.count}</span>
                                    </div>
                                </div>
                            ))}
                            {(!stats?.os || stats.os.length === 0) && (
                                <p className="text-zinc-500 text-center py-4">No data</p>
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
        <div className="bg-zinc-900/80 backdrop-blur-xl border border-zinc-800 rounded-2xl p-4 md:p-6 relative overflow-hidden">
            <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br ${color} opacity-10 rounded-full -translate-y-1/2 translate-x-1/2`} />
            <div className="flex items-start justify-between">
                <div>
                    <p className="text-zinc-400 text-sm">{title}</p>
                    <p className="text-3xl md:text-4xl font-bold text-white mt-1">{value.toLocaleString()}</p>
                    {subtitle && <p className="text-zinc-500 text-sm mt-1">{subtitle}</p>}
                </div>
                <div className={`w-10 h-10 md:w-12 md:h-12 bg-gradient-to-br ${color} rounded-xl flex items-center justify-center text-lg md:text-xl`}>
                    {icon}
                </div>
            </div>
        </div>
    );
}

function getFlagEmoji(countryName: string): string {
    // Use country code to generate flag emoji dynamically
    const countryToCodes: Record<string, string> = {
        // Americas
        'United States': 'US', 'Canada': 'CA', 'Mexico': 'MX', 'Brazil': 'BR',
        'Argentina': 'AR', 'Colombia': 'CO', 'Chile': 'CL', 'Peru': 'PE',
        'Venezuela': 'VE', 'Ecuador': 'EC', 'Bolivia': 'BO', 'Paraguay': 'PY',
        'Uruguay': 'UY', 'Costa Rica': 'CR', 'Panama': 'PA', 'Guatemala': 'GT',
        'Honduras': 'HN', 'El Salvador': 'SV', 'Nicaragua': 'NI', 'Cuba': 'CU',
        'Dominican Republic': 'DO', 'Puerto Rico': 'PR', 'Jamaica': 'JM', 'Haiti': 'HT',
        'Trinidad and Tobago': 'TT', 'Bahamas': 'BS', 'Barbados': 'BB', 'Belize': 'BZ',
        'Guyana': 'GY', 'Suriname': 'SR',
        // Europe
        'United Kingdom': 'GB', 'Germany': 'DE', 'France': 'FR', 'Italy': 'IT',
        'Spain': 'ES', 'Portugal': 'PT', 'Netherlands': 'NL', 'Belgium': 'BE',
        'Switzerland': 'CH', 'Austria': 'AT', 'Sweden': 'SE', 'Norway': 'NO',
        'Denmark': 'DK', 'Finland': 'FI', 'Ireland': 'IE', 'Poland': 'PL',
        'Czech Republic': 'CZ', 'Czechia': 'CZ', 'Greece': 'GR', 'Hungary': 'HU',
        'Romania': 'RO', 'Bulgaria': 'BG', 'Croatia': 'HR', 'Slovakia': 'SK',
        'Slovenia': 'SI', 'Serbia': 'RS', 'Ukraine': 'UA', 'Russia': 'RU',
        'Belarus': 'BY', 'Lithuania': 'LT', 'Latvia': 'LV', 'Estonia': 'EE',
        'Iceland': 'IS', 'Luxembourg': 'LU', 'Malta': 'MT', 'Cyprus': 'CY',
        'Albania': 'AL', 'North Macedonia': 'MK', 'Montenegro': 'ME', 'Bosnia and Herzegovina': 'BA',
        'Moldova': 'MD', 'Kosovo': 'XK',
        // Asia
        'China': 'CN', 'Japan': 'JP', 'South Korea': 'KR', 'Korea, Republic of': 'KR',
        'India': 'IN', 'Indonesia': 'ID', 'Thailand': 'TH', 'Vietnam': 'VN',
        'Philippines': 'PH', 'Malaysia': 'MY', 'Singapore': 'SG', 'Taiwan': 'TW',
        'Hong Kong': 'HK', 'Pakistan': 'PK', 'Bangladesh': 'BD', 'Sri Lanka': 'LK',
        'Nepal': 'NP', 'Myanmar': 'MM', 'Cambodia': 'KH', 'Laos': 'LA',
        'Mongolia': 'MN', 'North Korea': 'KP', 'Brunei': 'BN', 'Timor-Leste': 'TL',
        // Middle East
        'Turkey': 'TR', 'Israel': 'IL', 'Saudi Arabia': 'SA', 'United Arab Emirates': 'AE',
        'Qatar': 'QA', 'Kuwait': 'KW', 'Bahrain': 'BH', 'Oman': 'OM',
        'Jordan': 'JO', 'Lebanon': 'LB', 'Syria': 'SY', 'Iraq': 'IQ',
        'Iran': 'IR', 'Yemen': 'YE', 'Palestine': 'PS', 'Afghanistan': 'AF',
        // Africa
        'South Africa': 'ZA', 'Nigeria': 'NG', 'Egypt': 'EG', 'Kenya': 'KE',
        'Ethiopia': 'ET', 'Ghana': 'GH', 'Morocco': 'MA', 'Algeria': 'DZ',
        'Tunisia': 'TN', 'Tanzania': 'TZ', 'Uganda': 'UG', 'Rwanda': 'RW',
        'Senegal': 'SN', 'Ivory Coast': 'CI', "Cote d'Ivoire": 'CI', 'Cameroon': 'CM',
        'Zimbabwe': 'ZW', 'Zambia': 'ZM', 'Botswana': 'BW', 'Namibia': 'NA',
        'Mozambique': 'MZ', 'Angola': 'AO', 'Democratic Republic of the Congo': 'CD',
        'Republic of the Congo': 'CG', 'Sudan': 'SD', 'Libya': 'LY', 'Mali': 'ML',
        'Niger': 'NE', 'Burkina Faso': 'BF', 'Benin': 'BJ', 'Togo': 'TG',
        'Mauritius': 'MU', 'Madagascar': 'MG', 'Malawi': 'MW', 'Liberia': 'LR',
        'Sierra Leone': 'SL', 'Guinea': 'GN', 'Gambia': 'GM', 'Cape Verde': 'CV',
        // Oceania
        'Australia': 'AU', 'New Zealand': 'NZ', 'Fiji': 'FJ', 'Papua New Guinea': 'PG',
        'Samoa': 'WS', 'Tonga': 'TO', 'Vanuatu': 'VU', 'Solomon Islands': 'SB',
        // Central Asia
        'Kazakhstan': 'KZ', 'Uzbekistan': 'UZ', 'Turkmenistan': 'TM', 'Tajikistan': 'TJ',
        'Kyrgyzstan': 'KG', 'Azerbaijan': 'AZ', 'Georgia': 'GE', 'Armenia': 'AM',
    };

    const code = countryToCodes[countryName];
    if (code) {
        // Convert country code to flag emoji using regional indicator symbols
        const codePoints = [...code.toUpperCase()].map(c => 0x1F1E6 + c.charCodeAt(0) - 65);
        return String.fromCodePoint(...codePoints);
    }
    return String.fromCodePoint(0x1F30D); // Globe emoji as fallback
}
