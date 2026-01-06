'use client';

import { useState, useCallback } from 'react';
import { MiniKit } from '@worldcoin/minikit-js';
import { SWAP_CONFIG, UNISWAP_ADDRESSES } from '@/lib/uniswap/config';
import { PERMIT2_ABI } from '@/lib/uniswap/permit2-abi';
import type { Token, SwapQuote, SwapState } from '@/lib/uniswap/types';

interface UseSwapParams {
    tokenIn: Token | null;
    tokenOut: Token | null;
    quote: SwapQuote | null;
    walletAddress: string;
}

interface UseSwapResult {
    state: SwapState;
    executeSwap: () => Promise<void>;
    reset: () => void;
}

export function useSwap({
    tokenIn,
    tokenOut,
    quote,
    walletAddress,
}: UseSwapParams): UseSwapResult {
    const [state, setState] = useState<SwapState>({
        status: 'idle',
        quote: null,
        txHash: null,
        error: null,
    });

    const reset = useCallback(() => {
        setState({ status: 'idle', quote: null, txHash: null, error: null });
    }, []);

    const executeSwap = useCallback(async () => {
        if (!tokenIn || !tokenOut || !quote || !walletAddress) {
            setState(s => ({ ...s, status: 'error', error: 'Missing parameters' }));
            return;
        }

        if (!MiniKit.isInstalled()) {
            setState(s => ({ ...s, status: 'error', error: 'Please open in World App' }));
            return;
        }

        try {
            setState(s => ({ ...s, status: 'swapping', quote }));

            const amountIn = quote.amountIn.toString();
            const deadline = Math.floor((Date.now() + SWAP_CONFIG.DEFAULT_DEADLINE_MINUTES * 60 * 1000) / 1000);
            const nonce = Date.now().toString();
            const tokenInLower = tokenIn.address.toLowerCase() as `0x${string}`;

            const permitData = [
                [tokenInLower, amountIn],
                nonce,
                deadline.toString(),
            ];

            const transferDetails = [
                UNISWAP_ADDRESSES.UNIVERSAL_ROUTER,
                amountIn,
            ];

            console.log('Executing swap via Permit2 signatureTransfer:', {
                permit2Address: UNISWAP_ADDRESSES.PERMIT2,
                universalRouter: UNISWAP_ADDRESSES.UNIVERSAL_ROUTER,
                tokenIn: tokenInLower,
                tokenOut: tokenOut.address,
                amountIn,
                method: 'signatureTransfer',
            });

            const result = await MiniKit.commandsAsync.sendTransaction({
                transaction: [{
                    address: UNISWAP_ADDRESSES.PERMIT2 as `0x${string}`,
                    abi: PERMIT2_ABI,
                    functionName: 'signatureTransfer',
                    args: [
                        permitData,
                        transferDetails,
                        'PERMIT2_SIGNATURE_PLACEHOLDER_0',
                    ],
                }],
                permit2: [{
                    permitted: {
                        token: tokenInLower,
                        amount: amountIn,
                    },
                    nonce,
                    deadline: deadline.toString(),
                    spender: UNISWAP_ADDRESSES.UNIVERSAL_ROUTER as `0x${string}`,
                }],
            });

            if (!result) {
                throw new Error('Transaction request failed');
            }

            if (result.finalPayload.status === 'success') {
                setState({
                    status: 'success',
                    quote,
                    txHash: result.finalPayload.transaction_id || '',
                    error: null,
                });
            } else {
                const errorPayload = result.finalPayload;
                let errorMessage = JSON.stringify(errorPayload, null, 2);

                if ('error_code' in errorPayload && errorPayload.error_code === 'invalid_contract') {
                    errorMessage = `Contract not whitelisted. Add to Developer Portal:\n` +
                        `Permit2: ${UNISWAP_ADDRESSES.PERMIT2}\n` +
                        `Token: ${tokenInLower}`;
                }

                throw new Error(errorMessage);
            }

        } catch (error) {
            console.error('Swap failed:', error);
            const errorMessage = error instanceof Error ? error.message : String(error);
            const context = JSON.stringify({
                permit2: UNISWAP_ADDRESSES.PERMIT2,
                universalRouter: UNISWAP_ADDRESSES.UNIVERSAL_ROUTER,
                tokenIn: tokenIn.address,
                tokenOut: tokenOut.address,
                method: 'signatureTransfer',
                isMiniKitInstalled: MiniKit.isInstalled()
            }, null, 2);

            setState({
                status: 'error',
                quote,
                txHash: null,
                error: `Error: ${errorMessage}\n\nContext:\n${context}`,
            });
        }
    }, [tokenIn, tokenOut, quote, walletAddress]);

    return { state, executeSwap, reset };
}
