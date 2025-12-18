'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';

// World App supported languages for notifications (Arabic not supported)
const SUPPORTED_LANGUAGES = [
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'es', name: 'Spanish', flag: '🇪🇸' },
    { code: 'es-419', name: 'Spanish (LATAM)', flag: '🇲🇽' },
    { code: 'pt', name: 'Portuguese', flag: '🇧🇷' },
    { code: 'fr', name: 'French', flag: '🇫🇷' },
    { code: 'de', name: 'German', flag: '🇩🇪' },
    { code: 'ca', name: 'Catalan', flag: '🇪🇸' },
    { code: 'pl', name: 'Polish', flag: '🇵🇱' },
    { code: 'zh-CN', name: 'Chinese (Simplified)', flag: '🇨🇳' },
    { code: 'zh-TW', name: 'Chinese (Traditional)', flag: '🇹🇼' },
    { code: 'ja', name: 'Japanese', flag: '🇯🇵' },
    { code: 'ko', name: 'Korean', flag: '🇰🇷' },
    { code: 'th', name: 'Thai', flag: '🇹🇭' },
    { code: 'id', name: 'Indonesian', flag: '🇮🇩' },
    { code: 'ms', name: 'Malay', flag: '🇲🇾' },
    { code: 'hi', name: 'Hindi', flag: '🇮🇳' },
] as const;

type LanguageCode = typeof SUPPORTED_LANGUAGES[number]['code'];

interface Translation {
    language: LanguageCode;
    title: string;
    message: string;
}

