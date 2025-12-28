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
    isVerifiedHuman: boolean; // Verified with Orb - persists in Supabase
    newsletterClosed: boolean;
}

interface AuthContextType extends AuthState {
    loginWithWorldApp: () => Promise<void>;
    updateNewsletterSubscription: (email: string) => Promise<void>;
    closeNewsletter: () => void;
    setVerifiedHuman: (verified: boolean) => void;
    logout: () => void;
    loginAsDev: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

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

    // Initialize - Just mark as ready, user must authenticate fresh
    const initAuth = useCallback(() => {
        const cached = localStorage.getItem(WALLET_CACHE_KEY);
        const cachedWallet = cached ? JSON.parse(cached) : null;

        if (!cachedWallet?.walletAddress) {
            // No session - user needs to connect
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

        // Has cached session - restore it
        setState({
            isReady: true,
            isAuthenticated: true,
            walletAddress: cachedWallet.walletAddress,
            username: cachedWallet.username || null,
            email: cachedWallet.email || null,
            isInWorldApp,
            isVerifiedHuman: cachedWallet.isVerifiedHuman || false,
            newsletterClosed: cachedWallet.newsletterClosed || false,
        });
    }, [isInWorldApp]);

    useEffect(() => {
        if (miniKitReady) {
            initAuth();
        }
    }, [miniKitReady, initAuth]);

    // Login with World App - Always shows MiniKit dialog
    const loginWithWorldApp = useCallback(async () => {
        if (!isInWorldApp) {
            return;
        }

        try {
            const nonce = `${Date.now()}-${crypto.randomUUID()}`;

            // This ALWAYS shows the MiniKit dialog
            const { finalPayload } = await MiniKit.commandsAsync.walletAuth({
                nonce,
                statement: 'Connect to OrbId Wallet',
            });

            if (finalPayload.status === 'success') {
                const address = finalPayload.address;
                const username = MiniKit.user?.username || null;

                // Check Supabase ONLY for Orb verification status
                let isVerifiedHuman = false;
                try {
                    const res = await fetch(`/api/auth/orb-status?wallet=${address}`);
                    const data = await res.json();
                    isVerifiedHuman = data.isVerifiedHuman || false;
                } catch {
                    // If API fails, default to not verified
                    isVerifiedHuman = false;
                }

                // Save session to Supabase (creates/updates user record)
                try {
                    const res = await fetch('/api/auth/session', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ walletAddress: address, username }),
                    });
                    const data = await res.json();
                    if (data.userId) {
                        setAnalyticsUser(data.userId);
                    }
                } catch (error) {
                    console.error('Failed to save session:', error);
                }

                // Cache locally
                const cacheData = {
                    walletAddress: address,
                    username,
                    isVerifiedHuman,
                    newsletterClosed: false,
                };
                localStorage.setItem(WALLET_CACHE_KEY, JSON.stringify(cacheData));

                setState(prev => ({
                    ...prev,
                    isAuthenticated: true,
                    walletAddress: address,
                    username,
                    isVerifiedHuman,
                    newsletterClosed: false,
                }));

                Analytics.login('worldapp');
            }
        } catch (error) {
            console.error('World App login error:', error);
            Analytics.error('auth', 'world_app_login_failed');
        }
    }, [isInWorldApp]);

    // Developer Bypass - For testing on Desktop/Preview
    const loginAsDev = useCallback(async () => {
        const address = '0x71C7656EC7ab88b098defB751B7401B5f6d8976F';
        const username = 'dev_user';
        const isVerifiedHuman = true;

        try {
            await fetch('/api/auth/session', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ walletAddress: address, username }),
            });
        } catch (error) {
            console.error('Failed to save dev session:', error);
        }

        const cacheData = {
            walletAddress: address,
            username,
            isVerifiedHuman,
            newsletterClosed: false,
        };
        localStorage.setItem(WALLET_CACHE_KEY, JSON.stringify(cacheData));

        setState(prev => ({
            ...prev,
            isAuthenticated: true,
            walletAddress: address,
            username,
            isVerifiedHuman,
            newsletterClosed: false,
        }));

        Analytics.login('developer_bypass');
    }, []);

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
                const cached = localStorage.getItem(WALLET_CACHE_KEY);
                if (cached) {
                    const cacheData = JSON.parse(cached);
                    cacheData.email = email;
                    cacheData.newsletterClosed = true;
                    localStorage.setItem(WALLET_CACHE_KEY, JSON.stringify(cacheData));
                }

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
        const cached = localStorage.getItem(WALLET_CACHE_KEY);
        if (cached) {
            const cacheData = JSON.parse(cached);
            cacheData.newsletterClosed = true;
            localStorage.setItem(WALLET_CACHE_KEY, JSON.stringify(cacheData));
        }
        setState(prev => ({ ...prev, newsletterClosed: true }));
    }, []);

    // Update Orb verification status - saves to Supabase
    const setVerifiedHuman = useCallback((verified: boolean) => {
        const cached = localStorage.getItem(WALLET_CACHE_KEY);
        if (cached) {
            const cacheData = JSON.parse(cached);
            cacheData.isVerifiedHuman = verified;
            localStorage.setItem(WALLET_CACHE_KEY, JSON.stringify(cacheData));
        }
        setState(prev => ({ ...prev, isVerifiedHuman: verified }));
    }, []);

    // Logout - Complete reset
    const logout = useCallback(() => {
        // Clear auth-related storage only
        localStorage.removeItem(WALLET_CACHE_KEY);
        localStorage.removeItem('orbid_world_id_verified');
        localStorage.removeItem('notifications_enabled');
        sessionStorage.clear();

        // Reset to initial state
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
            loginAsDev,
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
