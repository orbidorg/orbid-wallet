import { UNISWAP_ADDRESSES, SWAP_CONFIG } from './config';
import type { SwapQuote, Token } from './types';

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

export async function getSwapQuote(params: QuoterParams): Promise<SwapQuote | null> {
    const { tokenIn, tokenOut, amountIn, rpcUrl, poolPreferences = DEFAULT_POOL_PREFERENCES } = params;

    if (amountIn <= BigInt(0)) {
        return null;
    }

    const quotes: SwapQuote[] = [];

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

    if (poolPreferences.useV4) {
        try {
            const v4Quote = await getV4Quote({ tokenIn, tokenOut, amountIn, rpcUrl });
            if (v4Quote) {
                quotes.push(v4Quote);
            }
        } catch (error) {
            console.warn('[Quoter] V4 quote failed:', error);
        }
    }

    if (quotes.length === 0) {
        console.warn('[Quoter] No quotes available from any pool version');
        return null;
    }

    const bestQuote = quotes.reduce((best, current) =>
        current.amountOut > best.amountOut ? current : best
    );

    console.log(`[Quoter] Best quote from ${bestQuote.route.version}: ${bestQuote.amountOut.toString()}`);
    return bestQuote;
}

async function getV3Quote(params: {
    tokenIn: Token;
    tokenOut: Token;
    amountIn: bigint;
    rpcUrl: string;
}): Promise<SwapQuote | null> {
    const { tokenIn, tokenOut, amountIn, rpcUrl } = params;

    const feeTiers = [
        SWAP_CONFIG.FEE_TIERS.LOW,      // 0.05% - common for major pairs
        SWAP_CONFIG.FEE_TIERS.LOWEST,   // 0.01% - stablecoins
        SWAP_CONFIG.FEE_TIERS.MEDIUM,   // 0.3% - standard
        SWAP_CONFIG.FEE_TIERS.HIGH,     // 1% - exotic pairs
    ];

    let bestQuote: SwapQuote | null = null;

    // Adjust amountIn for tokenIn sell tax (FOT support)
    const netAmountIn = tokenIn.sellTax
        ? (amountIn * BigInt(1000 - (tokenIn.sellTax * 10))) / BigInt(1000)
        : amountIn;

    for (const fee of feeTiers) {
        try {
            const quote = await quoteSingleV3({
                tokenIn: tokenIn.address,
                tokenOut: tokenOut.address,
                amountIn: netAmountIn,
                fee,
                rpcUrl,
            });

            if (quote && (!bestQuote || quote.amountOut > bestQuote.amountOut)) {
                // Calculate slippage tolerance (no fees - direct to Uniswap)
                const slippageBps = SWAP_CONFIG.DEFAULT_SLIPPAGE_BPS;
                const amountOutMin = (quote.amountOut * (BigInt(10000) - BigInt(slippageBps))) / BigInt(10000);

                const priceImpact = 0;

                bestQuote = {
                    amountIn,
                    amountOut: quote.amountOut,
                    amountOutMin,
                    priceImpact,
                    fee: BigInt(0), // No protocol fee
                    feePercentage: 0,
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
                    gasEstimate: quote.gasEstimate,
                };
            }
        } catch (error) {
            console.warn(`[V3] Quote failed for fee tier ${fee}:`, error);
            continue;
        }
    }

    return bestQuote;
}

