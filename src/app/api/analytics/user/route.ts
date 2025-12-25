import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';

// Helper to mask email for privacy
function maskEmail(email: string): string {
    const [local, domain] = email.split('@');
    if (!domain) return email;
    const masked = local.slice(0, 2) + '***';
    return `${masked}@${domain}`;
}

// Parse user agent for device, browser, and OS info
function parseUserAgent(ua: string): { deviceType: string; browser: string; os: string } {
    const uaLower = ua.toLowerCase();

    // Device type
    let deviceType = 'desktop';
    if (uaLower.includes('mobile') || uaLower.includes('android') || uaLower.includes('iphone')) {
        deviceType = 'mobile';
    } else if (uaLower.includes('tablet') || uaLower.includes('ipad')) {
        deviceType = 'tablet';
    }

    // Browser detection
    let browser = 'Unknown';
    if (uaLower.includes('worldapp')) {
        browser = 'World App';
    } else if (uaLower.includes('chrome') && !uaLower.includes('edg')) {
        browser = 'Chrome';
    } else if (uaLower.includes('firefox')) {
        browser = 'Firefox';
    } else if (uaLower.includes('safari') && !uaLower.includes('chrome')) {
        browser = 'Safari';
    } else if (uaLower.includes('edg')) {
        browser = 'Edge';
    } else if (uaLower.includes('opera') || uaLower.includes('opr')) {
        browser = 'Opera';
    }

    // OS detection
    let os = 'Unknown';
    if (uaLower.includes('android')) {
        os = 'Android';
    } else if (uaLower.includes('iphone') || uaLower.includes('ipad') || uaLower.includes('ios')) {
        os = 'iOS';
    } else if (uaLower.includes('windows')) {
        os = 'Windows';
    } else if (uaLower.includes('mac os') || uaLower.includes('macos')) {
        os = 'macOS';
    } else if (uaLower.includes('linux')) {
        os = 'Linux';
    }

    return { deviceType, browser, os };
}

// Fetch geo data from IP
async function getGeoData(ip: string): Promise<{
    country: string;
    countryCode: string;
    region: string;
    city: string;
    timezone: string;
}> {
    const defaultGeo = { country: '', countryCode: '', region: '', city: '', timezone: '' };

    // Skip local/private IPs
    if (!ip || ip.startsWith('127.') || ip.startsWith('192.168.') || ip.startsWith('10.') || ip === '::1') {
        return defaultGeo;
    }

    try {
        // Use ip-api.com (free, no key needed, 45 req/min limit)
        const res = await fetch(`http://ip-api.com/json/${ip}?fields=status,country,countryCode,regionName,city,timezone`, {
            signal: AbortSignal.timeout(5000)
        });

        if (res.ok) {
            const data = await res.json();
            if (data.status === 'success') {
                return {
                    country: data.country || '',
                    countryCode: data.countryCode || '',
                    region: data.regionName || '',
                    city: data.city || '',
                    timezone: data.timezone || ''
                };
            }
        }
    } catch (e) {
        console.error('[Analytics] Geo lookup failed:', e);
    }

    return defaultGeo;
}

// POST: Create or Update User
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { email, walletAddress, isVerifiedHuman } = body;

        if (!walletAddress && !email) {
            return NextResponse.json({ error: 'No identifier provided' }, { status: 400 });
        }

        const supabase = getSupabaseAdmin();

        // Get request metadata
        const userAgent = request.headers.get('user-agent') || '';
        const { deviceType, browser, os } = parseUserAgent(userAgent);

        // Get IP from various headers
        const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
            request.headers.get('x-real-ip') ||
            request.headers.get('cf-connecting-ip') || '';

        const geo = await getGeoData(ip);

        // Build update/insert data
        const trackingData = {
            user_agent: userAgent || null,
            device_type: deviceType || null,
            browser: browser || null,
            os: os || null,
            last_ip: ip || null,
            ...(geo.country && { country: geo.country }),
            ...(geo.countryCode && { country_code: geo.countryCode }),
            ...(geo.region && { region: geo.region }),
            ...(geo.city && { city: geo.city }),
            ...(geo.timezone && { timezone: geo.timezone }),
        };

        // CASE 1: walletAddress provided
        if (walletAddress) {
            const { data: existingByWallet } = await supabase
                .from('analytics_users')
                .select('id, email, total_logins, is_verified_human')
                .eq('wallet_address', walletAddress)
                .maybeSingle();

            if (existingByWallet) {
                // Update existing user - overwrite email if provided (new behavior for optional newsletter)
                const updateData = {
                    last_login_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                    total_logins: (existingByWallet.total_logins || 0) + 1,
                    ...trackingData,
                    ...(email && { email }),
                    ...(isVerifiedHuman === true && { is_verified_human: true })
                };

                await supabase.from('analytics_users').update(updateData).eq('id', existingByWallet.id);

                return NextResponse.json({ success: true, userId: existingByWallet.id });
            }

            // Check if email exists (linking wallet to email account)
            if (email) {
                const { data: existingByEmail } = await supabase
                    .from('analytics_users')
                    .select('id, wallet_address, total_logins')
                    .eq('email', email)
                    .maybeSingle();

                if (existingByEmail) {
                    // Update existing email user with wallet
                    await supabase.from('analytics_users').update({
                        wallet_address: walletAddress,
                        last_login_at: new Date().toISOString(),
                        updated_at: new Date().toISOString(),
                        total_logins: (existingByEmail.total_logins || 0) + 1,
                        ...trackingData,
                        ...(isVerifiedHuman === true && { is_verified_human: true })
                    }).eq('id', existingByEmail.id);

                    return NextResponse.json({ success: true, userId: existingByEmail.id });
                }
            }

            const insertData = {
                email: email || null,
                wallet_address: walletAddress,
                is_verified_human: isVerifiedHuman === true,
                ...trackingData,
                total_logins: 1
            };

            const { data: newUser, error } = await supabase
                .from('analytics_users')
                .insert(insertData)
                .select('id')
                .single();

            if (error) {
                console.error('[Analytics API] Insert error:', error);
                return NextResponse.json({ error: 'Failed to create user' }, { status: 500 });
            }

            return NextResponse.json({ success: true, userId: newUser?.id || null });
        }

        // CASE 2: Only email provided
        const { data: existingByEmail } = await supabase
            .from('analytics_users')
            .select('id, total_logins')
            .eq('email', email)
            .maybeSingle();

        if (existingByEmail) {
            await supabase.from('analytics_users').update({
                last_login_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                total_logins: (existingByEmail.total_logins || 0) + 1,
                ...trackingData
            }).eq('id', existingByEmail.id);

            return NextResponse.json({ success: true, userId: existingByEmail.id });
        }

        // Create new email-only user
        const { data: newUser, error } = await supabase
            .from('analytics_users')
            .insert({
                email,
                wallet_address: null,
                is_verified_human: false,
                ...trackingData,
                total_logins: 1
            })
            .select('id')
            .single();

        if (error) {
            console.error('[Analytics API] Insert error:', error);
            return NextResponse.json({ error: 'Failed to create user' }, { status: 500 });
        }

        return NextResponse.json({ success: true, userId: newUser?.id || null });

    } catch (e) {
        console.error('[Analytics API] Error:', e);
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}
