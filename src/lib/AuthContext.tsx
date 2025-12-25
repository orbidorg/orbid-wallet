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
    isVerifiedHuman: boolean;
    newsletterClosed: boolean;
}

interface AuthContextType extends AuthState {
    loginWithWorldApp: () => Promise<void>;
    updateNewsletterSubscription: (email: string) => Promise<void>;
    closeNewsletter: () => void;
    setVerifiedHuman: (verified: boolean) => void;
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
        isVerifiedHuman: false,
        newsletterClosed: false,
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
                    isVerifiedHuman: false,
                    newsletterClosed: false,
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
                    isVerifiedHuman: false,
                    newsletterClosed: false,
                });
                return;
            }

            // User exists in Supabase
            const user = sessionData.user;

            setState({
                isReady: true,
                isAuthenticated: true,
                walletAddress: user.walletAddress,
                username: user.username || cachedWallet.username,
                email: user.email,
                isInWorldApp,
                isVerifiedHuman: user.isVerifiedHuman || false,
                newsletterClosed: !!user.email, // If they have an email, we assume they either subbed or were asked
            });
            setAnalyticsUser(user.id);
        } catch (error) {
            console.error('Auth init error:', error);
            setState({
                isReady: true,
                isAuthenticated: false,
                walletAddress: null,
                username: null,
                email: null,
                isInWorldApp,
                isVerifiedHuman: false,
                newsletterClosed: false,
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
                        isAuthenticated: true,
                        walletAddress: address,
                        username,
                        isVerifiedHuman: data.isVerifiedHuman || false,
                        newsletterClosed: !!data.email,
                    }));
                    Analytics.login('worldapp');
                }
            }
        } catch (error) {
            console.error('World App login error:', error);
            Analytics.error('auth', 'world_app_login_failed');
        }
    }, [isInWorldApp]);

    // Update newsletter subscription
    const updateNewsletterSubscription = useCallback(async (email: string) => {
        try {
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

            if (result.success) {
                setState(prev => ({
                    ...prev,
                    email,
                    newsletterClosed: true,
                }));
            }
        } catch (error) {
            console.error('Newsletter sub error:', error);
        }
    }, [state.walletAddress, state.isVerifiedHuman]);

    const closeNewsletter = useCallback(() => {
        setState(prev => ({ ...prev, newsletterClosed: true }));
    }, []);

    const setVerifiedHuman = useCallback((verified: boolean) => {
        setState(prev => ({ ...prev, isVerifiedHuman: verified }));
    }, []);

    // Logout - Clears all local state and cache
    const logout = useCallback(async () => {
        // Clear all OrbId-related localStorage keys
        localStorage.removeItem(WALLET_CACHE_KEY);
        localStorage.removeItem('orbid_world_id_verified');
        localStorage.removeItem('notifications_enabled');

        // Clear any sessionStorage if used
        sessionStorage.clear();

        setState({
            isReady: true,
            isAuthenticated: false,
            walletAddress: null,
            username: null,
            email: null,
            isInWorldApp,
            isVerifiedHuman: false,
            newsletterClosed: false,
        });

        Analytics.logout();
        setAnalyticsUser(null);
    }, [isInWorldApp]);

    return (
        <AuthContext.Provider value={{
            ...state,
            loginWithWorldApp,
            updateNewsletterSubscription,
            closeNewsletter,
            setVerifiedHuman,
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
