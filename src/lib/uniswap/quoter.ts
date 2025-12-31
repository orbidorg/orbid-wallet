// Uniswap Quoter - Fetches swap quotes from Uniswap V2/V3/V4

import { UNISWAP_ADDRESSES, SWAP_CONFIG } from './config';
import type { SwapQuote, Token } from './types';

// Pool version preferences
export interface PoolPreferences {
    useV2: boolean;
    useV3: boolean;
    useV4: boolean;
}

interface QuoterParams {
    tokenIn: Token;
    tokenOut: Token;
    amountIn: bigint;
    rpcUrl: string;
    poolPreferences?: PoolPreferences;
}

const DEFAULT_POOL_PREFERENCES: PoolPreferences = {
    useV2: true,
    useV3: true,
    useV4: true,
};

/**
 * Get the best swap quote across enabled pool versions (V2/V3/V4)
 */
export async function getSwapQuote(params: QuoterParams): Promise<SwapQuote | null> {
    const { tokenIn, tokenOut, amountIn, rpcUrl, poolPreferences = DEFAULT_POOL_PREFERENCES } = params;

    if (amountIn <= BigInt(0)) {
        return null;
    }

    const quotes: SwapQuote[] = [];

    // Get V3 quote if enabled
    if (poolPreferences.useV3) {
        try {
            const v3Quote = await getV3Quote({ tokenIn, tokenOut, amountIn, rpcUrl });
            if (v3Quote) {
                quotes.push(v3Quote);
            }
        } catch (error) {
            console.warn('[Quoter] V3 quote failed:', error);
        }
    }

    // Get V2 quote if enabled
    if (poolPreferences.useV2) {
        try {
            const v2Quote = await getV2Quote({ tokenIn, tokenOut, amountIn, rpcUrl });
            if (v2Quote) {
                quotes.push(v2Quote);
            }
        } catch (error) {
            console.warn('[Quoter] V2 quote failed:', error);
        }
    }

    // V4 is not yet implemented (uses different interface via Universal Router)
    // For now, V4 quotes would come from the same V3 quoter with different routing

    if (quotes.length === 0) {
        console.warn('[Quoter] No quotes available from any pool version');
        return null;
    }

    // Find best quote (highest output)
    const bestQuote = quotes.reduce((best, current) =>
        current.amountOut > best.amountOut ? current : best
    );

    console.log(`[Quoter] Best quote from ${bestQuote.route.version}: ${bestQuote.amountOut.toString()}`);
    return bestQuote;
}

/**
 * Get quote from Uniswap V3 pools
 */
