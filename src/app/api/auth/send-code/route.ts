import { NextRequest, NextResponse } from 'next/server';
import { sessionStore } from '@/lib/sessionStore';
import { sendLoginCode } from '@/lib/email';

/** Generate 6-digit verification code */
function generateCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function POST(request: NextRequest) {
    try {
        const { email, lang } = await request.json();

        if (!email || !email.includes('@')) {
            return NextResponse.json(
                { error: 'Invalid email address' },
                { status: 400 }
            );
        }

        // Rate limiting
        const existingCode = await sessionStore.get(`login_code:${email}`);
        if (existingCode) {
            return NextResponse.json(
                { error: 'Please wait before requesting a new code' },
                { status: 429 }
            );
        }

        const code = generateCode();
        const sent = await sendLoginCode(email, code, lang || 'en');

        if (!sent) {
            return NextResponse.json(
                { error: 'Failed to send email' },
                { status: 500 }
            );
        }

        await sessionStore.set(`login_code:${email}`, code, 600);

        return NextResponse.json({
            success: true,
            message: 'Code sent to your email'
        });

    } catch (error) {
        console.error('Send code error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
