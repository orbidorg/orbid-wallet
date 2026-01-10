'use client';

import { useState, useCallback } from 'react';
import { MiniKit } from '@worldcoin/minikit-js';
import { encodePacked, encodeAbiParameters, getAddress } from 'viem';
import { SWAP_CONFIG, UNISWAP_ADDRESSES } from '@/lib/uniswap/config';
import type { Token, SwapQuote, SwapState } from '@/lib/uniswap/types';

const UNIVERSAL_ROUTER_ABI = [
    {
        inputs: [
            { name: 'commands', type: 'bytes' },
            { name: 'inputs', type: 'bytes[]' },
            { name: 'deadline', type: 'uint256' }
        ],
        name: 'execute',
        outputs: [],
        stateMutability: 'payable',
        type: 'function'
    }
] as const;

const ERC20_ABI = [
    {
        inputs: [
            { name: 'spender', type: 'address' },
            { name: 'amount', type: 'uint256' }
        ],
        name: 'approve',
        outputs: [{ name: '', type: 'bool' }],
        stateMutability: 'nonpayable',
        type: 'function'
    }
] as const;

const COMMANDS = {
    V3_SWAP_EXACT_IN: 0x00,
    V3_SWAP_EXACT_OUT: 0x01,
    V2_SWAP_EXACT_IN: 0x08,
    V2_SWAP_EXACT_OUT: 0x09,
    V4_SWAP: 0x10,
    PERMIT2_PERMIT: 0x0a,
    PERMIT2_TRANSFER_FROM: 0x0b,
    WRAP_ETH: 0x0c,
    UNWRAP_WETH: 0x0d,
} as const;

interface UseSwapParams {
    tokenIn: Token | null;
    tokenOut: Token | null;
    quote: SwapQuote | null;
    walletAddress: string;
}

export function useSwap({ tokenIn, tokenOut, quote, walletAddress }: UseSwapParams) {
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

            const tokenInAddress = getAddress(tokenIn.address);
            const tokenOutAddress = getAddress(tokenOut.address);
            const recipientAddress = getAddress(walletAddress);
            const universalRouter = getAddress(UNISWAP_ADDRESSES.UNIVERSAL_ROUTER);

            const amountIn = quote.amountIn.toString();
            const deadline = Math.floor((Date.now() + SWAP_CONFIG.DEFAULT_DEADLINE_MINUTES * 60 * 1000) / 1000);

            const { commands, inputs } = encodeSwapForVersion({
                tokenIn: tokenInAddress,
                tokenOut: tokenOutAddress,
                amountIn: quote.amountIn,
                amountOutMin: quote.amountOutMin,
                recipient: recipientAddress,
                version: quote.route.version,
                fee: quote.route.pools[0]?.fee || 3000,
            });

            let result;

            if (tokenIn.isNative) {
                console.log('Using direct approval flow for:', tokenIn.symbol);

                result = await MiniKit.commandsAsync.sendTransaction({
                    transaction: [
                        {
                            address: tokenInAddress,
                            abi: ERC20_ABI,
                            functionName: 'approve',
                            args: [universalRouter, BigInt(amountIn)],
                        },
                        {
                            address: universalRouter,
                            abi: UNIVERSAL_ROUTER_ABI,
                            functionName: 'execute',
                            args: [commands, inputs, BigInt(deadline)],
                        },
                    ],
                });
            } else {
                console.log('Using Permit2 flow for:', tokenIn.symbol);

                const nonce = Date.now().toString();

                result = await MiniKit.commandsAsync.sendTransaction({
                    transaction: [{
                        address: universalRouter,
                        abi: UNIVERSAL_ROUTER_ABI,
                        functionName: 'execute',
                        args: [commands, inputs, BigInt(deadline)],
                    }],
                    permit2: [{
                        permitted: {
                            token: tokenInAddress,
                            amount: amountIn,
                        },
                        nonce,
                        deadline: deadline.toString(),
                        spender: universalRouter,
                    }],
                });
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
                throw new Error(JSON.stringify(result.finalPayload, null, 2));
            }
        } catch (error) {
            console.error('Swap failed:', error);
            setState({
                status: 'error',
                quote,
                txHash: null,
                error: error instanceof Error ? error.message : String(error),
            });
        }
    }, [tokenIn, tokenOut, quote, walletAddress]);

    return { state, executeSwap, reset };
}

