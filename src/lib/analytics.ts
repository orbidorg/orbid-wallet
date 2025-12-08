'use client';

// Analytics Library - Client-side only
// All database operations go through /api/analytics

export interface AnalyticsEvent {
    event_name: string;
    event_category?: string;
    metadata?: Record<string, unknown>;
}

export interface UserSyncResult {
    success: boolean;
    userId?: string | null;
    error?: 'wallet_already_linked' | 'email_already_linked' | 'server_error';
    message?: string;
    linkedEmail?: string;
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
}): Promise<UserSyncResult> {
    try {
        const res = await fetch('/api/analytics/user', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        const json = await res.json();

        if (res.ok) {
            return { success: true, userId: json.userId };
        }

        // Handle conflict errors
        if (res.status === 409) {
            return {
                success: false,
                error: json.error,
                message: json.message,
                linkedEmail: json.linkedEmail
            };
        }

        return { success: false, error: 'server_error' };
    } catch (e) {
        console.error('Analytics user error:', e);
        return { success: false, error: 'server_error' };
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
