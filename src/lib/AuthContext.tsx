'use client';

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { MiniKit } from '@worldcoin/minikit-js';
import { useMiniKit } from '@/components/Providers';
import Analytics, { setAnalyticsUser } from './analytics';

interface AuthState {
    isReady: boolean;
    isAuthenticated: boolean;
    walletAddress: string | null;
    username: string | null;
    email: string | null;
    isInWorldApp: boolean;
    pendingEmailLink: boolean;
    isVerifiedHuman: boolean;
}

interface AuthContextType extends AuthState {
    loginWithWorldApp: () => Promise<void>;
    completeEmailLink: (email: string) => Promise<{ success: boolean; error?: string }>;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

// Temporary local cache for wallet (needed since MiniKit doesn't persist wallet)
const WALLET_CACHE_KEY = 'orbid_wallet_cache';

export function AuthProvider({ children }: { children: ReactNode }) {
    const [state, setState] = useState<AuthState>({
        isReady: false,
        isAuthenticated: false,
        walletAddress: null,
        username: null,
        email: null,
        isInWorldApp: false,
        pendingEmailLink: false,
        isVerifiedHuman: false,
    });
    const { isReady: miniKitReady, isInstalled: isInWorldApp } = useMiniKit();

    // Initialize auth state - Uses Supabase as source of truth
    const initAuth = useCallback(async () => {
        try {
            // Try to get cached wallet address
            const cached = localStorage.getItem(WALLET_CACHE_KEY);
            const cachedWallet = cached ? JSON.parse(cached) : null;

            if (!cachedWallet?.walletAddress) {
                // No cached wallet - user needs to connect
                setState({
                    isReady: true,
                    isAuthenticated: false,
                    walletAddress: null,
                    username: null,
                    email: null,
                    isInWorldApp,
                    pendingEmailLink: false,
                    isVerifiedHuman: false,
                });
                return;
            }

            // Check Supabase for user session
            const sessionRes = await fetch(`/api/auth/session?wallet=${cachedWallet.walletAddress}`);
            const sessionData = await sessionRes.json();

            if (!sessionData.authenticated) {
                // User not in Supabase - clear cache and show login
                localStorage.removeItem(WALLET_CACHE_KEY);
                setState({
                    isReady: true,
                    isAuthenticated: false,
                    walletAddress: null,
                    username: null,
                    email: null,
                    isInWorldApp,
                    pendingEmailLink: false,
                    isVerifiedHuman: false,
                });
                return;
            }

            // User exists in Supabase
            const user = sessionData.user;

            // Check email session
            const emailRes = await fetch('/api/auth/me');
            const emailData = await emailRes.json();
            const hasEmail = emailData.authenticated && emailData.email;

            if (hasEmail) {
                // Fully authenticated
                setState({
                    isReady: true,
                    isAuthenticated: true,
                    walletAddress: user.walletAddress,
                    username: user.username || cachedWallet.username,
                    email: emailData.email,
                    isInWorldApp,
                    pendingEmailLink: false,
                    isVerifiedHuman: user.isVerifiedHuman || false,
                });
                setAnalyticsUser(user.id);
            } else {
                // Has wallet in Supabase but no email session
                setState({
                    isReady: true,
                    isAuthenticated: false,
                    walletAddress: user.walletAddress,
                    username: user.username || cachedWallet.username,
                    email: null,
                    isInWorldApp,
                    pendingEmailLink: true,
                    isVerifiedHuman: user.isVerifiedHuman || false,
                });
            }
        } catch (error) {
            console.error('Auth init error:', error);
            setState({
                isReady: true,
                isAuthenticated: false,
                walletAddress: null,
                username: null,
                email: null,
                isInWorldApp,
                pendingEmailLink: false,
                isVerifiedHuman: false,
            });
        }
    }, [isInWorldApp]);

    useEffect(() => {
        if (miniKitReady) {
            initAuth();
        }
    }, [miniKitReady, initAuth]);

    // Login with World App - Creates session in Supabase
    const loginWithWorldApp = useCallback(async () => {
        if (!isInWorldApp) {
            return;
        }

        try {
            const nonce = `${Date.now()}-${crypto.randomUUID()}`;

            const { finalPayload } = await MiniKit.commandsAsync.walletAuth({
                nonce,
                statement: 'Connect to OrbId Wallet',
            });

            if (finalPayload.status === 'success') {
                const address = finalPayload.address;
                const username = MiniKit.user?.username || null;

                localStorage.setItem(WALLET_CACHE_KEY, JSON.stringify({ walletAddress: address, username }));

                // Create session in Supabase
                const res = await fetch('/api/auth/session', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ walletAddress: address, username }),
                });
                const data = await res.json();

                if (data.success) {
                    setState(prev => ({
                        ...prev,
                        walletAddress: address,
                        username,
                        pendingEmailLink: true,
                    }));
                    Analytics.login('worldapp');
                }
            }
        } catch (error) {
            console.error('World App login error:', error);
            Analytics.error('auth', 'world_app_login_failed');
        }
    }, [isInWorldApp]);

    // Complete email linking
    const completeEmailLink = useCallback(async (email: string): Promise<{ success: boolean; error?: string }> => {
        try {
            // Update user in Supabase with email
            const res = await fetch('/api/analytics/user', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email,
                    walletAddress: state.walletAddress,
                    isVerifiedHuman: state.isVerifiedHuman,
                }),
            });
            const result = await res.json();

            if (!result.success) {
                if (result.error === 'wallet_already_linked') {
                    // Clear cache
                    localStorage.removeItem(WALLET_CACHE_KEY);
                    return {
                        success: false,
                        error: `This World ID is already linked to another email (${result.linkedEmail || 'unknown'}).`
                    };
                }
                return { success: false, error: result.error || 'Failed to link email' };
            }

            setState(prev => ({
                ...prev,
                isAuthenticated: true,
                email,
                pendingEmailLink: false,
            }));

            setAnalyticsUser(result.userId || null);
            Analytics.verifyWorldId(true);

            return { success: true };
        } catch (error) {
            console.error('Email link error:', error);
            return { success: false, error: 'Server error' };
        }
    }, [state.walletAddress, state.isVerifiedHuman]);

    // Logout - Removes from Supabase
    const logout = useCallback(async () => {
        try {
            // Remove from email session
            await fetch('/api/auth/logout', { method: 'POST' });

            // Remove from Supabase session
            if (state.walletAddress) {
                await fetch('/api/auth/session', {
                    method: 'DELETE',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ walletAddress: state.walletAddress }),
                });
            }
        } catch { }

        // Clear local cache
        localStorage.removeItem(WALLET_CACHE_KEY);
        localStorage.removeItem('orbid_world_id_verified');

        setState({
            isReady: true,
            isAuthenticated: false,
            walletAddress: null,
            username: null,
            email: null,
            isInWorldApp,
            pendingEmailLink: false,
            isVerifiedHuman: false,
        });

        Analytics.logout();
        setAnalyticsUser(null);
    }, [isInWorldApp, state.walletAddress]);

    return (
        <AuthContext.Provider value={{
            ...state,
            loginWithWorldApp,
            completeEmailLink,
            logout,
        }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}

export { AuthContext };
