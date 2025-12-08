import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

// POST: Create or Update User
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { email, walletAddress, isVerifiedHuman } = body;

        const identifier = walletAddress || email;
        if (!identifier) {
            return NextResponse.json({ error: 'No identifier' }, { status: 400 });
        }

        // Simple geo lookup
        let geo = { country: '', countryCode: '' };
        try {
            const ip = request.headers.get('x-forwarded-for')?.split(',')[0] || '';
            if (ip) {
                const geoRes = await fetch(`https://ipapi.co/${ip}/json/`);
                if (geoRes.ok) {
                    const geoData = await geoRes.json();
                    geo = { country: geoData.country_name, countryCode: geoData.country_code };
                }
            }
        } catch { }

        // Check existing user
        let query = supabaseAdmin.from('analytics_users').select('id, total_logins');
        if (email) query = query.eq('email', email);
        else if (walletAddress) query = query.eq('wallet_address', walletAddress);

        const { data: existing } = await query.maybeSingle();

        if (existing) {
            await supabaseAdmin.from('analytics_users').update({
                last_login_at: new Date().toISOString(),
                total_logins: (existing.total_logins || 0) + 1,
                ...(isVerifiedHuman !== undefined && { is_verified_human: isVerifiedHuman })
            }).eq('id', existing.id);
            return NextResponse.json({ userId: existing.id });
        }

        // Create new user
        const { data: newUser } = await supabaseAdmin.from('analytics_users').insert({
            email,
            wallet_address: walletAddress,
            is_verified_human: isVerifiedHuman || false,
            country: geo.country,
            country_code: geo.countryCode,
            total_logins: 1
        }).select('id').single();

        return NextResponse.json({ userId: newUser?.id || null });
    } catch (e) {
        console.error('User sync error:', e);
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}
