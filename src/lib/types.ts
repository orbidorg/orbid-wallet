// Token types
export interface Token {
    symbol: string;
    name: string;
    address: string;
    decimals: number;
    logoURI: string;
}

export interface TokenBalance {
    token: Token;
    balance: string;
    valueUSD: number;
    change24h: number;
}

export interface TokenMarketData {
    price: number;
    change24h: number;
    change7d: number;
    volume24h: number;
    marketCap: number;
    liquidity: number;
    fdv: number;
    priceHistory: { time: number; price: number }[];
}

// Transaction types
export type TransactionType = 'send' | 'receive' | 'swap';
export type TransactionStatus = 'pending' | 'confirmed' | 'failed';

export interface Transaction {
    id: string;
    type: TransactionType;
    tokenIn?: Token;
    tokenOut?: Token;
    amountIn: string;
    amountOut?: string;
    timestamp: Date;
    hash: string;
    status: TransactionStatus;
}

// Navigation
export type TabType = 'wallet' | 'swap' | 'activity';
