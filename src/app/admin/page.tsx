'use client';

import { useState, useEffect } from 'react';

export default function AdminDashboard() {
    const [auth, setAuth] = useState(false);
    const [pass, setPass] = useState('');
    const [stats, setStats] = useState<any>(null);

    const checkAuth = async () => {
        const res = await fetch('/api/analytics?stat=overview', { headers: { 'Authorization': `Bearer ${pass}` } });
        if (res.ok) {
            setAuth(true);
            setStats(await res.json());
        } else {
            alert('Invalid Secret');
        }
    };

    if (!auth) return (
        <div className="min-h-screen bg-black flex items-center justify-center">
            <div className="glass p-8 rounded-xl flex flex-col gap-4">
                <h1 className="text-white text-xl font-bold">OrbId Admin</h1>
                <input type="password" value={pass} onChange={e => setPass(e.target.value)} placeholder="Admin Secret" className="bg-zinc-800 p-2 rounded text-white" />
                <button onClick={checkAuth} className="bg-pink-500 text-white p-2 rounded hover:bg-pink-400">Login</button>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-black p-8 text-white">
            <h1 className="text-3xl font-bold mb-8">Analytics Dashboard</h1>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="glass p-6 rounded-xl">
                    <p className="text-zinc-400">Total Users</p>
                    <p className="text-4xl font-bold">{stats?.totalUsers || 0}</p>
                </div>
                <div className="glass p-6 rounded-xl">
                    <p className="text-zinc-400">Verified Humans</p>
                    <p className="text-4xl font-bold text-green-400">{stats?.verifiedUsers || 0}</p>
                </div>
                <div className="glass p-6 rounded-xl">
                    <p className="text-zinc-400">Status</p>
                    <p className="text-4xl font-bold text-blue-400">Active</p>
                </div>
            </div>
            <button onClick={() => checkAuth()} className="mt-8 text-zinc-500 hover:text-white">Refresh Data</button>
        </div>
    );
}
