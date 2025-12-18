import { NextRequest, NextResponse } from 'next/server';

const DEEPL_API_URL = 'https://api-free.deepl.com/v2/translate';

// Map World App language codes to DeepL codes
const LANGUAGE_MAP: Record<string, string> = {
    'en': 'EN-US',
    'es': 'ES',
    'es-419': 'ES',
    'pt': 'PT-BR',
    'fr': 'FR',
    'de': 'DE',
    'pl': 'PL',
    'zh-CN': 'ZH-HANS',
    'zh-TW': 'ZH-HANT',
    'ja': 'JA',
    'ko': 'KO',
    'id': 'ID',
    'th': 'TH',
    'hi': 'HI',
    'ms': 'MS',
    // 'ca': Catalan is NOT supported by DeepL, will fallback to English automatically
};

export async function POST(request: NextRequest) {
    try {
        // Validate admin authorization
        const auth = request.headers.get('Authorization');
        if (auth !== `Bearer ${process.env.ADMIN_SECRET}`) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { title, message, targetLanguages } = await request.json();

        if (!title || !message || !targetLanguages || !Array.isArray(targetLanguages)) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const apiKey = process.env.DEEPL_API_KEY;
        if (!apiKey) {
            console.error('DEEPL_API_KEY not configured');
            return NextResponse.json({ error: 'Translation service not configured' }, { status: 500 });
        }

        const results: Record<string, { title: string; message: string }> = {};

        // English is the source, no translation needed
        results['en'] = { title, message };

        // Process translations only for supported languages to save quota
        const translationPromises = targetLanguages
            .filter(lang => lang !== 'en' && LANGUAGE_MAP[lang])
            .map(async (lang) => {
                const targetLang = LANGUAGE_MAP[lang];

                try {
                    const params = new URLSearchParams();
                    params.append('auth_key', apiKey);
                    params.append('text', title);
                    params.append('text', message);
                    params.append('target_lang', targetLang);
                    params.append('tag_handling', 'xml');
                    params.append('ignore_tags', 'var'); // We can wrap ${username} if needed, but XML usually handles placeholders well

                    const response = await fetch(DEEPL_API_URL, {
                        method: 'POST',
                        body: params,
                        headers: {
                            'Content-Type': 'application/x-www-form-urlencoded',
                        },
                    });

                    if (!response.ok) {
                        const error = await response.text();
                        console.error(`DeepL error for ${lang}:`, error);
                        results[lang] = { title, message }; // Fallback to source
                        return;
                    }

                    const data = await response.json();
                    results[lang] = {
                        title: data.translations[0].text,
                        message: data.translations[1].text,
                    };
                } catch (error) {
                    console.error(`Translation failed for ${lang}:`, error);
                    results[lang] = { title, message }; // Fallback to source
                }
            });

        // For languages not supported by DeepL, immediately use the source text (no API call)
        targetLanguages.forEach(lang => {
            if (lang !== 'en' && !LANGUAGE_MAP[lang]) {
                results[lang] = { title, message };
            }
        });

        await Promise.all(translationPromises);

        return NextResponse.json({ success: true, translations: results });

    } catch (error) {
        console.error('Translation route error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
