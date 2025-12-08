import { NextRequest, NextResponse } from 'next/server';
import { sessionStore } from '@/lib/sessionStore';
import { SignJWT } from 'jose';

const JWT_SECRET = new TextEncoder().encode(
    process.env.JWT_SECRET || 'fallback-secret-for-dev'
);

export async function POST(request: NextRequest) {
    try {
        const { email, code } = await request.json();

        if (!email || !code) {
            return NextResponse.json(
                { error: 'Email and code are required' },
                { status: 400 }
            );
        }

        // Get stored code
        const storedCode = await sessionStore.get<string>(`login_code:${email}`);

        if (!storedCode) {
            return NextResponse.json(
                { error: 'Code expired or not found' },
                { status: 400 }
            );
        }

        if (storedCode !== code) {
            return NextResponse.json(
                { error: 'Invalid code' },
                { status: 400 }
            );
        }

        // Delete used code
        await sessionStore.delete(`login_code:${email}`);

        // Create JWT token
        const token = await new SignJWT({ email })
            .setProtectedHeader({ alg: 'HS256' })
            .setIssuedAt()
            .setExpirationTime('7d')
            .sign(JWT_SECRET);

        // Create response with cookie
        const response = NextResponse.json({
            success: true,
            email,
        });

        // Set HTTP-only cookie
        response.cookies.set('auth_token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 60 * 60 * 24 * 7, // 7 days
            path: '/',
        });

        return response;

    } catch (error) {
        console.error('Verify code error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
