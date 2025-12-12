import { NextRequest, NextResponse } from 'next/server';
import { sessionStore } from '@/lib/sessionStore';
import { sendLoginCode } from '@/lib/email';

// Generate 6-digit code
function generateCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function POST(request: NextRequest) {
    const startTime = Date.now();

    try {
        const { email, lang } = await request.json();

        if (!email || !email.includes('@')) {
            return NextResponse.json(
                { error: 'Invalid email address' },
                { status: 400 }
            );
        }

        // Rate limiting: check if code was sent recently
        const rateCheckStart = Date.now();
        const existingCode = await sessionStore.get(`login_code:${email}`);
        console.log(`[send-code] Rate check took ${Date.now() - rateCheckStart}ms`);

        if (existingCode) {
            return NextResponse.json(
                { error: 'Please wait before requesting a new code' },
                { status: 429 }
            );
        }

        // Generate code first
        const code = generateCode();

        // Send email first (this is what the user waits for)
        const emailStart = Date.now();
        const sent = await sendLoginCode(email, code, lang || 'en');
        console.log(`[send-code] Email send took ${Date.now() - emailStart}ms`);

        if (!sent) {
            return NextResponse.json(
                { error: 'Failed to send email' },
                { status: 500 }
            );
        }

        // Store code after email is sent (10 minutes expiry)
        const storeStart = Date.now();
        await sessionStore.set(`login_code:${email}`, code, 600);
        console.log(`[send-code] Session store took ${Date.now() - storeStart}ms`);

        console.log(`[send-code] Total time: ${Date.now() - startTime}ms`);

        return NextResponse.json({
            success: true,
            message: 'Code sent to your email'
        });

    } catch (error) {
        console.error('Send code error:', error);
        console.log(`[send-code] Failed after ${Date.now() - startTime}ms`);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
