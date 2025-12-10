import type { Token } from './types';

// World Chain Mainnet tokens with correct addresses
export const WORLD_CHAIN_TOKENS: Token[] = [
    {
        symbol: 'WLD',
        name: 'Worldcoin',
        address: '0x2cFc85d8E48F8EAB294be644d9E25C3030863003',
        decimals: 18,
        logoURI: 'https://assets.coingecko.com/coins/images/31069/standard/worldcoin.jpeg',
    },
    {
        symbol: 'USDC',
        name: 'USD Coin',
        address: '0x79A02482A880bCE3F13e09Da970dC34db4CD24d1',
        decimals: 6,
        logoURI: 'https://assets.coingecko.com/coins/images/6319/standard/usdc.png',
    },
    {
        symbol: 'WETH',
        name: 'Ethereum',
        address: '0x4200000000000000000000000000000000000006',
        decimals: 18,
        logoURI: 'https://s2.coinmarketcap.com/static/img/coins/64x64/1027.png',
    },
    {
        symbol: 'WBTC',
        name: 'Bitcoin',
        address: '0x03C7054BCB39f7b2e5B2c7AcB37583e32D70Cfa3',
        decimals: 8,
        logoURI: 'https://assets.coingecko.com/coins/images/1/standard/bitcoin.png',
    },
    {
        symbol: 'LINK',
        name: 'Chainlink',
        address: '0x915B648e994D5f31059B38223B9fBE98aE185473',
        decimals: 18,
        logoURI: 'https://assets.coingecko.com/coins/images/877/standard/Chainlink_Logo_500.png',
    },
    {
        symbol: 'uSOL',
        name: 'Solana',
        address: '0x9B8Df6e244526Ab5F6e6400D331Db28C8fDDDb55',
        decimals: 18,
        logoURI: 'https://s2.coinmarketcap.com/static/img/coins/64x64/5426.png',
    },
    {
        symbol: 'uXRP',
        name: 'XRP',
        address: '0x2615A94df961278DcbC41fB0A54fEC5f10A693Ae',
        decimals: 18,
        logoURI: 'https://assets.coingecko.com/coins/images/44/standard/xrp-symbol-white-128.png',
    },
    {
        symbol: 'uDOGE',
        name: 'Dogecoin',
        address: '0x12E96C2BfEa6e835cf8DD38a5834fA61Cf723736',
        decimals: 18,
        logoURI: 'https://assets.coingecko.com/coins/images/5/standard/dogecoin.png',
    },
    {
        symbol: 'FOOTBALL',
        name: 'CrazyFootball Token',
        address: '0x6fB9dF9530e302bE9dC126363BD7529B807f7167',
        decimals: 18,
        logoURI: 'https://assets.coingecko.com/coins/images/69748/standard/Logo.jpg',
    },
    {
        symbol: 'ORO',
        name: 'ORO',
        address: '0xCd1E32b86953d79a6aC58e813d2eA7A1790CAB63',
        decimals: 18,
        logoURI: 'https://assets.coingecko.com/coins/images/70441/standard/oro.png',
    },
    {
        symbol: 'sDAI',
        name: 'Savings Dai',
        address: '0x859dBe24B90c9f2F7742083d3cf59Ca41f55BE5D',
        decimals: 18,
        logoURI: 'https://assets.coingecko.com/coins/images/32254/small/sdai.png',
    },
    {
        symbol: 'uSUI',
        name: 'SUI',
        address: '0xB0505e5a99AbD03d94a1169e638B78EDfED26EA4',
        decimals: 18,
        logoURI: 'https://s2.coinmarketcap.com/static/img/coins/64x64/20947.png',
    },
    {
        symbol: 'uPEPE',
        name: 'Pepe',
        address: '0xE5c436B0a34Df18f1daE98Af344cA5122E7D57c4',
        decimals: 18,
        logoURI: 'https://assets.coingecko.com/coins/images/29850/standard/pepe-token.jpeg',
    },
];

// CoinGecko IDs for price fetching
export const COINGECKO_IDS: Record<string, string> = {
    WLD: 'worldcoin-wld',
    USDC: 'usd-coin',
    WETH: 'wrapped-eth-world-chain',
    WBTC: 'bridged-wrapped-bitcoin-worldchain',
    LINK: 'chainlink',
    uSOL: 'wrapped-solana-universal',
    uXRP: 'wrapped-xrp-universal',
    uDOGE: 'wrapped-doge-universal',
    FOOTBALL: 'crazyfootball-token',
    ORO: 'oro-2',
    sDAI: 'savings-dai',
    uSUI: 'wrapped-sui-universal',
    uPEPE: 'pepe',
};
