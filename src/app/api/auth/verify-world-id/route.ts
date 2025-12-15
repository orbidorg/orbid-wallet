import { NextRequest, NextResponse } from 'next/server';
import { verifyCloudProof, IVerifyResponse, ISuccessResult } from '@worldcoin/minikit-js';

interface IRequestPayload {
    payload: ISuccessResult;
    action: string;
    signal?: string;
}

/** Verify World ID proof with cloud API */
export async function POST(req: NextRequest) {
    try {
        const { payload, action, signal } = (await req.json()) as IRequestPayload;
        const app_id = process.env.NEXT_PUBLIC_WLD_APP_ID as `app_${string}`;

        if (!app_id) {
            console.error('[verify-world-id] APP_ID not configured');
            return NextResponse.json({ success: false, error: 'Server configuration error' }, { status: 500 });
        }

        const verifyRes = (await verifyCloudProof(payload, app_id, action, signal)) as IVerifyResponse;

        if (verifyRes.success) {
            return NextResponse.json({
                success: true,
                verified: true,
                nullifier_hash: payload.nullifier_hash
            });
        } else {
            return NextResponse.json({
                success: false,
                error: verifyRes.detail || 'Verification failed',
                code: verifyRes.code
            }, { status: 400 });
        }
    } catch (error) {
        console.error('[verify-world-id] Error:', error);
        return NextResponse.json({
            success: false,
            error: 'Internal server error'
        }, { status: 500 });
    }
}
