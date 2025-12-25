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
    logout: () => void;
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

    // Initialize auth state from localStorage ONLY - no Supabase check
    const initAuth = useCallback(() => {
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

        // Use cached data directly - no Supabase verification
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

    // Login with World App - Creates session in Supabase AFTER MiniKit dialog
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

                // Save to Supabase
                const res = await fetch('/api/auth/session', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ walletAddress: address, username }),
                });
                const data = await res.json();

                // Cache everything locally
                const cacheData = {
                    walletAddress: address,
                    username,
                    email: data.email || null,
                    isVerifiedHuman: data.isVerifiedHuman || false,
                    newsletterClosed: !!data.email,
                };
                localStorage.setItem(WALLET_CACHE_KEY, JSON.stringify(cacheData));

                setState(prev => ({
                    ...prev,
                    isAuthenticated: true,
                    walletAddress: address,
                    username,
                    isVerifiedHuman: data.isVerifiedHuman || false,
                    newsletterClosed: !!data.email,
                }));

                if (data.userId) {
                    setAnalyticsUser(data.userId);
                }
                Analytics.login('worldapp');
            }
        } catch (error) {
            console.error('World App login error:', error);
            Analytics.error('auth', 'world_app_login_failed');
        }
    }, [isInWorldApp]);

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
                // Update local cache
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
        // Update local cache
        const cached = localStorage.getItem(WALLET_CACHE_KEY);
        if (cached) {
            const cacheData = JSON.parse(cached);
            cacheData.newsletterClosed = true;
            localStorage.setItem(WALLET_CACHE_KEY, JSON.stringify(cacheData));
        }
        setState(prev => ({ ...prev, newsletterClosed: true }));
    }, []);

    const setVerifiedHuman = useCallback((verified: boolean) => {
        // Update local cache
        const cached = localStorage.getItem(WALLET_CACHE_KEY);
        if (cached) {
            const cacheData = JSON.parse(cached);
            cacheData.isVerifiedHuman = verified;
            localStorage.setItem(WALLET_CACHE_KEY, JSON.stringify(cacheData));
        }
        setState(prev => ({ ...prev, isVerifiedHuman: verified }));
    }, []);

    // Logout - Clear everything
    const logout = useCallback(() => {
        localStorage.clear();
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
