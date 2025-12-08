import { createClient } from '@supabase/supabase-js';

// Supabase client for aaPanel Docker instance
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!process.env.NEXT_PUBLIC_SUPABASE_URL) console.error('❌ ERROR: NEXT_PUBLIC_SUPABASE_URL is missing in .env.local');
if (!supabaseServiceKey) console.error('❌ ERROR: SUPABASE_SERVICE_KEY is missing in .env.local (checked SUPABASE_SERVICE_KEY and SUPABASE_SERVICE_ROLE_KEY)');
if (supabaseServiceKey) console.log('✅ Supabase Service Key loaded successfully');

// Client for browser/frontend use
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Admin client for server-side operations (API routes)
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false,
    },
});

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
