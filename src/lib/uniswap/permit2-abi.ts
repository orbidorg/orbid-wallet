export const PERMIT2_ABI = [
    {
        inputs: [
            {
                components: [
                    {
                        components: [
                            { name: 'token', type: 'address' },
                            { name: 'amount', type: 'uint256' },
                        ],
                        name: 'permitted',
                        type: 'tuple',
                    },
                    { name: 'nonce', type: 'uint256' },
                    { name: 'deadline', type: 'uint256' },
                ],
                name: 'permit',
                type: 'tuple',
            },
            {
                components: [
                    { name: 'to', type: 'address' },
                    { name: 'requestedAmount', type: 'uint256' },
                ],
                name: 'transferDetails',
                type: 'tuple',
            },
            { name: 'signature', type: 'bytes' },
        ],
        name: 'signatureTransfer',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function',
    },
] as const;
