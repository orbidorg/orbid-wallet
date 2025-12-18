import { NextRequest, NextResponse } from 'next/server';

// Notification translations for World App API
// Note: ${username} is replaced by World App with the recipient's username
const NOTIFICATION_TRANSLATIONS = {
    tx_received: {
        en: { title: 'Payment Received', message: 'Hey ${username}! You received ${amount} ${token}' },
        es: { title: 'Pago Recibido', message: '¡Hola ${username}! Recibiste ${amount} ${token}' },
        'es-419': { title: 'Pago Recibido', message: '¡Hola ${username}! Recibiste ${amount} ${token}' },
        'zh-CN': { title: '收到付款', message: '${username}，您收到了 ${amount} ${token}' },
        'zh-TW': { title: '收到付款', message: '${username}，您收到了 ${amount} ${token}' },
        hi: { title: 'भुगतान प्राप्त', message: '${username}, आपको ${amount} ${token} प्राप्त हुआ' },
        pt: { title: 'Pagamento Recebido', message: 'Olá ${username}! Você recebeu ${amount} ${token}' },
        fr: { title: 'Paiement Reçu', message: 'Salut ${username}! Vous avez reçu ${amount} ${token}' },
        de: { title: 'Zahlung Erhalten', message: 'Hallo ${username}! Sie haben ${amount} ${token} erhalten' },
        ja: { title: '支払い受取', message: '${username}さん、${amount} ${token} を受け取りました' },
        ko: { title: '결제 수신', message: '${username}님, ${amount} ${token}을(를) 받았습니다' },
        ca: { title: 'Pagament Rebut', message: 'Hola ${username}! Has rebut ${amount} ${token}' },
        id: { title: 'Pembayaran Diterima', message: 'Hai ${username}! Anda menerima ${amount} ${token}' },
        ms: { title: 'Pembayaran Diterima', message: 'Hai ${username}! Anda menerima ${amount} ${token}' },
        pl: { title: 'Płatność Otrzymana', message: 'Cześć ${username}! Otrzymałeś ${amount} ${token}' },
        th: { title: 'ได้รับการชำระเงิน', message: 'สวัสดี ${username}! คุณได้รับ ${amount} ${token}' },
    },
    tx_sent: {
        en: { title: 'Transaction Sent', message: '${username}, you sent ${amount} ${token}' },
        es: { title: 'Transacción Enviada', message: '${username}, enviaste ${amount} ${token}' },
        'es-419': { title: 'Transacción Enviada', message: '${username}, enviaste ${amount} ${token}' },
        'zh-CN': { title: '交易已发送', message: '${username}，您已发送 ${amount} ${token}' },
        'zh-TW': { title: '交易已發送', message: '${username}，您已發送 ${amount} ${token}' },
        hi: { title: 'लेनदेन भेजा गया', message: '${username}, आपने ${amount} ${token} भेजा' },
        pt: { title: 'Transação Enviada', message: '${username}, você enviou ${amount} ${token}' },
        fr: { title: 'Transaction Envoyée', message: '${username}, vous avez envoyé ${amount} ${token}' },
        de: { title: 'Transaktion Gesendet', message: '${username}, Sie haben ${amount} ${token} gesendet' },
        ja: { title: '取引送信', message: '${username}さん、${amount} ${token} を送信しました' },
        ko: { title: '거래 전송됨', message: '${username}님, ${amount} ${token}을(를) 보냈습니다' },
        ca: { title: 'Transacció Enviada', message: '${username}, has enviat ${amount} ${token}' },
        id: { title: 'Transaksi Terkirim', message: '${username}, Anda mengirim ${amount} ${token}' },
        ms: { title: 'Transaksi Dihantar', message: '${username}, Anda menghantar ${amount} ${token}' },
        pl: { title: 'Transakcja Wysłana', message: '${username}, wysłałeś ${amount} ${token}' },
        th: { title: 'ส่งธุรกรรมแล้ว', message: '${username}, คุณส่ง ${amount} ${token}' },
    },
};

type NotificationType = keyof typeof NOTIFICATION_TRANSLATIONS;
type SupportedLanguage = 'en' | 'es' | 'zh-CN' | 'hi' | 'pt' | 'fr' | 'de' | 'ja' | 'ko' | 'ca' | 'id' | 'ms' | 'pl' | 'es-419' | 'th' | 'zh-TW';

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
        const appId = process.env.NEXT_PUBLIC_WLD_APP_ID || process.env.NEXT_PUBLIC_WORLD_APP_ID;

        if (!apiKey) {
            console.error('WORLD_APP_API_KEY not configured');
            return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
        }

        if (!appId) {
            console.error('App ID not configured');
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

        // Build the deep link path as per World App documentation
        // Format: worldapp://mini-app?app_id=[app_id]&path=[path] (path is optional)
        const formattedPath = miniAppPath.startsWith('/') ? miniAppPath : `/${miniAppPath}`;
        const deepLinkPath = `worldapp://mini-app?app_id=${appId}&path=${encodeURIComponent(formattedPath)}`;

        // Send to World App API
        const response = await fetch('https://developer.worldcoin.org/api/v2/minikit/send-notification', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
                app_id: appId,
                wallet_addresses: walletAddresses,
                localisations,
                mini_app_path: deepLinkPath,
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
