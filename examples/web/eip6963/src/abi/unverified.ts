export const unverifiedAbi = [
  {
    inputs: [],
    name: 'getNumber',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'getString',
    outputs: [{ internalType: 'string', name: '', type: 'string' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'string', name: '_bString', type: 'string' },
      { internalType: 'uint256', name: '_bNumber', type: 'uint256' },
    ],
    name: 'setAll',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'uint256', name: '_bNumber', type: 'uint256' }],
    name: 'setNumber',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'string', name: '_bString', type: 'string' }],
    name: 'setString',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
];
