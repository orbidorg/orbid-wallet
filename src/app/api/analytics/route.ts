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

            return NextResponse.json({
                totalUsers: total || 0,
                verifiedUsers: verified || 0,
                newUsersToday: newToday || 0
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

        return NextResponse.json({ ok: true });
    } catch (e) {
        console.error('Analytics GET error:', e);
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}
