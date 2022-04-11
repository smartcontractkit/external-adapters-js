export const ADDRESS_RESOLVER_ABI = [
  {
    constant: true,
    inputs: [{ internalType: 'bytes32', name: 'name', type: 'bytes32' }],
    name: 'getAddress',
    outputs: [{ internalType: 'address', name: '', type: 'address' }],
    payable: false,
    stateMutability: 'view',
    type: 'function',
  },
]

export const DEBT_CACHE_ABI = [
  {
    constant: true,
    inputs: [],
    name: 'currentDebt',
    outputs: [
      { internalType: 'uint256', name: 'debt', type: 'uint256' },
      { internalType: 'bool', name: 'anyRateIsInvalid', type: 'bool' },
    ],
    payable: false,
    stateMutability: 'view',
    type: 'function',
  },
]

export const SYNTHETIX_DEBT_SHARE_ABI = [
  {
    constant: true,
    inputs: [],
    name: 'totalSupply',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    payable: false,
    stateMutability: 'view',
    type: 'function',
  },
]