async function getV3Quote(params: {
    tokenIn: Token;
    tokenOut: Token;
    amountIn: bigint;
    rpcUrl: string;
}): Promise<SwapQuote | null> {
    const { tokenIn, tokenOut, amountIn, rpcUrl } = params;

    // Try different fee tiers to find best quote
    const feeTiers = [
        SWAP_CONFIG.FEE_TIERS.LOW,      // 0.05%
        SWAP_CONFIG.FEE_TIERS.MEDIUM,   // 0.3%
        SWAP_CONFIG.FEE_TIERS.HIGH,     // 1%
    ];

    let bestQuote: SwapQuote | null = null;

    for (const fee of feeTiers) {
        try {
            const quote = await quoteSingleV3({
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
                const adjustedQuote = await quoteSingleV3({
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

                    // Price impact simplified
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
            console.warn(`[V3] Quote failed for fee tier ${fee}:`, error);
            continue;
        }
    }

    return bestQuote;
}

/**
 * Get quote from Uniswap V2 pools
 */
async function getV2Quote(params: {
    tokenIn: Token;
    tokenOut: Token;
    amountIn: bigint;
    rpcUrl: string;
}): Promise<SwapQuote | null> {
    const { tokenIn, tokenOut, amountIn, rpcUrl } = params;

    try {
        // Call getAmountsOut on V2 Router
        const quote = await quoteSingleV2({
            tokenIn: tokenIn.address,
            tokenOut: tokenOut.address,
            amountIn,
            rpcUrl,
        });

        if (!quote) return null;

        // Calculate fee amount
        const feeAmount = (amountIn * BigInt(SWAP_CONFIG.FEE_BPS)) / BigInt(10000);
        const amountAfterFee = amountIn - feeAmount;

        // Recalculate output with fee deducted
        const adjustedQuote = await quoteSingleV2({
            tokenIn: tokenIn.address,
            tokenOut: tokenOut.address,
            amountIn: amountAfterFee,
            rpcUrl,
        });

        if (!adjustedQuote) return null;

        // Calculate slippage tolerance
        const slippageBps = SWAP_CONFIG.DEFAULT_SLIPPAGE_BPS;
        const amountOutMin = (adjustedQuote.amountOut * (BigInt(10000) - BigInt(slippageBps))) / BigInt(10000);

        // Price impact
        const rawOut = Number(quote.amountOut);
        const adjustedOut = Number(adjustedQuote.amountOut);
        const priceImpact = rawOut > 0 ? Math.max(0, ((rawOut - adjustedOut) / rawOut - 0.005) * 100) : 0;

        return {
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
                    fee: 3000, // V2 uses 0.3% fee
                    liquidity: BigInt(0),
                    token0: tokenIn.address,
                    token1: tokenOut.address,
                }],
                version: 'v2',
            },
            gasEstimate: BigInt(150000), // Typical V2 gas
        };
    } catch (error) {
        console.warn('[V2] Quote failed:', error);
        return null;
    }
}

// ============ V3 Quoting ============

interface QuoteSingleV3Params {
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

async function quoteSingleV3(params: QuoteSingleV3Params): Promise<QuoteResult | null> {
    const { tokenIn, tokenOut, amountIn, fee, rpcUrl } = params;

    const callData = encodeQuoteCallV3(tokenIn, tokenOut, amountIn, fee);

    try {
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

        if (result.error || !result.result || result.result === '0x') {
            return null;
        }

        return decodeQuoteResultV3(result.result);
    } catch (error) {
        console.error('[V3] Quote RPC call failed:', error);
        return null;
    }
}

function encodeQuoteCallV3(
    tokenIn: string,
    tokenOut: string,
    amountIn: bigint,
    fee: number
): string {
    // QuoterV2 quoteExactInputSingle(address,address,uint256,uint24,uint160)
    const selector = 'c6a5026a';

    const params = [
        tokenIn.slice(2).toLowerCase().padStart(64, '0'),
        tokenOut.slice(2).toLowerCase().padStart(64, '0'),
        amountIn.toString(16).padStart(64, '0'),
        fee.toString(16).padStart(64, '0'),
        '0'.padStart(64, '0'), // sqrtPriceLimitX96 = 0
    ].join('');

    return '0x' + selector + params;
}

function decodeQuoteResultV3(data: string): QuoteResult {
    const hex = data.slice(2);
    const amountOut = BigInt('0x' + hex.slice(0, 64));
    const gasEstimate = BigInt('0x' + hex.slice(192, 256));
    return { amountOut, gasEstimate };
}

// ============ V2 Quoting ============

interface QuoteSingleV2Params {
    tokenIn: string;
    tokenOut: string;
    amountIn: bigint;
    rpcUrl: string;
}

async function quoteSingleV2(params: QuoteSingleV2Params): Promise<QuoteResult | null> {
    const { tokenIn, tokenOut, amountIn, rpcUrl } = params;

    // V2 Router getAmountsOut(uint256 amountIn, address[] path)
    const callData = encodeQuoteCallV2(tokenIn, tokenOut, amountIn);

    try {
        const response = await fetch(rpcUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                jsonrpc: '2.0',
                id: 1,
                method: 'eth_call',
                params: [
                    {
                        to: UNISWAP_ADDRESSES.SWAP_ROUTER_V2,
                        data: callData,
                    },
                    'latest',
                ],
            }),
        });

        const result = await response.json();

        if (result.error || !result.result || result.result === '0x') {
            console.warn('[V2] No liquidity or pair not found');
            return null;
        }

        return decodeQuoteResultV2(result.result);
    } catch (error) {
        console.error('[V2] Quote RPC call failed:', error);
        return null;
    }
}

function encodeQuoteCallV2(
    tokenIn: string,
    tokenOut: string,
    amountIn: bigint
): string {
    // getAmountsOut(uint256 amountIn, address[] calldata path)
    // Selector: d06ca61f
    const selector = 'd06ca61f';

    // Encode amountIn
    const amountHex = amountIn.toString(16).padStart(64, '0');

    // Encode path array offset (points to where array data starts)
    const offsetHex = (64).toString(16).padStart(64, '0'); // 0x40 = 64 bytes

    // Encode array length (2 tokens)
    const lengthHex = (2).toString(16).padStart(64, '0');

    // Encode token addresses
    const token0Hex = tokenIn.slice(2).toLowerCase().padStart(64, '0');
    const token1Hex = tokenOut.slice(2).toLowerCase().padStart(64, '0');

    return '0x' + selector + amountHex + offsetHex + lengthHex + token0Hex + token1Hex;
}

function decodeQuoteResultV2(data: string): QuoteResult {
    const hex = data.slice(2);

    // getAmountsOut returns uint256[] - array of amounts for each token in path
    // Skip offset (32 bytes) and length (32 bytes), then read second amount
    // Structure: [offset][length][amount0][amount1...]

    // Read array length
    const arrayLength = parseInt(hex.slice(64, 128), 16);

    if (arrayLength < 2) {
        throw new Error('Invalid V2 quote result');
    }

    // Read the last amount (output amount)
    const amountOutStart = 128 + (arrayLength - 1) * 64;
    const amountOut = BigInt('0x' + hex.slice(amountOutStart, amountOutStart + 64));

    return {
        amountOut,
        gasEstimate: BigInt(150000), // Typical V2 swap gas
    };
}
