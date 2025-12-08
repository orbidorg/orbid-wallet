'use client';

import { supabaseAdmin } from './supabase';

export interface UserAnalytics {
    id: string;
    email?: string;
    wallet_address?: string;
    is_verified_human: boolean;
    country?: string;
    created_at: string;
}

export interface AnalyticsEvent {
    event_name: string;
    event_category?: string;
    metadata?: Record<string, unknown>;
}

export async function createOrUpdateUser(data: {
    email?: string;
    walletAddress?: string;
    isVerifiedHuman?: boolean;
}): Promise<string | null> {
    try {
        // Simple geo (client-side fetch in real app, simplified here)
        let geo = { country: '', countryCode: '' };
        try {
            const res = await fetch('https://ipapi.co/json/');
            if (res.ok) {
                const json = await res.json();
                geo = { country: json.country_name, countryCode: json.country_code };
            }
        } catch { }

        const identifier = data.walletAddress || data.email;
        if (!identifier) return null;

        // Check existing
        const { data: existing } = await supabaseAdmin
            .from('analytics_users')
            .select('id, total_logins')
            .or(`email.eq.${data.email},wallet_address.eq.${data.walletAddress}`)
            .single();

        if (existing) {
            await supabaseAdmin.from('analytics_users').update({
                last_login_at: new Date().toISOString(),
                total_logins: (existing.total_logins || 0) + 1,
                ...(data.isVerifiedHuman !== undefined && { is_verified_human: data.isVerifiedHuman })
            }).eq('id', existing.id);
            return existing.id;
        }

        // Create new
        const { data: newUser } = await supabaseAdmin.from('analytics_users').insert({
            email: data.email,
            wallet_address: data.walletAddress,
            is_verified_human: data.isVerifiedHuman || false,
            country: geo.country,
            country_code: geo.countryCode,
            total_logins: 1
        }).select('id').single();

        return newUser?.id || null;
    } catch (e) {
        console.error('Analytics error:', e);
        return null;
    }
}

let currentUserId: string | null = null;
export function setAnalyticsUser(id: string | null) { currentUserId = id; }

export async function trackEvent(event: AnalyticsEvent) {
    try {
        await fetch('/api/analytics', {
            method: 'POST',
            body: JSON.stringify({ ...event, user_id: currentUserId })
        });
    } catch { }
}

const Analytics = {
    login: (method: string) => trackEvent({ event_name: 'login', metadata: { method } }),
    logout: () => trackEvent({ event_name: 'logout' }),
    verifyWorldId: (success: boolean) => trackEvent({ event_name: 'verify_world_id', metadata: { success } }),
    error: (type: string, msg: string) => trackEvent({ event_name: 'error', metadata: { type, msg } }),
    openModal: (name: string) => trackEvent({ event_name: 'open_modal', metadata: { name } })
};

export default Analytics;
