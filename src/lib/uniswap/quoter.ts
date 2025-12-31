// Uniswap Quoter - Fetches swap quotes from Uniswap v3/v4

import { UNISWAP_ADDRESSES, SWAP_CONFIG } from './config';
import type { SwapQuote, Token } from './types';

interface QuoterParams {
    tokenIn: Token;
    tokenOut: Token;
    amountIn: bigint;
    rpcUrl: string;
}

/**
 * Get a swap quote from Uniswap v3 Quoter
 */
export async function getSwapQuote(params: QuoterParams): Promise<SwapQuote | null> {
    const { tokenIn, tokenOut, amountIn, rpcUrl } = params;

    if (amountIn <= BigInt(0)) {
        return null;
    }

    // Try different fee tiers to find best quote
    const feeTiers = [
        SWAP_CONFIG.FEE_TIERS.LOW,      // 0.05%
        SWAP_CONFIG.FEE_TIERS.MEDIUM,   // 0.3%
        SWAP_CONFIG.FEE_TIERS.HIGH,     // 1%
    ];

    let bestQuote: SwapQuote | null = null;

    for (const fee of feeTiers) {
        try {
            const quote = await quoteSingle({
                tokenIn: tokenIn.address,
                tokenOut: tokenOut.address,
                amountIn,
                fee,
                rpcUrl,
            });

            if (quote && (!bestQuote || quote.amountOut > bestQuote.amountOut)) {
                // Calculate fee amount
                const feeAmount = (amountIn * BigInt(SWAP_CONFIG.FEE_BPS)) / BigInt(10000);
                const amountAfterFee = amountIn - feeAmount;

                // Recalculate output with fee deducted
                const adjustedQuote = await quoteSingle({
                    tokenIn: tokenIn.address,
                    tokenOut: tokenOut.address,
                    amountIn: amountAfterFee,
                    fee,
                    rpcUrl,
                });

                if (adjustedQuote) {
                    // Calculate slippage tolerance
                    const slippageBps = SWAP_CONFIG.DEFAULT_SLIPPAGE_BPS;
                    const amountOutMin = (adjustedQuote.amountOut * (BigInt(10000) - BigInt(slippageBps))) / BigInt(10000);

                    // Price impact simplified (comparing quote vs adjusted)
                    const rawOut = Number(quote.amountOut);
                    const adjustedOut = Number(adjustedQuote.amountOut);
                    const priceImpact = rawOut > 0 ? Math.max(0, ((rawOut - adjustedOut) / rawOut - 0.005) * 100) : 0;

                    bestQuote = {
                        amountIn,
                        amountOut: adjustedQuote.amountOut,
                        amountOutMin,
                        priceImpact,
                        fee: feeAmount,
                        feePercentage: SWAP_CONFIG.FEE_BPS / 100,
                        route: {
                            path: [tokenIn, tokenOut],
                            pools: [{
                                address: '',
                                fee,
                                liquidity: BigInt(0),
                                token0: tokenIn.address,
                                token1: tokenOut.address,
                            }],
                            version: 'v3',
                        },
                        gasEstimate: adjustedQuote.gasEstimate,
                    };
                }
            }
        } catch (error) {
            console.warn(`Quote failed for fee tier ${fee}:`, error);
            continue;
        }
    }

    return bestQuote;
}

interface QuoteSingleParams {
    tokenIn: string;
    tokenOut: string;
    amountIn: bigint;
    fee: number;
    rpcUrl: string;
}

interface QuoteResult {
    amountOut: bigint;
    gasEstimate: bigint;
}

async function quoteSingle(params: QuoteSingleParams): Promise<QuoteResult | null> {
    const { tokenIn, tokenOut, amountIn, fee, rpcUrl } = params;

    // Encode the call data
    const callData = encodeQuoteCall(tokenIn, tokenOut, amountIn, fee);

    try {
        console.log('[Quoter] RPC call to:', rpcUrl);
        console.log('[Quoter] Quoter address:', UNISWAP_ADDRESSES.QUOTER_V2);
        console.log('[Quoter] Call data:', callData);

        const response = await fetch(rpcUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                jsonrpc: '2.0',
                id: 1,
                method: 'eth_call',
                params: [
                    {
                        to: UNISWAP_ADDRESSES.QUOTER_V2,
                        data: callData,
                    },
                    'latest',
                ],
            }),
        });

        const result = await response.json();

        console.log('[Quoter] RPC response:', result);

        if (result.error || !result.result || result.result === '0x') {
            console.warn('[Quoter] No result or error:', result.error);
            return null;
        }

        // Decode the result
        const decoded = decodeQuoteResult(result.result);
        return decoded;
    } catch (error) {
        console.error('Quote RPC call failed:', error);
        return null;
    }
}

function encodeQuoteCall(
    tokenIn: string,
    tokenOut: string,
    amountIn: bigint,
    fee: number
): string {
    // QuoterV2 on World Chain uses the old-style direct params
    // Function selector for quoteExactInputSingle(address,address,uint256,uint24,uint160)
    const selector = 'c6a5026a';

    // Encode parameters directly (not as a struct)
    const params = [
        tokenIn.slice(2).toLowerCase().padStart(64, '0'),
        tokenOut.slice(2).toLowerCase().padStart(64, '0'),
        amountIn.toString(16).padStart(64, '0'),
        fee.toString(16).padStart(64, '0'),
        '0'.padStart(64, '0'), // sqrtPriceLimitX96 = 0
    ].join('');

    return '0x' + selector + params;
}

function decodeQuoteResult(data: string): QuoteResult {
    const hex = data.slice(2);
    const amountOut = BigInt('0x' + hex.slice(0, 64));
    const gasEstimate = BigInt('0x' + hex.slice(192, 256));
    return { amountOut, gasEstimate };
}
