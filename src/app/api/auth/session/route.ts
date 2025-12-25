'use server';

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';

// GET: Check if user exists and return session data
export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const walletAddress = searchParams.get('wallet');

    if (!walletAddress) {
        return NextResponse.json({ authenticated: false, error: 'Missing wallet address' }, { status: 400 });
    }

    try {
        const supabase = getSupabaseAdmin();

        const { data: user, error } = await supabase
            .from('analytics_users')
            .select('id, wallet_address, email, username, is_verified_human, created_at, last_seen_at')
            .eq('wallet_address', walletAddress.toLowerCase())
            .single();

        if (error || !user) {
            return NextResponse.json({ authenticated: false });
        }

        // Update last_seen_at
        await supabase
            .from('analytics_users')
            .update({ last_seen_at: new Date().toISOString() })
            .eq('wallet_address', walletAddress.toLowerCase());

        return NextResponse.json({
            authenticated: true,
            user: {
                id: user.id,
                walletAddress: user.wallet_address,
                email: user.email,
                username: user.username,
                isVerifiedHuman: user.is_verified_human,
                createdAt: user.created_at,
            }
        });
    } catch (error) {
        console.error('[Session API] GET error:', error);
        return NextResponse.json({ authenticated: false, error: 'Server error' }, { status: 500 });
    }
}

// POST: Create or update user session after wallet connect
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { walletAddress, username } = body;

        if (!walletAddress) {
            return NextResponse.json({ success: false, error: 'Missing wallet address' }, { status: 400 });
        }

        const supabase = getSupabaseAdmin();
        const walletLower = walletAddress.toLowerCase();

        // Check if user exists
        const { data: existingUser } = await supabase
            .from('analytics_users')
            .select('id, is_verified_human, email, username')
            .eq('wallet_address', walletLower)
            .single();

        if (existingUser) {
            // Update existing user
            await supabase
                .from('analytics_users')
                .update({
                    username: username || null,
                    last_seen_at: new Date().toISOString(),
                })
                .eq('wallet_address', walletLower);

            return NextResponse.json({
                success: true,
                userId: existingUser.id,
                isNew: false,
                isVerifiedHuman: existingUser.is_verified_human,
                email: existingUser.email,
                username: existingUser.username
            });
        } else {
            // Create new user
            const { data: newUser, error } = await supabase
                .from('analytics_users')
                .insert({
                    wallet_address: walletLower,
                    username: username || null,
                    is_verified_human: false,
                    created_at: new Date().toISOString(),
                    last_seen_at: new Date().toISOString(),
                })
                .select('id')
                .single();

            if (error) {
                console.error('[Session API] Create user error:', error);
                return NextResponse.json({ success: false, error: 'Failed to create user' }, { status: 500 });
            }

            return NextResponse.json({ success: true, userId: newUser.id, isNew: true });
        }
    } catch (error) {
        console.error('[Session API] POST error:', error);
        return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
    }
}

