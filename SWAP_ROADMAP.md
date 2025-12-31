# OrbIdSwapRelay - Implementation Roadmap

## Contract Overview

### OrbIdSwapRelay.sol
**Path**: `contracts/src/OrbIdSwapRelay.sol`

A gas-efficient swap relay contract for World Chain that supports Uniswap V3/V4, integrates Permit2 for gasless approvals, and collects a 0.5% fee on all swaps.

### Key Features
- **Dual Protocol Support**: Uniswap V3 (SwapRouter) and V4 (Universal Router)
- **Permit2 Integration**: Gasless token approvals via EIP-2612 signatures
- **Fee Collection**: 0.5% fee on input amount, sent to configurable recipient
- **Slippage Protection**: User-defined minimum output amounts

### Contract Functions

| Function | Description |
|----------|-------------|
| `swap(SwapParams calldata params)` | Direct swap with pre-approved tokens |
| `swapWithPermit(SwapParams calldata params, PermitParams calldata permit)` | Gasless swap using Permit2 signature |
| `setFeeRecipient(address newRecipient)` | Update fee recipient (owner only) |
| `setFeeBps(uint16 newFeeBps)` | Update fee percentage (owner only, max 5%) |

### Contract Addresses (World Chain Mainnet)

| Contract | Address |
|----------|---------|
| WETH | `0x4200000000000000000000000000000000000006` |
| USDC (Native) | `0x79A02482A880bCE3F13e09Da970dC34db4CD24d1` |
| WLD | `0x2cFc85d8E48F8EAB294be644d9E25C3030863003` |
| Permit2 | `0x000000000022D473030F116dDEE9F6B43aC78BA3` |
| Uniswap V3 SwapRouter | `0x091AD9e2e6e5eD44c1c66dB50e49A601F9f36cF6` |
| Uniswap V3 Factory | `0x7a5028BDa40e7B173C278C5342087826455ea25a` |
| Uniswap V3 QuoterV2 | `0x10158D43e6cc414deE1Bd1eB0EfC6a5cBCfF244c` |
| Uniswap V4 Universal Router | `0x8ac7bee993bb44dab564ea4bc9ea67bf9eb5e743` |
| Fee Recipient | `0xc248F2b195B6D328879e76F210fdC7276A2ddE1E` |

---

## Next Steps

### 1. Deploy OrbIdSwapRelay Contract

```bash
cd contracts
npx hardhat run scripts/deploy.ts --network worldchain
```

**Requirements**:
- Set `DEPLOYER_PRIVATE_KEY` in `.env`
- Ensure sufficient ETH balance for gas

**After Deployment**:
- Update `ORBID_SWAP_RELAY_ADDRESS` in `src/lib/uniswap/config.ts`

---

### 2. Verify Contract on WorldScan

```bash
npx hardhat verify --network worldchain <DEPLOYED_ADDRESS> \
  "0x091AD9e2e6e5eD44c1c66dB50e49A601F9f36cF6" \
  "0x8ac7bee993bb44dab564ea4bc9ea67bf9eb5e743" \
  "0x000000000022D473030F116dDEE9F6B43aC78BA3" \
  "0xc248F2b195B6D328879e76F210fdC7276A2ddE1E" \
  50
```

---

### 3. Integrate World App MiniKit

**File**: `src/hooks/useSwap.ts`

Complete the integration with World App MiniKit:
- Implement `onSign` for Permit2 EIP-712 signatures
- Implement `onSendTransaction` for swap execution
- Handle transaction status and confirmations

---

### 4. End-to-End Testing

| Test Case | Description |
|-----------|-------------|
| Small Swap | Test with minimal amounts (0.1 WLD) |
| Fee Verification | Confirm 0.5% fee is collected |
| Slippage Protection | Test with high slippage to verify revert |
| Multi-Token | Test WLD/USDC, WLD/WETH, USDC/WETH pairs |

---

### 5. UI Polish

- Remove debug console.log statements from quoter
- Add success/error toast notifications for transactions
- Display swap history in Activity tab
- Add loading states for transaction confirmation

---

## Configuration

### Default Swap Parameters

| Parameter | Value |
|-----------|-------|
| Fee | 0.5% (50 bps) |
| Default Slippage | 0.5% (50 bps) |
| Deadline | 20 minutes |
| Pool Fee Tiers | 0.05%, 0.3%, 1% |

### RPC Endpoints

| Provider | URL |
|----------|-----|
| DRPC (Primary) | `https://worldchain.drpc.org` |
| Alchemy Public | `https://worldchain-mainnet.g.alchemy.com/public` |
| ThirdWeb | `https://480.rpc.thirdweb.com` |
