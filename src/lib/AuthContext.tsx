'use client';

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { MiniKit } from '@worldcoin/minikit-js';
import { useMiniKit } from '@/components/Providers';
import Analytics, { createOrUpdateUser, setAnalyticsUser } from './analytics';

interface AuthState {
    isReady: boolean;
    isAuthenticated: boolean;
    walletAddress: string | null;
    username: string | null;
    email: string | null;
    isInWorldApp: boolean;
    // New: World ID connected but email not yet linked
    pendingEmailLink: boolean;
}

interface AuthContextType extends AuthState {
    loginWithWorldApp: () => Promise<void>;
    completeEmailLink: (email: string) => Promise<{ success: boolean; error?: string }>;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

const STORAGE_KEY = 'orbid_auth';

export function AuthProvider({ children }: { children: ReactNode }) {
    const [state, setState] = useState<AuthState>({
        isReady: false,
        isAuthenticated: false,
        walletAddress: null,
        username: null,
        email: null,
        isInWorldApp: false,
        pendingEmailLink: false,
    });
    const { isReady: miniKitReady, isInstalled: isInWorldApp } = useMiniKit();

    // Initialize auth state
    const initAuth = useCallback(async () => {
        try {
            // Check for server session first
            const res = await fetch('/api/auth/me');
            const data = await res.json();

            // Check localStorage for wallet
            const stored = localStorage.getItem(STORAGE_KEY);
            const parsedStored = stored ? JSON.parse(stored) : null;

            // Full authentication: wallet + email session
            if (data.authenticated && data.email && parsedStored?.walletAddress) {
                setState({
                    isReady: true,
                    isAuthenticated: true,
                    walletAddress: parsedStored.walletAddress,
                    username: parsedStored.username || null,
                    email: data.email,
                    isInWorldApp,
                    pendingEmailLink: false,
                });

                // Track user
                createOrUpdateUser({
                    email: data.email,
                    walletAddress: parsedStored.walletAddress,
                    isVerifiedHuman: true
                }).then(result => result.success && setAnalyticsUser(result.userId || null));
                return;
            }

            // Wallet exists but no email session - need to link email
            if (parsedStored?.walletAddress && !data.authenticated) {
                setState({
                    isReady: true,
                    isAuthenticated: false,
                    walletAddress: parsedStored.walletAddress,
                    username: parsedStored.username || null,
                    email: null,
                    isInWorldApp,
                    pendingEmailLink: true,
                });
                return;
            }

            // Not authenticated
            setState({
                isReady: true,
                isAuthenticated: false,
                walletAddress: null,
                username: null,
                email: null,
                isInWorldApp,
                pendingEmailLink: false,
            });
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
            });
        }
    }, [isInWorldApp]);

    useEffect(() => {
        if (miniKitReady) {
            initAuth();
        }
    }, [miniKitReady, initAuth]);

    // Login with World App (MiniKit) - Step 1: Get wallet, then need email
    const loginWithWorldApp = useCallback(async () => {
        if (!isInWorldApp) {
            // Should not happen - browser users see QR code
            return;
        }

        try {
            const { finalPayload } = await MiniKit.commandsAsync.walletAuth({
                nonce: crypto.randomUUID(),
            });

            if (finalPayload.status === 'success') {
                const address = finalPayload.address;
                const username = (finalPayload as { username?: string }).username || null;

                console.log('[AuthContext] walletAuth response:', { address, username, fullPayload: finalPayload });

                localStorage.setItem(STORAGE_KEY, JSON.stringify({ walletAddress: address, username }));

                // Set pending email link state - user needs to link email
                setState(prev => ({
                    ...prev,
                    walletAddress: address,
                    username,
                    pendingEmailLink: true,
                }));

                // Track initial connection
                Analytics.login('worldapp');
            }
        } catch (error) {
            console.error('World App login error:', error);
            Analytics.error('auth', 'world_app_login_failed');
        }
    }, [isInWorldApp]);

    // Complete email linking - Step 2: After email verification
    // Returns { success: boolean, error?: string } to handle wallet_already_linked errors
    const completeEmailLink = useCallback(async (email: string): Promise<{ success: boolean; error?: string }> => {
        const stored = localStorage.getItem(STORAGE_KEY);
        const parsedStored = stored ? JSON.parse(stored) : {};

        // Call API to link email to wallet
        const result = await createOrUpdateUser({
            email,
            walletAddress: state.walletAddress || undefined,
            isVerifiedHuman: true
        });

        if (!result.success) {
            // Handle wallet already linked to another email
            if (result.error === 'wallet_already_linked') {
                // Clear the pending wallet and show error
                localStorage.removeItem(STORAGE_KEY);
                setState(prev => ({
                    ...prev,
                    walletAddress: null,
                    username: null,
                    pendingEmailLink: false,
                }));
                return {
                    success: false,
                    error: `This World ID is already linked to another email (${result.linkedEmail || 'unknown'}). Please login with that email.`
                };
            }
            return { success: false, error: result.error || 'Failed to link email' };
        }

        // Update localStorage with email
        localStorage.setItem(STORAGE_KEY, JSON.stringify({
            ...parsedStored,
            email
        }));

        setState(prev => ({
            ...prev,
            isAuthenticated: true,
            email,
            pendingEmailLink: false,
        }));

        setAnalyticsUser(result.userId || null);
        Analytics.verifyWorldId(true);

        return { success: true };
    }, [state.walletAddress]);

    // Logout
    const logout = useCallback(async () => {
        try {
            await fetch('/api/auth/logout', { method: 'POST' });
        } catch { }

        localStorage.removeItem(STORAGE_KEY);
        localStorage.removeItem('worldid_verified');

        setState({
            isReady: true,
            isAuthenticated: false,
            walletAddress: null,
            username: null,
            email: null,
            isInWorldApp,
            pendingEmailLink: false,
        });

        Analytics.logout();
        setAnalyticsUser(null);
    }, [isInWorldApp]);

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
