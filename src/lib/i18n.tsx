'use client';

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';

// Supported languages
export type Language = 'en' | 'es' | 'zh' | 'hi' | 'pt' | 'fr' | 'de' | 'ja' | 'ko' | 'ar';

export interface LanguageInfo {
    code: Language;
    name: string;
    nativeName: string;
    flag: string;
    rtl: boolean;
}

export const LANGUAGES: LanguageInfo[] = [
    { code: 'en', name: 'English', nativeName: 'English', flag: '🇺🇸', rtl: false },
    { code: 'es', name: 'Spanish', nativeName: 'Español', flag: '🇪🇸', rtl: false },
    { code: 'zh', name: 'Chinese', nativeName: '中文', flag: '🇨🇳', rtl: false },
    { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', flag: '🇮🇳', rtl: false },
    { code: 'pt', name: 'Portuguese', nativeName: 'Português', flag: '🇧🇷', rtl: false },
    { code: 'fr', name: 'French', nativeName: 'Français', flag: '🇫🇷', rtl: false },
    { code: 'de', name: 'German', nativeName: 'Deutsch', flag: '🇩🇪', rtl: false },
    { code: 'ja', name: 'Japanese', nativeName: '日本語', flag: '🇯🇵', rtl: false },
    { code: 'ko', name: 'Korean', nativeName: '한국어', flag: '🇰🇷', rtl: false },
    { code: 'ar', name: 'Arabic', nativeName: 'العربية', flag: '🇸🇦', rtl: true },
];

// Translation keys
export interface Translations {
    // Navigation
    nav: {
        wallet: string;
        activity: string;
        swap: string;
        profile: string;
    };
    // Profile
    profile: {
        totalBalance: string;
        copyAddress: string;
        addressCopied: string;
        disconnect: string;
        verified: string;
        verifyIdentity: string;
        wldBalance: string;
        explorer: string;
        worldChain: string;
        chainId: string;
        connected: string;
    };
    // Activity
    activity: {
        title: string;
        noActivity: string;
        loadMore: string;
        sent: string;
        received: string;
        swapped: string;
        contract: string;
        pending: string;
        failed: string;
        transactionDetails: string;
        type: string;
        from: string;
        to: string;
        amount: string;
        date: string;
        time: string;
        hash: string;
        network: string;
        viewExplorer: string;
        transactions: string;
    };
    // Tokens
    tokens: {
        send: string;
        receive: string;
        buy: string;
        noTokens: string;
        balance: string;
        price: string;
        change24h: string;
    };
    // Modals
    modals: {
        send: string;
        receive: string;
        settings: string;
        close: string;
        confirm: string;
        cancel: string;
        share: string;
        scanQR: string;
        enterAddress: string;
        enterAmount: string;
        max: string;
        continue: string;
        sending: string;
        success: string;
        error: string;
        selectToken: string;
        recipientAddress: string;
        change: string;
        fee: string;
        free: string;
        processing: string;
        transactionSent: string;
        tryAgain: string;
        invalidAddress: string;
        invalidAmount: string;
        insufficientBalance: string;
        transactionFailed: string;
        transactionRejected: string;
    };
    // Settings
    settings: {
        title: string;
        language: string;
        selectLanguage: string;
        about: string;
        help: string;
        contact: string;
        followX: string;
        version: string;
        tagline: string;
    };
    // Email Linking
    email: {
        linkEmail: string;
        enterEmail: string;
        sendCode: string;
        enterCode: string;
        verifyCode: string;
        codeSent: string;
        invalidCode: string;
        welcome: string;
        connectedWallet: string;
        emailRequired: string;
        changeEmail: string;
    };
    // Swap
    swap: {
        comingSoon: string;
        underDevelopment: string;
        description: string;
        followUpdates: string;
        swapFrom: string;
    };
    // Ads
    ads: {
        showAnnouncements: string;
        orbidLive: string;
        orbidLiveDesc: string;
        followX: string;
        followXDesc: string;
        followCta: string;
    };
    // Common
    common: {
        loading: string;
        error: string;
        retry: string;
        back: string;
        warning: string;
        worldChainOnly: string;
    };
}

// Import translations
import { en } from './translations/en';
import { es } from './translations/es';
import { zh } from './translations/zh';
import { hi } from './translations/hi';
import { pt } from './translations/pt';
import { fr } from './translations/fr';
import { de } from './translations/de';
import { ja } from './translations/ja';
import { ko } from './translations/ko';
import { ar } from './translations/ar';

const translations: Record<Language, Translations> = {
    en, es, zh, hi, pt, fr, de, ja, ko, ar
};

// Context
interface I18nContextType {
    lang: Language;
    setLang: (lang: Language) => void;
    t: Translations;
    isRTL: boolean;
    languages: LanguageInfo[];
}

const I18nContext = createContext<I18nContextType | null>(null);

const STORAGE_KEY = 'orbid_language';

// Detect browser language
function detectLanguage(): Language {
    if (typeof window === 'undefined') return 'en';

    const browserLang = navigator.language.split('-')[0].toLowerCase();
    const supported = LANGUAGES.find(l => l.code === browserLang);
    return supported ? supported.code : 'en';
}

export function I18nProvider({ children }: { children: ReactNode }) {
    const [lang, setLangState] = useState<Language>('en');
    const [mounted, setMounted] = useState(false);

    // Initialize language
    useEffect(() => {
        const stored = localStorage.getItem(STORAGE_KEY) as Language | null;
        const detected = stored || detectLanguage();
        setLangState(detected);
        setMounted(true);
    }, []);

    // Update document direction for RTL
    useEffect(() => {
        if (!mounted) return;
        const langInfo = LANGUAGES.find(l => l.code === lang);
        document.documentElement.dir = langInfo?.rtl ? 'rtl' : 'ltr';
        document.documentElement.lang = lang;
    }, [lang, mounted]);

    const setLang = useCallback((newLang: Language) => {
        setLangState(newLang);
        localStorage.setItem(STORAGE_KEY, newLang);
    }, []);

    const isRTL = LANGUAGES.find(l => l.code === lang)?.rtl || false;
    const t = translations[lang] || translations.en;

    return (
        <I18nContext.Provider value={{ lang, setLang, t, isRTL, languages: LANGUAGES }}>
            {children}
        </I18nContext.Provider>
    );
}

export function useI18n() {
    const context = useContext(I18nContext);
    if (!context) {
        throw new Error('useI18n must be used within I18nProvider');
    }
    return context;
}
