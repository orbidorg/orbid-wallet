import { NextRequest, NextResponse } from 'next/server';
import { verifyCloudProof, IVerifyResponse, ISuccessResult } from '@worldcoin/minikit-js';

interface IRequestPayload {
    payload: ISuccessResult;
    action: string;
    signal?: string;
}

export async function POST(req: NextRequest) {
    try {
        const { payload, action, signal } = (await req.json()) as IRequestPayload;

        const app_id = process.env.NEXT_PUBLIC_WLD_APP_ID as `app_${string}`;

        if (!app_id) {
            console.error('[verify-world-id] APP_ID not configured');
            return NextResponse.json({ success: false, error: 'Server configuration error' }, { status: 500 });
        }

        console.log('[verify-world-id] Verifying proof for action:', action);

        const verifyRes = (await verifyCloudProof(payload, app_id, action, signal)) as IVerifyResponse;

        console.log('[verify-world-id] Verification result:', verifyRes);

        if (verifyRes.success) {
            // Verification succeeded - World ID will now register this in the portal
            return NextResponse.json({ 
                success: true, 
                verified: true,
                nullifier_hash: payload.nullifier_hash 
            });
        } else {
            // Verification failed (usually means already verified)
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
