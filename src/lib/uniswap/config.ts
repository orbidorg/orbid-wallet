// Uniswap Configuration for World Chain
// Contract addresses verified from official deployments

export const WORLD_CHAIN_ID = 480;

// Uniswap Contract Addresses on World Chain
export const UNISWAP_ADDRESSES = {
    // Permit2 - Universal across all chains
    PERMIT2: '0x000000000022D473030F116dDEE9F6B43aC78BA3',

    // Uniswap v3
    SWAP_ROUTER_V3: '0x091AD9e2e6e5eD44c1c66dB50e49A601F9f36cF6',
    FACTORY_V3: '0x7a5028BDa40e7B173C278C5342087826455ea25a',
    QUOTER_V2: '0x10158D43e6cc414deE1Bd1eB0EfC6a5cBCfF244c',

    // Uniswap v4
    UNIVERSAL_ROUTER_V4: '0x8ac7bee993bb44dab564ea4bc9ea67bf9eb5e743',
} as const;

// OrbIdSwapRelay Configuration
export const SWAP_CONFIG = {
    // Fee settings
    FEE_BPS: 50, // 0.5%
    FEE_RECIPIENT: '0xc248F2b195B6D328879e76F210fdC7276A2ddE1E',

    // Default swap settings
    DEFAULT_SLIPPAGE_BPS: 50, // 0.5%
    DEFAULT_DEADLINE_MINUTES: 20,

    // Pool fee tiers (in hundredths of a bip)
    FEE_TIERS: {
        LOWEST: 100,   // 0.01%
        LOW: 500,      // 0.05%
        MEDIUM: 3000,  // 0.3%
        HIGH: 10000,   // 1%
    },
} as const;

// OrbIdSwapRelay contract address (to be updated after deployment)
export const ORBID_SWAP_RELAY_ADDRESS = '' as `0x${string}`;

// WETH address on World Chain
export const WETH_ADDRESS = '0x4200000000000000000000000000000000000006';
