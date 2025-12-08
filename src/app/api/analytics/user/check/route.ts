import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';

// Helper to mask email for privacy
function maskEmail(email: string): string {
    const [local, domain] = email.split('@');
    if (!domain) return email;
    const masked = local.slice(0, 2) + '***';
    return `${masked}@${domain}`;
}

// POST: Check if wallet/email can be linked
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { walletAddress, email } = body;

        if (!walletAddress || !email) {
            return NextResponse.json({ error: 'Missing wallet or email' }, { status: 400 });
        }

        const supabase = getSupabaseAdmin();

        // Check if wallet already has a linked email
        const { data: existingByWallet } = await supabase
            .from('analytics_users')
            .select('id, email')
            .eq('wallet_address', walletAddress)
            .maybeSingle();

        if (existingByWallet?.email && existingByWallet.email !== email) {
            return NextResponse.json({
                error: 'wallet_already_linked',
                message: 'This World ID is already linked to another email',
                linkedEmail: maskEmail(existingByWallet.email)
            }, { status: 409 });
        }

        // Check if email is linked to a different wallet
        const { data: existingByEmail } = await supabase
            .from('analytics_users')
            .select('id, wallet_address')
            .eq('email', email)
            .maybeSingle();

        if (existingByEmail?.wallet_address && existingByEmail.wallet_address !== walletAddress) {
            return NextResponse.json({
                error: 'email_already_linked',
                message: 'This email is linked to a different World ID'
            }, { status: 409 });
        }

        // All good - can proceed with linking
        return NextResponse.json({ success: true });

    } catch (e) {
        console.error('[Analytics Check API] Error:', e);
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}
