'use client';

import { useState, useCallback } from 'react';
import { MiniKit } from '@worldcoin/minikit-js';
import { SWAP_CONFIG, ORBID_SWAP_RELAY_ADDRESS } from '@/lib/uniswap/config';
import type { Token, SwapQuote, SwapState } from '@/lib/uniswap/types';

// Contract ABI for OrbIdSwapRelay.swapWithPermit function (single transaction)
const SWAP_WITH_PERMIT_ABI = [{
    name: 'swapWithPermit',
    type: 'function',
    inputs: [
        {
            name: 'params',
            type: 'tuple',
            components: [
                { name: 'tokenIn', type: 'address' },
                { name: 'tokenOut', type: 'address' },
                { name: 'amountIn', type: 'uint256' },
                { name: 'amountOutMin', type: 'uint256' },
                { name: 'poolFee', type: 'uint24' },
                { name: 'deadline', type: 'uint256' },
                { name: 'version', type: 'uint8' }
            ]
        },
        { name: 'permitData', type: 'bytes' },
        { name: 'signature', type: 'bytes' }
    ],
    outputs: [{ name: 'amountOut', type: 'uint256' }],
    stateMutability: 'nonpayable'
}] as const;

interface UseSwapParams {
    tokenIn: Token | null;
    tokenOut: Token | null;
    quote: SwapQuote | null;
    walletAddress: string;
    slippageBps?: number;
}

interface UseSwapResult {
    state: SwapState;
    executeSwap: () => Promise<void>;
    reset: () => void;
}

function getVersionEnum(version: 'v2' | 'v3' | 'v4'): 0 | 1 | 2 {
    switch (version) {
        case 'v2': return 0;
        case 'v3': return 1;
        case 'v4': return 2;
    }
}

/**
 * Encode permitData as bytes for the contract (nonce, deadline)
 */
function encodePermitData(nonce: string, deadline: string): string {
    // ABI encode (uint256 nonce, uint256 deadline)
    const nonceHex = BigInt(nonce).toString(16).padStart(64, '0');
    const deadlineHex = BigInt(deadline).toString(16).padStart(64, '0');
    return '0x' + nonceHex + deadlineHex;
}

/**
 * Build detailed error message from MiniKit response for debugging
 */
function buildDetailedError(payload: any, step: string): string {
    const errorCode = payload.error_code || 'unknown';
    let errorMsg = `[${step}] Error: ${errorCode}`;
    errorMsg += `\n\nFull response:\n${JSON.stringify(payload, null, 2)}`;
    return errorMsg;
}

export function useSwap({
    tokenIn,
    tokenOut,
    quote,
    walletAddress,
    slippageBps = SWAP_CONFIG.DEFAULT_SLIPPAGE_BPS,
}: UseSwapParams): UseSwapResult {
    const [state, setState] = useState<SwapState>({
        status: 'idle',
        quote: null,
        txHash: null,
        error: null,
    });

    const reset = useCallback(() => {
        setState({
            status: 'idle',
            quote: null,
            txHash: null,
            error: null,
        });
    }, []);

    const executeSwap = useCallback(async () => {
        if (!tokenIn || !tokenOut || !quote || !walletAddress) {
            setState(s => ({ ...s, status: 'error', error: 'Missing parameters' }));
            return;
        }

        if (!ORBID_SWAP_RELAY_ADDRESS) {
            setState(s => ({ ...s, status: 'error', error: 'Swap relay not deployed' }));
            return;
        }

        if (!MiniKit.isInstalled()) {
            setState(s => ({ ...s, status: 'error', error: 'Please open in World App' }));
            return;
        }

        try {
            setState(s => ({ ...s, status: 'swapping', quote }));

            // Prepare transaction parameters
            const amountInStr = quote.amountIn.toString();
            const amountOutMinStr = quote.amountOutMin.toString();
            const nonce = Date.now().toString();
            const deadlineTs = Math.floor((Date.now() + SWAP_CONFIG.DEFAULT_DEADLINE_MINUTES * 60 * 1000) / 1000);
            const deadlineStr = deadlineTs.toString();
            const version = getVersionEnum(quote.route.version);
            const poolFee = quote.route.pools[0]?.fee || SWAP_CONFIG.FEE_TIERS.MEDIUM;

            // Token address in lowercase
            const tokenInLower = tokenIn.address.toLowerCase() as `0x${string}`;

            // Encode permitData for the contract
            const permitData = encodePermitData(nonce, deadlineStr);

            console.log('[useSwap] Single TX swap with params:', {
                tokenIn: tokenInLower,
                tokenOut: tokenOut.address,
                amountIn: amountInStr,
                amountOutMin: amountOutMinStr,
                poolFee,
                deadline: deadlineStr,
                version,
                nonce,
                permitData,
            });

            // SINGLE TRANSACTION: Call swapWithPermit on the contract
            // MiniKit handles Permit2 signature generation and injects it
            const result = await MiniKit.commandsAsync.sendTransaction({
                transaction: [{
                    address: ORBID_SWAP_RELAY_ADDRESS as `0x${string}`,
                    abi: SWAP_WITH_PERMIT_ABI,
                    functionName: 'swapWithPermit',
                    args: [
                        // SwapParams tuple
                        [
                            tokenInLower,
                            tokenOut.address,
                            amountInStr,
                            amountOutMinStr,
                            poolFee,
                            deadlineStr,
                            version
                        ],
                        // permitData (encoded nonce + deadline)
                        permitData,
                        // signature placeholder - MiniKit replaces this
                        'PERMIT2_SIGNATURE_PLACEHOLDER_0'
                    ]
                }],
                permit2: [{
                    permitted: {
                        token: tokenInLower,
                        amount: amountInStr,
                    },
                    spender: ORBID_SWAP_RELAY_ADDRESS as `0x${string}`,
                    nonce: nonce,
                    deadline: deadlineStr,
                }]
            });

            console.log('[useSwap] Result:', JSON.stringify(result.finalPayload, null, 2));

            const finalPayload = result.finalPayload;

            if (finalPayload.status === 'success') {
                const txHash = finalPayload.transaction_id || '';
                setState({
                    status: 'success',
                    quote,
                    txHash,
                    error: null,
                });
            } else {
                const detailedError = buildDetailedError(finalPayload, 'swapWithPermit');
                console.error('[useSwap] Failed:', detailedError);
                throw new Error(detailedError);
            }

        } catch (error) {
            console.error('[useSwap] Full error:', error);
            setState({
                status: 'error',
                quote,
                txHash: null,
                error: error instanceof Error ? error.message : String(error),
            });
        }
    }, [tokenIn, tokenOut, quote, walletAddress, slippageBps]);

    return {
        state,
        executeSwap,
        reset,
    };
}
