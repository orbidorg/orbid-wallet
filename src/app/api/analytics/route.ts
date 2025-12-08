import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { error } = await supabaseAdmin.from('analytics_events').insert({
            event_name: body.event_name,
            metadata: body.metadata,
            user_id: body.user_id,
            created_at: new Date().toISOString()
        });
        return NextResponse.json({ success: !error });
    } catch {
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}

export async function GET(request: NextRequest) {
    const auth = request.headers.get('authorization');
    if (auth !== `Bearer ${process.env.ADMIN_SECRET}`) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    if (searchParams.get('stat') === 'overview') {
        const { count: total } = await supabaseAdmin.from('analytics_users').select('*', { count: 'exact', head: true });
        const { count: verified } = await supabaseAdmin.from('analytics_users').select('*', { count: 'exact', head: true }).eq('is_verified_human', true);
        return NextResponse.json({ totalUsers: total || 0, verifiedUsers: verified || 0, newUsersToday: 0 });
    }

    return NextResponse.json({ ok: true });
}
