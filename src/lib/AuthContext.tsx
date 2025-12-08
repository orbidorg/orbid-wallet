'use client';

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { MiniKit } from '@worldcoin/minikit-js';
import Analytics, { createOrUpdateUser, setAnalyticsUser } from './analytics';

interface AuthState {
    isReady: boolean;
    isAuthenticated: boolean;
    walletAddress: string | null;
    username: string | null;
    email: string | null;
    isInWorldApp: boolean;
}

interface AuthContextType extends AuthState {
    loginWithWorldApp: () => Promise<void>;
    loginWithEmail: (email: string) => void;
    connectWorldID: () => Promise<void>;
    logout: () => Promise<void>;
    showEmailLogin: boolean;
    setShowEmailLogin: (show: boolean) => void;
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
    });
    const [showEmailLogin, setShowEmailLogin] = useState(false);

    // Initialize auth state
    const initAuth = useCallback(async () => {
        try {
            // Check for server session first
            const res = await fetch('/api/auth/me');
            const data = await res.json();

            // Check localStorage for wallet
            const stored = localStorage.getItem(STORAGE_KEY);
            const parsedStored = stored ? JSON.parse(stored) : null;

            if (data.authenticated && data.email) {
                setState({
                    isReady: true,
                    isAuthenticated: true,
                    walletAddress: parsedStored?.walletAddress || null,
                    username: parsedStored?.username || null,
                    email: data.email,
                    isInWorldApp: MiniKit.isInstalled(),
                });

                // Track user
                if (parsedStored?.walletAddress || data.email) {
                    createOrUpdateUser({
                        email: data.email,
                        walletAddress: parsedStored?.walletAddress,
                        isVerifiedHuman: false
                    }).then(id => setAnalyticsUser(id));
                }
                return;
            }

            // Check localStorage for wallet-only auth
            if (parsedStored?.walletAddress) {
                setState({
                    isReady: true,
                    isAuthenticated: true,
                    walletAddress: parsedStored.walletAddress,
                    username: parsedStored.username || null,
                    email: null,
                    isInWorldApp: MiniKit.isInstalled(),
                });

                // Track user
                createOrUpdateUser({
                    walletAddress: parsedStored.walletAddress,
                    isVerifiedHuman: false
                }).then(id => setAnalyticsUser(id));
                return;
            }

            // Not authenticated
            setState({
                isReady: true,
                isAuthenticated: false,
                walletAddress: null,
                username: null,
                email: null,
                isInWorldApp: MiniKit.isInstalled(),
            });
        } catch (error) {
            console.error('Auth init error:', error);
            setState({
                isReady: true,
                isAuthenticated: false,
                walletAddress: null,
                username: null,
                email: null,
                isInWorldApp: false,
            });
        }
    }, []);

    useEffect(() => {
        initAuth();
    }, [initAuth]);

    // Login with World App (MiniKit) - gets wallet directly
    const loginWithWorldApp = useCallback(async () => {
        if (!MiniKit.isInstalled()) {
            // Outside World App - show email login
            setShowEmailLogin(true);
            return;
        }

        try {
            const { finalPayload } = await MiniKit.commandsAsync.walletAuth({
                nonce: crypto.randomUUID(),
            });

            if (finalPayload.status === 'success') {
                const address = finalPayload.address;
                const username = (finalPayload as { username?: string }).username || null;
                localStorage.setItem(STORAGE_KEY, JSON.stringify({ walletAddress: address, username }));
                setState(prev => ({
                    ...prev,
                    isAuthenticated: true,
                    walletAddress: address,
                    username,
                }));

                // Track
                Analytics.login('worldapp');
                createOrUpdateUser({
                    walletAddress: address,
                    isVerifiedHuman: true
                }).then(id => setAnalyticsUser(id));
            }
        } catch (error) {
            console.error('World App login error:', error);
            Analytics.error('auth', 'world_app_login_failed');
            setShowEmailLogin(true);
        }
    }, []);

    // Login with email (called after successful code verification)
    const loginWithEmail = useCallback(async (email: string) => {
        setState(prev => ({
            ...prev,
            isAuthenticated: true,
            email,
            walletAddress: null, // No wallet yet, need to connect World ID
        }));
        setShowEmailLogin(false);

        // Track
        Analytics.login('email');
        createOrUpdateUser({ email }).then(id => setAnalyticsUser(id));
    }, []);

    // Connect World ID to get wallet address (after email login)
    const connectWorldID = useCallback(async () => {
        if (!MiniKit.isInstalled()) {
            // Outside World App - generate mock for testing
            const mockAddress = '0x' + Array.from({ length: 40 }, () =>
                Math.floor(Math.random() * 16).toString(16)
            ).join('');

            const stored = localStorage.getItem(STORAGE_KEY);
            const parsed = stored ? JSON.parse(stored) : {};
            localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...parsed, walletAddress: mockAddress }));

            setState(prev => ({
                ...prev,
                walletAddress: mockAddress,
            }));

            // Track
            Analytics.verifyWorldId(true);
            createOrUpdateUser({
                email: state.email || undefined,
                walletAddress: mockAddress,
                isVerifiedHuman: true
            }).then(id => setAnalyticsUser(id));
            return;
        }

        try {
            const { finalPayload } = await MiniKit.commandsAsync.walletAuth({
                nonce: crypto.randomUUID(),
            });

            if (finalPayload.status === 'success') {
                const address = finalPayload.address;
                const stored = localStorage.getItem(STORAGE_KEY);
                const parsed = stored ? JSON.parse(stored) : {};
                localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...parsed, walletAddress: address }));

                setState(prev => ({
                    ...prev,
                    walletAddress: address,
                }));

                // Track
                Analytics.verifyWorldId(true);
                createOrUpdateUser({
                    email: state.email || undefined,
                    walletAddress: address,
                    isVerifiedHuman: true
                }).then(id => setAnalyticsUser(id));
            }
        } catch (error) {
            console.error('Connect World ID error:', error);
            Analytics.error('auth', 'world_id_connect_failed');
        }
    }, [state.email]);

    // Logout
    const logout = useCallback(async () => {
        try {
            await fetch('/api/auth/logout', { method: 'POST' });
        } catch {
            // Ignore errors
        }
        localStorage.removeItem(STORAGE_KEY);
        setState(prev => ({
            ...prev,
            isAuthenticated: false,
            walletAddress: null,
            email: null,
        }));

        Analytics.logout();
        setAnalyticsUser(null);
    }, []);

    return (
        <AuthContext.Provider value={{
            ...state,
            loginWithWorldApp,
            loginWithEmail,
            connectWorldID,
            logout,
            showEmailLogin,
            setShowEmailLogin,
        }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within AuthProvider');
    }
    return context;
}
