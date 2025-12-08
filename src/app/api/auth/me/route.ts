import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(
    process.env.JWT_SECRET || 'fallback-secret-for-dev'
);

export async function GET(request: NextRequest) {
    try {
        const token = request.cookies.get('auth_token')?.value;

        if (!token) {
            return NextResponse.json({ authenticated: false });
        }

        const { payload } = await jwtVerify(token, JWT_SECRET);

        return NextResponse.json({
            authenticated: true,
            email: payload.email,
        });

    } catch {
        // Invalid token
        return NextResponse.json({ authenticated: false });
    }
}
