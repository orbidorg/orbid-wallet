import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Supabase client for aaPanel Docker instance
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Client for browser/frontend use (safe, uses anon key)
export const supabase = supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey)
    : null;

// Lazy-initialized admin client for server-side operations (API routes only)
let _supabaseAdmin: SupabaseClient | null = null;

export function getSupabaseAdmin(): SupabaseClient {
    if (_supabaseAdmin) return _supabaseAdmin;

    const serviceKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceKey) {
        throw new Error('Supabase Admin requires SUPABASE_SERVICE_KEY environment variable');
    }

    _supabaseAdmin = createClient(supabaseUrl, serviceKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false,
        },
    });

    return _supabaseAdmin;
}

// Legacy export for compatibility (will throw if env vars missing)
export const supabaseAdmin = {
    from: (table: string) => getSupabaseAdmin().from(table),
};

// Database types (extend as needed)
export interface UserSession {
    id: string;
    wallet_address: string;
    email?: string;
    created_at: string;
    last_login: string;
}

export interface EmailCode {
    id: string;
    email: string;
    code: string;
    expires_at: string;
    used: boolean;
}

