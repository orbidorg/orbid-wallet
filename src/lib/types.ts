// Token types
export interface Token {
    symbol: string;
    name: string;
    address: string;
    decimals: number;
    logoURI: string;
    isNative?: boolean; // true for WLD (direct transfer), false/undefined for ERC-20 (Permit2)
    pools?: string[]; // GeckoTerminal pool addresses for chart data
}

export interface TokenBalance {
    token: Token;
    balance: string;
    valueUSD: number;
    change24h: number;
}

export type ChartPeriod = "1d" | "7d" | "30d" | "365d" | "max";

export interface PricePoint {
    timestamp: number;
    price: number;
    volume?: number;
}

export interface TokenMarketData {
    price: number;
    change24h: number;
    change7d: number;
    volume24h: number;
    marketCap: number;
    fdv: number;
    high24h: number;
    low24h: number;
    priceHistory: PricePoint[];
}

// Transaction types
export type TransactionType = 'send' | 'receive' | 'swap' | 'contract';
export type TransactionStatus = 'pending' | 'confirmed' | 'failed';

export interface Transaction {
    hash: string;
    from: string;
    to: string;
    value: string;
    timestamp: number;
    blockNumber: string;
    type: TransactionType;
    status: TransactionStatus;
    tokenSymbol?: string;
    tokenAmount?: string;
    gasUsed?: string;
    gasPrice?: string;
}

// Navigation
export type TabType = 'wallet' | 'swap' | 'activity';