function encodeSwapForVersion(params: {
    tokenIn: string;
    tokenOut: string;
    amountIn: bigint;
    amountOutMin: bigint;
    recipient: string;
    version: 'v2' | 'v3' | 'v4';
    fee: number;
}): { commands: `0x${string}`; inputs: `0x${string}`[] } {
    const { version } = params;

    if (version === 'v3') return encodeV3Swap(params);
    if (version === 'v2') return encodeV2Swap(params);
    if (version === 'v4') return encodeV4Swap(params);

    throw new Error(`Unsupported version: ${version}`);
}

function encodeV3Swap({
    tokenIn, tokenOut, amountIn, amountOutMin, recipient, fee
}: {
    tokenIn: string;
    tokenOut: string;
    amountIn: bigint;
    amountOutMin: bigint;
    recipient: string;
    fee: number;
}): { commands: `0x${string}`; inputs: `0x${string}`[] } {
    const path = encodePacked(
        ['address', 'uint24', 'address'],
        [tokenIn as `0x${string}`, fee, tokenOut as `0x${string}`]
    );

    const input = encodeAbiParameters(
        [
            { type: 'address', name: 'recipient' },
            { type: 'uint256', name: 'amountIn' },
            { type: 'uint256', name: 'amountOutMin' },
            { type: 'bytes', name: 'path' },
            { type: 'bool', name: 'payerIsUser' },
        ],
        [recipient as `0x${string}`, amountIn, amountOutMin, path, true]
    );

    return {
        commands: `0x${COMMANDS.V3_SWAP_EXACT_IN.toString(16).padStart(2, '0')}` as `0x${string}`,
        inputs: [input],
    };
}

function encodeV2Swap({
    tokenIn, tokenOut, amountIn, amountOutMin, recipient
}: {
    tokenIn: string;
    tokenOut: string;
    amountIn: bigint;
    amountOutMin: bigint;
    recipient: string;
    fee?: number;
}): { commands: `0x${string}`; inputs: `0x${string}`[] } {
    const input = encodeAbiParameters(
        [
            { type: 'address', name: 'recipient' },
            { type: 'uint256', name: 'amountIn' },
            { type: 'uint256', name: 'amountOutMin' },
            { type: 'address[]', name: 'path' },
            { type: 'bool', name: 'payerIsUser' },
        ],
        [
            recipient as `0x${string}`,
            amountIn,
            amountOutMin,
            [tokenIn as `0x${string}`, tokenOut as `0x${string}`],
            true
        ]
    );

    return {
        commands: `0x${COMMANDS.V2_SWAP_EXACT_IN.toString(16).padStart(2, '0')}` as `0x${string}`,
        inputs: [input],
    };
}

function encodeV4Swap({
    tokenIn, tokenOut, amountIn, amountOutMin, fee
}: {
    tokenIn: string;
    tokenOut: string;
    amountIn: bigint;
    amountOutMin: bigint;
    recipient: string;
    fee: number;
}): { commands: `0x${string}`; inputs: `0x${string}`[] } {
    const t0 = tokenIn.toLowerCase() < tokenOut.toLowerCase() ? tokenIn : tokenOut;
    const t1 = tokenIn.toLowerCase() < tokenOut.toLowerCase() ? tokenOut : tokenIn;
    const zeroForOne = tokenIn.toLowerCase() === t0.toLowerCase();

    const tickSpacing = fee === 100 ? 1 : fee === 500 ? 10 : fee === 3000 ? 60 : 200;

    const poolKey = encodeAbiParameters(
        [
            { type: 'address', name: 'currency0' },
            { type: 'address', name: 'currency1' },
            { type: 'uint24', name: 'fee' },
            { type: 'int24', name: 'tickSpacing' },
            { type: 'address', name: 'hooks' },
        ],
        [
            t0 as `0x${string}`,
            t1 as `0x${string}`,
            fee,
            tickSpacing,
            '0x0000000000000000000000000000000000000000' as `0x${string}`,
        ]
    );

    const input = encodeAbiParameters(
        [
            { type: 'bytes', name: 'poolKey' },
            { type: 'bool', name: 'zeroForOne' },
            { type: 'uint128', name: 'amountIn' },
            { type: 'uint128', name: 'amountOutMin' },
            { type: 'bytes', name: 'hookData' },
        ],
        [poolKey, zeroForOne, amountIn, amountOutMin, '0x' as `0x${string}`]
    );

    return {
        commands: `0x${COMMANDS.V4_SWAP.toString(16).padStart(2, '0')}` as `0x${string}`,
        inputs: [input],
    };
}
