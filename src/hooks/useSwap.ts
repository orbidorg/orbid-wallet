'use client';

import { useState, useCallback } from 'react';
import {
    generateNonce,
    getDeadline,
    buildPermitData,
    encodePermitData,
    checkPermit2Allowance,
    buildApprovalData,
} from '@/lib/uniswap/permit2';
import { SWAP_CONFIG, ORBID_SWAP_RELAY_ADDRESS, UNISWAP_ADDRESSES } from '@/lib/uniswap/config';
import type { Token, SwapQuote, SwapState, SwapParams } from '@/lib/uniswap/types';

interface UseSwapParams {
    tokenIn: Token | null;
    tokenOut: Token | null;
    quote: SwapQuote | null;
    walletAddress: string;
    rpcUrl: string;
    onSign: (data: unknown) => Promise<string>; // EIP-712 sign function
    onSendTransaction: (tx: unknown) => Promise<string>; // Send transaction function
}

interface UseSwapResult {
    state: SwapState;
    executeSwap: () => Promise<void>;
    reset: () => void;
}

const MAX_UINT256 = BigInt(2) ** BigInt(256) - BigInt(1);

/**
 * Hook for executing swaps through OrbIdSwapRelay
 */
export function useSwap({
    tokenIn,
    tokenOut,
    quote,
    walletAddress,
    rpcUrl,
    onSign,
    onSendTransaction,
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
            setState(s => ({ ...s, status: 'error', error: 'Swap relay not deployed yet' }));
            return;
        }

        try {
            setState(s => ({ ...s, status: 'approving', quote }));

            // Step 1: Check if user has approved Permit2
            const allowance = await checkPermit2Allowance(
                tokenIn.address,
                walletAddress,
                rpcUrl
            );

            if (allowance < quote.amountIn) {
                // Need to approve Permit2 first
                const approvalData = buildApprovalData();

                const approvalTx = {
                    to: tokenIn.address,
                    data: approvalData,
                    value: '0x0',
                };

                const approvalHash = await onSendTransaction(approvalTx);
                console.log('Approval tx:', approvalHash);

                // Wait a bit for approval to be confirmed
                await new Promise(resolve => setTimeout(resolve, 3000));
            }

            setState(s => ({ ...s, status: 'signing' }));

            // Step 2: Generate Permit2 signature
            const nonce = generateNonce();
            const deadline = getDeadline();

            const permitData = buildPermitData(
                tokenIn.address,
                quote.amountIn,
                ORBID_SWAP_RELAY_ADDRESS,
                nonce,
                deadline
            );

            const signature = await onSign(permitData);

            setState(s => ({ ...s, status: 'swapping' }));

            // Step 3: Execute swap
            const swapParams: SwapParams = {
                tokenIn: tokenIn.address,
                tokenOut: tokenOut.address,
                amountIn: quote.amountIn,
                amountOutMin: quote.amountOutMin,
                poolFee: quote.route.pools[0]?.fee || SWAP_CONFIG.FEE_TIERS.MEDIUM,
                deadline,
                useV4: quote.route.version === 'v4',
            };

            const permitDataEncoded = encodePermitData(nonce, deadline);

            // Encode swapWithPermit call
            const swapCallData = encodeSwapWithPermit(swapParams, permitDataEncoded, signature);

            const swapTx = {
                to: ORBID_SWAP_RELAY_ADDRESS,
                data: swapCallData,
                value: '0x0',
            };

            const txHash = await onSendTransaction(swapTx);

            setState({
                status: 'success',
                quote,
                txHash,
                error: null,
            });

        } catch (error) {
            console.error('Swap failed:', error);
            setState({
                status: 'error',
                quote,
                txHash: null,
                error: error instanceof Error ? error.message : 'Swap failed',
            });
        }
    }, [tokenIn, tokenOut, quote, walletAddress, rpcUrl, onSign, onSendTransaction]);

    return {
        state,
        executeSwap,
        reset,
    };
}

/**
 * Encode the swapWithPermit function call
 */
function encodeSwapWithPermit(
    params: SwapParams,
    permitData: string,
    signature: string
): string {
    // Function selector for swapWithPermit
    // swapWithPermit((address,address,uint256,uint256,uint24,uint256,bool),bytes,bytes)
    const selector = '????????'; // TODO: Calculate actual selector after contract deployment

    // For now, return placeholder - will be updated after contract ABI is generated
    // This would encode:
    // - SwapParams struct
    // - permitData bytes
    // - signature bytes

    // Simplified encoding (would use ethers.js or viem in production)
    const tokenIn = params.tokenIn.slice(2).padStart(64, '0');
    const tokenOut = params.tokenOut.slice(2).padStart(64, '0');
    const amountIn = params.amountIn.toString(16).padStart(64, '0');
    const amountOutMin = params.amountOutMin.toString(16).padStart(64, '0');
    const poolFee = params.poolFee.toString(16).padStart(64, '0');
    const deadline = params.deadline.toString(16).padStart(64, '0');
    const useV4 = (params.useV4 ? '1' : '0').padStart(64, '0');

    // Note: This is a simplified encoding. Real implementation needs proper ABI encoding
    return '0x' + selector + tokenIn + tokenOut + amountIn + amountOutMin + poolFee + deadline + useV4;
}
