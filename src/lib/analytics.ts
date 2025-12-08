'use client';

// Analytics Library - Client-side only
// All database operations go through /api/analytics

export interface AnalyticsEvent {
    event_name: string;
    event_category?: string;
    metadata?: Record<string, unknown>;
}

let currentUserId: string | null = null;

export function setAnalyticsUser(id: string | null) {
    currentUserId = id;
}

// Create or update user via API (server handles Supabase)
export async function createOrUpdateUser(data: {
    email?: string;
    walletAddress?: string;
    isVerifiedHuman?: boolean;
}): Promise<string | null> {
    try {
        const res = await fetch('/api/analytics/user', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        if (res.ok) {
            const json = await res.json();
            return json.userId || null;
        }
        return null;
    } catch (e) {
        console.error('Analytics user error:', e);
        return null;
    }
}

// Track event via API
export async function trackEvent(event: AnalyticsEvent) {
    try {
        await fetch('/api/analytics', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...event, user_id: currentUserId })
        });
    } catch {
        // Silent fail
    }
}

const Analytics = {
    login: (method: string) => trackEvent({ event_name: 'login', metadata: { method } }),
    logout: () => trackEvent({ event_name: 'logout' }),
    verifyWorldId: (success: boolean) => trackEvent({ event_name: 'verify_world_id', metadata: { success } }),
    error: (type: string, msg: string) => trackEvent({ event_name: 'error', metadata: { type, msg } }),
    openModal: (name: string) => trackEvent({ event_name: 'open_modal', metadata: { name } })
};

export default Analytics;
