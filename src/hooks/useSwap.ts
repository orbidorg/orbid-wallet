'use client';

import { useState, useCallback } from 'react';
import { MiniKit } from '@worldcoin/minikit-js';
import { SWAP_CONFIG, UNISWAP_ADDRESSES } from '@/lib/uniswap/config';
import type { Token, SwapQuote, SwapState } from '@/lib/uniswap/types';

const SWAP_ROUTER_V3_ABI = [{
    name: 'exactInputSingle',
    type: 'function',
    inputs: [{
        name: 'params',
        type: 'tuple',
        components: [
            { name: 'tokenIn', type: 'address' },
            { name: 'tokenOut', type: 'address' },
            { name: 'fee', type: 'uint24' },
            { name: 'recipient', type: 'address' },
            { name: 'amountIn', type: 'uint256' },
            { name: 'amountOutMinimum', type: 'uint256' },
            { name: 'sqrtPriceLimitX96', type: 'uint160' }
        ]
    }],
    outputs: [{ name: 'amountOut', type: 'uint256' }],
    stateMutability: 'payable'
}] as const;

const SWAP_ROUTER_V2_ABI = [
    {
        name: 'swapExactTokensForTokens',
        type: 'function',
        inputs: [
            { name: 'amountIn', type: 'uint256' },
            { name: 'amountOutMin', type: 'uint256' },
            { name: 'path', type: 'address[]' },
            { name: 'to', type: 'address' },
            { name: 'deadline', type: 'uint256' }
        ],
        outputs: [{ name: 'amounts', type: 'uint256[]' }],
        stateMutability: 'nonpayable'
    },
    {
        name: 'swapExactTokensForTokensSupportingFeeOnTransferTokens',
        type: 'function',
        inputs: [
            { name: 'amountIn', type: 'uint256' },
            { name: 'amountOutMin', type: 'uint256' },
            { name: 'path', type: 'address[]' },
            { name: 'to', type: 'address' },
            { name: 'deadline', type: 'uint256' }
        ],
        outputs: [],
        stateMutability: 'nonpayable'
    }
] as const;

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

function getVersionRouter(version: 'v2' | 'v3' | 'v4'): string {
    switch (version) {
        case 'v2': return UNISWAP_ADDRESSES.SWAP_ROUTER_V2;
        case 'v3': return UNISWAP_ADDRESSES.SWAP_ROUTER_V3;
        case 'v4': return UNISWAP_ADDRESSES.UNIVERSAL_ROUTER_V4;
    }
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

        let version: 'v2' | 'v3' | 'v4' | undefined;
        let router: string | undefined;
        let amountIn: string | undefined;

        try {
            setState(s => ({ ...s, status: 'swapping', quote }));

            amountIn = quote.amountIn.toString();
            const amountOutMin = quote.amountOutMin.toString();
            const deadline = Math.floor(Date.now() / 1000) + (SWAP_CONFIG.DEFAULT_DEADLINE_MINUTES * 60);
            const poolFee = quote.route.pools[0]?.fee || SWAP_CONFIG.FEE_TIERS.MEDIUM;
            version = quote.route.version;
            router = getVersionRouter(version);
            const tokenInLower = tokenIn.address.toLowerCase() as `0x${string}`;
            const nonce = Date.now().toString();

            let result;

            if (version === 'v2') {
                const hasTax = (tokenIn.sellTax || 0) > 0 || (tokenOut.buyTax || 0) > 0;
                const functionName = hasTax ? 'swapExactTokensForTokensSupportingFeeOnTransferTokens' : 'swapExactTokensForTokens';

                result = await MiniKit.commandsAsync.sendTransaction({
                    transaction: [{
                        address: router as `0x${string}`,
                        abi: SWAP_ROUTER_V2_ABI,
                        functionName,
                        args: [
                            amountIn,
                            amountOutMin,
                            [tokenIn.address, tokenOut.address],
                            walletAddress,
                            deadline.toString()
                        ]
                    }],
                    permit2: [{
                        permitted: { token: tokenInLower, amount: amountIn },
                        spender: router as `0x${string}`,
                        nonce,
                        deadline: deadline.toString(),
                    }]
                });
            } else if (version === 'v3') {
                console.log('Using Uniswap V3 Router:', router);
                const v3Args = [
                    tokenIn.address,
                    tokenOut.address,
                    poolFee,
                    walletAddress,
                    amountIn,
                    amountOutMin,
                    '0'
                ];
                console.log('V3 Params:', {
                    router,
                    poolFee,
                    args: v3Args,
                    permit2Token: tokenInLower,
                    permit2Amount: amountIn,
                    permit2Spender: router
                });

                result = await MiniKit.commandsAsync.sendTransaction({
                    transaction: [{
                        address: router as `0x${string}`,
                        abi: SWAP_ROUTER_V3_ABI,
                        functionName: 'exactInputSingle',
                        args: [v3Args]
                    }],
                    permit2: [{
                        permitted: { token: tokenInLower, amount: amountIn },
                        spender: router as `0x${string}`,
                        nonce,
                        deadline: deadline.toString(),
                    }]
                });
            } else {
                throw new Error(`Execution for Uniswap ${version} is not yet implemented. Please use a V2 or V3 pool.`);
            }

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
                const error = JSON.stringify(result.finalPayload, null, 2);
                throw new Error(error);
            }

        } catch (error) {
            console.error('Swap failed:', error);
            const errorMessage = error instanceof Error ? error.message : String(error);
            const context = JSON.stringify({
                version,
                router,
                tokenIn: tokenIn.address,
                tokenOut: tokenOut.address,
                amountIn,
                method: version === 'v3' ? 'exactInputSingle' : 'swapExactTokensForTokens',
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