export default function AdminNotificationsPage() {
    // Auth state
    const [authenticated, setAuthenticated] = useState(false);
    const [password, setPassword] = useState('');
    const passwordRef = useRef('');
    const [authLoading, setAuthLoading] = useState(false);
    const [authError, setAuthError] = useState('');

    // Form state
    const [baseTitle, setBaseTitle] = useState('');
    const [baseMessage, setBaseMessage] = useState('');
    const [walletAddresses, setWalletAddresses] = useState('');
    const [miniAppPath, setMiniAppPath] = useState('/');

    // Language selection
    const [selectedLanguages, setSelectedLanguages] = useState<Set<LanguageCode>>(new Set(['en']));

    // Translated content (editable preview)
    const [translations, setTranslations] = useState<Translation[]>([]);

    // UI state
    const [showPreview, setShowPreview] = useState(false);
    const [sending, setSending] = useState(false);
    const [translating, setTranslating] = useState(false);
    const [result, setResult] = useState<{ success: boolean; message: string; details?: Record<string, unknown> } | null>(null);

    // Keep password ref updated
    useEffect(() => {
        passwordRef.current = password;
    }, [password]);

    // Authenticate
    const authenticate = async () => {
        setAuthLoading(true);
        setAuthError('');
        try {
            // Test auth by making a simple call to the analytics endpoint
            const res = await fetch('/api/analytics?stat=overview', {
                headers: { 'Authorization': `Bearer ${password}` }
            });
            if (res.ok) {
                setAuthenticated(true);
                passwordRef.current = password;
            } else {
                setAuthError('Invalid admin secret');
            }
        } catch {
            setAuthError('Connection error');
        }
        setAuthLoading(false);
    };

    // Logout
    const logout = () => {
        setAuthenticated(false);
        setPassword('');
        passwordRef.current = '';
        setResult(null);
    };

    // Generate translations when base content or languages change
    const generateTranslations = useCallback(async () => {
        setTranslating(true);
        try {
            const targetLangs = Array.from(selectedLanguages);
            const res = await fetch('/api/admin/translate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${passwordRef.current}`
                },
                body: JSON.stringify({
                    title: baseTitle,
                    message: baseMessage,
                    targetLanguages: targetLangs
                })
            });

            if (res.ok) {
                const data = await res.json();
                const newTranslations: Translation[] = [];

                targetLangs.forEach(lang => {
                    const trans = data.translations[lang] || { title: baseTitle, message: baseMessage };
                    newTranslations.push({
                        language: lang,
                        title: trans.title,
                        message: trans.message,
                    });
                });
                setTranslations(newTranslations);
            } else {
                // Fallback if API fails
                const newTranslations: Translation[] = [];
                selectedLanguages.forEach(lang => {
                    newTranslations.push({
                        language: lang,
                        title: baseTitle,
                        message: baseMessage,
                    });
                });
                setTranslations(newTranslations);
            }
        } catch (error) {
            console.error('Translation error:', error);
        } finally {
            setTranslating(false);
        }
    }, [selectedLanguages, baseTitle, baseMessage]);

    const toggleAllLanguages = () => {
        const allCodes = SUPPORTED_LANGUAGES.map(l => l.code);
        const isAllSelected = selectedLanguages.size === allCodes.length;

        if (isAllSelected) {
            setSelectedLanguages(new Set(['en']));
        } else {
            setSelectedLanguages(new Set(allCodes));
        }
    };

    const toggleLanguage = (lang: LanguageCode) => {
        const newSelected = new Set(selectedLanguages);
        if (newSelected.has(lang)) {
            // Don't allow removing English
            if (lang !== 'en') {
                newSelected.delete(lang);
            }
        } else {
            newSelected.add(lang);
        }
        setSelectedLanguages(newSelected);
    };

    const selectNone = () => {
        setSelectedLanguages(new Set(['en'])); // Always keep English
    };

    const updateTranslation = (index: number, field: 'title' | 'message', value: string) => {
        const newTranslations = [...translations];
        newTranslations[index] = { ...newTranslations[index], [field]: value };
        setTranslations(newTranslations);
    };

    const handleSend = async () => {
        const addresses = walletAddresses
            .split(/[\n,]/)
            .map(a => a.trim())
            .filter(a => a.length > 0);

        if (addresses.length === 0) {
            setResult({ success: false, message: 'Please enter at least one wallet address' });
            return;
        }

        if (translations.length === 0) {
            setResult({ success: false, message: 'Please add translations' });
            return;
        }

        // Validate all translations have content
        for (const t of translations) {
            if (!t.title.trim() || !t.message.trim()) {
                setResult({ success: false, message: `Missing title or message for ${t.language}` });
                return;
            }
        }

        setSending(true);
        setResult(null);

        // Split addresses into batches of 1000 (World App API limit)
        const BATCH_SIZE = 1000;
        const batches: string[][] = [];
        for (let i = 0; i < addresses.length; i += BATCH_SIZE) {
            batches.push(addresses.slice(i, i + BATCH_SIZE));
        }

        const results: { batch: number; success: boolean; data?: Record<string, unknown>; error?: string }[] = [];
        let successCount = 0;
        let failCount = 0;

        try {
            for (let i = 0; i < batches.length; i++) {
                const batch = batches[i];

                // Update progress
                setResult({
                    success: true,
                    message: `Sending batch ${i + 1}/${batches.length} (${batch.length} addresses)...`,
                });

                try {
                    const response = await fetch('/api/admin/notifications/send', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${passwordRef.current}`,
                        },
                        body: JSON.stringify({
                            walletAddresses: batch,
                            localisations: translations,
                            miniAppPath,
                        }),
                    });

                    const data = await response.json();

                    if (response.ok) {
                        results.push({ batch: i + 1, success: true, data });
                        successCount += batch.length;
                    } else {
                        results.push({ batch: i + 1, success: false, error: data.error });
                        failCount += batch.length;
                    }
                } catch (error) {
                    results.push({ batch: i + 1, success: false, error: String(error) });
                    failCount += batch.length;
                }

                // Small delay between batches to avoid rate limiting
                if (i < batches.length - 1) {
                    await new Promise(resolve => setTimeout(resolve, 500));
                }
            }

            // Final result
            const allSuccess = results.every(r => r.success);
            setResult({
                success: allSuccess,
                message: allSuccess
                    ? `✅ All ${batches.length} batch(es) sent successfully! (${successCount} addresses)`
                    : `⚠️ Completed with errors: ${successCount} succeeded, ${failCount} failed`,
                details: {
                    batches: results,
                    totalAddresses: addresses.length,
                    successCount,
                    failCount,
                },
            });
        } catch (error) {
            setResult({ success: false, message: 'Network error', details: { error: String(error) } });
        } finally {
            setSending(false);
        }
    };

    return (
        <div className="min-h-screen bg-zinc-950 text-white p-6">
            <div className="max-w-4xl mx-auto">
                {!authenticated ? (
                    // Login Screen
                    <div className="flex items-center justify-center min-h-[80vh]">
                        <div className="bg-zinc-900 rounded-xl p-8 w-full max-w-md">
                            <h1 className="text-2xl font-bold mb-6 text-center">🔐 Admin Notifications</h1>
                            <p className="text-zinc-400 text-sm mb-6 text-center">
                                Enter your admin secret to access the notification panel
                            </p>
                            <div className="space-y-4">
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && authenticate()}
                                    placeholder="Enter admin secret..."
                                    className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg focus:outline-none focus:border-pink-500"
                                />
                                {authError && (
                                    <p className="text-red-400 text-sm">{authError}</p>
                                )}
                                <button
                                    onClick={authenticate}
                                    disabled={authLoading || !password}
                                    className="w-full py-3 bg-gradient-to-r from-pink-500 to-purple-600 rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 transition-opacity"
                                >
                                    {authLoading ? 'Verifying...' : 'Access Panel'}
                                </button>
                            </div>
                            <div className="mt-6 text-center">
                                <Link href="/admin" className="text-sm text-zinc-400 hover:text-pink-400 transition-colors">
                                    ← Back to Dashboard
                                </Link>
                            </div>
                        </div>
                    </div>
                ) : (
                    // Authenticated View
                    <>
                        {/* Header with navigation */}
                        <div className="flex justify-between items-center mb-6">
                            <h1 className="text-2xl font-bold">📢 Send Notifications</h1>
                            <div className="flex items-center gap-4">
                                <Link href="/admin" className="text-sm text-zinc-400 hover:text-pink-400 transition-colors">
                                    Dashboard
                                </Link>
                                <Link href="/admin/tickets" className="text-sm text-zinc-400 hover:text-pink-400 transition-colors">
                                    Tickets
                                </Link>
                                <button
                                    onClick={logout}
                                    className="px-4 py-2 text-sm bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-colors"
                                >
                                    Logout
                                </button>
                            </div>
                        </div>

                        {!showPreview ? (
                            <>
                                {/* Step 1: Basic Info */}
                                <div className="bg-zinc-900 rounded-xl p-6 mb-6">
                                    <h2 className="text-lg font-semibold mb-4">1. Notification Content</h2>

                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-sm text-zinc-400 mb-1">
                                                Title <span className="text-zinc-500">(max 30 chars)</span>
                                            </label>
                                            <input
                                                type="text"
                                                value={baseTitle}
                                                onChange={(e) => setBaseTitle(e.target.value.slice(0, 30))}
                                                placeholder="🎉 Rewards Available"
                                                className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg focus:outline-none focus:border-pink-500"
                                                maxLength={30}
                                            />
                                            <span className="text-xs text-zinc-500">{baseTitle.length}/30</span>
                                        </div>

                                        <div>
                                            <label className="block text-sm text-zinc-400 mb-1">
                                                Message <span className="text-zinc-500">(max 200 chars, use {'${username}'} for personalization)</span>
                                            </label>
                                            <textarea
                                                value={baseMessage}
                                                onChange={(e) => setBaseMessage(e.target.value.slice(0, 200))}
                                                placeholder="Hey ${username}, your daily rewards are ready!"
                                                className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg focus:outline-none focus:border-pink-500 h-20 resize-none"
                                                maxLength={200}
                                            />
                                            <span className="text-xs text-zinc-500">{baseMessage.length}/200</span>
                                        </div>

                                        <div>
                                            <label className="block text-sm text-zinc-400 mb-1">
                                                Mini App Path <span className="text-zinc-500">(where to open when clicked)</span>
                                            </label>
                                            <input
                                                type="text"
                                                value={miniAppPath}
                                                onChange={(e) => setMiniAppPath(e.target.value)}
                                                placeholder="/"
                                                className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg focus:outline-none focus:border-pink-500"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Step 2: Wallet Addresses */}
                                <div className="bg-zinc-900 rounded-xl p-6 mb-6">
                                    <h2 className="text-lg font-semibold mb-4">2. Recipients</h2>

                                    <div>
                                        <label className="block text-sm text-zinc-400 mb-1">
                                            Wallet Addresses <span className="text-zinc-500">(one per line or comma-separated, max 1000)</span>
                                        </label>
                                        <textarea
                                            value={walletAddresses}
                                            onChange={(e) => setWalletAddresses(e.target.value)}
                                            placeholder="0x123...&#10;0x456...&#10;0x789..."
                                            className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg focus:outline-none focus:border-pink-500 h-32 resize-none font-mono text-sm"
                                        />
                                        <span className="text-xs text-zinc-500">
                                            {walletAddresses.split(/[\n,]/).filter(a => a.trim()).length} addresses
                                        </span>
                                    </div>
                                </div>

                                {/* Step 3: Languages */}
                                <div className="bg-zinc-900 rounded-xl p-6 mb-6">
                                    <h2 className="text-lg font-semibold mb-4">3. Languages</h2>

                                    <div className="flex gap-2 mb-4">
                                        <button
                                            onClick={toggleAllLanguages}
                                            className="px-4 py-1.5 text-sm bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-lg transition-colors flex items-center gap-2"
                                        >
                                            {selectedLanguages.size === SUPPORTED_LANGUAGES.length ? (
                                                <>
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                                    Deselect All
                                                </>
                                            ) : (
                                                <>
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                                    Select All
                                                </>
                                            )}
                                        </button>
                                    </div>

                                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                                        {SUPPORTED_LANGUAGES.map(lang => (
                                            <label
                                                key={lang.code}
                                                className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-colors ${selectedLanguages.has(lang.code)
                                                    ? 'bg-pink-500/20 border border-pink-500/50'
                                                    : 'bg-zinc-800 border border-transparent hover:border-zinc-600'
                                                    } ${lang.code === 'en' ? 'opacity-100' : ''}`}
                                            >
                                                <input
                                                    type="checkbox"
                                                    checked={selectedLanguages.has(lang.code)}
                                                    onChange={() => toggleLanguage(lang.code)}
                                                    disabled={lang.code === 'en'}
                                                    className="sr-only"
                                                />
                                                <span>{lang.flag}</span>
                                                <span className="text-sm">{lang.name}</span>
                                                {lang.code === 'en' && (
                                                    <span className="text-xs text-zinc-500">(required)</span>
                                                )}
                                            </label>
                                        ))}
                                    </div>
                                </div>

                                {/* Continue Button */}
                                <button
                                    onClick={async () => {
                                        setShowPreview(true);
                                        await generateTranslations();
                                    }}
                                    disabled={!baseTitle || !baseMessage || !walletAddresses || translating}
                                    className="w-full py-4 bg-gradient-to-r from-pink-500 to-purple-600 rounded-xl font-bold disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 transition-all flex items-center justify-center gap-3 shadow-lg shadow-pink-500/20"
                                >
                                    {translating ? (
                                        <>
                                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            Translating...
                                        </>
                                    ) : (
                                        <>
                                            ✨ Preview Translations →
                                        </>
                                    )}
                                </button>
                            </>
                        ) : (
                            <>
                                {/* Preview & Edit Translations */}
                                <div className="bg-zinc-900 rounded-xl p-6 mb-6">
                                    <div className="flex justify-between items-center mb-4">
                                        <h2 className="text-lg font-semibold">Edit Translations</h2>
                                        <button
                                            onClick={() => setShowPreview(false)}
                                            className="text-sm text-zinc-400 hover:text-white"
                                        >
                                            ← Back
                                        </button>
                                    </div>

                                    <p className="text-sm text-zinc-400 mb-4">
                                        Review and edit each translation before sending. Use <code className="bg-zinc-800 px-1 rounded">${'{username}'}</code> for personalization.
                                    </p>

                                    <div className="space-y-4 max-h-[60vh] overflow-y-auto">
                                        {translations.map((t, index) => {
                                            const langInfo = SUPPORTED_LANGUAGES.find(l => l.code === t.language);
                                            return (
                                                <div key={t.language} className="bg-zinc-800 rounded-lg p-4">
                                                    <div className="flex items-center gap-2 mb-3">
                                                        <span className="text-lg">{langInfo?.flag}</span>
                                                        <span className="font-medium">{langInfo?.name}</span>
                                                        <span className="text-xs text-zinc-500">({t.language})</span>
                                                    </div>

                                                    <div className="space-y-2">
                                                        <input
                                                            type="text"
                                                            value={t.title}
                                                            onChange={(e) => updateTranslation(index, 'title', e.target.value.slice(0, 30))}
                                                            placeholder="Title"
                                                            className="w-full px-3 py-2 bg-zinc-700 border border-zinc-600 rounded-lg text-sm focus:outline-none focus:border-pink-500"
                                                            maxLength={30}
                                                        />
                                                        <textarea
                                                            value={t.message}
                                                            onChange={(e) => updateTranslation(index, 'message', e.target.value.slice(0, 200))}
                                                            placeholder="Message"
                                                            className="w-full px-3 py-2 bg-zinc-700 border border-zinc-600 rounded-lg text-sm focus:outline-none focus:border-pink-500 h-16 resize-none"
                                                            maxLength={200}
                                                        />
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Summary */}
                                <div className="bg-zinc-900 rounded-xl p-6 mb-6">
                                    <h2 className="text-lg font-semibold mb-2">Summary</h2>
                                    <div className="text-sm text-zinc-400 space-y-1">
                                        <p>📬 <strong>{walletAddresses.split(/[\n,]/).filter(a => a.trim()).length}</strong> recipients</p>
                                        <p>🌐 <strong>{translations.length}</strong> languages</p>
                                        <p>🔗 Path: <code className="bg-zinc-800 px-1 rounded">{miniAppPath}</code></p>
                                    </div>
                                </div>

                                {/* Result */}
                                {result && (
                                    <div className={`mb-6 p-4 rounded-xl ${result.success ? 'bg-green-500/20 border border-green-500/50' : 'bg-red-500/20 border border-red-500/50'}`}>
                                        <p className={result.success ? 'text-green-400' : 'text-red-400'}>
                                            {result.success ? '✅' : '❌'} {result.message}
                                        </p>
                                        {result.details && (
                                            <pre className="mt-2 text-xs text-zinc-400 overflow-x-auto">
                                                {JSON.stringify(result.details, null, 2)}
                                            </pre>
                                        )}
                                    </div>
                                )}

                                {/* Send Button */}
                                <button
                                    onClick={handleSend}
                                    disabled={sending}
                                    className="w-full py-3 bg-gradient-to-r from-pink-500 to-purple-600 rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 transition-opacity"
                                >
                                    {sending ? 'Sending...' : '🚀 Send Notifications'}
                                </button>
                            </>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
