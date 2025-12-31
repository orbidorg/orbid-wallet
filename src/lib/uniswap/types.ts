// Types for Uniswap Swap functionality

export interface Token {
    address: string;
    symbol: string;
    name: string;
    decimals: number;
    logoURI?: string;
}

export interface SwapQuote {
    amountIn: bigint;
    amountOut: bigint;
    amountOutMin: bigint;
    priceImpact: number;
    fee: bigint;
    feePercentage: number;
    route: SwapRoute;
    gasEstimate: bigint;
}

export interface SwapRoute {
    path: Token[];
    pools: PoolInfo[];
    version: 'v3' | 'v4';
}

export interface PoolInfo {
    address: string;
    fee: number;
    liquidity: bigint;
    token0: string;
    token1: string;
}

export interface SwapParams {
    tokenIn: string;
    tokenOut: string;
    amountIn: bigint;
    amountOutMin: bigint;
    poolFee: number;
    deadline: bigint;
    useV4: boolean;
}

export interface PermitTransferFrom {
    permitted: {
        token: string;
        amount: bigint;
    };
    nonce: bigint;
    deadline: bigint;
}

export interface SwapState {
    status: 'idle' | 'quoting' | 'approving' | 'signing' | 'swapping' | 'success' | 'error';
    quote: SwapQuote | null;
    txHash: string | null;
    error: string | null;
}
