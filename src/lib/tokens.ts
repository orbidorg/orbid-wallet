import type { Token } from './types';

// World Chain Mainnet tokens with correct addresses
export const WORLD_CHAIN_TOKENS: Token[] = [
    {
        symbol: 'WLD',
        name: 'Worldcoin',
        address: '0x2cFc85d8E48F8EAB294be644d9E25C3030863003',
        decimals: 18,
        logoURI: 'https://assets.coingecko.com/coins/images/31069/small/worldcoin.jpeg',
    },
    {
        symbol: 'USDC',
        name: 'USD Coin',
        address: '0x79A02482A880bCE3F13e09Da970dC34db4CD24d1',
        decimals: 6,
        logoURI: 'https://assets.coingecko.com/coins/images/6319/small/usdc.png',
    },
    {
        symbol: 'WETH',
        name: 'Wrapped Ether',
        address: '0x4200000000000000000000000000000000000006',
        decimals: 18,
        logoURI: 'https://assets.coingecko.com/coins/images/2518/small/weth.png',
    },
    {
        symbol: 'WBTC',
        name: 'Wrapped BTC',
        address: '0x03C7054BCB39f7b2e5B2c7AcB37583e32D70Cfa3',
        decimals: 8,
        logoURI: 'https://assets.coingecko.com/coins/images/7598/small/wrapped_bitcoin_wbtc.png',
    },
    {
        symbol: 'sDAI',
        name: 'Savings Dai',
        address: '0x859dBe24B90c9f2F7742083d3cf59Ca41f55BE5D',
        decimals: 18,
        logoURI: 'https://assets.coingecko.com/coins/images/32254/small/sdai.png',
    },
];

// CoinGecko IDs for price fetching
export const COINGECKO_IDS: Record<string, string> = {
    WLD: 'worldcoin-wld',
    USDC: 'usd-coin',
    WETH: 'weth',
    WBTC: 'wrapped-bitcoin',
    sDAI: 'savings-dai',
};
