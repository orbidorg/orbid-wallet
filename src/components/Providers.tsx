'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState, useEffect, type ReactNode, createContext, useContext } from 'react';
import { MiniKit } from '@worldcoin/minikit-js';
import { AuthProvider } from '@/lib/AuthContext';
import { ToastProvider } from '@/lib/ToastContext';
import { I18nProvider } from '@/lib/i18n';

const APP_ID = process.env.NEXT_PUBLIC_WLD_APP_ID || 'app_920c1c9a0cb3aaa68e626f54c09f3cf9';

// Initialize MiniKit SYNCHRONOUSLY at module load (before any React renders)
if (typeof window !== 'undefined') {
    MiniKit.install(APP_ID);
}

// Context to track MiniKit readiness
const MiniKitContext = createContext<{ isReady: boolean; isInstalled: boolean }>({
    isReady: false,
    isInstalled: false
});

export const useMiniKit = () => useContext(MiniKitContext);

export default function Providers({ children }: { children: ReactNode }) {
    const [queryClient] = useState(
        () =>
            new QueryClient({
                defaultOptions: {
                    queries: {
                        staleTime: 60 * 1000,
                        refetchOnWindowFocus: false,
                    },
                },
            })
    );

    const [miniKitState, setMiniKitState] = useState({
        isReady: false,
        isInstalled: false
    });

    // Check MiniKit status after mount
    useEffect(() => {
        const installed = MiniKit.isInstalled();
        setMiniKitState({
            isReady: true,
            isInstalled: installed
        });
    }, []);

    return (
        <MiniKitContext.Provider value={miniKitState}>
            <QueryClientProvider client={queryClient}>
                <I18nProvider>
                    <AuthProvider>
                        <ToastProvider>
                            {children}
                        </ToastProvider>
                    </AuthProvider>
                </I18nProvider>
            </QueryClientProvider>
        </MiniKitContext.Provider>
    );
}

