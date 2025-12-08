import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';

// Helper to mask email for privacy
function maskEmail(email: string): string {
    const [local, domain] = email.split('@');
    if (!domain) return email;
    const masked = local.slice(0, 2) + '***';
    return `${masked}@${domain}`;
}

// Helper to detect device type from user agent
function getDeviceType(userAgent: string): string {
    const ua = userAgent.toLowerCase();
    if (ua.includes('mobile') || ua.includes('android') || ua.includes('iphone')) {
        return 'mobile';
    }
    if (ua.includes('tablet') || ua.includes('ipad')) {
        return 'tablet';
    }
    return 'desktop';
}

// POST: Create or Update User
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { email, walletAddress, isVerifiedHuman } = body;

        // Need at least one identifier
        if (!walletAddress && !email) {
            return NextResponse.json({ error: 'No identifier provided' }, { status: 400 });
        }

        const supabase = getSupabaseAdmin();

        // Get request metadata for tracking
        const userAgent = request.headers.get('user-agent') || '';
        const deviceType = getDeviceType(userAgent);
        const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
            request.headers.get('x-real-ip') || '';

        // Geo lookup
        let geo = { country: '', countryCode: '' };
        try {
            if (ip && !ip.startsWith('127.') && !ip.startsWith('192.168.')) {
                const geoRes = await fetch(`https://ipapi.co/${ip}/json/`, {
                    signal: AbortSignal.timeout(3000)
                });
                if (geoRes.ok) {
                    const geoData = await geoRes.json();
                    if (!geoData.error) {
                        geo = { country: geoData.country_name || '', countryCode: geoData.country_code || '' };
                    }
                }
            }
        } catch { }

        // CASE 1: walletAddress provided (World App login or connecting World ID)
        if (walletAddress) {
            // Check if wallet already exists
            const { data: existingByWallet } = await supabase
                .from('analytics_users')
                .select('id, email, total_logins')
                .eq('wallet_address', walletAddress)
                .maybeSingle();

            if (existingByWallet) {
                // Wallet exists - check if email matches (if email provided)
                if (email && existingByWallet.email && existingByWallet.email !== email) {
                    // Different email trying to link to this wallet - REJECT
                    return NextResponse.json({
                        error: 'wallet_already_linked',
                        message: 'This World ID is already linked to another email',
                        linkedEmail: maskEmail(existingByWallet.email)
                    }, { status: 409 });
                }

                // Same email or no email conflict - update existing user
                await supabase.from('analytics_users').update({
                    last_login_at: new Date().toISOString(),
                    total_logins: (existingByWallet.total_logins || 0) + 1,
                    ...(isVerifiedHuman !== undefined && { is_verified_human: isVerifiedHuman }),
                    ...(email && !existingByWallet.email && { email }), // Set email if not already set
                    // Update tracking info
                    user_agent: userAgent,
                    device_type: deviceType,
                    last_ip: ip,
                    ...(geo.country && { country: geo.country, country_code: geo.countryCode })
                }).eq('id', existingByWallet.id);

                return NextResponse.json({ userId: existingByWallet.id });
            }

            // Wallet doesn't exist - check if email exists (user adding wallet to email account)
            if (email) {
                const { data: existingByEmail } = await supabase
                    .from('analytics_users')
                    .select('id, wallet_address, total_logins')
                    .eq('email', email)
                    .maybeSingle();

                if (existingByEmail) {
                    if (existingByEmail.wallet_address && existingByEmail.wallet_address !== walletAddress) {
                        // This email already has a different wallet - REJECT
                        return NextResponse.json({
                            error: 'email_already_linked',
                            message: 'This email is already linked to a different World ID'
                        }, { status: 409 });
                    }

                    // Add wallet to existing email user
                    await supabase.from('analytics_users').update({
                        wallet_address: walletAddress,
                        last_login_at: new Date().toISOString(),
                        total_logins: (existingByEmail.total_logins || 0) + 1,
                        ...(isVerifiedHuman !== undefined && { is_verified_human: isVerifiedHuman }),
                        user_agent: userAgent,
                        device_type: deviceType,
                        last_ip: ip,
                        ...(geo.country && { country: geo.country, country_code: geo.countryCode })
                    }).eq('id', existingByEmail.id);

                    return NextResponse.json({ userId: existingByEmail.id });
                }
            }

            // Create new user with wallet
            const { data: newUser } = await supabase.from('analytics_users').insert({
                email: email || null,
                wallet_address: walletAddress,
                is_verified_human: isVerifiedHuman || false,
                country: geo.country || null,
                country_code: geo.countryCode || null,
                user_agent: userAgent,
                device_type: deviceType,
                last_ip: ip,
                total_logins: 1
            }).select('id').single();

            return NextResponse.json({ userId: newUser?.id || null });
        }

        // CASE 2: Only email provided (email login without World ID yet)
        const { data: existingByEmail } = await supabase
            .from('analytics_users')
            .select('id, total_logins')
            .eq('email', email)
            .maybeSingle();

        if (existingByEmail) {
            // Update existing email user
            await supabase.from('analytics_users').update({
                last_login_at: new Date().toISOString(),
                total_logins: (existingByEmail.total_logins || 0) + 1,
                user_agent: userAgent,
                device_type: deviceType,
                last_ip: ip,
                ...(geo.country && { country: geo.country, country_code: geo.countryCode })
            }).eq('id', existingByEmail.id);

            return NextResponse.json({ userId: existingByEmail.id });
        }

        // Create new email-only user
        const { data: newUser } = await supabase.from('analytics_users').insert({
            email,
            wallet_address: null,
            is_verified_human: false,
            country: geo.country || null,
            country_code: geo.countryCode || null,
            user_agent: userAgent,
            device_type: deviceType,
            last_ip: ip,
            total_logins: 1
        }).select('id').single();

        return NextResponse.json({ userId: newUser?.id || null });

    } catch (e) {
        console.error('User sync error:', e);
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}
