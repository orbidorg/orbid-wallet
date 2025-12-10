import { NextRequest, NextResponse } from 'next/server';

// Notification translations for World App API
const NOTIFICATION_TRANSLATIONS = {
    tx_received: {
        en: { title: 'Payment Received', message: 'You received ${amount} ${token}' },
        es: { title: 'Pago Recibido', message: 'Recibiste ${amount} ${token}' },
        zh: { title: '收到付款', message: '您收到了 ${amount} ${token}' },
        hi: { title: 'भुगतान प्राप्त', message: 'आपको ${amount} ${token} प्राप्त हुआ' },
        pt: { title: 'Pagamento Recebido', message: 'Você recebeu ${amount} ${token}' },
        fr: { title: 'Paiement Reçu', message: 'Vous avez reçu ${amount} ${token}' },
        de: { title: 'Zahlung Erhalten', message: 'Sie haben ${amount} ${token} erhalten' },
        ja: { title: '支払い受取', message: '${amount} ${token} を受け取りました' },
        ko: { title: '결제 수신', message: '${amount} ${token}을(를) 받았습니다' },
        ar: { title: 'تم استلام الدفع', message: 'لقد استلمت ${amount} ${token}' },
    },
    tx_sent: {
        en: { title: 'Transaction Sent', message: 'You sent ${amount} ${token}' },
        es: { title: 'Transacción Enviada', message: 'Enviaste ${amount} ${token}' },
        zh: { title: '交易已发送', message: '您已发送 ${amount} ${token}' },
        hi: { title: 'लेनदेन भेजा गया', message: 'आपने ${amount} ${token} भेजा' },
        pt: { title: 'Transação Enviada', message: 'Você enviou ${amount} ${token}' },
        fr: { title: 'Transaction Envoyée', message: 'Vous avez envoyé ${amount} ${token}' },
        de: { title: 'Transaktion Gesendet', message: 'Sie haben ${amount} ${token} gesendet' },
        ja: { title: '取引送信', message: '${amount} ${token} を送信しました' },
        ko: { title: '거래 전송됨', message: '${amount} ${token}을(를) 보냈습니다' },
        ar: { title: 'تم إرسال المعاملة', message: 'لقد أرسلت ${amount} ${token}' },
    },
};

type NotificationType = keyof typeof NOTIFICATION_TRANSLATIONS;
type SupportedLanguage = 'en' | 'es' | 'zh' | 'hi' | 'pt' | 'fr' | 'de' | 'ja' | 'ko' | 'ar';

interface SendNotificationRequest {
    walletAddresses: string[];
    type: NotificationType;
    amount?: string;
    token?: string;
    miniAppPath?: string;
}

export async function POST(request: NextRequest) {
    try {
        const body: SendNotificationRequest = await request.json();
        const { walletAddresses, type, amount = '', token = '', miniAppPath = '/' } = body;

        if (!walletAddresses || walletAddresses.length === 0) {
            return NextResponse.json({ error: 'walletAddresses required' }, { status: 400 });
        }

        if (!type || !NOTIFICATION_TRANSLATIONS[type]) {
            return NextResponse.json({ error: 'Invalid notification type' }, { status: 400 });
        }

        const apiKey = process.env.WORLD_APP_API_KEY;
        if (!apiKey) {
            console.error('WORLD_APP_API_KEY not configured');
            return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
        }

        // Build localized notifications for all supported languages
        const translations = NOTIFICATION_TRANSLATIONS[type];
        const localisations = (Object.keys(translations) as SupportedLanguage[]).map(lang => {
            const { title, message } = translations[lang];
            return {
                language: lang,
                title: title,
                message: message.replace('${amount}', amount).replace('${token}', token),
            };
        });

        // Send to World App API
        const response = await fetch('https://developer.worldcoin.org/api/v2/minikit/send-notification', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
                wallet_addresses: walletAddresses,
                localisations,
                mini_app_path: miniAppPath,
            }),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            console.error('World App API error:', response.status, errorData);
            return NextResponse.json(
                { error: 'Failed to send notification', details: errorData },
                { status: response.status }
            );
        }

        const data = await response.json();
        return NextResponse.json({ success: true, data });

    } catch (error) {
        console.error('Notification send error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
