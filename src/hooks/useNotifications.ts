'use client';

import { useState, useEffect, useCallback } from 'react';
import { MiniKit, Permission } from '@worldcoin/minikit-js';

interface NotificationState {
    isEnabled: boolean;
    isSupported: boolean;
    isLoading: boolean;
}

export function useNotifications() {
    const [state, setState] = useState<NotificationState>({
        isEnabled: false,
        isSupported: false,
        isLoading: true,
    });

    useEffect(() => {
        // Check if running in World App
        const isSupported = MiniKit.isInstalled();

        // Load saved preference
        const savedPreference = localStorage.getItem('notifications_enabled');
        const isEnabled = savedPreference === 'true';

        setState({
            isEnabled: isEnabled && isSupported,
            isSupported,
            isLoading: false,
        });
    }, []);

    const requestPermission = useCallback(async (): Promise<boolean> => {
        if (!MiniKit.isInstalled()) {
            console.warn('MiniKit not installed, notifications not supported');
            return false;
        }

        setState(prev => ({ ...prev, isLoading: true }));

        try {
            // Request notification permission via MiniKit
            const { finalPayload } = await MiniKit.commandsAsync.requestPermission({
                permission: Permission.Notifications
            });

            const granted = finalPayload.status === 'success';

            // Save preference
            localStorage.setItem('notifications_enabled', granted ? 'true' : 'false');

            setState(prev => ({
                ...prev,
                isEnabled: granted,
                isLoading: false,
            }));

            return granted;
        } catch (error) {
            console.error('Failed to request notification permission:', error);
            setState(prev => ({ ...prev, isLoading: false }));
            return false;
        }
    }, []);

    const disableNotifications = useCallback(() => {
        localStorage.setItem('notifications_enabled', 'false');
        setState(prev => ({ ...prev, isEnabled: false }));
    }, []);

    return {
        ...state,
        requestPermission,
        disableNotifications,
    };
}
