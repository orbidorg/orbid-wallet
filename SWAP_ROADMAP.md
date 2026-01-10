# OrbId Wallet - Swap Implementation

## Current Implementation Status: ✅ Complete

### Architecture Overview

OrbId Wallet integrates directy with Uniswap's **Universal Router V4** via World App's MiniKit SDK. No custom relay contract is needed - all swaps go directly through Uniswap with Permit2 for gasless approvals.

---

## Contract Addresses (World Chain Mainnet)

| Contract | Address |
|----------|---------|
| **Universal Router V4** | `0x8ac7bEE993bb44dAb564Ea4bc9EA67Bf9Eb5e743` |
| **Permit2** | `0x000000000022D473030F116dDEE9F6B43aC78BA3` |
| Uniswap V3 SwapRouter | `0x091AD9e2e6e5eD44c1c66dB50e49A601F9f36cF6` |
| Uniswap V3 Factory | `0x7a5028BDa40e7B173C278C5342087826455ea25a` |
| Uniswap V3 QuoterV2 | `0x10158D43e6cc414deE1Bd1eB0EfC6a5cBCfF244c` |
| Uniswap V4 Pool Manager | `0xb1860D529182Ac3BC1F51FA2ABd56662b7D13f33` |
| Uniswap V4 Quoter | `0x55D235b3Ff2DAF7C3eDe0DEfc9521F1D6fE6C5C0` |
| WETH | `0x4200000000000000000000000000000000000006` |
| USDC | `0x79A02482A880bCE3F13e09Da970dC34db4CD24d1` |
| WLD | `0x2cFc85d8E48F8EAB294be644d9E25C3030863003` |

---

## Implementation Files

| File | Purpose |
|------|---------|
| `src/hooks/useSwap.ts` | Core swap execution logic with Universal Router |
| `src/hooks/useSwapQuote.ts` | Quote fetching hook |
| `src/lib/uniswap/config.ts` | Contract addresses and configuration |
| `src/lib/uniswap/quoter.ts` | V2/V3/V4 quote engine |
| `src/lib/uniswap/types.ts` | TypeScript interfaces |
| `src/lib/uniswap/v4-discovery.ts` | V4 pool discovery |
| `src/components/SwapInterface.tsx` | Swap UI component |

---

## How Swaps Work

### Flow

1. **User selects tokens** → Quote is fetched via `useSwapQuote`
2. **User clicks Swap** → `executeSwap()` is called
3. **Command encoding** → Swap parameters encoded for Universal Router
4. **MiniKit sends transaction** → Universal Router `execute()` with Permit2 signature
5. **Transaction confirmed** → Success state displayed

### Universal Router Commands

| Version | Command Code | Function |
|---------|-------------|----------|
| V3 | `0x00` | `V3_SWAP_EXACT_IN` |
| V2 | `0x08` | `V2_SWAP_EXACT_IN` |
| V4 | `0x10` | `V4_SWAP` |

### MiniKit Integration

```typescript
await MiniKit.commandsAsync.sendTransaction({
    transaction: [{
        address: UNIVERSAL_ROUTER,
        abi: UNIVERSAL_ROUTER_ABI,
        functionName: 'execute',
        args: [commands, inputs, deadline],
    }],
    permit2: [{
        permitted: { token, amount },
        nonce,
        deadline,
        spender: UNIVERSAL_ROUTER,
    }],
});
```

MiniKit automatically replaces the Permit2 signature placeholder with the user's actual signature.

---

## Developer Portal Configuration

### Required Whitelists (Configuration → Advanced)

**Contract Entrypoints:**
```
0x8ac7bee993bb44dab564ea4bc9ea67bf9eb5e743
0x000000000022d473030f116ddee9f6b43ac78ba3
```

**Permit2 Tokens (all lowercase):**
```
0x2cfc85d8e48f8eab294be644d9e25c3030863003
0x79a02482a880bce3f13e09da970dc34db4cd24d1
0x4200000000000000000000000000000000000006
```

Add any additional tokens you want to support.

---

## Swap Parameters

| Parameter | Value |
|-----------|-------|
| Default Slippage | 0.5% (50 bps) |
| Deadline | 20 minutes |
| Pool Fee Tiers | 0.01%, 0.05%, 0.3%, 1% |

---

## RPC Endpoints

| Provider | URL |
|----------|-----|
| DRPC (Primary) | `https://worldchain.drpc.org` |
| Alchemy Public | `https://worldchain-mainnet.g.alchemy.com/public` |

---

## Known Limitations

- V4 swap encoding is simplified; complex multi-hop routes not yet supported
- Users have 500 free transactions per day on World Chain
- Gas is sponsored by World App