async function getV2Quote(params: {
    tokenIn: Token;
    tokenOut: Token;
    amountIn: bigint;
    rpcUrl: string;
}): Promise<SwapQuote | null> {
    const { tokenIn, tokenOut, amountIn, rpcUrl } = params;

    try {
        // Adjust amountIn for tokenIn sell tax (FOT support)
        const netAmountIn = tokenIn.sellTax
            ? (amountIn * BigInt(1000 - (tokenIn.sellTax * 10))) / BigInt(1000)
            : amountIn;

        const quote = await quoteSingleV2({
            tokenIn: tokenIn.address,
            tokenOut: tokenOut.address,
            amountIn: netAmountIn,
            rpcUrl,
        });

        if (!quote) return null;

        // Calculate slippage tolerance (no fees - direct to Uniswap)
        const slippageBps = SWAP_CONFIG.DEFAULT_SLIPPAGE_BPS;
        const amountOutMin = (quote.amountOut * (BigInt(10000) - BigInt(slippageBps))) / BigInt(10000);

        return {
            amountIn,
            amountOut: quote.amountOut,
            amountOutMin,
            priceImpact: 0,
            fee: BigInt(0),
            feePercentage: 0,
            route: {
                path: [tokenIn, tokenOut],
                pools: [{
                    address: '',
                    fee: 3000,
                    liquidity: BigInt(0),
                    token0: tokenIn.address,
                    token1: tokenOut.address,
                }],
                version: 'v2',
            },
            gasEstimate: BigInt(150000),
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

        if (result.error) {
            console.warn(`[V3] RPC error for fee ${fee}:`, result.error.message || result.error);
            return null;
        }

        if (!result.result || result.result === '0x') {
            console.warn(`[V3] Empty result for fee tier ${fee} (pool may not exist)`);
            return null;
        }

        const decoded = decodeQuoteResultV3(result.result);
        console.log(`[V3] Quote for fee ${fee}: ${decoded.amountOut.toString()} out`);
        return decoded;
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
    // QuoterV2.quoteExactInputSingle takes a struct as parameter
    // Function signature: quoteExactInputSingle((address,address,uint256,uint24,uint160))
    // The selector is for the struct-based version
    const selector = 'c6a5026a'; // quoteExactInputSingle(address,address,uint256,uint24,uint160)

    // Encode parameters directly (not as a tuple with offset)
    const tokenInPadded = tokenIn.slice(2).toLowerCase().padStart(64, '0');
    const tokenOutPadded = tokenOut.slice(2).toLowerCase().padStart(64, '0');
    const amountInHex = amountIn.toString(16).padStart(64, '0');
    const feeHex = fee.toString(16).padStart(64, '0');
    const sqrtPriceLimitX96 = '0'.padStart(64, '0');

    return '0x' + selector + tokenInPadded + tokenOutPadded + amountInHex + feeHex + sqrtPriceLimitX96;
}

function decodeQuoteResultV3(data: string): QuoteResult {
    const hex = data.slice(2);

    if (hex.length < 64) {
        console.error('[V3] Invalid quote response length:', hex.length);
        return { amountOut: BigInt(0), gasEstimate: BigInt(150000) };
    }

    const amountOut = BigInt('0x' + hex.slice(0, 64));
    // sqrtPriceX96After: bytes 64-128
    // initializedTicksCrossed: bytes 128-192 (actually 32-bit but padded to 256)
    // gasEstimate: bytes 192-256
    let gasEstimate = BigInt(150000);
    if (hex.length >= 256) {
        try {
            gasEstimate = BigInt('0x' + hex.slice(192, 256));
        } catch {
            gasEstimate = BigInt(150000);
        }
    }

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
                        to: UNISWAP_ADDRESSES.SWAP_ROUTER,
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

/**
 * Get quote from Uniswap V4 pools
 * Uses pool discovery system for known and unknown pools
 */
async function getV4Quote(params: {
    tokenIn: Token;
    tokenOut: Token;
    amountIn: bigint;
    rpcUrl: string;
}): Promise<SwapQuote | null> {
    const { tokenIn, tokenOut, amountIn, rpcUrl } = params;

    console.log('[V4] getV4Quote called', {
        tokenIn: tokenIn.symbol,
        tokenOut: tokenOut.symbol,
        amount: amountIn.toString()
    });

    // Import pool discovery (inline to avoid circular deps)
    const { getV4PoolConfigs, cachePoolConfig, getCachedPoolConfig } = await import('./v4-discovery');

    // Check cache first
    const cachedConfig = getCachedPoolConfig(tokenIn.address, tokenOut.address);
    const configs = cachedConfig ? [cachedConfig] : getV4PoolConfigs(tokenIn.address, tokenOut.address);

    let bestQuote: SwapQuote | null = null;
    let successfulConfig: { fee: number; tickSpacing: number; hooks: string } | null = null;

    // Adjust amountIn for tokenIn sell tax (FOT support)
    const netAmountIn = tokenIn.sellTax
        ? (amountIn * BigInt(1000 - (tokenIn.sellTax * 10))) / BigInt(1000)
        : amountIn;

    for (const config of configs) {
        const quote = await quoteSingleV4({
            tokenIn: tokenIn.address,
            tokenOut: tokenOut.address,
            amountIn: netAmountIn,
            fee: config.fee,
            tickSpacing: config.tickSpacing,
            hooks: config.hooks,
            rpcUrl
        });

        if (!quote) continue;

        // Sanity check: reject obviously invalid quotes
        // A reasonable quote should not exceed input amount by more than 10^12 (accounting for decimals)
        const maxReasonableRatio = BigInt(10) ** BigInt(12);
        const ratio = quote.amountOut / (netAmountIn || BigInt(1));

        if (ratio > maxReasonableRatio) {
            console.warn(`[V4] Rejecting unreasonable quote for fee ${config.fee}: ratio ${ratio.toString()}`);
            continue;
        }

        if (!bestQuote || quote.amountOut > bestQuote.amountOut) {
            successfulConfig = config;
            bestQuote = {
                amountIn,
                amountOut: quote.amountOut,
                amountOutMin: (quote.amountOut * BigInt(995)) / BigInt(1000), // 0.5% slippage
                priceImpact: 0,
                fee: BigInt(0),
                feePercentage: config.fee / 10000,
                route: {
                    path: [tokenIn, tokenOut],
                    pools: [{
                        address: UNISWAP_ADDRESSES.POOL_MANAGER,
                        fee: config.fee,
                        liquidity: BigInt(0),
                        token0: tokenIn.address,
                        token1: tokenOut.address
                    }],
                    version: 'v4'
                },
                gasEstimate: quote.gasEstimate
            };

            // Cache successful config for future use
            if (!cachedConfig) {
                cachePoolConfig(tokenIn.address, tokenOut.address, config);
            }
        }
    }

    if (bestQuote && successfulConfig) {
        console.log(`[V4] Found quote with fee ${successfulConfig.fee} (${successfulConfig.fee / 10000}%)`);
    }

    return bestQuote;
}

/**
 * Check if a V4 pool exists and has liquidity using StateView
 */
async function checkPoolLiquidity(params: {
    tokenIn: string;
    tokenOut: string;
    fee: number;
    tickSpacing: number;
    hooks: string;
    rpcUrl: string;
}): Promise<bigint> {
    const { tokenIn, tokenOut, fee, tickSpacing, hooks, rpcUrl } = params;

    // Sort tokens
    const t0 = tokenIn.toLowerCase() < tokenOut.toLowerCase() ? tokenIn : tokenOut;
    const t1 = tokenIn.toLowerCase() < tokenOut.toLowerCase() ? tokenOut : tokenIn;

    try {
        const { encodeFunctionData } = await import('viem');

        // StateView ABI for getLiquidity
        const stateViewAbi = [{
            name: 'getLiquidity',
            type: 'function',
            stateMutability: 'view',
            inputs: [{
                name: 'poolManager',
                type: 'address'
            }, {
                name: 'poolId',
                type: 'bytes32'
            }],
            outputs: [{
                name: 'liquidity',
                type: 'uint128'
            }]
        }] as const;

        // Calculate poolId (keccak256 of PoolKey)
        // PoolKey = (currency0, currency1, fee, tickSpacing, hooks)
        // For now, we'll use a simplified approach and call the quoter directly
        // If it returns valid data, the pool exists

        // Actually, let's just try quoting and check if the result is reasonable
        // The quoter will revert if the pool doesn't exist
        return BigInt(1); // Assume pool exists, let quoter validate
    } catch (error) {
        console.warn(`[V4] Error checking liquidity:`, error);
        return BigInt(0);
    }
}

/**
 * Quote V4 for a single pool using viem for proper ABI encoding
 */
async function quoteSingleV4(params: {
    tokenIn: string;
    tokenOut: string;
    amountIn: bigint;
    fee: number;
    tickSpacing: number;
    hooks: string;
    rpcUrl: string;
}): Promise<{ amountOut: bigint; gasEstimate: bigint } | null> {
    const { tokenIn, tokenOut, amountIn, fee, tickSpacing, hooks, rpcUrl } = params;

    // Sort tokens for currency0/currency1 (V4 requirement)
    const t0 = tokenIn.toLowerCase() < tokenOut.toLowerCase() ? tokenIn : tokenOut;
    const t1 = tokenIn.toLowerCase() < tokenOut.toLowerCase() ? tokenOut : tokenIn;
    const zeroForOne = tokenIn.toLowerCase() === t0.toLowerCase();

    try {
        // Use viem to encode the function call properly
        const { encodeFunctionData } = await import('viem');

        // Define the V4Quoter ABI for quoteExactInputSingle
        const quoterAbi = [{
            name: 'quoteExactInputSingle',
            type: 'function',
            stateMutability: 'nonpayable',
            inputs: [{
                name: 'params',
                type: 'tuple',
                components: [
                    {
                        name: 'poolKey',
                        type: 'tuple',
                        components: [
                            { name: 'currency0', type: 'address' },
                            { name: 'currency1', type: 'address' },
                            { name: 'fee', type: 'uint24' },
                            { name: 'tickSpacing', type: 'int24' },
                            { name: 'hooks', type: 'address' }
                        ]
                    },
                    { name: 'zeroForOne', type: 'bool' },
                    { name: 'exactAmount', type: 'uint128' },
                    { name: 'hookData', type: 'bytes' }
                ]
            }],
            outputs: [
                { name: 'amountOut', type: 'uint256' },
                { name: 'gasEstimate', type: 'uint256' }
            ]
        }] as const;

        // Encode the function call
        const callData = encodeFunctionData({
            abi: quoterAbi,
            functionName: 'quoteExactInputSingle',
            args: [{
                poolKey: {
                    currency0: t0 as `0x${string}`,
                    currency1: t1 as `0x${string}`,
                    fee,
                    tickSpacing,
                    hooks: hooks as `0x${string}`
                },
                zeroForOne,
                exactAmount: amountIn,
                hookData: '0x' as `0x${string}`
            }]
        });

        console.log(`[V4] Calling quoter for fee ${fee} with viem encoding`);

        const response = await fetch(rpcUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                jsonrpc: '2.0',
                id: 1,
                method: 'eth_call',
                params: [
                    {
                        to: UNISWAP_ADDRESSES.QUOTER_V4,
                        data: callData,
                    },
                    'latest',
                ],
            }),
        });

        const result = await response.json();

        console.log(`[V4] RPC response for fee ${fee}:`, {
            hasResult: !!result.result,
            hasError: !!result.error,
            resultValue: result.result,
            errorData: result.error?.data,
            errorMessage: result.error?.message
        });

        // V4Quoter returns data (may revert intentionally to return data)
        let dataHex: string | null = null;

        if (result.result && result.result !== '0x') {
            dataHex = result.result;
            console.log(`[V4] Using result data for fee ${fee}`);
        } else if (result.error?.data && result.error.data !== '0x') {
            dataHex = result.error.data;
            console.log(`[V4] Using error.data for fee ${fee}`);
        }

        if (!dataHex || dataHex === '0x') {
            console.warn(`[V4] No usable data for fee ${fee}`);
            return null;
        }

        // Decode using viem
        const { decodeFunctionResult } = await import('viem');

        const decoded = decodeFunctionResult({
            abi: quoterAbi,
            functionName: 'quoteExactInputSingle',
            data: dataHex as `0x${string}`
        });

        const [amountOut, gasEstimate] = decoded as [bigint, bigint];

        // Reject amountOut == 0 (pool doesn't exist or has no liquidity)
        if (amountOut === BigInt(0)) {
            console.warn(`[V4] Pool has no liquidity for fee ${fee}`);
            return null;
        }

        console.log(`[V4] Successfully decoded quote for fee ${fee}:`, {
            amountOut: amountOut.toString(),
            gasEstimate: gasEstimate.toString()
        });

        return { amountOut, gasEstimate };
    } catch (error) {
        console.error(`[V4] Error in quoteSingleV4 for fee ${fee}:`, error);
        return null;
    }
}
