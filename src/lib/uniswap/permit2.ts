// Permit2 helpers for gasless token approvals

import { UNISWAP_ADDRESSES, SWAP_CONFIG } from './config';
import type { PermitTransferFrom } from './types';

// Permit2 domain for EIP-712 signing
export const PERMIT2_DOMAIN = {
    name: 'Permit2',
    chainId: 480, // World Chain
    verifyingContract: UNISWAP_ADDRESSES.PERMIT2 as `0x${string}`,
};

// Type data for PermitTransferFrom
export const PERMIT_TRANSFER_FROM_TYPES = {
    PermitTransferFrom: [
        { name: 'permitted', type: 'TokenPermissions' },
        { name: 'spender', type: 'address' },
        { name: 'nonce', type: 'uint256' },
        { name: 'deadline', type: 'uint256' },
    ],
    TokenPermissions: [
        { name: 'token', type: 'address' },
        { name: 'amount', type: 'uint256' },
    ],
};

/**
 * Generate a random nonce for Permit2
 */
export function generateNonce(): bigint {
    const randomBytes = new Uint8Array(32);
    crypto.getRandomValues(randomBytes);
    return BigInt('0x' + Array.from(randomBytes).map(b => b.toString(16).padStart(2, '0')).join(''));
}

/**
 * Get deadline timestamp (current time + minutes)
 */
export function getDeadline(minutes: number = SWAP_CONFIG.DEFAULT_DEADLINE_MINUTES): bigint {
    return BigInt(Math.floor(Date.now() / 1000) + minutes * 60);
}

/**
 * Build the permit data for signing
 */
export function buildPermitData(
    tokenAddress: string,
    amount: bigint,
    spender: string, // OrbIdSwapRelay address
    nonce: bigint,
    deadline: bigint
) {
    return {
        domain: PERMIT2_DOMAIN,
        types: PERMIT_TRANSFER_FROM_TYPES,
        primaryType: 'PermitTransferFrom' as const,
        message: {
            permitted: {
                token: tokenAddress,
                amount: amount.toString(),
            },
            spender,
            nonce: nonce.toString(),
            deadline: deadline.toString(),
        },
    };
}

/**
 * Encode permit data for contract call
 */
export function encodePermitData(nonce: bigint, deadline: bigint): string {
    // ABI encode (uint256 nonce, uint256 deadline)
    const nonceHex = nonce.toString(16).padStart(64, '0');
    const deadlineHex = deadline.toString(16).padStart(64, '0');
    return '0x' + nonceHex + deadlineHex;
}

/**
 * Build the full permit struct for contract
 */
export function buildPermitStruct(
    token: string,
    amount: bigint,
    nonce: bigint,
    deadline: bigint
): PermitTransferFrom {
    return {
        permitted: {
            token,
            amount,
        },
        nonce,
        deadline,
    };
}

/**
 * Check if user has approved Permit2 for a token
 */
export async function checkPermit2Allowance(
    tokenAddress: string,
    ownerAddress: string,
    rpcUrl: string
): Promise<bigint> {
    // ERC20 allowance(address,address) selector
    const selector = 'dd62ed3e';
    const owner = ownerAddress.slice(2).padStart(64, '0');
    const spender = UNISWAP_ADDRESSES.PERMIT2.slice(2).padStart(64, '0');

    const callData = '0x' + selector + owner + spender;

    try {
        const response = await fetch(rpcUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                jsonrpc: '2.0',
                id: 1,
                method: 'eth_call',
                params: [
                    { to: tokenAddress, data: callData },
                    'latest',
                ],
            }),
        });

        const result = await response.json();

        if (result.result && result.result !== '0x') {
            return BigInt(result.result);
        }

        return BigInt(0);
    } catch {
        return BigInt(0);
    }
}

/**
 * Build approval transaction data for Permit2
 */
export function buildApprovalData(): string {
    // approve(address spender, uint256 amount)
    const selector = '095ea7b3';
    const spender = UNISWAP_ADDRESSES.PERMIT2.slice(2).padStart(64, '0');
    const amount = 'ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff'; // max uint256

    return '0x' + selector + spender + amount;
}
