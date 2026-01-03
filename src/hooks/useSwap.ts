'use client';

import { useState, useCallback } from 'react';
import { MiniKit } from '@worldcoin/minikit-js';
import { SWAP_CONFIG, ORBID_SWAP_RELAY_ADDRESS } from '@/lib/uniswap/config';
import type { Token, SwapQuote, SwapState } from '@/lib/uniswap/types';
import PERMIT2_ABI from '@/abi/Permit2.json';

// Permit2 address on World Chain (World App specific)
const PERMIT2_ADDRESS = '0xF0882554ee924278806d708396F1a7975b732522';

// Contract ABI for OrbIdSwapRelay.swap function
const SWAP_ABI = [{
    name: 'swap',
    type: 'function',
    inputs: [{
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
    }],
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
 * Build detailed error message from MiniKit response for debugging
 */
function buildDetailedError(payload: any, step: string): string {
    const errorCode = payload.error_code || 'unknown';
    const debugUrl = payload.debug_url;
    const transactionId = payload.transaction_id;

    let errorMsg = `[${step}] Error: ${errorCode}`;
    if (transactionId) {
        errorMsg += `\nTx ID: ${transactionId}`;
    }
    if (debugUrl) {
        errorMsg += `\nDebug: ${debugUrl}`;
    }
    // Full payload for debugging
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
            const deadline = Math.floor((Date.now() + SWAP_CONFIG.DEFAULT_DEADLINE_MINUTES * 60 * 1000) / 1000).toString();
            const version = getVersionEnum(quote.route.version);
            const poolFee = quote.route.pools[0]?.fee || SWAP_CONFIG.FEE_TIERS.MEDIUM;

            // Token address in lowercase for Permit2
            const tokenInLower = tokenIn.address.toLowerCase() as `0x${string}`;

            // Log transaction params for debugging
            console.log('[useSwap] Transaction params:', {
                tokenIn: tokenInLower,
                tokenOut: tokenOut.address,
                amountIn: amountInStr,
                amountOutMin: amountOutMinStr,
                poolFee,
                deadline,
                version,
                nonce,
            });

            // Step 1: Transfer tokens to contract via Permit2 signatureTransfer
            console.log('[useSwap] Step 1: Sending Permit2 signatureTransfer...');
            const transferResult = await MiniKit.commandsAsync.sendTransaction({
                transaction: [{
                    address: PERMIT2_ADDRESS as `0x${string}`,
                    abi: PERMIT2_ABI,
                    functionName: 'signatureTransfer',
                    args: [
                        [[tokenInLower, amountInStr], nonce, deadline],
                        [ORBID_SWAP_RELAY_ADDRESS, amountInStr],
                        'PERMIT2_SIGNATURE_PLACEHOLDER_0'
                    ]
                }],
                permit2: [{
                    permitted: {
                        token: tokenInLower,
                        amount: amountInStr,
                    },
                    spender: PERMIT2_ADDRESS as `0x${string}`,
                    nonce: nonce,
                    deadline: deadline,
                }]
            });

            console.log('[useSwap] Transfer result:', JSON.stringify(transferResult.finalPayload, null, 2));

            if (transferResult.finalPayload.status !== 'success') {
                const detailedError = buildDetailedError(transferResult.finalPayload, 'Permit2 Transfer');
                console.error('[useSwap] Transfer failed:', detailedError);
                throw new Error(detailedError);
            }

            // Wait for transfer to be mined
            console.log('[useSwap] Waiting for transfer to be mined...');
            await new Promise(resolve => setTimeout(resolve, 3000));

            // Step 2: Execute swap on contract
            console.log('[useSwap] Step 2: Executing swap on contract...');
            const swapResult = await MiniKit.commandsAsync.sendTransaction({
                transaction: [{
                    address: ORBID_SWAP_RELAY_ADDRESS as `0x${string}`,
                    abi: SWAP_ABI,
                    functionName: 'swap',
                    args: [[
                        tokenIn.address,
                        tokenOut.address,
                        amountInStr,
                        amountOutMinStr,
                        poolFee,
                        deadline,
                        version
                    ]]
                }]
            });

            console.log('[useSwap] Swap result:', JSON.stringify(swapResult.finalPayload, null, 2));

            const finalPayload = swapResult.finalPayload;

            if (finalPayload.status === 'success') {
                const txHash = finalPayload.transaction_id || '';
                setState({
                    status: 'success',
                    quote,
                    txHash,
                    error: null,
                });
            } else {
                const detailedError = buildDetailedError(finalPayload, 'Swap Execution');
                console.error('[useSwap] Swap failed:', detailedError);
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
