import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

// POST: Track an event
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        await supabaseAdmin.from('analytics_events').insert({
            event_name: body.event_name,
            metadata: body.metadata,
            user_id: body.user_id,
            created_at: new Date().toISOString()
        });
        return NextResponse.json({ success: true });
    } catch (e) {
        console.error('Analytics POST error:', e);
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}

// GET: Retrieve stats for Admin Dashboard
export async function GET(request: NextRequest) {
    const auth = request.headers.get('authorization');
    if (auth !== `Bearer ${process.env.ADMIN_SECRET}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const stat = searchParams.get('stat');

    try {
        // Overview stats
        if (stat === 'overview') {
            const { count: total } = await supabaseAdmin
                .from('analytics_users')
                .select('*', { count: 'exact', head: true });

            const { count: verified } = await supabaseAdmin
                .from('analytics_users')
                .select('*', { count: 'exact', head: true })
                .eq('is_verified_human', true);

            const today = new Date().toISOString().split('T')[0];
            const { count: newToday } = await supabaseAdmin
                .from('analytics_users')
                .select('*', { count: 'exact', head: true })
                .gte('created_at', today);

            // Sum total logins
            const { data: loginsData } = await supabaseAdmin
                .from('analytics_users')
                .select('total_logins');
            const totalLogins = (loginsData || []).reduce((sum: number, row: { total_logins: number }) => sum + (row.total_logins || 0), 0);

            return NextResponse.json({
                totalUsers: total || 0,
                verifiedUsers: verified || 0,
                newUsersToday: newToday || 0,
                totalLogins
            });
        }

        // Countries distribution
        if (stat === 'countries') {
            const { data } = await supabaseAdmin
                .from('analytics_users')
                .select('country')
                .not('country', 'is', null);

            const countryMap: Record<string, number> = {};
            (data || []).forEach((row: { country: string }) => {
                countryMap[row.country] = (countryMap[row.country] || 0) + 1;
            });

            const countries = Object.entries(countryMap)
                .map(([country, count]) => ({ country, count }))
                .sort((a, b) => b.count - a.count);

            return NextResponse.json({ countries });
        }

        // Growth over time (last 30 days)
        if (stat === 'growth') {
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

            const { data } = await supabaseAdmin
                .from('analytics_users')
                .select('created_at')
                .gte('created_at', thirtyDaysAgo.toISOString());

            const dateMap: Record<string, number> = {};
            (data || []).forEach((row: { created_at: string }) => {
                const date = row.created_at.split('T')[0];
                dateMap[date] = (dateMap[date] || 0) + 1;
            });

            // Fill in missing days with 0
            const growth = [];
            for (let i = 29; i >= 0; i--) {
                const d = new Date();
                d.setDate(d.getDate() - i);
                const dateStr = d.toISOString().split('T')[0];
                growth.push({ date: dateStr, count: dateMap[dateStr] || 0 });
            }

            return NextResponse.json({ growth });
        }

        // Device types distribution
        if (stat === 'devices') {
            const { data } = await supabaseAdmin
                .from('analytics_users')
                .select('device_type')
                .not('device_type', 'is', null);

            const deviceMap: Record<string, number> = {};
            (data || []).forEach((row: { device_type: string }) => {
                if (row.device_type) {
                    deviceMap[row.device_type] = (deviceMap[row.device_type] || 0) + 1;
                }
            });

            const devices = Object.entries(deviceMap)
                .map(([device, count]) => ({ device, count }))
                .sort((a, b) => b.count - a.count);

            return NextResponse.json({ devices });
        }

        // Browsers distribution
        if (stat === 'browsers') {
            const { data } = await supabaseAdmin
                .from('analytics_users')
                .select('browser')
                .not('browser', 'is', null);

            const browserMap: Record<string, number> = {};
            (data || []).forEach((row: { browser: string }) => {
                if (row.browser) {
                    browserMap[row.browser] = (browserMap[row.browser] || 0) + 1;
                }
            });

            const browsers = Object.entries(browserMap)
                .map(([browser, count]) => ({ browser, count }))
                .sort((a, b) => b.count - a.count);

            return NextResponse.json({ browsers });
        }

        // OS distribution
        if (stat === 'os') {
            const { data } = await supabaseAdmin
                .from('analytics_users')
                .select('os')
                .not('os', 'is', null);

            const osMap: Record<string, number> = {};
            (data || []).forEach((row: { os: string }) => {
                if (row.os) {
                    osMap[row.os] = (osMap[row.os] || 0) + 1;
                }
            });

            const osList = Object.entries(osMap)
                .map(([os, count]) => ({ os, count }))
                .sort((a, b) => b.count - a.count);

            return NextResponse.json({ os: osList });
        }

        // Recent users
        if (stat === 'recent') {
            const { data } = await supabaseAdmin
                .from('analytics_users')
                .select('email, wallet_address, country, created_at, total_logins')
                .order('created_at', { ascending: false })
                .limit(20);

            const users = (data || []).map((row: {
                email: string | null;
                wallet_address: string | null;
                country: string | null;
                created_at: string;
                total_logins: number | null;
            }) => ({
                email: row.email || null,
                wallet: row.wallet_address || null,
                country: row.country || null,
                created: row.created_at,
                logins: row.total_logins || 1
            }));

            return NextResponse.json({ users });
        }

        return NextResponse.json({ ok: true });
    } catch (e) {
        console.error('Analytics GET error:', e);
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}
